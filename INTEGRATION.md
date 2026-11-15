# Connecting factory data

The dashboard includes working imports, source-backed views, condition forecasting,
original document/layout uploads, and an HTTPS gateway client. No factory endpoint,
approved document, camera stream, PLC driver, or historical fault-training dataset
was supplied. These are not represented as connected or validated plant systems.
CIP/PAT monitoring uses measurements only; no video was added.

## In the dashboard

1. Open **Connections** and download **Data template** for the selected factory.
2. Replace its demonstration measurements with your source-system records. Keep
   `schemaVersion: 1`, the factory index (0 Cairo, 1 Delta, 2 Alexandria, 3 Suez),
   `period`, `source`, and ISO `observedAt`. The template is example data, not a feed.
3. Import the JSON into its factory card. Matching-period views use supplied
   sections; other sections retain explicitly labeled demo data. Imports are
   read-only and saved in this browser. A new import replaces that factory record.
4. For live readings, use **Connect** with your factory gateway base URL, e.g.
   `https://operations.example/api/factories/0`. Sign in to the gateway first.
   It must support credentialed CORS for this dashboard's exact origin. Never put
   API tokens in URLs or frontend source. Optional polling runs only while open.
5. Enable command requests only when your gateway is authorized to accept them.
   Imported files cannot issue commands. Sources older than 15 minutes and failed
   connections block command requests. An accepted receipt is not execution.

## Data sections

| Section | Used by |
| --- | --- |
| `business` | Business KPIs, sustainability, factory quality/delivery summaries |
| `production.lines` | Production, packaging, utilization, OEE and factory summaries |
| `batches` | Process stages, batch records and gateway action targets |
| `assets` | Factory-unique assets, condition readings and timestamped samples |
| `facility` | Building/power/utilities readings and range conformance |
| `quality.cip` | Current cycle, phase-specific limits and supplied phase history |
| `quality.pat` | Product readings, acceptance ranges and conformance |
| `alarms` | Alarm register, details, status and acknowledgement requests |
| `workforce` | Factory roster, skills and qualification expiry |
| `workOrders` | Source assignments, completion state and maintenance events |
| `kpis` | Product quality, satisfaction mix, reviews, delivery counts, claims, complaints, cost and downtime breakdowns |
| `sustainability` | Energy, cost, water, emissions and waste profiles |
| `supplyChain` | Material inventory, customer orders and delivery/supplier trends |

IDs for assets, batches and alarms must be unique across factories. Array indices
for lines are 0–2; asset indices 0–3 correspond to pump, motor, compressor and valve.
A snapshot can supply some sections, but missing sections must not be interpreted
as connected. The downloadable template includes every supported section and labels its values as
examples. Replace them with source values. Business KPI and sustainability views
remain labeled mixed metrics when their detailed sections are not supplied.

`production.lines` requires target/output counts, availability/performance/quality,
reject/progress percentages, status, product, workOrder, plannedMinutes and runMinutes.
Utilization is runMinutes/plannedMinutes; OEE is availability*performance*quality/10000.
Snapshot totals are never multiplied to invent a different time period.

An asset contains index, globally unique id, health, optional cost (EGP value at risk), label/value/unit/limit, secondary,
hours, optional skill, and chronological samples: `[{time: ISO_TIMESTAMP, value: number}]`.
Forecasting uses least-squares regression over at least five samples and reports
slope, residual error, R² and threshold crossing from the **last sample timestamp**.
It is not a validated fault diagnosis, medical/quality release decision, or remaining
useful life model. An increasing trend with R² below 0.5 gets no crossing estimate.

CIP phase limits are `limits: {temperatureMin, temperatureMax, flowMin, conductivityMax}`.
The upstream system must supply the correct limits for the current phase. Optional
`history` entries contain time, phase and result. Being within these supplied limits
or receiving a Complete status does not certify GMP cleaning validation.
PAT entries contain name, value, unit, min and max.

Workforce expiry uses YYYY-MM-DD. Source work orders require matching source assets
and use `{id, assetId, assignee, status, note, events}`. Events are `{time,message}`;
status is Open, Assigned or Completed. Supplied assignees must exist in the same
snapshot's roster. Missing work-order data is displayed as Not supplied.

## Files and factory layouts

Tools → Organization documents accepts PDF, PNG and JPEG files (up to 15 MB), with
reference, version and an optional organization approval reference. Files persist
in IndexedDB in this browser; upload does not approve them or publish them to a DMS.
Uploaded references can be opened from the document center and downloaded intact.
Use an asset's full ID as a document reference to open it from Asset documents.

Connections → Site layout accepts a PNG/JPEG of your campus drawing or 3D render.
Specify its revision and set each area's X/Y percentage to align the clickable
hotspots. This is an organization-supplied image, not an imported BIM/GLB model.
Existing illustrative interactive 3D engineering views remain available.

## Gateway protocol

- `GET {base}/snapshot`: one factory envelope above.
- `POST {base}/commands`: requestId, factory, kind, target, action, payload,
  requestedAt. `Idempotency-Key` equals requestId. Receipt: requestId, status
  (`accepted`, `executed`, `rejected`), message. No optimistic state changes.
- Kinds: line (Running/Stopped/Changeover), batch (start/hold/resume/advance),
  alarm (acknowledge/resolve), workOrder (assign/complete).
- Gateway authorization, technician checks, equipment interlocks, lifecycle rules,
  and actual execution are enforced by your approved plant-side adapter.

## Included reference gateway

`gateway/server.py` uses Python's standard library and SQLite to persist snapshots,
snapshot history and an idempotent command outbox. It deliberately has **no equipment
driver**. It is a local integration reference, not a production SCADA gateway.

PowerShell, from the project folder:

```powershell
$env:OPS_GATEWAY_TOKEN = Read-Host 'Set a private gateway key (at least 24 characters)'
$env:OPS_ALLOWED_ORIGINS = 'http://127.0.0.1:8088'
py gateway/server.py --port 8787
```

In another terminal:

```powershell
py -m http.server 8088 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8787/login and sign in with that key. In the local dashboard,
connect factory 0 to http://127.0.0.1:8787/api/factories/0. An authorized adapter
publishes actual snapshots using POST to that base's /snapshot with server-side
`Authorization: Bearer <key>`. Never commit this key or a production snapshot.

The adapter reads GET /api/factories/0/commands with bearer authorization, executes
only approved/authorized requests, then PATCHes /api/commands/{requestId} with
`{status: executed|rejected, message: ...}` and publishes the resulting snapshot.
Until then the receipt remains accepted, and the dashboard keeps source-confirmed
state. SQLite does not create or execute equipment commands by itself.

For hosted use, deploy your approved gateway behind HTTPS and authentication,
allowlist the exact Site origin, and configure an authenticated browser session.
A cross-site gateway may require compatible cookie settings and browser permission;
prefer a trusted same-site gateway. Do not expose this development HTTP server
publicly or treat its shared access key as production identity/role management.

## What still needs organization input

Actual source endpoints and mappings, approved files/layouts, authentic telemetry,
plant-side command drivers and authorization, and labeled fault history for any
validated failure/RUL model. These cannot be inferred from the reference screenshots.
