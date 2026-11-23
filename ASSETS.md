# Dashboard Visual Assets

- `dist/assets/schneider-electric.svg`: Schneider Electric wordmark, transparent
  SVG from https://commons.wikimedia.org/wiki/File:Schneider_Electric_2007.svg.
  The original vector paths and colors are retained; there is no background rectangle.
- `dist/assets/cctv-realistic.png`: generated illustrative factory-camera contact
  sheet showing staffed reception, production corridor, packaging room and warehouse.
- `dist/assets/cctv-walking-worker.png`: retained historical sprite asset, unused
  by current camera views. The walking-person overlay has been removed.
- `dist/assets/network-background.png`: full-screen adaptation of the supplied
  blue/violet network reference image, with screenshot controls removed.
- `dist/assets/dashboard-atmosphere.png`: approved dark cyan/mint/violet background
  for all dashboard views, with a quiet center and subtle perimeter mesh.
- `dist/assets/holographic-egypt.png`: transparent map-only artwork derived from
  the approved holographic network concept. Factory markers, connection paths,
  labels and selected-site readings are rendered separately as interactive UI.
  The geography and marker locations are illustrative, not surveyed GIS positions.
- `dist/assets/holographic-earth-horizon.png`: decorative cyan Earth-at-night
  backdrop behind the holographic platform, matching the approved reference style.

Camera identifiers, campus coverage and configured HTTPS image endpoints remain
specific to the selected factory. A configured endpoint is shown directly and does
not receive a simulated walking overlay. Illustrative camera scenes are still
images, not live video or recordings.

The Utilities tab currently displays explicitly labeled demo profiles. Water, gas
and electricity are period totals; power is instantaneous demand and is not multiplied
by the selected period. Existing live gateway, source import and report functions
are retained even though Connections is no longer a navigation tab.
