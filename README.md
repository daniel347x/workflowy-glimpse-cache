# Workflowy GLIMPSE Cache Extension

Chrome extension that provides DOM-extracted GLIMPSE data to Python MCP Workflowy Server via WebSocket.

## Architecture

**WebSocket Communication:**
- Extension connects to `ws://localhost:8765` (Python MCP server)
- Python sends requests: `{"action": "extract_dom", "node_id": "uuid"}`
- Extension walks DOM and responds with full tree structure
- Python uses this data instead of API fetch (bypasses 200K node transfers)

**Components:**
- `background.js` - Maintains WebSocket connection, relays messages
- `content.js` - Extracts DOM tree structure from Workflowy page
- `manifest.json` - Extension configuration

## Installation

### Method 1: Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this directory: `E:\__daniel347x\__Obsidian\__Inking into Mind\--TypingMind\Projects - All\Projects - Individual\TODO\Chrome_Extensions\workflowy-glimpse-cache`

### Method 2: Build and Install (Production)

TODO: Add build process if needed (currently using unpacked is fine)

## Icon Placeholders

The extension currently references icon files that don't exist yet:
- `icon16.png` (16x16)
- `icon48.png` (48x48)  
- `icon128.png` (128x128)

You can:
1. Create simple placeholder icons
2. Or remove the "icons" section from manifest.json (Chrome will use default)

## Testing

1. Install extension (load unpacked)
2. Open Workflowy in browser
3. Check extension console: Should see "Connected to Python MCP server"
4. Expand some nodes in Workflowy
5. In TypingMind agent, call `workflowy_glimpse(node_id)`
6. Python logs should show "GLIMPSE via WebSocket successful"

## Dependencies

Python side requires: `pip install websockets`

## How It Works

1. Extension loads when Workflowy page opens
2. Background script connects to `ws://localhost:8765`
3. When Python calls `workflowy_glimpse()`:
   - Python sends WS request to extension
   - Extension walks DOM starting at requested node
   - Extension sends JSON response via WebSocket
   - Python returns data to agent (transparent)
4. If WebSocket unavailable, Python falls back to API fetch

**Dan does nothing - completely invisible!**
