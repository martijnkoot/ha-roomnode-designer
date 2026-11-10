# Roomnode Designer

A Home Assistant custom integration that adds a floor plan editor to the sidebar. Place
the Jarvis ESP roomnodes on a plan per floor, then draw their radar detection zones,
exclusion zones and entry lines instead of typing coordinates.

It does not talk to the radar itself. The roomnode firmware already exposes the zones as
`text` entities (`Polygon Zone 1-4`, `Polygon Exclusion 1-2`, `Entry Line 1-2`); this
integration converts shapes drawn on the floor plan into the radar's own coordinate frame
and writes them to those entities.

## Status

Version 0.2.0. The editor and the coordinate maths were exercised in a browser against a
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
   be dragged. To remove a corner, click it and press Delete (or click the red ×, or right-click
   it); a shape keeps at least 3 points. Click a dimension label to type an exact length such as
   `4,5`, `450cm` or `4500mm`: the far end of that edge moves, and when the next edge is
   perpendicular it slides along so right angles stay right. Points snap to the corners and walls of other rooms, line up with their corners (dashed green guide) and otherwise snap to a 10 cm grid, so a new room can be drawn flush against its neighbour. Hold **Shift** to keep lines horizontal or vertical: while drawing, the new point lines up with the previous one; while dragging a corner of a room or zone, it snaps to the position that keeps both neighbouring edges straight (a right angle); while moving a whole shape, it moves along one axis. Hold **Alt** to disable snapping.
5. **Send to device** writes everything to the roomnode in one go: the radar settings (mode,
   distance, detection angles) and the zones, exclusion zones and entry lines. **Read from
   device** does the reverse and replaces those settings and shapes in the plan.
6. **Live targets** overlays the radar's tracked targets. Walk through the room: if the dots
   move opposite to you, enable *Mirror left/right* on the node.
   The dots glide smoothly between the radar's updates and leave a trail that fades out over
   about 2.5 seconds.

Both side panels and the toolbar can be hidden with the buttons in the top corners of the drawing area to make more room; a dot on the right button means something is selected. With the toolbar hidden the keyboard shortcuts below still work. The choice is remembered per browser.

The **lock** button at the right of the toolbar (shortcut **L**) protects the drawing against accidental changes: you can still select a roomnode (or room or zone) to read its details, pan, zoom, show live targets and push a roomnode to its device, but nothing can be moved, drawn, edited or deleted, and "read from device" is disabled. The lock is remembered per browser.

Changes autosave. Ctrl/Cmd+Z undoes, Delete removes the selection, Esc cancels. Scroll to
zoom, drag the background to pan.

## Detection angle

A roomnode has a **Detection angle** (start and end) next to its range. They map to the radar's
own settings `Tracking Radar Detection Start Angle`, `Detection End Angle` and `Detection
Distance`, and decide the coverage drawn on the plan. *Send to device* writes them to the radar (only the
values that differ); *Read from device* fills them in from the device.
Placing a roomnode starts from what the radar currently reports.

The firmware accepts different ranges per installation mode, and the editor checks the same
rules before sending:

| Mode | Distance | Angles | Meaning |
| --- | --- | --- | --- |
| Wall (`side`) | 0.1 - 6 m | -60° to 60°, start < end | A sector around the heading; 0° is straight ahead. Narrowing it makes the radar ignore the sides. |
| Ceiling (`top`) | 0.1 - 4 m | 0° to 360°, start < end | A slice of the circle around the node; 0° is the heading arrow. 0-360 is the full circle, a smaller range limits detection to a slice, for example a doorway. |

So the angles are useful in ceiling mode too, but mean something different from wall mode.
The mounting you choose in the plan decides the radar's installation mode (Wall = `side`,
Ceiling = `top`). When the radar is in another mode, the button changes to "Switch radar & send
to device". After a confirmation the integration sets the mode through the device's
`Tracking Radar Installation Mode` select, waits until the radar confirms it (no restart is
needed), then writes distance and angles and replaces the zones on the device with the zones of
the plan. If the radar does not confirm within 15 seconds nothing else is written. The
installation height and installation angle of the radar are not written.

## Before first use

- **Angle direction.** Positive angles are drawn clockwise from the heading, and 0° as the heading. This follows the firmware's value ranges but was not verified on hardware; check it with *Live targets* (and *Mirror left/right*, which also reverses the angles).
- **Mirroring.** The firmware reports targets as x lateral, y forward. Whether positive x is
  to the radar's left or right was not verified. Use *Live targets* once per node and set
  *Mirror left/right* if needed; entry line directions are corrected automatically.
- **Entity discovery** matches ESPHome entities by their original names (for example
  `Polygon Zone 1`). If you renamed the firmware entities, discovery fails.
- **Shape limits come from the firmware**: 4 zones, 2 exclusions, 2 entry lines, 20 points per
  shape, 255 characters per encoded shape. Violations are reported when pushing.
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
