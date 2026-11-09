# Roomnode Designer

A Home Assistant custom integration that adds a floor plan editor to the sidebar. Place
the Jarvis ESP roomnodes on a plan per floor, then draw their radar detection zones,
exclusion zones and entry lines instead of typing coordinates.

It does not talk to the radar itself. The roomnode firmware already exposes the zones as
`text` entities (`Polygon Zone 1-4`, `Polygon Exclusion 1-2`, `Entry Line 1-2`); this
integration converts shapes drawn on the floor plan into the radar's own coordinate frame
and writes them to those entities.

## Status

Version 0.1.2. The editor and the coordinate maths were exercised in a browser against a
simulated Home Assistant, and the geometry and validation have unit tests. **It has not yet
been run inside a real Home Assistant, and the radar axis orientation has not been verified
on hardware.** See [Before first use](#before-first-use).

## Install

Requires Home Assistant 2026.11 or newer, where the Marketplace replaces HACS. Older versions
can use [HACS](https://hacs.xyz) with the same repository URL.

1. Settings → **Marketplace** → **Add from link** → enter `martijnkoot/ha-roomnode-designer`
   (the Marketplace asks you to connect a GitHub account for custom repositories).
2. Install **Roomnode Designer** and restart Home Assistant when asked.
3. Settings → Devices & services → **Add integration** → *Roomnode Designer*.
4. A **Roomnodes** entry appears in the sidebar (administrators only).

Updates appear under Settings → Updates next to Home Assistant updates. The repository must
stay public on GitHub and keep `hacs.json` and the `custom_components/roomnode_designer/`
layout, otherwise the Marketplace cannot update it.

## Using the editor

1. Pick a floor at the top. Floors, areas and devices come from Home Assistant's own
   registries (Floor → Area → Device, as in the Jarvis home taxonomy); without floors a single
   default floor is used.
2. **Rooms**: choose *Draw* next to an area in the left list, then drag a rectangle or
   click the corners of a polygon. Double-click or Enter closes it. The room is linked to
   the area.
3. **Roomnodes**: choose *Place* next to a discovered device. It lands in the room that
   belongs to its area. Drag it to its real position and drag the handle in front of it to
   set the heading. Mounting type, height, range and field of view start from the values the
   firmware reports.
4. **Zones**: with a roomnode selected, use *Detection zone*, *Exclusion zone* or *Entry
   line*. Drag a rectangle or click points. Corners and edge midpoints of a selected shape can
   be dragged; double-click a corner to delete it. Corners snap to room corners and a 10 cm
   grid; hold Shift to disable snapping.
5. **Push to device** writes the saved shapes to the roomnode. **Read from device** replaces
   the plan's zones for that node with what the device currently stores.
6. **Live targets** overlays the radar's tracked targets. Walk through the room: if the dots
   move opposite to you, enable *Mirror left/right* on the node.

Both side panels can be collapsed with the buttons in the top corners of the drawing area to make more room; a dot on the right button means something is selected. The choice is remembered per browser.

Changes autosave. Ctrl/Cmd+Z undoes, Delete removes the selection, Esc cancels. Scroll to
zoom, drag the background to pan.

## Before first use

- **Mirroring.** The firmware reports targets as x lateral, y forward. Whether positive x is
  to the radar's left or right was not verified. Use *Live targets* once per node and set
  *Mirror left/right* if needed; entry line directions are corrected automatically.
- **Entity discovery** matches ESPHome entities by their original names (for example
  `Polygon Zone 1`). If you renamed the firmware entities, discovery fails.
- **Shape limits come from the firmware**: 4 zones, 2 exclusions, 2 entry lines, 20 points per
  shape, 255 characters per encoded shape. Violations are reported when pushing.
- **Ceiling coverage** is drawn as an approximate circle from height and field of view.
- The plan is stored in `.storage/roomnode_designer.model` and is not part of Home Assistant
  backups of the ESPHome configuration, only of the `.storage` folder.

## Coordinate conventions

Floor plan: millimetres, x east, y north. A node has a heading (0° = up, clockwise positive).
The radar frame is x lateral, y forward, origin at the radar. Encoded polygons look like
`x:y;x:y;x:y` and entry lines like `x1:y1;x2:y2;left|right`, as defined in
`roomnode/vendor/ld2460/packages/ld2460-polygon-zones.yaml` in the private Jarvis repository.
[geometry.py](custom_components/roomnode_designer/geometry.py) is the single implementation of
this conversion.

## Development

```sh
python3 -m unittest discover -s tests -v
node --check custom_components/roomnode_designer/frontend/roomnode-designer-panel.js
```

`dev/index.html` runs the panel against a mock Home Assistant. Serve the repository root with
any static server, for example `python3 -m http.server`, and open `/dev/index.html`. Add
`?dark=1` for the dark theme.

## Publishing a release

Bump `version` in `custom_components/roomnode_designer/manifest.json`, commit, and tag and
publish a GitHub release with the same version (for example `v0.1.1`). The GitHub workflow
runs the HACS validation and hassfest on every push; those actions were written for HACS and
have not been checked against the new Marketplace.

## Firmware contract

The entity names and string formats this integration depends on come from the Jarvis roomnode
firmware. Change them there and here together.

## License

MIT, see [LICENSE](LICENSE).
