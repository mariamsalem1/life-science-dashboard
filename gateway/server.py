"""Reference HTTP gateway: persistent snapshots and an auditable command outbox.
No PLC driver is included. An authorized plant adapter must consume the outbox,
execute approved actions, update the receipt, and publish a new snapshot.
"""
import argparse
from contextlib import contextmanager
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

TOKEN = os.environ.get('OPS_GATEWAY_TOKEN', '')
ORIGINS = set(filter(None, os.environ.get('OPS_ALLOWED_ORIGINS', 'http://127.0.0.1:8088').split(',')))
DB = Path(os.environ.get('OPS_GATEWAY_DB', str(Path(__file__).with_name('operations.sqlite3'))))
SESSIONS = {}
ACTIONS = {'processSystem': {'Running', 'Stopped'}, 'line': {'Running', 'Stopped', 'Changeover'}, 'batch': {'start', 'hold', 'resume', 'advance'}, 'alarm': {'acknowledge', 'resolve'}, 'workOrder': {'assign', 'complete'}}


@contextmanager
def connect():
    db = sqlite3.connect(DB)
    db.execute('CREATE TABLE IF NOT EXISTS snapshots(factory INTEGER PRIMARY KEY, body TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS snapshot_history(id INTEGER PRIMARY KEY AUTOINCREMENT, factory INTEGER, received REAL, body TEXT)')
    db.execute('CREATE TABLE IF NOT EXISTS commands(id TEXT PRIMARY KEY, factory INTEGER, body TEXT, status TEXT, message TEXT, created REAL)')
    db.commit()
    try:
        with db:
            yield db
    finally:
        db.close()


