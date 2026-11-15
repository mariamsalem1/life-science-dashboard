"""Standard-library tests for snapshot persistence, authorization and the command outbox."""
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('ops_gateway', Path(__file__).with_name('server.py'))
gateway = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gateway)


class Request(gateway.Gateway):
    def __init__(self, path, payload=None, authorized=True, origin='https://dashboard.test'):
        raw = json.dumps(payload or {}).encode()
        self.path = path
        self.headers = {'Content-Length': str(len(raw)), 'Origin': origin, 'Host': '127.0.0.1:8787'}
        if authorized:
            self.headers['Authorization'] = 'Bearer ' + gateway.TOKEN
        if payload and 'requestId' in payload:
            self.headers['Idempotency-Key'] = payload['requestId']
        self.rfile = io.BytesIO(raw)
        self.result = None

    def response(self, code, body, cookie=None, html=False):
        self.result = (code, body)


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        gateway.DB = Path(self.tmp.name) / 'test.sqlite3'
        gateway.TOKEN = 'development-test-key-at-least-24-characters'
        gateway.ORIGINS = {'https://dashboard.test'}
        self.snapshot = {'schemaVersion': 1, 'factory': 0, 'period': 'Today', 'production': {'lines': [{'index': 0}]}, 'assets': [{'id': 'CAI-P-104'}], 'processSystems': [{'index': 0, 'id': 'CAI-PROC-L1', 'status': 'Running'}]}
        req = Request('/api/factories/0/snapshot', self.snapshot)
        req.do_POST()
        self.assertEqual(req.result[0], 200)

    def tearDown(self):
        self.tmp.cleanup()

    def command(self):
        return {'requestId': 'REQ-test-1', 'factory': 0, 'kind': 'line', 'target': '0', 'action': 'Stopped', 'payload': {}, 'requestedAt': '2026-11-15T00:00:00Z'}

    def test_auth_origin_and_snapshot(self):
        req = Request('/api/factories/0/snapshot', authorized=False)
        req.do_GET()
        self.assertEqual(req.result[0], 401)
        req = Request('/api/factories/0/commands', self.command(), origin='https://untrusted.test')
        req.do_POST()
        self.assertEqual(req.result[0], 403)
        req = Request('/api/factories/0/snapshot')
        req.do_GET()
        self.assertEqual(req.result, (200, self.snapshot))
        with gateway.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM snapshot_history').fetchone()[0], 1)

    def test_idempotency_queue_and_execution_receipt(self):
        command = self.command()
        for _ in range(2):
            req = Request('/api/factories/0/commands', command)
            req.do_POST()
            self.assertIn(req.result[0], [200, 202])
            self.assertEqual(req.result[1]['status'], 'accepted')
        with gateway.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM commands').fetchone()[0], 1)
            # Queuing does not execute a line or rewrite telemetry.
            self.assertEqual(json.loads(db.execute('SELECT body FROM snapshots').fetchone()[0]), self.snapshot)
        changed = {**command, 'action': 'Running'}
        req = Request('/api/factories/0/commands', changed)
        req.do_POST()
        self.assertEqual(req.result[0], 409)
        req = Request('/api/commands/REQ-test-1', {'status': 'executed', 'message': 'Authorized adapter confirmed'})
        req.do_PATCH()
        self.assertEqual(req.result[0], 200)
        req = Request('/api/factories/0/commands', command)
        req.do_POST()
        self.assertEqual(req.result[1]['status'], 'executed')

    def test_process_system_is_queued_without_mutating_telemetry(self):
        req = Request('/api/factories/0/commands', {**self.command(), 'kind': 'processSystem', 'target': 'CAI-PROC-L1'})
        req.do_POST()
        self.assertEqual(req.result[0], 202)
        self.assertEqual(req.result[1]['status'], 'accepted')
        with gateway.connect() as db:
            record = json.loads(db.execute('SELECT body FROM snapshots WHERE factory=0').fetchone()[0])
            self.assertEqual(record['processSystems'][0]['status'], 'Running')

    def test_target_and_factory_validation(self):
        req = Request('/api/factories/0/commands', {**self.command(), 'target': '999'})
        req.do_POST()
        self.assertEqual(req.result[0], 409)
        req = Request('/api/factories/0/commands', {**self.command(), 'factory': 1})
        req.do_POST()
        self.assertEqual(req.result[0], 400)
        req = Request('/api/factories/0/commands', {**self.command(), 'action': 'arbitrary-command'})
        req.do_POST()
        self.assertEqual(req.result[0], 400)


if __name__ == '__main__':
    unittest.main()
