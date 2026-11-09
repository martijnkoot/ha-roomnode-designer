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
)
REQUIRED_ENTITY = "Polygon Zone 1"
