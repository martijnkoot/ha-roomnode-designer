/*
 * Roomnode Designer panel for Home Assistant.
 * Single-file web component, no build step. Floor plan coordinates are in
 * millimetres, x east / y north; the SVG flips y when drawing.
 * The radar math mirrors custom_components/roomnode_designer/geometry.py
 * (the Python side is authoritative for what is sent to the device).
 */

const API = "roomnode_designer";
const DEFAULT_FLOOR = "__default__";
const COLORS = ["#2196f3", "#43a047", "#fb8c00", "#8e24aa", "#00acc1", "#e91e63", "#6d4c41", "#546e7a"];
const SLOTS = { zone: 4, exclusion: 2, line: 2 };

const TEXT = {
  en: {
    title: "Roomnodes", floor: "Floor", nodes: "Roomnodes on this floor", devices: "Available roomnodes",
    no_nodes: "None placed yet.", no_devices: "No unplaced roomnodes found. Add the ESPHome device to Home Assistant first.",
    rooms: "Rooms", draw_area: "Draw", place: "Place", remove: "Remove from plan",
    tool_select: "Select", tool_room: "Draw room", tool_zone: "Detection zone", tool_excl: "Exclusion zone", tool_line: "Entry line",
    need_node: "Select a roomnode first", snap: "Snap", live: "Live targets", fit: "Fit to view", undo: "Undo", redo: "Redo",
    saved: "Saved", saving: "Saving…", unsaved: "Unsaved changes", conflict: "Changed elsewhere — reload", reload: "Reload",
    push: "Push to device", pull: "Read from device", pushing: "Pushing…", pushed: "Sent to device", push_failed: "Push failed",
    pull_confirm: "Replace the zones of this roomnode in the plan with the ones stored on the device?",
    pulled: "Zones read from device", last_sent: "Last sent to device",
    node_settings: "Roomnode", name: "Name", device: "Device", mounting: "Mounting", wall: "Wall", ceiling: "Ceiling",
    height: "Mounting height (m)", range: "Max range (m)", fov: "Field of view (°)", rotation: "Heading (°, 0 = up)",
    flip_x: "Mirror left/right", flip_hint: "Enable if live targets move opposite to your movement.",
    pos_x: "X (m)", pos_y: "Y (m)", zones_enabled: "Zones active on device", people: "People count", reset_people: "Reset",
    shapes: "Zones & lines", zone: "Zone", exclusion: "Exclusion", line: "Entry line", slot: "Slot",
    in_side: "Counts as “in” when crossing to the", left: "left", right: "right", flip_dir: "Flip direction", swap_ends: "Swap ends",
    outside: "point(s) outside the radar range", area: "Home Assistant area", none: "— none —", delete: "Delete",
    room: "Room", select_hint: "Select a roomnode, room or zone, or place a roomnode from the list.",
    hint_poly: "Drag for a rectangle, or click points. Hold Shift for straight lines, Alt for no snapping. Double-click or Enter to finish, Esc to cancel.",
    hint_line: "Click two points (Shift = straight). Then flip the direction in the panel if needed.",
    slots_full: "All slots of this type are in use.", slot_taken: "That slot is already in use.", auto_floor: "Default floor",
    floor_hint: "Using a default floor. Add floors under Settings → Areas to separate levels.",
    cover_note: "Approximate radar coverage", min_points: "A shape needs at least 3 points.", dim_invalid: "Enter a length such as 4.5 (metres), 450cm or 4500mm.", dim_hint: "Enter = apply, Esc = cancel", hint_edit: "Click a corner, then press Delete or right-click it to remove it. Click a dimension to type an exact length.", lock: "Lock", unlock: "Unlock", lock_title: "Lock the drawing against accidental changes", unlock_title: "Unlock to edit the drawing", locked_msg: "Locked. Unlock to make changes.", locked_hint: "Locked: you can select, pan, zoom and push; nothing can be changed.", angles: "Detection angle", angle_start: "Start (°)", angle_end: "End (°)",
    hint_angle_wall: "Wall mode: -60° to 60° around the heading (0° = straight ahead). A narrower range makes the radar ignore the sides. Max distance 6 m.",
    hint_angle_ceiling: "Ceiling mode: 0° to 360° around the node (0° = the heading arrow). A smaller range limits detection to a slice. Max distance 4 m.",
    p_dist: "Max range must be between 0.1 and {max} m in this mode.", p_order: "Start must be smaller than end.", p_bounds: "Angles must stay between {lo}° and {hi}° in this mode.",
    push_radar: "Send radar settings", pull_radar: "Read radar settings", on_device: "On the device", no_radar_entities: "This device does not expose the radar detection settings.",
    mode_mismatch: "The radar is in {mode} mode, the plan says {plan}. Sending will switch the radar to {plan} mode.", push_radar_switch: "Switch radar & send settings", switch_confirm: "The radar will be switched from {from} to {to} mode. The zones on the device are replaced by the zones in the plan, and the detection distance and angles are set. Continue?", radar_switched: "Radar switched; settings and zones sent. Check with Live targets.", radar_pushed: "Radar updated", radar_same: "The radar already has these settings.", radar_pulled: "Radar settings read from the device", rk_distance: "distance", rk_start: "start", rk_end: "end",
    hide_tools: "Hide toolbar", show_tools: "Show toolbar", hide_left: "Hide lists", show_left: "Show lists", hide_right: "Hide details", show_right: "Show details", targets: "targets", menu: "Menu", plan: "Plan", panel: "Panel",
  },
  nl: {
    title: "Roomnodes", floor: "Verdieping", nodes: "Roomnodes op deze verdieping", devices: "Beschikbare roomnodes",
    no_nodes: "Nog niets geplaatst.", no_devices: "Geen ongeplaatste roomnodes gevonden. Voeg eerst het ESPHome-apparaat toe aan Home Assistant.",
    rooms: "Kamers", draw_area: "Tekenen", place: "Plaatsen", remove: "Van plattegrond halen",
    tool_select: "Selecteren", tool_room: "Kamer tekenen", tool_zone: "Detectiezone", tool_excl: "Uitsluitzone", tool_line: "Entry line",
    need_node: "Selecteer eerst een roomnode", snap: "Magneet", live: "Live doelen", fit: "Passend maken", undo: "Ongedaan maken", redo: "Opnieuw",
    saved: "Opgeslagen", saving: "Opslaan…", unsaved: "Niet-opgeslagen wijzigingen", conflict: "Elders gewijzigd — herlaad", reload: "Herladen",
    push: "Naar apparaat sturen", pull: "Van apparaat lezen", pushing: "Versturen…", pushed: "Naar apparaat gestuurd", push_failed: "Versturen mislukt",
    pull_confirm: "De zones van deze roomnode in de plattegrond vervangen door die op het apparaat?",
    pulled: "Zones van apparaat gelezen", last_sent: "Laatst naar apparaat gestuurd",
    node_settings: "Roomnode", name: "Naam", device: "Apparaat", mounting: "Montage", wall: "Wand", ceiling: "Plafond",
    height: "Montagehoogte (m)", range: "Max. bereik (m)", fov: "Kijkhoek (°)", rotation: "Richting (°, 0 = omhoog)",
    flip_x: "Links/rechts spiegelen", flip_hint: "Zet aan als live doelen tegengesteld aan jouw beweging bewegen.",
    pos_x: "X (m)", pos_y: "Y (m)", zones_enabled: "Zones actief op apparaat", people: "Aantal personen", reset_people: "Reset",
    shapes: "Zones & lijnen", zone: "Zone", exclusion: "Uitsluitzone", line: "Entry line", slot: "Slot",
    in_side: "Telt als “binnen” bij oversteken naar", left: "links", right: "rechts", flip_dir: "Richting omdraaien", swap_ends: "Uiteinden wisselen",
    outside: "punt(en) buiten radarbereik", area: "Home Assistant-gebied", none: "— geen —", delete: "Verwijderen",
    room: "Kamer", select_hint: "Selecteer een roomnode, kamer of zone, of plaats een roomnode uit de lijst.",
    hint_poly: "Sleep voor een rechthoek, of klik punten. Houd Shift ingedrukt voor rechte lijnen, Alt voor geen magneet. Dubbelklik of Enter om af te sluiten, Esc om te annuleren.",
    hint_line: "Klik twee punten (Shift = recht). Draai daarna zo nodig de richting om in het paneel.",
    slots_full: "Alle slots van dit type zijn in gebruik.", slot_taken: "Dat slot is al in gebruik.", auto_floor: "Standaardverdieping",
    floor_hint: "Standaardverdieping in gebruik. Voeg verdiepingen toe onder Instellingen → Gebieden.",
    cover_note: "Geschat radarbereik", min_points: "Een vorm heeft minstens 3 punten nodig.", dim_invalid: "Voer een lengte in zoals 4,5 (meter), 450cm of 4500mm.", dim_hint: "Enter = toepassen, Esc = annuleren", hint_edit: "Klik een hoekpunt en druk op Delete, of rechtsklik erop, om het te verwijderen. Klik op een maat om een exacte lengte in te typen.", lock: "Vergrendel", unlock: "Ontgrendel", lock_title: "Vergrendel de tekening tegen onbedoelde wijzigingen", unlock_title: "Ontgrendel om de tekening te bewerken", locked_msg: "Vergrendeld. Ontgrendel om te wijzigen.", locked_hint: "Vergrendeld: je kunt selecteren, verschuiven, zoomen en naar het apparaat sturen; niets kan gewijzigd worden.", angles: "Detectiehoek", angle_start: "Start (°)", angle_end: "Eind (°)",
    hint_angle_wall: "Wandmodus: -60° tot 60° rond de richting (0° = recht vooruit). Een smaller bereik laat de radar de zijkanten negeren. Max. afstand 6 m.",
    hint_angle_ceiling: "Plafondmodus: 0° tot 360° rond de node (0° = de richtingspijl). Een kleiner bereik beperkt de detectie tot een taartpunt. Max. afstand 4 m.",
    p_dist: "Max. bereik moet in deze modus tussen 0,1 en {max} m liggen.", p_order: "Start moet kleiner zijn dan eind.", p_bounds: "Hoeken moeten in deze modus tussen {lo}° en {hi}° blijven.",
    push_radar: "Radar-instellingen versturen", pull_radar: "Radar-instellingen lezen", on_device: "Op het apparaat", no_radar_entities: "Dit apparaat toont de radar-detectie-instellingen niet.",
    mode_mismatch: "De radar staat in {mode}-modus, het plan zegt {plan}. Versturen zet de radar om naar {plan}-modus.", push_radar_switch: "Radar omzetten & instellingen versturen", switch_confirm: "De radar wordt omgezet van {from} naar {to}-modus. De zones op het apparaat worden vervangen door de zones uit het plan, en afstand en hoeken worden ingesteld. Doorgaan?", radar_switched: "Radar omgezet; instellingen en zones verstuurd. Controleer met Live doelen.", radar_pushed: "Radar bijgewerkt", radar_same: "De radar had deze instellingen al.", radar_pulled: "Radar-instellingen van het apparaat gelezen", rk_distance: "afstand", rk_start: "start", rk_end: "eind",
    hide_tools: "Werkbalk verbergen", show_tools: "Werkbalk tonen", hide_left: "Lijsten verbergen", show_left: "Lijsten tonen", hide_right: "Details verbergen", show_right: "Details tonen", targets: "doelen", menu: "Menu", plan: "Plattegrond", panel: "Paneel",
  },
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, "0")).join("");
const clone = (o) => JSON.parse(JSON.stringify(o));
const rad = (d) => (d * Math.PI) / 180;
const m2 = (mm) => (mm / 1000).toFixed(2);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* ---- radar math (mirror of geometry.py) ---- */
function basis(node) {
  const h = rad(node.rotation || 0);
  const forward = [Math.sin(h), Math.cos(h)];
  let right = [Math.cos(h), -Math.sin(h)];
  if (node.flip_x) right = [-right[0], -right[1]];
  return { right, forward };
}
function radarToFloor(p, node) {
  const { right, forward } = basis(node);
  return [node.x + p[0] * right[0] + p[1] * forward[0], node.y + p[0] * right[1] + p[1] * forward[1]];
}
/* Detection angles are what the radar is configured with: -60..60 around the heading in wall
   (side) mode, a 0..360 slice around the node in ceiling (top) mode. Positive angles run
   clockwise; the left/right mirror option reverses them. The sign was not verified on hardware. */
