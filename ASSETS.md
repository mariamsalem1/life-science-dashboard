# Dashboard Visual Assets

- `dist/assets/schneider-electric.svg`: Schneider Electric wordmark, transparent
  SVG from https://commons.wikimedia.org/wiki/File:Schneider_Electric_2007.svg.
  The original vector paths and colors are retained; there is no background rectangle.
- `dist/assets/cctv-realistic.png`: generated illustrative factory-camera contact
  sheet showing staffed reception, production corridor, packaging room and warehouse.
- `dist/assets/cctv-walking-worker.png`: generated transparent four-frame walking
  sprite. CSS animates the sprite in selected simulated camera views. It respects
  the browser's reduced-motion preference. These views are not live video or recordings.

Camera identifiers, campus coverage and configured HTTPS image endpoints remain
specific to the selected factory. A configured endpoint is shown directly and does
not receive the simulated walking overlay.

The Utilities tab currently displays explicitly labeled demo profiles. Water, gas
and electricity are period totals; power is instantaneous demand and is not multiplied
by the selected period. Existing live gateway, source import and report functions
are retained even though Connections is no longer a navigation tab.