class Gateway(BaseHTTPRequestHandler):
    server_version = 'OperationsGateway/1.0'

    def log_message(self, fmt, *args):
        # Never log cookies, authorization headers, request bodies, or query values.
        print('%s %s %s' % (self.address_string(), self.command, self.path.split('?')[0]))

    def response(self, code, body, cookie=None, html=False):
        data = body.encode() if html else json.dumps(body).encode()
        self.send_response(code)
        origin = self.headers.get('Origin', '')
        if origin in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Vary', 'Origin')
        self.send_header('Content-Type', 'text/html; charset=utf-8' if html else 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        if self.headers.get('Origin') not in ORIGINS:
            return self.response(403, {'error': 'Origin not allowed'})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Authorization')
        self.end_headers()

    def admin(self):
        value = self.headers.get('Authorization', '')
        return bool(TOKEN) and hmac.compare_digest(value, 'Bearer ' + TOKEN)

    def authenticated(self):
        if self.admin():
            return True
        cookies = SimpleCookie()
        try:
            cookies.load(self.headers.get('Cookie', ''))
            key = cookies.get('ops_session')
            return bool(key and SESSIONS.get(key.value, 0) > time.time())
        except Exception:
            return False

    def body(self):
        size = int(self.headers.get('Content-Length', '0'))
        if size < 1 or size > 2_000_000:
            raise ValueError('Body must be between 1 byte and 2 MB')
        raw = self.rfile.read(size)
        return parse_qs(raw.decode()) if self.path == '/login' else json.loads(raw)

    def do_GET(self):
        if self.path == '/login':
            return self.response(200, '<!doctype html><meta charset="utf-8"><title>Gateway sign in</title><h1>Operations gateway</h1><form method="post"><label>Gateway access key <input name="token" type="password" autocomplete="off" required></label><button>Sign in</button></form><p>This reference gateway queues commands. It does not control equipment.</p>', html=True)
        if not self.authenticated():
            return self.response(401, {'error': 'Sign in at /login or use adapter authorization'})
        match = re.fullmatch(r'/api/factories/([0-3])/(snapshot|commands)', self.path)
        if not match:
            return self.response(404, {'error': 'Unknown route'})
        fi, kind = int(match[1]), match[2]
        with connect() as db:
            if kind == 'snapshot':
                row = db.execute('SELECT body FROM snapshots WHERE factory=?', (fi,)).fetchone()
                return self.response(200, json.loads(row[0])) if row else self.response(404, {'error': 'No source snapshot published'})
            if not self.admin():
                return self.response(403, {'error': 'Adapter authorization required for the command outbox'})
            rows = db.execute('SELECT id,body,status,message FROM commands WHERE factory=? ORDER BY created DESC LIMIT 200', (fi,)).fetchall()
            return self.response(200, [{'requestId': row[0], 'command': json.loads(row[1]), 'status': row[2], 'message': row[3]} for row in rows])

    def do_POST(self):
        try:
            origin = self.headers.get('Origin')
            # Browser writes require an explicit allowlisted origin. Adapter writes require a bearer credential.
            if origin and origin not in ORIGINS and not (self.path == '/login' and origin in ['http://' + self.headers.get('Host', ''), 'https://' + self.headers.get('Host', '')]):
                return self.response(403, {'error': 'Origin not allowed'})
            if self.path == '/login':
                values = self.body()
                if not TOKEN or not hmac.compare_digest(values.get('token', [''])[0], TOKEN):
                    time.sleep(.3)
                    return self.response(401, {'error': 'Invalid access key'})
                session = secrets.token_urlsafe(32)
                SESSIONS[session] = time.time() + 8 * 3600
                secure = self.headers.get('X-Forwarded-Proto') == 'https'
                cookie = 'ops_session=' + session + '; HttpOnly; Path=/; Max-Age=28800; SameSite=' + ('None; Secure' if secure else 'Lax')
                return self.response(200, {'message': 'Signed in. Return to the dashboard and test the connection.'}, cookie)
            if not self.authenticated():
                return self.response(401, {'error': 'Sign in required'})
            if not self.admin() and origin not in ORIGINS:
                return self.response(403, {'error': 'Browser write origin required'})
            match = re.fullmatch(r'/api/factories/([0-3])/(snapshot|commands)', self.path)
            if not match:
                return self.response(404, {'error': 'Unknown route'})
            fi, kind, payload = int(match[1]), match[2], self.body()
            with connect() as db:
                if kind == 'snapshot':
                    if not self.admin():
                        return self.response(403, {'error': 'Adapter authorization required'})
                    if payload.get('schemaVersion') != 1 or payload.get('factory') != fi or payload.get('period') not in ['Today', 'This week', 'This month']:
                        raise ValueError('Snapshot envelope does not match the factory contract')
                    db.execute('INSERT INTO snapshot_history(factory,received,body) VALUES(?,?,?)', (fi, time.time(), json.dumps(payload)))
                    db.execute('INSERT INTO snapshots VALUES(?,?) ON CONFLICT(factory) DO UPDATE SET body=excluded.body', (fi, json.dumps(payload)))
                    return self.response(200, {'status': 'stored'})
                request_id = payload.get('requestId', '')
                if not re.fullmatch(r'[-A-Za-z0-9_]{1,100}', request_id) or request_id != self.headers.get('Idempotency-Key'):
                    raise ValueError('A matching request ID and Idempotency-Key are required')
                if payload.get('factory') != fi or payload.get('action') not in ACTIONS.get(payload.get('kind'), set()):
                    raise ValueError('Unsupported factory or action')
                row = db.execute('SELECT body,status,message FROM commands WHERE id=?', (request_id,)).fetchone()
                if row:
                    if json.loads(row[0]) != payload:
                        return self.response(409, {'error': 'Request ID already used with different content'})
                    return self.response(200, {'requestId': request_id, 'status': row[1], 'message': row[2]})
                snapshot_row = db.execute('SELECT body FROM snapshots WHERE factory=?', (fi,)).fetchone()
                if not snapshot_row:
                    return self.response(409, {'error': 'Publish a factory snapshot before requesting commands'})
                snapshot = json.loads(snapshot_row[0])
                kind_name, target = payload.get('kind'), str(payload.get('target', ''))
                targets = {'processSystem': [row['id'] for row in snapshot.get('processSystems', [])], 'line': [str(row['index']) for row in snapshot.get('production', {}).get('lines', [])], 'batch': [row['id'] for row in snapshot.get('batches', [])], 'alarm': [row['id'] for row in snapshot.get('alarms', [])], 'workOrder': [row['id'] for row in snapshot.get('assets', [])]}
                if target not in targets.get(kind_name, []):
                    return self.response(409, {'error': 'Target not present in the factory snapshot'})
                message = 'Queued for the authorized plant adapter. No equipment command has been executed.'
                db.execute('INSERT INTO commands VALUES(?,?,?,?,?,?)', (request_id, fi, json.dumps(payload), 'accepted', message, time.time()))
                return self.response(202, {'requestId': request_id, 'status': 'accepted', 'message': message})
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            self.response(400, {'error': str(exc)})

    def do_PATCH(self):
        if not self.admin():
            return self.response(403, {'error': 'Adapter authorization required'})
        match = re.fullmatch(r'/api/commands/([-A-Za-z0-9_]{1,100})', self.path)
        if not match:
            return self.response(404, {'error': 'Unknown receipt'})
        try:
            value = self.body()
            if value.get('status') not in ['executed', 'rejected']:
                raise ValueError('Receipt must be executed or rejected')
            with connect() as db:
                updated = db.execute('UPDATE commands SET status=?,message=? WHERE id=? AND status=?', (value['status'], str(value.get('message', ''))[:1000], match[1], 'accepted'))
                if not updated.rowcount:
                    return self.response(409, {'error': 'Receipt is missing or already terminal'})
            self.response(200, {'requestId': match[1], **value})
        except (ValueError, TypeError) as exc:
            self.response(400, {'error': str(exc)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8787)
    args = parser.parse_args()
    if len(TOKEN) < 24:
        raise SystemExit('Set OPS_GATEWAY_TOKEN to a private key of at least 24 characters.')
    with connect():
        pass
    print('Reference gateway on http://127.0.0.1:%s (no equipment driver)' % args.port)
    ThreadingHTTPServer(('127.0.0.1', args.port), Gateway).serve_forever()