function coverageRadius(node) { return node.range; }
function detectAngles(node) {
  const ceiling = node.mounting === "ceiling";
  return [node.angle_start ?? (ceiling ? 0 : -60), node.angle_end ?? (ceiling ? 360 : 60)];
}
function floorAngle(node, a) { return (node.rotation || 0) + (node.flip_x ? -a : a); }
function coveragePoints(node) {
  const R = coverageRadius(node), [a0, a1] = detectAngles(node);
  if (node.mounting === "ceiling" && a1 - a0 >= 359.9) {
    return Array.from({ length: 48 }, (_, i) => [node.x + R * Math.cos(rad(i * 7.5)), node.y + R * Math.sin(rad(i * 7.5))]);
  }
  const pts = [[node.x, node.y]];
  const steps = Math.max(1, Math.ceil((a1 - a0) / 4));
  for (let i = 0; i <= steps; i++) {
    const h = rad(floorAngle(node, a0 + ((a1 - a0) * i) / steps));
    pts.push([node.x + R * Math.sin(h), node.y + R * Math.cos(h)]);
  }
  return pts;
}
function inCoverage(node, p) {
  if (dist([node.x, node.y], p) > coverageRadius(node)) return false;
  const [a0, a1] = detectAngles(node);
  if (node.mounting === "ceiling" && a1 - a0 >= 359.9) return true;
  let rel = (Math.atan2(p[0] - node.x, p[1] - node.y) * 180) / Math.PI - (node.rotation || 0);
  if (node.flip_x) rel = -rel;
  rel = node.mounting === "ceiling" ? ((rel % 360) + 360) % 360 : ((rel + 540) % 360) - 180;
  return rel >= a0 && rel <= a1;
}
function centroid(pts) {
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
}
function pointInPoly(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const STYLE = `
:host{display:block;height:100vh;height:100dvh;overflow:hidden;--rd-bg:var(--primary-background-color,#fafafa);--rd-card:var(--card-background-color,#fff);--rd-text:var(--primary-text-color,#212121);--rd-sub:var(--secondary-text-color,#727272);--rd-line:var(--divider-color,#e0e0e0);--rd-accent:var(--primary-color,#03a9f4);--rd-err:var(--error-color,#db4437);--rd-ok:var(--success-color,#43a047)}
*{box-sizing:border-box}
.root{display:grid;grid-template-rows:auto 1fr;height:100%;background:var(--rd-bg);color:var(--rd-text);font-family:var(--paper-font-body1_-_font-family,Roboto,sans-serif);font-size:14px}
header{display:flex;align-items:center;gap:12px;padding:0 16px;height:56px;background:var(--app-header-background-color,var(--rd-accent));color:var(--app-header-text-color,#fff);box-shadow:0 1px 3px rgba(0,0,0,.25);z-index:3}
header h1{font-size:20px;font-weight:400;margin:0;white-space:nowrap}
.menu{display:none;background:none;border:0;color:inherit;font-size:22px;cursor:pointer;padding:4px 8px}
.floors{display:flex;gap:4px;overflow:auto;flex:1}
.floors button{background:rgba(255,255,255,.15);border:0;color:inherit;padding:7px 14px;border-radius:18px;cursor:pointer;white-space:nowrap;font:inherit}
.floors button.on{background:#fff;color:var(--rd-accent);font-weight:500}
.status{font-size:13px;opacity:.95;white-space:nowrap;display:flex;align-items:center;gap:8px}
.status button{background:#fff;color:var(--rd-accent);border:0;border-radius:4px;padding:3px 8px;cursor:pointer;font:inherit}
.status.bad{color:#ffd0cc;font-weight:500}
main{display:grid;grid-template-columns:300px 1fr 340px;min-height:0}
aside.left{grid-column:1}.canvas{grid-column:2}aside.right{grid-column:3}
main.hide-left{grid-template-columns:0 1fr 340px}main.hide-right{grid-template-columns:300px 1fr 0}main.hide-left.hide-right{grid-template-columns:0 1fr 0}
main.hide-left aside.left,main.hide-right aside.right{display:none}
.canvas{--edge-top:76px}main.hide-tools .canvas{--edge-top:12px}main.hide-tools .tools{display:none}
.edge{position:absolute;top:var(--edge-top);z-index:2;width:38px;height:38px;border:0;border-radius:8px;background:var(--rd-card);color:var(--rd-text);box-shadow:0 2px 8px rgba(0,0,0,.22);cursor:pointer;display:flex;align-items:center;justify-content:center}
.edge:hover{background:var(--rd-bg)}.edge svg{width:22px;height:22px;pointer-events:none}.edge.l{left:12px}.edge.r{right:12px}.edge.t{left:12px;top:calc(var(--edge-top) + 46px)}
.edge .badge{position:absolute;top:6px;right:6px;width:9px;height:9px;border-radius:50%;background:var(--rd-accent);display:none}.edge.has .badge{display:block}
aside{background:var(--rd-card);overflow:auto;padding:12px 14px;min-height:0}
aside.left{border-right:1px solid var(--rd-line)}
aside.right{border-left:1px solid var(--rd-line)}
h3{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--rd-sub);margin:18px 0 8px;font-weight:500}
h3:first-child{margin-top:4px}
.item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;border:1px solid transparent}
.item:hover{background:var(--rd-bg)}.item.sel{border-color:var(--rd-accent);background:color-mix(in srgb,var(--rd-accent) 10%,transparent)}
.dot{width:12px;height:12px;border-radius:50%;flex:none}
.item .t{flex:1;min-width:0}.item .t b{display:block;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.item .t span{font-size:12px;color:var(--rd-sub)}
.btn{background:var(--rd-accent);color:var(--text-primary-color,#fff);border:0;border-radius:6px;padding:7px 12px;cursor:pointer;font:inherit;font-weight:500}
.btn.ghost{background:none;color:var(--rd-accent);border:1px solid var(--rd-line)}
.btn.danger{background:none;color:var(--rd-err);border:1px solid var(--rd-line)}
.btn.sm{padding:4px 9px;font-size:13px}.btn:disabled{opacity:.45;cursor:default}
.row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.empty{color:var(--rd-sub);padding:6px 2px;font-size:13px}
label.f{display:block;margin:10px 0}label.f>span{display:block;font-size:12px;color:var(--rd-sub);margin-bottom:3px}
input[type=text],input[type=number],select{width:100%;padding:8px 9px;border:1px solid var(--rd-line);border-radius:6px;background:var(--rd-bg);color:var(--rd-text);font:inherit}
label.chk{display:flex;gap:8px;align-items:center;margin:10px 0;cursor:pointer}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hint{font-size:12px;color:var(--rd-sub);margin-top:2px}.warn{color:var(--rd-err);font-size:12px;margin:4px 0}
code.sent{display:block;font-size:11px;word-break:break-all;background:var(--rd-bg);padding:6px 8px;border-radius:6px;margin-top:4px}
.canvas{position:relative;min-width:0;min-height:0;background:var(--rd-bg)}
svg{width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none}
svg.pan{cursor:grab}svg.draw{cursor:crosshair}
.tools{position:absolute;top:12px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);overflow-x:auto;display:flex;gap:2px;background:var(--rd-card);border-radius:10px;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,.22);z-index:2}
.tools button{display:flex;flex-direction:column;align-items:center;gap:1px;border:0;background:none;color:var(--rd-text);padding:6px 11px;border-radius:7px;cursor:pointer;font:inherit;font-size:11px;min-width:64px}
.tools button svg{width:22px;height:22px;pointer-events:none}.tools button:hover:not(:disabled){background:var(--rd-bg)}
.tools button.on,.tools button.on:hover:not(:disabled){background:var(--rd-accent);color:#fff}
.tools button.on:hover:not(:disabled){filter:brightness(1.12)}
.tools button.lock.on,.tools button.lock.on:hover:not(:disabled){background:#f57c00}
.lockbar{background:color-mix(in srgb,#f57c00 14%,transparent);color:var(--rd-text);border:1px solid #f57c00;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:13px}.tools button:disabled{opacity:.35;cursor:default}
.tools .sep{width:1px;background:var(--rd-line);margin:4px 3px}
.zoom{position:absolute;right:12px;bottom:36px;display:flex;flex-direction:column;gap:2px;background:var(--rd-card);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.22);z-index:2;overflow:hidden}
.zoom button{border:0;background:none;color:var(--rd-text);width:38px;height:36px;font-size:18px;cursor:pointer}.zoom button:hover{background:var(--rd-bg)}
.bar{position:absolute;left:12px;bottom:10px;right:12px;display:flex;justify-content:space-between;font-size:12px;color:var(--rd-sub);pointer-events:none;z-index:1}
.toast{position:absolute;left:50%;bottom:50px;transform:translateX(-50%);background:#323232;color:#fff;padding:10px 16px;border-radius:8px;z-index:5;max-width:80%;box-shadow:0 3px 10px rgba(0,0,0,.4)}.toast.err{background:var(--rd-err)}
.toast[hidden]{display:none}
input.dim-input{position:absolute;z-index:6;width:88px;padding:5px 6px;border:2px solid var(--rd-accent);border-radius:8px;text-align:center;font:inherit;font-weight:600;background:var(--rd-card);color:var(--rd-text);box-shadow:0 2px 10px rgba(0,0,0,.3)}
.toggle-side{display:none}
@media (max-width:1100px){main,main.hide-left,main.hide-right,main.hide-left.hide-right{grid-template-columns:1fr;grid-template-rows:1fr auto}aside.left,.canvas,aside.right{grid-column:1}aside.left{display:none}main.showleft aside.left{display:block;position:absolute;z-index:4;left:0;top:56px;bottom:0;width:min(320px,90vw)}aside.right{border-left:0;border-top:1px solid var(--rd-line);max-height:42vh}.menu{display:block}.toggle-side{display:inline-block}.tools button{min-width:52px;padding:5px 7px}.tools button span{display:none}}
`;

const ICONS = {
  select: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 2l14 9-6 1.5L15 20l-2.6 1-3-7.4L4 18z"/></svg>',
  room: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3zm2 2v14h14V5H5z"/></svg>',
  zone: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l9 6v8l-9 6-9-6V8l9-6zm0 2.4L5 9v6l7 4.6 7-4.6V9l-7-4.6z"/></svg>',
  excl: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 016.3 12.9L7.1 5.7A7.9 7.9 0 0112 4zM5.7 7.1l11.2 11.2A8 8 0 015.7 7.1z"/></svg>',
  line: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 11h13.2l-3.6-3.6L14 6l6 6-6 6-1.4-1.4 3.6-3.6H3z"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 8c-2.7 0-5.1 1-7 2.6L2 7v9h9l-3.6-3.6A8 8 0 0120 15.5l2.4-.8C21.2 10.900 17.200 8 12.500 8z"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.400 10.600A11 11 0 0011.500 8c-4.700 0-8.700 2.900-9.900 6.700l2.400.8A8 8 0 0116.600 12.400L13 16h9V7z"/></svg>',
  live: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 8a4 4 0 100 8 4 4 0 000-8zM4.900 4.900l1.400 1.400a8 8 0 000 11.400l-1.400 1.400a10 10 0 010-14.200zm14.200 0a10 10 0 010 14.200l-1.400-1.400a8 8 0 000-11.400z"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6zm3 11a2 2 0 110-4 2 2 0 010 4z"/></svg>',
  unlock: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6.500A4.500 4.500 0 007.500 5L9.300 5.800A2.500 2.500 0 0115 6.500V8H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4z"/></svg>',
  snap: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h4v4H3zm7 0h4v4h-4zm7 0h4v4h-4zM3 10h4v4H3zm7 0h4v4h-4zm7 0h4v4h-4zM3 17h4v4H3zm7 0h4v4h-4zm7 0h4v4h-4z"/></svg>',
};

class RoomnodeDesignerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._narrow = false;
    this.model = { floors: {} };
    this.revision = 0;
    this.devices = [];
    this.floors = [];
    this.areas = [];
    this.floorId = DEFAULT_FLOOR;
    this.sel = null;
    this.tool = "select";
    this.draw = null;
    this.drag = null;
    this.pendingArea = null;
    this.snapOn = true;
    this.live = false;
    this.view = { ox: 0, oy: 0, s: 0.08, w: 800, h: 600 };
    this.cursor = null;
    this.undo = [];
    this.redo = [];
    this.status = "saved";
    this.lastSent = {};
    this._saveTimer = null;
    this._saving = false;
    this._ready = false;
    this._raf = null;
    this._onKey = this._onKey.bind(this);
    this._onKeyUp = (e) => { if (e.key === " ") this._space = false; };
    // Flush a pending autosave when the tab is hidden or closed.
    this._onVis = (e) => { if ((e.type === "pagehide" || document.visibilityState === "hidden") && this.status === "unsaved") this._save(); };
  }

  get locked() { return !!this.panels?.locked; }

  /* ---------- HA panel contract ---------- */
  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    this._ensureDom();
    if (first) this._init();
    else if (this.live && this._ready) this._scheduleCanvas();
  }
  get hass() { return this._hass; }
  set narrow(v) { this._narrow = v; }
  set route(_v) {}
  set panel(_v) {}

  connectedCallback() {
    this._ensureDom();
    window.addEventListener("keydown", this._onKey);
    window.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("visibilitychange", this._onVis);
    window.addEventListener("pagehide", this._onVis);
  }
  disconnectedCallback() {
    document.removeEventListener("visibilitychange", this._onVis);
    window.removeEventListener("pagehide", this._onVis);
    window.removeEventListener("keydown", this._onKey);
    window.removeEventListener("keyup", this._onKeyUp);
    this._ro?.disconnect();
    if (this.status === "unsaved") this._save();
  }

  /* ---------- i18n ---------- */
  t(k) {
    const lang = (this._hass?.locale?.language || this._hass?.language || "en").slice(0, 2);
    return (TEXT[lang] || TEXT.en)[k] ?? TEXT.en[k] ?? k;
  }

  /* ---------- DOM ---------- */
  _ensureDom() {
    if (this._dom) return;
    const root = this.shadowRoot;
    root.innerHTML = `<style>${STYLE}</style>
    <div class="root">
      <header><button class="menu" data-a="menu" title="Menu">☰</button><h1 id="title"></h1><div class="floors" id="floors"></div><div class="status" id="status"></div></header>
      <main id="main">
        <aside class="left" id="left"></aside>
        <section class="canvas" id="canvas">
          <div class="tools" id="tools"></div>
          <svg id="svg" xmlns="http://www.w3.org/2000/svg"></svg>
          <button class="edge l" data-a="toggle-left" id="edgeL"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3zm6 2H5v14h4V5zm2 0v14h8V5h-8z"/></svg></button>
          <button class="edge t" data-a="toggle-tools" id="edgeT"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3zm2 2v4h14V5H5zm0 6v8h14v-8H5z"/></svg></button>
          <button class="edge r" data-a="toggle-right" id="edgeR"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3zm12 2H5v14h10V5zm2 0v14h2V5h-2z"/></svg><span class="badge"></span></button>
          <div class="zoom"><button data-a="zoom-in">+</button><button data-a="zoom-out">−</button><button data-a="fit" title="">⤢</button></div>
          <div class="bar"><span id="hint"></span><span id="coords"></span></div>
          <div class="toast" id="toast" hidden></div>
        </section>
        <aside class="right" id="right"></aside>
      </main>
    </div>`;
    const $ = (id) => root.getElementById(id);
    this._dom = { title: $("title"), floors: $("floors"), status: $("status"), main: $("main"), left: $("left"), right: $("right"), tools: $("tools"), svg: $("svg"), canvas: $("canvas"), hint: $("hint"), coords: $("coords"), toast: $("toast") };
    const d = this._dom;
    root.addEventListener("click", (e) => this._onAction(e));
    d.right.addEventListener("change", (e) => this._onField(e));
    d.svg.addEventListener("pointerdown", (e) => this._onDown(e));
    d.svg.addEventListener("pointermove", (e) => this._onMove(e));
    d.svg.addEventListener("pointerup", (e) => this._onUp(e));
    d.svg.addEventListener("pointercancel", (e) => this._onUp(e));
    d.svg.addEventListener("dblclick", (e) => this._onDbl(e));
    d.svg.addEventListener("wheel", (e) => this._onWheel(e), { passive: false });
    d.svg.addEventListener("contextmenu", (e) => e.preventDefault());
    this.panels = { hideLeft: false, hideRight: false, hideTools: false, locked: false };
    try { Object.assign(this.panels, JSON.parse(localStorage.getItem("roomnode_designer.panels") || "{}")); } catch (_) {}
    this._applyPanels();
    this._ro = new ResizeObserver(() => {
      const r = d.canvas.getBoundingClientRect();
      // Keep the drawing anchored on the centre when a side panel is opened or closed.
      if (this.view.w > 0 && r.width > 0 && !this._needFit) this.view.ox += (r.width - this.view.w) / 2;
      this.view.w = r.width; this.view.h = r.height;
      if (this._needFit && r.width > 0) { this._needFit = false; this._fit(); }
      this._renderCanvas();
    });
    this._ro.observe(d.canvas);
  }

  /* ---------- load / save ---------- */
  async _init() {
    const h = this._hass;
    try {
      const [res, floors, areas] = await Promise.all([
        h.callWS({ type: `${API}/load` }),
        h.callWS({ type: "config/floor_registry/list" }).catch(() => []),
        h.callWS({ type: "config/area_registry/list" }).catch(() => []),
      ]);
      this.model = res.model; this.revision = res.revision; this.devices = res.devices;
      this.areas = areas;
      this.floors = floors.length ? [...floors].sort((a, b) => (a.level ?? 0) - (b.level ?? 0)) : [{ floor_id: DEFAULT_FLOOR, name: this.t("auto_floor"), level: 0 }];
      const first = this.floors.find((f) => (this.model.floors[f.floor_id]?.nodes.length || 0) > 0) || this.floors[0];
      this.floorId = first.floor_id;
      this._ready = true;
      this._needFit = true;
      this._ensureFloor();
      this._renderAll();
      this._fit();
      this._renderCanvas();
    } catch (err) {
      this._toast(err?.message || String(err), true);
    }
  }
  _ensureFloor() {
    this.model.floors[this.floorId] ??= { rooms: [], nodes: [] };
  }
  get fl() { this._ensureFloor(); return this.model.floors[this.floorId]; }

  _changed() {
    this.status = "unsaved";
    this._renderStatus();
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(), 400);
  }
  async _save() {
    clearTimeout(this._saveTimer);
    if (this._saving) { this._saveAgain = true; return; }
    if (this.status === "conflict") return;
    this._saving = true; this.status = "saving"; this._renderStatus();
    try {
      const res = await this._hass.callWS({ type: `${API}/save`, model: this.model, revision: this.revision });
      this.revision = res.revision;
      this.status = "saved";
    } catch (err) {
      if (err?.code === "conflict") this.status = "conflict";
      else { this.status = "unsaved"; this._toast(err?.message || String(err), true); }
    }
    this._saving = false;
    if (this._saveAgain) { this._saveAgain = false; if (this.status !== "conflict") await this._save(); }
    this._renderStatus();
  }
  async _flushSave() {
    if (this.status === "unsaved") await this._save();
    while (this._saving) await new Promise((r) => setTimeout(r, 50));
  }

  /* ---------- history ---------- */
  _beginEdit() {
    this.undo.push(JSON.stringify(this.model));
    if (this.undo.length > 100) this.undo.shift();
    this.redo = [];
  }
  _restore(json) {
    this.model = JSON.parse(json);
    this._ensureFloor();
    if (this.sel && !this._selObj()) this.sel = null;
    this._changed(); this._renderAll();
  }
  _undo() { if (!this.undo.length) return; this.redo.push(JSON.stringify(this.model)); this._restore(this.undo.pop()); }
  _redo() { if (!this.redo.length) return; this.undo.push(JSON.stringify(this.model)); this._restore(this.redo.pop()); }

  /* ---------- model helpers ---------- */
  nodeColor(node) {
    const all = Object.values(this.model.floors).flatMap((f) => f.nodes);
    return COLORS[Math.max(0, all.findIndex((n) => n.id === node.id)) % COLORS.length];
  }
  deviceOf(node) { return this.devices.find((d) => d.device_id === node.device_id); }
  stateOf(device, name) { return device?.entities?.[name] ? this._hass.states[device.entities[name]] : undefined; }
  selNode() {
    if (!this.sel) return null;
    const id = this.sel.type === "node" ? this.sel.id : this.sel.node;
    return this.fl.nodes.find((n) => n.id === id) || null;
  }
  _selObj() {
    const s = this.sel; if (!s) return null;
    if (s.type === "node") return this.fl.nodes.find((n) => n.id === s.id) || null;
    if (s.type === "room") return this.fl.rooms.find((r) => r.id === s.id) || null;
    const node = this.selNode(); if (!node) return null;
    if (s.type === "zone") return node.zones.find((z) => z.kind === s.kind && z.slot === s.slot) || null;
    if (s.type === "line") return node.lines.find((l) => l.slot === s.slot) || null;
    return null;
  }
  _nextSlot(items, kind) {
    const used = new Set(items.filter((i) => !kind || i.kind === kind).map((i) => i.slot));
    for (let s = 1; s <= SLOTS[kind || "line"]; s++) if (!used.has(s)) return s;
    return 0;
  }
  _unplaced() {
    const placed = new Set(Object.values(this.model.floors).flatMap((f) => f.nodes.map((n) => n.device_id)));
    return this.devices.filter((d) => !placed.has(d.device_id));
  }

  _placeDevice(deviceId) {
    const dev = this.devices.find((d) => d.device_id === deviceId); if (!dev) return;
    const area = this.areas.find((a) => a.area_id === dev.area_id);
    if (area?.floor_id && this.floors.some((f) => f.floor_id === area.floor_id)) this.floorId = area.floor_id;
    this._beginEdit();
    const room = this.fl.rooms.find((r) => r.area_id && r.area_id === dev.area_id);
    const at = room ? centroid(room.points) : this._viewCenter();
    // Distances come from HA in whatever unit the sensor uses; convert to mm and ignore
    // values outside what the backend accepts instead of storing something unsaveable.
    const mm = (n, lo, hi) => {
      const st = this.stateOf(dev, n), v = parseFloat(st?.state);
      if (!Number.isFinite(v)) return null;
      const unit = st.attributes?.unit_of_measurement;
      const k = unit === "mm" ? 1 : unit === "cm" ? 10 : unit === "m" ? 1000 : v < 100 ? 1000 : 1;
      const out = v * k;
      return out >= lo && out <= hi ? Math.round(out) : null;
    };
    const numv = (n) => { const v = parseFloat(this.stateOf(dev, n)?.state); return Number.isFinite(v) ? v : null; };
    const devMode = this.stateOf(dev, "Tracking Radar Installation Mode")?.state;
    const mode = devMode === "top" ? "ceiling" : devMode === "side" ? "wall" : this.stateOf(dev, "Radar Mounting Mode")?.state;
    const node = {
      id: uid(), device_id: dev.device_id, name: dev.name,
      x: Math.round(at[0]), y: Math.round(at[1]), rotation: 0, flip_x: false,
      mounting: mode === "ceiling" ? "ceiling" : "wall",
      height: mm("Radar Default Mounting Height", 0, 10000) ?? 1500,
      zones: [], lines: [],
    };
    // Start from what the radar is actually set to; fall back to the firmware defaults.
    const ceiling = node.mounting === "ceiling", maxR = ceiling ? 4000 : 6000;
    node.range = Math.min(maxR, mm("Tracking Radar Detection Distance", 500, 20000) ?? mm("Radar Default Range", 500, 20000) ?? maxR);
    let a0 = numv("Tracking Radar Detection Start Angle"), a1 = numv("Tracking Radar Detection End Angle");
    const [lo, hi] = ceiling ? [0, 360] : [-60, 60];
    if (a0 === null || a1 === null || !(a0 < a1) || a0 < lo || a1 > hi) [a0, a1] = [lo, hi];
    node.angle_start = a0; node.angle_end = a1;
    node.fov = Math.max(10, Math.min(360, a1 - a0));
    this._ensureFloor(); this.fl.nodes.push(node);
    this.sel = { type: "node", id: node.id };
    this._changed(); this._renderAll();
  }

  /* ---------- view ---------- */
  w2s(p) { return [this.view.ox + p[0] * this.view.s, this.view.oy - p[1] * this.view.s]; }
  s2w(x, y) { return [(x - this.view.ox) / this.view.s, (this.view.oy - y) / this.view.s]; }
  _viewCenter() { return this.s2w(this.view.w / 2, this.view.h / 2); }
  _evPoint(e) {
    const r = this._dom.svg.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  _fit() {
    const pts = [];
    for (const r of this.fl.rooms) pts.push(...r.points);
    for (const n of this.fl.nodes) pts.push([n.x, n.y]);
    let [x0, y0, x1, y1] = [0, 0, 10000, 7000];
    if (pts.length) {
      x0 = Math.min(...pts.map((p) => p[0])); x1 = Math.max(...pts.map((p) => p[0]));
      y0 = Math.min(...pts.map((p) => p[1])); y1 = Math.max(...pts.map((p) => p[1]));
      const pad = 1200; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    }
    const { w, h } = this.view; if (!w || !h) { this._needFit = true; return; }
    const s = Math.min(w / (x1 - x0), h / (y1 - y0));
    this.view.s = s;
    this.view.ox = w / 2 - ((x0 + x1) / 2) * s;
    this.view.oy = h / 2 + ((y0 + y1) / 2) * s;
  }
  _zoomAt(px, py, factor) {
    const [wx, wy] = this.s2w(px, py);
    this.view.s = Math.min(2, Math.max(0.01, this.view.s * factor));
    this.view.ox = px - wx * this.view.s;
    this.view.oy = py + wy * this.view.s;
    this._renderCanvas();
  }
  _onWheel(e) {
    e.preventDefault();
    const [x, y] = this._evPoint(e);
    this._zoomAt(x, y, Math.exp(-e.deltaY * 0.0015));
  }

  /* ---------- snapping ---------- */
  /* noSnap (Alt): free placement. ortho (Shift): array of anchor points; the result is
     forced onto the horizontal/vertical through one anchor, or, with two anchors (the
     neighbours of a polygon corner), onto the corner that keeps both edges axis-aligned. */
  _snap(w, noSnap, ortho, skip) {
    const p = this._snapFree(w, noSnap, skip);
    if (!ortho || !ortho.length) return p;
    if (ortho.length === 1) {
      const a = ortho[0];
      return Math.abs(p[0] - a[0]) >= Math.abs(p[1] - a[1]) ? [p[0], a[1]] : [a[0], p[1]];
    }
    const [a, b] = ortho;
    const c1 = [a[0], b[1]], c2 = [b[0], a[1]];
    return dist(c1, p) <= dist(c2, p) ? c1 : c2;
  }
  /* Snap order: corner of another room, then its walls, then alignment with corners
     (also those of the shape being drawn), then the grid. `skip` = {obj, i} leaves the corner
     being dragged (and its two edges) out of the candidates. this._snapHit feeds the markers. */
  _snapFree(w, noSnap, skip) {
    this._snapHit = null;
    const rnd = (v) => [Math.round(v[0]), Math.round(v[1])];
    if (!this.snapOn || noSnap) return rnd(w);
    const T = 10 / this.view.s;
    const verts = [], edges = [];
    for (const r of this.fl.rooms) {
      const n = r.points.length, mine = skip && skip.obj === r;
      r.points.forEach((p, i) => {
        const j = (i + 1) % n;
        if (!(mine && skip.i === i)) verts.push(p);
        if (!(mine && (skip.i === i || skip.i === j))) edges.push([p, r.points[j]]);
      });
    }
    let best = null, bd = T;
    for (const p of verts) { const d = dist(p, w); if (d < bd) { bd = d; best = p; } }
    if (best) { this._snapHit = { p: best, kind: "vertex" }; return [best[0], best[1]]; }

    let fx = null, fy = null, fxd = T, fyd = T, slant = null, sd = T;
    for (const [a, b] of edges) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      if (Math.abs(dy) < 1 && w[0] >= Math.min(a[0], b[0]) - T && w[0] <= Math.max(a[0], b[0]) + T) {
        const d = Math.abs(w[1] - a[1]); if (d < fyd) { fyd = d; fy = a[1]; }
      } else if (Math.abs(dx) < 1 && w[1] >= Math.min(a[1], b[1]) - T && w[1] <= Math.max(a[1], b[1]) + T) {
        const d = Math.abs(w[0] - a[0]); if (d < fxd) { fxd = d; fx = a[0]; }
      } else if (Math.abs(dx) >= 1 && Math.abs(dy) >= 1) {
        const l2 = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((w[0] - a[0]) * dx + (w[1] - a[1]) * dy) / l2));
        const q = [a[0] + t * dx, a[1] + t * dy], d = dist(q, w);
        if (d < sd) { sd = d; slant = q; }
      }
    }
    if (slant && fx === null && fy === null) { const q = rnd(slant); this._snapHit = { p: q, kind: "edge" }; return q; }
    const onWall = fx !== null || fy !== null;

    let vx = null, vy = null;
    const cands = [...verts, ...(this.draw?.points || [])];
    if (fx === null) { let d0 = T; for (const p of cands) { const d = Math.abs(p[0] - w[0]); if (d < d0) { d0 = d; fx = p[0]; vx = p; } } }
    if (fy === null) { let d0 = T; for (const p of cands) { const d = Math.abs(p[1] - w[1]); if (d < d0) { d0 = d; fy = p[1]; vy = p; } } }
    const g = this.view.s * 100 >= 6 ? 100 : 500;
    const out = [fx ?? Math.round(w[0] / g) * g, fy ?? Math.round(w[1] / g) * g];
    if (fx !== null || fy !== null) this._snapHit = { p: out, kind: onWall ? "edge" : "align", vx, vy };
    return out;
  }

  /* ---------- pointer interaction ---------- */
  _onDown(e) {
    if (!this._ready) return;
    const svg = this._dom.svg;
    const [sx, sy] = this._evPoint(e);
    const w = this.s2w(sx, sy);
    this._closeDim();
    if (e.button === 2 && this.tool === "select" && !this.locked) {
      const hv = e.target.closest("[data-t='vh']");
      if (hv) { this._deleteVertex(Number(hv.dataset.i)); return; }
    }
    if (e.button === 1 || e.button === 2 || this._space) {
      this.drag = { type: "pan", sx, sy, ox: this.view.ox, oy: this.view.oy };
      svg.setPointerCapture(e.pointerId); return;
    }
    if (e.button !== 0) return;
    if (this.tool !== "select") { this._drawDown(e, sx, sy, w); svg.setPointerCapture(e.pointerId); return; }

    const el = e.target.closest("[data-t]");
    const t = el?.dataset.t;
    svg.setPointerCapture(e.pointerId);
    if (!t) { this.sel = null; this.drag = { type: "pan", sx, sy, ox: this.view.ox, oy: this.view.oy }; this._renderAll(); return; }
    const id = el.dataset.id, i = Number(el.dataset.i);

    if (this.locked && ["vdel", "dim", "vh", "mh", "lp", "rot"].includes(t)) { this.drag = { type: "pan", sx, sy, ox: this.view.ox, oy: this.view.oy }; return; }
    if (t === "vdel") { this._deleteVertex(i); return; }
    if (t === "dim") { this.drag = { type: "dim", i, kind: el.dataset.kind }; return; }
    if (t === "vh") { this._beginEdit(); this.drag = { type: "vertex", i, sx, sy, moved: false }; return; }
    if (t === "mh") {
      this._beginEdit();
      const obj = this._selObj(); const a = obj.points[i], b = obj.points[(i + 1) % obj.points.length];
      obj.points.splice(i + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      this.drag = { type: "vertex", i: i + 1, sx, sy, moved: true }; this._renderCanvas(); return;
    }
    if (t === "lp") { this._beginEdit(); this.drag = { type: "lp", i }; return; }
    if (t === "rot") { this._beginEdit(); this.drag = { type: "rot" }; return; }

    if (t === "node") this.sel = { type: "node", id };
    else if (t === "room") this.sel = { type: "room", id };
    else if (t === "zone") this.sel = { type: "zone", node: el.dataset.node, kind: el.dataset.kind, slot: Number(el.dataset.slot) };
    else if (t === "line") this.sel = { type: "line", node: el.dataset.node, slot: Number(el.dataset.slot) };
    if (this.locked) { this.drag = { type: "pan", sx, sy, ox: this.view.ox, oy: this.view.oy }; this._renderAll(); return; }
    this._beginEdit();
    this.drag = { type: "move", start: w, orig: clone(this._selObj()), moved: false };
    this._renderAll();
  }

  _onMove(e) {
    const [sx, sy] = this._evPoint(e);
    const w = this.s2w(sx, sy);
    this.cursor = w;
    this._dom.coords.textContent = `x ${m2(w[0])} m · y ${m2(w[1])} m`;
    const d = this.drag;
    if (!d && this.draw) { this._drawMove(e, sx, sy, w); return; }
    if (!d) return;
    if (d.type === "pan") { this.view.ox = d.ox + (sx - d.sx); this.view.oy = d.oy + (sy - d.sy); this._renderCanvas(); return; }
    const obj = this._selObj(); if (!obj) return;
    if (d.type === "move") {
      d.moved = true;
      const dx = w[0] - d.start[0], dy = w[1] - d.start[1];
      const g = this.snapOn && !e.altKey ? 100 : 1;
      let sdx = Math.round(dx / g) * g, sdy = Math.round(dy / g) * g;
      if (e.shiftKey) { if (Math.abs(sdx) >= Math.abs(sdy)) sdy = 0; else sdx = 0; }
      if (this.sel.type === "node") { obj.x = d.orig.x + sdx; obj.y = d.orig.y + sdy; }
      else if (this.sel.type === "line") { obj.p1 = [d.orig.p1[0] + sdx, d.orig.p1[1] + sdy]; obj.p2 = [d.orig.p2[0] + sdx, d.orig.p2[1] + sdy]; }
      else obj.points = d.orig.points.map((p) => [p[0] + sdx, p[1] + sdy]);
    } else if (d.type === "vertex") {
      if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) < 4) return;
      d.moved = true;
      const pts = obj.points, n = pts.length;
      obj.points[d.i] = this._snap(w, e.altKey, e.shiftKey ? [pts[(d.i + n - 1) % n], pts[(d.i + 1) % n]] : null, this.sel.type === "room" ? { obj, i: d.i } : null);
    } else if (d.type === "lp") {
      obj[d.i === 0 ? "p1" : "p2"] = this._snap(w, e.altKey, e.shiftKey ? [d.i === 0 ? obj.p2 : obj.p1] : null);
    } else if (d.type === "rot") {
      const node = obj;
      let a = (Math.atan2(w[0] - node.x, w[1] - node.y) * 180) / Math.PI;
      if (e.shiftKey) a = Math.round(a / 90) * 90;
      else if (this.snapOn && !e.altKey) a = Math.round(a / 5) * 5;
      node.rotation = Math.round(((a % 360) + 360) % 360);
    }
    this._renderCanvas();
  }

  _onUp(e) {
    try { this._dom.svg.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!this.drag && this.draw) { this._drawUp(e); return; }
    const d = this.drag; this.drag = null;
    if (d?.type === "dim") { this._openDim(d.kind, d.i); return; }
    if (d?.type === "vertex") {
      this.selVertex = { sel: JSON.stringify(this.sel), i: d.i };
      if (!d.moved) { this.undo.pop(); this._renderAll(); return; }
    }
    if (!d || d.type === "pan") { this._renderCanvas(); return; }
    if (d.type === "move" && !d.moved) { this.undo.pop(); this._renderAll(); return; }
    this._changed(); this._renderAll();
  }

  _onDbl(e) {
    if (this.locked) return;
    if (this.draw) { this._finishDraw(true); return; }
    const el = e.target.closest("[data-t='vh']");
    if (el) {
      const obj = this._selObj();
      if (obj?.points) this._deleteVertex(Number(el.dataset.i));
    }
  }

  /* ---------- drawing ---------- */
  _setTool(tool) {
    if (this.locked && tool !== "select") { this._toast(this.t("locked_msg"), true); return; }
    if ((tool === "zone" || tool === "exclusion" || tool === "line") && !this.selNode()) { this._toast(this.t("need_node"), true); return; }
    this.tool = tool; this.pendingArea = tool === "room" ? this.pendingArea : null;
    this.draw = tool === "select" ? null : { points: [], rect: null, down: null, cursor: null };
    this._renderAll();
  }
  _drawAnchor(e) {
    const pts = this.draw?.points || [];
    return e.shiftKey && pts.length ? [pts[pts.length - 1]] : null;
  }
  _drawDown(e, sx, sy, w) {
    const sw = this._snap(w, e.altKey, this._drawAnchor(e));
    if (!this.draw) this.draw = { points: [], rect: null, down: null };
    this.draw.down = { sx, sy, w: sw };
    this.draw.cursor = sw;
  }
  _drawMove(e, sx, sy, w) {
    const dr = this.draw, sw = this._snap(w, e.altKey, this._drawAnchor(e));
    dr.cursor = sw;
    if (dr.down && dr.points.length === 0 && this.tool !== "line" && Math.hypot(sx - dr.down.sx, sy - dr.down.sy) > 6) {
      dr.rect = [dr.down.w, sw];
    }
    this._renderCanvas();
  }
  _drawUp(e) {
    const dr = this.draw; if (!dr?.down) return;
    const [sx, sy] = this._evPoint(e);
    const down = dr.down; dr.down = null;
    if (dr.rect) {
      const [a, b] = dr.rect; dr.rect = null;
      if (Math.abs(a[0] - b[0]) > 50 && Math.abs(a[1] - b[1]) > 50) {
        dr.points = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]];
        this._finishDraw(false); return;
      }
      this._renderCanvas(); return;
    }
    if (Math.hypot(sx - down.sx, sy - down.sy) > 6) return;
    const raw = this._snap(this.s2w(sx, sy), e.altKey);
    const p = this._snap(this.s2w(sx, sy), e.altKey, this._drawAnchor(e));
    if (this.tool === "line") {
      dr.points.push(p);
      if (dr.points.length === 2) { this._finishDraw(false); return; }
    } else {
      const first = dr.points[0];
      if (dr.points.length >= 3 && first && Math.hypot(...[0, 1].map((k) => this.w2s(first)[k] - this.w2s(raw)[k])) < 12) { this._finishDraw(false); return; }
      dr.points.push(p);
    }
    this._renderCanvas();
  }
  _finishDraw(fromDbl) {
    const dr = this.draw; if (!dr) return;
    let pts = dr.points;
    if (fromDbl && pts.length >= 2 && dist(pts[pts.length - 1], pts[pts.length - 2]) < 1) pts = pts.slice(0, -1);
    const tool = this.tool;
    const need = tool === "line" ? 2 : 3;
    if (pts.length < need) { this.draw = null; this._renderAll(); return; }
    if (tool === "room") {
      this._beginEdit();
      const area = this.areas.find((a) => a.area_id === this.pendingArea);
      const room = { id: uid(), name: area?.name || `${this.t("room")} ${this.fl.rooms.length + 1}`, area_id: area?.area_id || null, points: pts };
      this.fl.rooms.push(room); this.sel = { type: "room", id: room.id };
    } else {
      const node = this.selNode();
      if (tool === "line") {
        const slot = this._nextSlot(node.lines);
        if (!slot) { this._toast(this.t("slots_full"), true); this.draw = null; this.tool = "select"; this._renderAll(); return; }
        this._beginEdit();
        node.lines.push({ slot, p1: pts[0], p2: pts[1], in_side: "left" });
        this.sel = { type: "line", node: node.id, slot };
      } else {
        if (pts.length > 20) pts = pts.slice(0, 20);
        const slot = this._nextSlot(node.zones, tool);
        if (!slot) { this._toast(this.t("slots_full"), true); this.draw = null; this.tool = "select"; this._renderAll(); return; }
        this._beginEdit();
        node.zones.push({ kind: tool, slot, name: "", points: pts });
        this.sel = { type: "zone", node: node.id, kind: tool, slot };
      }
    }
    this.draw = null; this.tool = "select"; this.pendingArea = null;
    this._changed(); this._renderAll();
  }

  /* ---------- vertices and exact dimensions ---------- */
  _vertexSel() {
    const v = this.selVertex, obj = this._selObj();
    if (!v || !obj?.points || v.sel !== JSON.stringify(this.sel) || v.i >= obj.points.length) return null;
    return v.i;
  }
  _deleteVertex(i) {
    const obj = this._selObj();
    if (!obj?.points) return;
    if (obj.points.length <= 3) { this._toast(this.t("min_points"), true); return; }
    this._beginEdit();
    obj.points.splice(i, 1);
    this.selVertex = null;
    this._changed(); this._renderAll();
  }
  _closeDim() {
    const el = this._dimInput; this._dimInput = null;
    if (el?.isConnected) el.remove();
  }
  _dimEnds(kind, i) {
    const obj = this._selObj(); if (!obj) return null;
    if (kind === "line") return [obj.p1, obj.p2];
    return [obj.points[i], obj.points[(i + 1) % obj.points.length]];
  }
  _openDim(kind, i) {
    const ends = this._dimEnds(kind, i); if (!ends) return;
    this._closeDim();
    const mid = this.w2s([(ends[0][0] + ends[1][0]) / 2, (ends[0][1] + ends[1][1]) / 2]);
    const inp = document.createElement("input");
    inp.type = "text"; inp.inputMode = "decimal"; inp.className = "dim-input";
    inp.value = m2(dist(ends[0], ends[1]));
    inp.title = this.t("dim_hint");
    inp.style.left = `${mid[0] - 44}px`; inp.style.top = `${mid[1] - 40}px`;
    inp.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") { const v = inp.value; this._closeDim(); this._applyDim(kind, i, v); }
      else if (ev.key === "Escape") this._closeDim();
    });
    inp.addEventListener("blur", () => { if (this._dimInput === inp) this._closeDim(); });
    this._dom.canvas.appendChild(inp);
    this._dimInput = inp;
    setTimeout(() => { inp.focus(); inp.select(); }, 0);
  }
  _applyDim(kind, i, text) {
    const m = String(text).trim().replace(",", ".").match(/^(\d+(?:\.\d+)?)\s*(mm|cm|m)?$/i);
    if (!m) { this._toast(this.t("dim_invalid"), true); return; }
    const L = parseFloat(m[1]) * ({ mm: 1, cm: 10, m: 1000 }[(m[2] || "m").toLowerCase()]);
    if (!(L >= 50)) { this._toast(this.t("dim_invalid"), true); return; }
    const obj = this._selObj(), ends = this._dimEnds(kind, i);
    if (!obj || !ends) return;
    const [A, B] = ends, cur = dist(A, B);
    if (cur < 1) { this._toast(this.t("dim_invalid"), true); return; }
    const dir = [(B[0] - A[0]) / cur, (B[1] - A[1]) / cur];
    const nb = [Math.round(A[0] + dir[0] * L), Math.round(A[1] + dir[1] * L)];
    const delta = [nb[0] - B[0], nb[1] - B[1]];
    this._beginEdit();
    if (kind === "line") obj.p2 = nb;
    else {
      const pts = obj.points, n = pts.length, bi = (i + 1) % n, ci = (i + 2) % n;
      // Keep a right angle at the far end: a perpendicular next edge slides along with the corner.
      if (n >= 4) {
        const C = pts[ci], v = [C[0] - B[0], C[1] - B[1]], vl = Math.hypot(v[0], v[1]);
        if (vl > 0 && Math.abs((v[0] * dir[0] + v[1] * dir[1]) / vl) < 0.01) pts[ci] = [C[0] + delta[0], C[1] + delta[1]];
      }
      pts[bi] = nb;
    }
    this._changed(); this._renderAll();
  }

  /* ---------- keyboard ---------- */
  _onKey(e) {
    if (!this.isConnected || !this._ready) return;
    const tag = e.composedPath()[0]?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === " ") { this._space = true; e.preventDefault(); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (!mod && e.key.toLowerCase() === "l") { this._onAction({ target: { closest: () => ({ dataset: { a: "lock" } }) } }); return; }
    if (this.locked && ((mod && ["z", "y"].includes(e.key.toLowerCase())) || e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault(); this._toast(this.t("locked_msg"), true); return;
    }
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? this._redo() : this._undo(); return; }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); this._redo(); return; }
    if (e.key === "Escape") { this.draw = null; this.tool = "select"; this.pendingArea = null; this.sel = null; this._renderAll(); }
    else if (e.key === "Enter" && this.draw) this._finishDraw(false);
    else if ((e.key === "Delete" || e.key === "Backspace") && this.sel) {
      e.preventDefault();
      const v = this._vertexSel();
      if (v !== null) this._deleteVertex(v); else this._deleteSel();
    }
  }
  _deleteSel() {
    const s = this.sel; if (!s) return;
    this._beginEdit();
    if (s.type === "node") this.fl.nodes = this.fl.nodes.filter((n) => n.id !== s.id);
    else if (s.type === "room") this.fl.rooms = this.fl.rooms.filter((r) => r.id !== s.id);
    else if (s.type === "zone") { const n = this.selNode(); n.zones = n.zones.filter((z) => !(z.kind === s.kind && z.slot === s.slot)); }
    else if (s.type === "line") { const n = this.selNode(); n.lines = n.lines.filter((l) => l.slot !== s.slot); }
    this.sel = null; this._changed(); this._renderAll();
  }

  /* ---------- actions ---------- */
  async _onAction(e) {
    const el = e.target.closest("[data-a]"); if (!el) return;
    const a = el.dataset.a, id = el.dataset.id;
    if (a === "toggle-tools") {
      this.panels.hideTools = !this.panels.hideTools;
      try { localStorage.setItem("roomnode_designer.panels", JSON.stringify(this.panels)); } catch (_) {}
      this._applyPanels(); return;
    }
    if (a === "toggle-left" || a === "toggle-right") {
      if (a === "toggle-left" && matchMedia("(max-width:1100px)").matches) { this._dom.main.classList.toggle("showleft"); return; }
      const key = a === "toggle-left" ? "hideLeft" : "hideRight";
      this.panels[key] = !this.panels[key];
      try { localStorage.setItem("roomnode_designer.panels", JSON.stringify(this.panels)); } catch (_) {}
      this._applyPanels(); return;
    }
    if (a === "menu") { this._dom.main.classList.toggle("showleft"); this._hass && this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })); return; }
    if (a === "floor") { this.floorId = id; this.sel = null; this.draw = null; this.tool = "select"; this._ensureFloor(); this._fit(); this._renderAll(); return; }
    if (a === "lock") {
      this.panels.locked = !this.panels.locked;
      try { localStorage.setItem("roomnode_designer.panels", JSON.stringify(this.panels)); } catch (_) {}
      this.draw = null; this.tool = "select"; this.drag = null; this.pendingArea = null; this._closeDim();
      this._renderAll(); return;
    }
    if (this.locked && ["tool", "place", "draw-area", "delete", "flip-dir", "swap-ends", "pull", "pull-radar", "undo", "redo", "vdel"].includes(a) && !(a === "tool" && id === "select")) {
      this._toast(this.t("locked_msg"), true); return;
    }
    if (a === "tool") { this._setTool(id); return; }
    if (a === "snap") { this.snapOn = !this.snapOn; this._renderAll(); return; }
    if (a === "live") { this.live = !this.live; this._renderAll(); return; }
    if (a === "undo") return this._undo();
    if (a === "redo") return this._redo();
    if (a === "zoom-in") return this._zoomAt(this.view.w / 2, this.view.h / 2, 1.3);
    if (a === "zoom-out") return this._zoomAt(this.view.w / 2, this.view.h / 2, 1 / 1.3);
    if (a === "fit") { this._fit(); this._renderCanvas(); return; }
    if (a === "reload") { location.reload(); return; }
    if (a === "place") return this._placeDevice(id);
    if (a === "draw-area") { this.pendingArea = id; this._setTool("room"); this.pendingArea = id; return; }
    if (a === "sel-node") { this.sel = { type: "node", id }; this._renderAll(); return; }
    if (a === "sel-room") { this.sel = { type: "room", id }; this._renderAll(); return; }
    if (a === "sel-zone") { this.sel = { type: "zone", node: el.dataset.node, kind: el.dataset.kind, slot: Number(el.dataset.slot) }; this._renderAll(); return; }
    if (a === "sel-line") { this.sel = { type: "line", node: el.dataset.node, slot: Number(el.dataset.slot) }; this._renderAll(); return; }
    if (a === "delete") return this._deleteSel();
    if (a === "flip-dir") { const l = this._selObj(); this._beginEdit(); l.in_side = l.in_side === "left" ? "right" : "left"; this._changed(); this._renderAll(); return; }
    if (a === "swap-ends") { const l = this._selObj(); this._beginEdit(); [l.p1, l.p2] = [l.p2, l.p1]; l.in_side = l.in_side === "left" ? "right" : "left"; this._changed(); this._renderAll(); return; }
    if (a === "toggle-zones") { const n = this.selNode(); const ent = this.deviceOf(n)?.entities?.["Polygon Zones Enabled"]; if (ent) this._hass.callService("switch", "toggle", { entity_id: ent }); return; }
    if (a === "reset-people") { const n = this.selNode(); const ent = this.deviceOf(n)?.entities?.["Reset People Count"]; if (ent) this._hass.callService("button", "press", { entity_id: ent }); return; }
    if (a === "push-radar") return this._pushRadar();
    if (a === "pull-radar") return this._pullRadar();
    if (a === "push") return this._push();
    if (a === "pull") return this._pull();
  }

  _onField(e) {
    const el = e.target.closest("[data-f]"); if (!el) return;
    const obj = this._selObj(); if (!obj || this.locked) return;
    const f = el.dataset.f;
    let v = el.type === "checkbox" ? el.checked : el.value;
    const num = () => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };
    this._beginEdit();
    if (f === "name") obj.name = v;
    else if (f === "area_id") {
      obj.area_id = v || null;
      const area = this.areas.find((a) => a.area_id === v);
      if (area && (!obj.name || obj.name.startsWith(this.t("room")))) obj.name = area.name;
    } else if (f === "mounting") {
      // Keep the angles at the new mode's defaults when they were still at the old mode's defaults.
      const was = obj.mounting === "ceiling" ? [0, 360] : [-60, 60], next = v === "ceiling" ? [0, 360] : [-60, 60];
      obj.mounting = v;
      if ((obj.angle_start === was[0] && obj.angle_end === was[1]) || obj.angle_start < next[0] || obj.angle_end > next[1]) [obj.angle_start, obj.angle_end] = next;
      obj.range = Math.min(obj.range, v === "ceiling" ? 4000 : 6000);
    } else if (f === "angle_start" || f === "angle_end") {
      const n = num();
      if (n !== null) obj[f] = Math.round(Math.min(720, Math.max(-360, n)) * 10) / 10;
    }
    else if (f === "flip_x") obj.flip_x = !!v;
    else if (["height", "range", "x", "y"].includes(f)) {
      const n = num();
      const lim = { height: [0, 10000], range: [500, 20000], x: [-1e6, 1e6], y: [-1e6, 1e6] }[f];
      if (n !== null) obj[f] = Math.min(lim[1], Math.max(lim[0], Math.round(n * 1000)));
    }
    else if (f === "fov") { const n = num(); if (n !== null) obj.fov = Math.min(360, Math.max(10, n)); }
    else if (f === "rotation") { const n = num(); if (n !== null) obj.rotation = ((n % 360) + 360) % 360; }
    else if (f === "slot") {
      const n = parseInt(v, 10), node = this.selNode();
      const list = this.sel.type === "line" ? node.lines : node.zones.filter((z) => z.kind === obj.kind);
      if (list.some((x) => x !== obj && x.slot === n)) { this.undo.pop(); this._toast(this.t("slot_taken"), true); this._renderAll(); return; }
      obj.slot = n;
      if (this.sel.type === "line") this.sel.slot = n; else this.sel.slot = n;
    } else if (f === "in_side") obj.in_side = v;
    this._changed(); this._renderAll();
  }

  async _push() {
    const node = this.selNode(); if (!node) return;
    this._toast(this.t("pushing"));
    try {
      await this._flushSave();
      const res = await this._hass.callWS({ type: `${API}/push`, node_id: node.id });
      this.lastSent[node.id] = res.sent;
      this._toast(this.t("pushed")); this._renderRight();
    } catch (err) { this._toast(`${this.t("push_failed")}: ${err?.message || err}`, true); }
  }
  async _pushRadar() {
    const node = this.selNode(); if (!node) return;
    this._toast(this.t("pushing"));
    try {
      await this._flushSave();
      const dev = this.deviceOf(node);
      const switching = !!dev && this._radarModeMismatch(node, dev);
      if (switching) {
        const mode = this.stateOf(dev, "Tracking Radar Installation Mode")?.state;
        if (!confirm(this.t("switch_confirm").replace("{from}", mode).replace("{to}", node.mounting === "ceiling" ? "top" : "side"))) { this._dom.toast.hidden = true; return; }
      }
      const res = await this._hass.callWS({ type: `${API}/push_radar`, node_id: node.id, switch_mode: switching });
      if (res.switched) await this._hass.callWS({ type: `${API}/push`, node_id: node.id });
      const parts = Object.entries(res.sent).map(([k, v]) => `${this.t("rk_" + k)} ${v}${k === "distance" ? " m" : "°"}`);
      this._toast(res.switched ? this.t("radar_switched") : parts.length ? `${this.t("radar_pushed")}: ${parts.join(", ")}` : this.t("radar_same"));
      this._renderRight();
    } catch (err) { this._toast(`${this.t("push_failed")}: ${err?.message || err}`, true); }
  }
  async _pullRadar() {
    const node = this.selNode(); if (!node) return;
    try {
      await this._flushSave();
      const res = await this._hass.callWS({ type: `${API}/pull_radar`, node_id: node.id });
      this._beginEdit();
      if (res.mounting) node.mounting = res.mounting;
      if (res.angle_start !== undefined) node.angle_start = res.angle_start;
      if (res.angle_end !== undefined) node.angle_end = res.angle_end;
      if (res.range !== undefined && res.range >= 500 && res.range <= 20000) node.range = res.range;
      this._changed(); this._renderAll(); this._toast(this.t("radar_pulled"));
    } catch (err) { this._toast(err?.message || String(err), true); }
  }
  async _pull() {
    const node = this.selNode(); if (!node) return;
    if (!confirm(this.t("pull_confirm"))) return;
    try {
      await this._flushSave();
      const res = await this._hass.callWS({ type: `${API}/pull`, node_id: node.id });
      this._beginEdit();
      node.zones = res.zones.map((z) => ({ ...z, name: "" }));
      node.lines = res.lines;
      this.sel = { type: "node", id: node.id };
      this._changed(); this._renderAll(); this._toast(this.t("pulled"));
    } catch (err) { this._toast(err?.message || String(err), true); }
  }

  _toast(msg, err = false) {
    const t = this._dom.toast; t.textContent = msg; t.className = `toast${err ? " err" : ""}`; t.hidden = false;
    clearTimeout(this._toastTimer); this._toastTimer = setTimeout(() => (t.hidden = true), err ? 6000 : 3000);
  }

  /* ---------- live targets ---------- */
  _liveTargets(node) {
    const dev = this.deviceOf(node); if (!dev) return [];
    const out = [];
    for (let i = 1; i <= 5; i++) {
      const sx = this.stateOf(dev, `Tracking Target ${i} X`), sy = this.stateOf(dev, `Tracking Target ${i} Y`);
      if (!sx || !sy) continue;
      const x = parseFloat(sx.state), y = parseFloat(sy.state);
      if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) continue;
      const unit = sx.attributes?.unit_of_measurement;
      const k = unit === "mm" ? 1 : unit === "cm" ? 10 : 1000;
      out.push({ n: i, p: radarToFloor([x * k, y * k], node) });
    }
    return out;
  }

  /* ---------- rendering ---------- */
  _renderAll() {
    if (!this._dom) return;
    this._dom.title.textContent = this.t("title");
    this._applyPanels(); this._renderFloors(); this._renderStatus(); this._renderTools(); this._renderLeft(); this._renderRight(); this._renderCanvas();
    const editable = this.sel && (this.sel.type === "room" || this.sel.type === "zone");
    const hint = this.locked ? "🔒 " + this.t("locked_hint") : this.tool === "line" ? this.t("hint_line") : this.tool !== "select" ? this.t("hint_poly") : editable ? this.t("hint_edit") : "";
    this._dom.hint.textContent = hint;
  }
  _scheduleCanvas() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = null; this._renderCanvas(); });
  }
  _applyPanels() {
    const d = this._dom, p = this.panels;
    d.main.classList.toggle("hide-left", !!p.hideLeft);
    d.main.classList.toggle("hide-right", !!p.hideRight);
    d.main.classList.toggle("hide-tools", !!p.hideTools);
    this.shadowRoot.getElementById("edgeT").title = this.t(p.hideTools ? "show_tools" : "hide_tools");
    const l = this.shadowRoot.getElementById("edgeL"), r = this.shadowRoot.getElementById("edgeR");
    l.title = this.t(p.hideLeft ? "show_left" : "hide_left");
    r.title = this.t(p.hideRight ? "show_right" : "hide_right");
    // A dot on the closed right panel button tells you something is selected.
    r.classList.toggle("has", !!p.hideRight && !!this.sel);
  }
  _renderFloors() {
    this._dom.floors.innerHTML = this.floors.map((f) => `<button data-a="floor" data-id="${esc(f.floor_id)}" class="${f.floor_id === this.floorId ? "on" : ""}">${esc(f.name)}</button>`).join("");
  }
  _renderStatus() {
    const s = this.status, d = this._dom.status;
    d.className = `status${s === "conflict" ? " bad" : ""}`;
    d.innerHTML = esc(this.t(s)) + (s === "conflict" ? ` <button data-a="reload">${esc(this.t("reload"))}</button>` : "");
  }
  _renderTools() {
    const hasNode = !!this.selNode();
    const L = this.locked;
    const tb = (id, icon, label, opts = {}) =>
      `<button data-a="${opts.action || "tool"}" data-id="${id}" class="${(opts.on ?? this.tool === id ? "on" : "") + (opts.cls ? " " + opts.cls : "")}" ${opts.disabled ? "disabled" : ""} title="${esc(opts.title ?? (opts.disabled ? this.t("need_node") : label))}">${ICONS[icon]}<span>${esc(label)}</span></button>`;
    const lk = L ? { disabled: true, title: this.t("locked_msg") } : {};
    this._dom.tools.innerHTML =
      tb("select", "select", this.t("tool_select")) + tb("room", "room", this.t("tool_room"), lk) +
      '<div class="sep"></div>' +
      tb("zone", "zone", this.t("tool_zone"), L ? lk : { disabled: !hasNode }) +
      tb("exclusion", "excl", this.t("tool_excl"), L ? lk : { disabled: !hasNode }) +
      tb("line", "line", this.t("tool_line"), L ? lk : { disabled: !hasNode }) +
      '<div class="sep"></div>' +
      tb("snap", "snap", this.t("snap"), { action: "snap", on: this.snapOn }) +
      tb("live", "live", this.t("live"), { action: "live", on: this.live }) +
      tb("undo", "undo", this.t("undo"), { action: "undo", on: false, disabled: L || !this.undo.length, title: L ? this.t("locked_msg") : this.t("undo") }) +
      tb("redo", "redo", this.t("redo"), { action: "redo", on: false, disabled: L || !this.redo.length, title: L ? this.t("locked_msg") : this.t("redo") }) +
      '<div class="sep"></div>' +
      tb("lock", L ? "lock" : "unlock", this.t(L ? "unlock" : "lock"), { action: "lock", on: L, cls: "lock", title: this.t(L ? "unlock_title" : "lock_title") });
  }

  _renderLeft() {
    this._renderLeftInner();
    if (this.locked) this._dom.left.querySelectorAll('[data-a="place"],[data-a="draw-area"]').forEach((b) => { b.disabled = true; b.title = this.t("locked_msg"); });
  }
  _renderRight() {
    this._renderRightInner();
    if (!this.locked || !this.selNode() && !this._selObj()) return;
    const R = this._dom.right;
    R.querySelectorAll("input,select").forEach((el) => { el.disabled = true; });
    R.querySelectorAll('[data-a="delete"],[data-a="pull"],[data-a="pull-radar"],[data-a="flip-dir"],[data-a="swap-ends"]').forEach((b) => { b.disabled = true; b.title = this.t("locked_msg"); });
    R.insertAdjacentHTML("afterbegin", `<div class="lockbar">🔒 ${esc(this.t("locked_hint"))}</div>`);
  }
  _renderLeftInner() {
    const f = this.fl, sel = this.sel;
    const nodeItems = f.nodes.map((n) => {
      const dev = this.deviceOf(n);
      const on = sel && ((sel.type === "node" && sel.id === n.id) || sel.node === n.id);
      return `<div class="item ${on ? "sel" : ""}" data-a="sel-node" data-id="${n.id}"><span class="dot" style="background:${this.nodeColor(n)}"></span><div class="t"><b>${esc(n.name)}</b><span>${n.zones.length} ${esc(this.t("zone").toLowerCase())} · ${n.lines.length} ${esc(this.t("line").toLowerCase())}${dev ? "" : " · ⚠"}</span></div></div>`;
    }).join("") || `<div class="empty">${esc(this.t("no_nodes"))}</div>`;

    const free = this._unplaced();
    const devItems = free.map((d) => `<div class="item"><span class="dot" style="background:var(--rd-sub)"></span><div class="t"><b>${esc(d.name)}</b><span>${esc(this.areas.find((a) => a.area_id === d.area_id)?.name || "")}</span></div><button class="btn sm" data-a="place" data-id="${d.device_id}">${esc(this.t("place"))}</button></div>`).join("") || `<div class="empty">${esc(this.t("no_devices"))}</div>`;

    const drawn = new Set(f.rooms.map((r) => r.area_id).filter(Boolean));
    const floorAreas = this.areas.filter((a) => (this.floorId === DEFAULT_FLOOR ? true : a.floor_id === this.floorId) && !drawn.has(a.area_id));
    const roomItems = f.rooms.map((r) => `<div class="item ${sel?.type === "room" && sel.id === r.id ? "sel" : ""}" data-a="sel-room" data-id="${r.id}"><div class="t"><b>${esc(r.name)}</b><span>${esc(this.areas.find((a) => a.area_id === r.area_id)?.name || "")}</span></div></div>`).join("") +
      floorAreas.map((a) => `<div class="item"><div class="t"><b style="color:var(--rd-sub)">${esc(a.name)}</b></div><button class="btn ghost sm" data-a="draw-area" data-id="${a.area_id}">${esc(this.t("draw_area"))}</button></div>`).join("");

    this._dom.left.innerHTML = `<h3>${esc(this.t("nodes"))}</h3>${nodeItems}<h3>${esc(this.t("devices"))}</h3>${devItems}<h3>${esc(this.t("rooms"))}</h3>${roomItems || `<div class="empty">—</div>`}${this.floorId === DEFAULT_FLOOR ? `<div class="hint" style="margin-top:12px">${esc(this.t("floor_hint"))}</div>` : ""}`;
  }

  _radarProblems(node) {
    const top = node.mounting === "ceiling", maxD = top ? 4 : 6, lo = top ? 0 : -60, hi = top ? 360 : 60;
    const d = node.range / 1000, out = [];
    if (d < 0.1 || d > maxD) out.push(this.t("p_dist").replace("{max}", maxD));
    if (!(node.angle_start < node.angle_end)) out.push(this.t("p_order"));
    if (node.angle_start < lo || node.angle_end > hi) out.push(this.t("p_bounds").replace("{lo}", lo).replace("{hi}", hi));
    return out;
  }
  _radarModeMismatch(node, dev) {
    const mode = this.stateOf(dev, "Tracking Radar Installation Mode")?.state;
    return (mode === "side" || mode === "top") && mode !== (node.mounting === "ceiling" ? "top" : "side");
  }
  _radarDeviceLine(node, dev) {
    if (!dev) return "";
    const num = (n) => { const v = parseFloat(this.stateOf(dev, n)?.state); return Number.isFinite(v) ? v : null; };
    const mode = this.stateOf(dev, "Tracking Radar Installation Mode")?.state;
    const a0 = num("Tracking Radar Detection Start Angle"), a1 = num("Tracking Radar Detection End Angle");
    const dd = this.stateOf(dev, "Tracking Radar Detection Distance");
    if (a0 === null || a1 === null) return `<div class="hint">${esc(this.t("no_radar_entities"))}</div>`;
    const dm = parseFloat(dd?.state), unit = dd?.attributes?.unit_of_measurement;
    const distance = Number.isFinite(dm) ? ` · ${(dm * (unit === "mm" ? 0.001 : unit === "cm" ? 0.01 : 1)).toFixed(1)} m` : "";
    const wantMode = node.mounting === "ceiling" ? "top" : "side";
    const mismatch = mode && mode !== wantMode ? `<div class="warn">⚠ ${esc(this.t("mode_mismatch").replace("{mode}", mode).replaceAll("{plan}", wantMode))}</div>` : "";
    return `<div class="hint">${esc(this.t("on_device"))}: ${a0}° … ${a1}°${distance}${mode ? ` · ${esc(mode)}` : ""}</div>${mismatch}`;
  }
  _renderRightInner() {
    const R = this._dom.right, s = this.sel, obj = this._selObj();
    if (!obj) { R.innerHTML = `<div class="empty" style="padding-top:20px">${esc(this.t("select_hint"))}</div>`; return; }
    const field = (label, inner, hint) => `<label class="f"><span>${esc(label)}</span>${inner}${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</label>`;
    const inp = (f, v, type = "text", extra = "") => `<input type="${type}" data-f="${f}" value="${esc(v)}" ${extra}>`;
    const opt = (v, label, cur) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(label)}</option>`;

    if (s.type === "node") {
      const dev = this.deviceOf(obj);
      const en = this.stateOf(dev, "Polygon Zones Enabled");
      const people = this.stateOf(dev, "People Count");
      const sent = this.lastSent[obj.id];
      const shapeRows = [
        ...obj.zones.map((z) => `<div class="item" data-a="sel-zone" data-node="${obj.id}" data-kind="${z.kind}" data-slot="${z.slot}"><span class="dot" style="background:${z.kind === "zone" ? this.nodeColor(obj) : "#e53935"}"></span><div class="t"><b>${esc(z.name || `${this.t(z.kind)} ${z.slot}`)}</b><span>${z.points.length} pts</span></div></div>`),
        ...obj.lines.map((l) => `<div class="item" data-a="sel-line" data-node="${obj.id}" data-slot="${l.slot}"><span class="dot" style="background:#ffb300"></span><div class="t"><b>${esc(this.t("line"))} ${l.slot}</b></div></div>`),
      ].join("") || `<div class="empty">—</div>`;
      R.innerHTML = `<h3>${esc(this.t("node_settings"))}</h3>
        ${field(this.t("name"), inp("name", obj.name))}
        <div class="hint">${esc(this.t("device"))}: ${esc(dev?.name || "⚠ —")}</div>
        <div class="two">${field(this.t("mounting"), `<select data-f="mounting">${opt("wall", this.t("wall"), obj.mounting)}${opt("ceiling", this.t("ceiling"), obj.mounting)}</select>`)}
        ${field(this.t("rotation"), inp("rotation", Math.round(obj.rotation), "number", 'step="5"'))}</div>
        <div class="two">${field(this.t("height"), inp("height", m2(obj.height), "number", 'step="0.1" min="0"'))}${field(this.t("range"), inp("range", m2(obj.range), "number", 'step="0.5" min="0.5"'))}</div>
        <h3>${esc(this.t("angles"))}</h3>
        <div class="two">${field(this.t("angle_start"), inp("angle_start", +obj.angle_start.toFixed(1), "number", 'step="1"'))}${field(this.t("angle_end"), inp("angle_end", +obj.angle_end.toFixed(1), "number", 'step="1"'))}</div>
        <div class="hint">${esc(this.t(obj.mounting === "ceiling" ? "hint_angle_ceiling" : "hint_angle_wall"))}</div>
        ${this._radarProblems(obj).map((m) => `<div class="warn">⚠ ${esc(m)}</div>`).join("")}
        ${this._radarDeviceLine(obj, dev)}
        <div class="row">
          <button class="btn" data-a="push-radar" ${dev && !this._radarProblems(obj).length ? "" : "disabled"}>${esc(this.t(dev && this._radarModeMismatch(obj, dev) ? "push_radar_switch" : "push_radar"))}</button>
          <button class="btn ghost" data-a="pull-radar" ${dev ? "" : "disabled"}>${esc(this.t("pull_radar"))}</button>
        </div>
        <div class="two">${field(this.t("pos_x"), inp("x", m2(obj.x), "number", 'step="0.1"'))}${field(this.t("pos_y"), inp("y", m2(obj.y), "number", 'step="0.1"'))}</div>
        <label class="chk"><input type="checkbox" data-f="flip_x" ${obj.flip_x ? "checked" : ""}> ${esc(this.t("flip_x"))}</label><div class="hint">${esc(this.t("flip_hint"))}</div>
        <div class="row">
          <button class="btn" data-a="push" ${dev ? "" : "disabled"}>${esc(this.t("push"))}</button>
          <button class="btn ghost" data-a="pull" ${dev ? "" : "disabled"}>${esc(this.t("pull"))}</button>
        </div>
        ${sent ? `<div class="hint">${esc(this.t("last_sent"))}</div>${Object.entries(sent).filter(([, v]) => v).map(([k, v]) => `<code class="sent"><b>${esc(k)}</b><br>${esc(v)}</code>`).join("")}` : ""}
        ${dev ? `<h3>${esc(this.t("zones_enabled"))}</h3><div class="row" style="align-items:center"><button class="btn ${en?.state === "on" ? "" : "ghost"} sm" data-a="toggle-zones">${en?.state === "on" ? "ON" : "OFF"}</button>
          <span>${esc(this.t("people"))}: <b>${esc(people?.state ?? "—")}</b></span><button class="btn ghost sm" data-a="reset-people">${esc(this.t("reset_people"))}</button></div>` : ""}
        <h3>${esc(this.t("shapes"))}</h3>${shapeRows}
        <div class="row"><button class="btn danger sm" data-a="delete">${esc(this.t("remove"))}</button></div>`;
    } else if (s.type === "room") {
      R.innerHTML = `<h3>${esc(this.t("room"))}</h3>${field(this.t("name"), inp("name", obj.name))}
        ${field(this.t("area"), `<select data-f="area_id">${opt("", this.t("none"), obj.area_id || "")}${this.areas.map((a) => opt(a.area_id, a.name, obj.area_id)).join("")}</select>`)}
        <div class="row"><button class="btn danger sm" data-a="delete">${esc(this.t("delete"))}</button></div>`;
    } else if (s.type === "zone") {
      const node = this.selNode(); const out = obj.points.filter((p) => !inCoverage(node, p)).length;
      const slots = Array.from({ length: SLOTS[obj.kind] }, (_, i) => i + 1);
      R.innerHTML = `<h3>${esc(this.t(obj.kind))} — ${esc(node.name)}</h3>${field(this.t("name"), inp("name", obj.name))}
        ${field(this.t("slot"), `<select data-f="slot">${slots.map((n) => opt(String(n), String(n), String(obj.slot))).join("")}</select>`)}
        ${out ? `<div class="warn">⚠ ${out} ${esc(this.t("outside"))}</div>` : ""}
        <div class="hint">${obj.points.length} / 20</div>
        <div class="row"><button class="btn danger sm" data-a="delete">${esc(this.t("delete"))}</button></div>`;
    } else if (s.type === "line") {
      const slots = [1, 2];
      R.innerHTML = `<h3>${esc(this.t("line"))} — ${esc(this.selNode().name)}</h3>
        ${field(this.t("slot"), `<select data-f="slot">${slots.map((n) => opt(String(n), String(n), String(obj.slot))).join("")}</select>`)}
        <label class="f"><span>${esc(this.t("in_side"))}</span><select data-f="in_side">${opt("left", this.t("left"), obj.in_side)}${opt("right", this.t("right"), obj.in_side)}</select></label>
        <div class="row"><button class="btn ghost sm" data-a="flip-dir">${esc(this.t("flip_dir"))}</button><button class="btn ghost sm" data-a="swap-ends">${esc(this.t("swap_ends"))}</button></div>
        <div class="row"><button class="btn danger sm" data-a="delete">${esc(this.t("delete"))}</button></div>`;
    }
  }

  /* Clickable dimension label; x and y are screen pixels. */
  _dimLabel(x, y, text, kind, i) {
    const w = text.length * 6.6 + 14;
    if (this.locked) return `<g pointer-events="none"><rect x="${x - w / 2}" y="${y - 12}" width="${w}" height="18" rx="9" fill="var(--card-background-color,#fff)" stroke="var(--secondary-text-color,#757575)" stroke-opacity=".5"/><text x="${x}" y="${y + 1}" font-size="11" text-anchor="middle" fill="var(--primary-text-color,#333)">${text}</text></g>`;
    return `<g data-t="dim" data-kind="${kind}" data-i="${i}" style="cursor:text"><rect x="${x - w / 2}" y="${y - 12}" width="${w}" height="18" rx="9" fill="var(--card-background-color,#fff)" stroke="var(--primary-color,#03a9f4)" stroke-opacity=".6"/><text x="${x}" y="${y + 1}" font-size="11" text-anchor="middle" fill="var(--primary-text-color,#333)" pointer-events="none">${text}</text></g>`;
  }
  _renderCanvas() {
    if (!this._dom || !this._ready) return;
    const { w, h, s } = this.view;
    const P = (p) => this.w2s(p).map((v) => v.toFixed(1)).join(",");
    const poly = (pts) => pts.map(P).join(" ");
    const out = [];
    out.push(`<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#e5393522"/><line x1="0" y1="0" x2="0" y2="8" stroke="#e53935" stroke-width="2" opacity=".6"/></pattern></defs>`);

    // grid
    const step = [100, 500, 1000, 5000].find((g) => g * s >= 10) || 5000;
    const [wx0, wy1] = this.s2w(0, 0), [wx1, wy0] = this.s2w(w, h);
    let minor = "", major = "";
    for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) { const sx = this.w2s([x, 0])[0].toFixed(1); (x % 1000 === 0 ? (major += `M${sx} 0V${h}`) : (minor += `M${sx} 0V${h}`)); }
    for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) { const sy = this.w2s([0, y])[1].toFixed(1); (y % 1000 === 0 ? (major += `M0 ${sy}H${w}`) : (minor += `M0 ${sy}H${w}`)); }
    out.push(`<path d="${minor}" stroke="var(--divider-color,#e0e0e0)" stroke-width="1" opacity=".45" fill="none"/><path d="${major}" stroke="var(--divider-color,#bdbdbd)" stroke-width="1" opacity=".9" fill="none"/>`);

    // rooms
    for (const r of this.fl.rooms) {
      const on = this.sel?.type === "room" && this.sel.id === r.id;
      const c = this.w2s([Math.min(...r.points.map((p) => p[0])), Math.max(...r.points.map((p) => p[1]))]);
      out.push(`<polygon data-t="room" data-id="${r.id}" points="${poly(r.points)}" fill="${on ? "rgba(3,169,244,.16)" : "var(--card-background-color,#fff)"}" fill-opacity="${on ? 1 : 0.85}" stroke="${on ? "var(--primary-color,#03a9f4)" : "var(--secondary-text-color,#757575)"}" stroke-width="${on ? 3 : 2.5}" stroke-linejoin="round" style="cursor:${this.tool === "select" ? "move" : "crosshair"}"/>`);
      out.push(`<text x="${c[0] + 10}" y="${c[1] + 20}" text-anchor="start" fill="var(--secondary-text-color,#757575)" font-size="14" font-weight="500" pointer-events="none">${esc(r.name)}</text>`);
    }

    // nodes: coverage, zones, lines
    for (const n of this.fl.nodes) {
      const col = this.nodeColor(n), mine = this.selNode()?.id === n.id;
      out.push(`<polygon points="${poly(coveragePoints(n))}" fill="${col}" fill-opacity="${mine ? 0.12 : 0.06}" stroke="${col}" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="5 4" pointer-events="none"/>`);
      const dev = this.deviceOf(n);
      for (const z of n.zones) {
        const isSel = this.sel?.type === "zone" && this.sel.node === n.id && this.sel.kind === z.kind && this.sel.slot === z.slot;
        const present = this.live && z.kind === "zone" && this.stateOf(dev, `Polygon Zone ${z.slot} Presence`)?.state === "on";
        const fill = z.kind === "exclusion" ? "url(#hatch)" : col;
        const c = this.w2s(centroid(z.points));
        out.push(`<polygon data-t="zone" data-node="${n.id}" data-kind="${z.kind}" data-slot="${z.slot}" points="${poly(z.points)}" fill="${fill}" fill-opacity="${z.kind === "exclusion" ? 1 : present ? 0.6 : isSel ? 0.38 : 0.24}" stroke="${z.kind === "exclusion" ? "#e53935" : col}" stroke-width="${isSel ? 3 : 2}" stroke-linejoin="round" style="cursor:${this.tool === "select" ? "move" : "crosshair"}"/>`);
        out.push(`<text x="${c[0]}" y="${c[1]}" text-anchor="middle" font-size="12" font-weight="500" fill="${z.kind === "exclusion" ? "#c62828" : col}" pointer-events="none">${esc(z.name || `${this.t(z.kind)} ${z.slot}`)}</text>`);
      }
      for (const l of n.lines) {
        const isSel = this.sel?.type === "line" && this.sel.node === n.id && this.sel.slot === l.slot;
        const a = this.w2s(l.p1), b = this.w2s(l.p2), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        // screen y is flipped: left of p1->p2 in world = (-dy,dx) in world => in screen (dy, dx)... compute from world vector
        const wv = [l.p2[0] - l.p1[0], l.p2[1] - l.p1[1]], wl = Math.hypot(wv[0], wv[1]) || 1;
        const leftW = [-wv[1] / wl, wv[0] / wl], inW = l.in_side === "left" ? leftW : [-leftW[0], -leftW[1]];
        const inS = [inW[0], -inW[1]];
        const tip = [mid[0] + inS[0] * 26, mid[1] + inS[1] * 26];
        out.push(`<g data-t="line" data-node="${n.id}" data-slot="${l.slot}" style="cursor:${this.tool === "select" ? "move" : "crosshair"}"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="transparent" stroke-width="16"/><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#ffb300" stroke-width="${isSel ? 5 : 3.5}" stroke-linecap="round"/><line x1="${mid[0]}" y1="${mid[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="#ffb300" stroke-width="3"/><circle cx="${tip[0]}" cy="${tip[1]}" r="5" fill="#ffb300"/><text x="${tip[0] + inS[0] * 12}" y="${tip[1] + inS[1] * 12 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#b26a00">IN</text></g>`);
      }
    }

    // selection handles
    const obj = this._selObj();
    if (obj && this.tool === "select" && (this.sel.type === "room" || this.sel.type === "zone")) {
      const pts = obj.points;
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length], a = this.w2s(p), b = this.w2s(q);
        out.push(this._dimLabel((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 12, `${m2(dist(p, q))} m`, "poly", i));
        if (!this.locked) out.push(`<circle data-t="mh" data-i="${i}" cx="${(a[0] + b[0]) / 2}" cy="${(a[1] + b[1]) / 2}" r="5" fill="var(--card-background-color,#fff)" stroke="var(--primary-color,#03a9f4)" stroke-width="2" opacity=".75" style="cursor:copy"/>`);
      });
      const vs = this.locked ? null : this._vertexSel();
      if (!this.locked) pts.forEach((p, i) => { const a = this.w2s(p); out.push(`<rect data-t="vh" data-i="${i}" x="${a[0] - 6}" y="${a[1] - 6}" width="12" height="12" rx="2" fill="${i === vs ? "var(--primary-color,#03a9f4)" : "#fff"}" stroke="var(--primary-color,#03a9f4)" stroke-width="2.5" style="cursor:pointer"/>`); });
      if (vs !== null && pts.length > 3) {
        const a = this.w2s(pts[vs]);
        out.push(`<g data-t="vdel" data-i="${vs}" style="cursor:pointer"><circle cx="${a[0] + 16}" cy="${a[1] - 16}" r="10" fill="var(--error-color,#db4437)" stroke="#fff" stroke-width="2"/><path d="M${a[0] + 12} ${a[1] - 20}l8 8m0-8l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`);
      }
    }
    if (obj && this.tool === "select" && this.sel.type === "line") {
      { const m = this.w2s([(obj.p1[0] + obj.p2[0]) / 2, (obj.p1[1] + obj.p2[1]) / 2]); out.push(this._dimLabel(m[0], m[1] + 30, `${m2(dist(obj.p1, obj.p2))} m`, "line", 0)); }
      if (!this.locked) [obj.p1, obj.p2].forEach((p, i) => { const a = this.w2s(p); out.push(`<rect data-t="lp" data-i="${i}" x="${a[0] - 6}" y="${a[1] - 6}" width="12" height="12" rx="2" fill="#fff" stroke="#ffb300" stroke-width="2.5" style="cursor:pointer"/>`); });
    }

    // live targets
    if (this.live) {
      for (const n of this.fl.nodes) for (const t of this._liveTargets(n)) {
        const q = this.w2s(t.p);
        out.push(`<g pointer-events="none"><circle cx="${q[0]}" cy="${q[1]}" r="14" fill="#ff1744" fill-opacity=".18"/><circle cx="${q[0]}" cy="${q[1]}" r="6" fill="#ff1744" stroke="#fff" stroke-width="2"/><text x="${q[0] + 10}" y="${q[1] - 10}" font-size="11" font-weight="700" fill="#ff1744">${t.n}</text></g>`);
      }
    }

    // nodes
    for (const n of this.fl.nodes) {
      const col = this.nodeColor(n), q = this.w2s([n.x, n.y]);
      const on = this.selNode()?.id === n.id && this.sel.type === "node";
      const hd = rad(n.rotation || 0), dir = [Math.sin(hd), -Math.cos(hd)];
      const tip = [q[0] + dir[0] * 34, q[1] + dir[1] * 34];
      const people = this.live ? this.stateOf(this.deviceOf(n), "People Count")?.state : null;
      out.push(`<g data-t="node" data-id="${n.id}" style="cursor:${this.tool === "select" ? "move" : "default"}">
        ${on ? `<circle cx="${q[0]}" cy="${q[1]}" r="21" fill="none" stroke="var(--primary-color,#03a9f4)" stroke-width="2.5"/>` : ""}
        <line x1="${q[0]}" y1="${q[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${q[0]}" cy="${q[1]}" r="15" fill="${col}" stroke="#fff" stroke-width="2.5"/>
        <path transform="translate(${q[0] - 9},${q[1] - 9}) scale(.75)" fill="#fff" d="M12 8a4 4 0 100 8 4 4 0 000-8zM4.9 4.9l1.4 1.4a8 8 0 000 11.4l-1.4 1.4a10 10 0 010-14.2zm14.2 0a10 10 0 010 14.2l-1.4-1.4a8 8 0 000-11.4z" pointer-events="none"/></g>`);
      out.push(`<text x="${q[0]}" y="${q[1] + 34}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--primary-text-color,#212121)" paint-order="stroke" stroke="var(--card-background-color,#fff)" stroke-width="3.5" pointer-events="none">${esc(n.name)}${people != null && people !== "unknown" ? ` · ${esc(people)}` : ""}</text>`);
      if (on && !this.locked) out.push(`<circle data-t="rot" cx="${tip[0]}" cy="${tip[1]}" r="7" fill="#fff" stroke="${col}" stroke-width="3" style="cursor:alias"/>`);
    }

    // draft
    const dr = this.draw;
    if (dr) {
      const col = this.tool === "exclusion" ? "#e53935" : this.tool === "line" ? "#ffb300" : "var(--primary-color,#03a9f4)";
      if (dr.rect) {
        const [a, b] = dr.rect, p0 = this.w2s(a), p1 = this.w2s(b);
        out.push(`<rect x="${Math.min(p0[0], p1[0])}" y="${Math.min(p0[1], p1[1])}" width="${Math.abs(p1[0] - p0[0])}" height="${Math.abs(p1[1] - p0[1])}" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="2.5" stroke-dasharray="6 4" pointer-events="none"/>`);
        out.push(`<text x="${(p0[0] + p1[0]) / 2}" y="${Math.min(p0[1], p1[1]) - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="${col}">${m2(Math.abs(b[0] - a[0]))} × ${m2(Math.abs(b[1] - a[1]))} m</text>`);
      } else if (dr.points.length || dr.cursor) {
        const pts = [...dr.points]; if (dr.cursor && dr.points.length) pts.push(dr.cursor);
        if (pts.length > 1) out.push(`<polyline points="${poly(pts)}" fill="${this.tool === "line" ? "none" : col}" fill-opacity=".14" stroke="${col}" stroke-width="2.5" stroke-dasharray="6 4" pointer-events="none"/>`);
        dr.points.forEach((p, i) => { const a = this.w2s(p); out.push(`<circle cx="${a[0]}" cy="${a[1]}" r="${i === 0 && dr.points.length >= 3 ? 8 : 5}" fill="#fff" stroke="${col}" stroke-width="2.5" pointer-events="none"/>`); });
        if (dr.cursor) { const a = this.w2s(dr.cursor); out.push(`<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="${col}" pointer-events="none"/>`); }
        if (dr.points.length && dr.cursor) out.push(`<text x="${this.w2s(dr.cursor)[0] + 10}" y="${this.w2s(dr.cursor)[1] - 10}" font-size="12" font-weight="600" fill="${col}">${m2(dist(dr.points[dr.points.length - 1], dr.cursor))} m</text>`);
      }
    }

    // snap marker: what the pointer is currently snapping to
    const hit = this._snapHit;
    if (hit && (this.draw || this.drag?.type === "vertex" || this.drag?.type === "lp")) {
      const c = this.w2s(hit.p), G = "#43a047";
      for (const ref of [hit.vx, hit.vy]) {
        if (!ref) continue;
        const r = this.w2s(ref);
        out.push(`<line x1="${c[0]}" y1="${c[1]}" x2="${r[0]}" y2="${r[1]}" stroke="${G}" stroke-width="1.5" stroke-dasharray="4 4" pointer-events="none"/>`);
      }
      out.push(hit.kind === "vertex"
        ? `<circle cx="${c[0]}" cy="${c[1]}" r="10" fill="none" stroke="${G}" stroke-width="3" pointer-events="none"/>`
        : `<rect x="${c[0] - 5}" y="${c[1] - 5}" width="10" height="10" transform="rotate(45 ${c[0]} ${c[1]})" fill="${G}" stroke="#fff" stroke-width="1.5" pointer-events="none"/>`);
    }

    // scale bar
    const nice = [0.5, 1, 2, 5, 10].find((m) => m * 1000 * s >= 80) || 10;
    const len = nice * 1000 * s;
    out.push(`<g transform="translate(16,${h - 46})" pointer-events="none"><path d="M0 0v8h${len}v-8" fill="none" stroke="var(--secondary-text-color,#757575)" stroke-width="2"/><text x="${len / 2}" y="-5" text-anchor="middle" font-size="11" fill="var(--secondary-text-color,#757575)">${nice} m</text></g>`);

    const svg = this._dom.svg;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("class", this.drag?.type === "pan" ? "pan" : this.tool !== "select" ? "draw" : "");
    svg.innerHTML = out.join("");
  }
}

customElements.define("roomnode-designer-panel", RoomnodeDesignerPanel);
