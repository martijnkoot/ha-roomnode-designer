"""Constants for Roomnode Designer."""

DOMAIN = "roomnode_designer"
PANEL_URL_PATH = "roomnode-designer"
PANEL_ELEMENT = "roomnode-designer-panel"
STATIC_URL = "/roomnode_designer_static"
STORAGE_KEY = "roomnode_designer.model"
STORAGE_VERSION = 1

# Entities the Jarvis roomnode firmware exposes (matched on their original name).
ENTITY_NAMES_EXACT = {
    "Polygon Zones Enabled",
    "People Count",
    "Last Crossing Direction",
    "Reset People Count",
    "Tracking Presence",
    "Tracking Target Count",
}
ENTITY_NAME_PREFIXES = (
    "Polygon Zone ",
    "Polygon Exclusion ",
    "Entry Line ",
    "Tracking Target ",
    "Radar ",
    "Tracking Radar ",
)

# Entities that can be written; when a name exists as several entities (the radar mode is both
# a select and a text sensor) the writable one wins.
WRITABLE_DOMAINS = {"select", "number", "text", "switch", "button"}

NAME_RADAR_MODE = "Tracking Radar Installation Mode"
NAME_RADAR_DISTANCE = "Tracking Radar Detection Distance"
NAME_RADAR_START = "Tracking Radar Detection Start Angle"
NAME_RADAR_END = "Tracking Radar Detection End Angle"
REQUIRED_ENTITY = "Polygon Zone 1"
