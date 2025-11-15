# Workflowy GLIMPSE Cache - Deployment Guide

## Prerequisites

### Python Dependency

The Python MCP server requires the `websockets` library:

```bash
pip install websockets
```

**Note:** If this library is missing, the WebSocket server won't start, but the MCP server will still function normally (GLIMPSE will just use API fetches).

---

## Installation Steps

### Step 1: Install Chrome Extension

1. Open Chrome/Edge browser
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Navigate to and select:
   ```
   E:\__daniel347x\__Obsidian\__Inking into Mind\--TypingMind\Projects - All\Projects - Individual\TODO\Chrome_Extensions\workflowy-glimpse-cache
   ```
6. Extension should now appear in your extensions list

**Verification:**
- Extension icon appears in toolbar (or extensions menu)
- Open Chrome DevTools console, should see: `[GLIMPSE Cache] Content script loaded on Workflowy page` (when on Workflowy)

---

### Step 2: Verify Python WebSocket Server

The WebSocket server starts automatically when the MCP Workflowy Server starts.

**Check server logs:**
- When you refresh TypingMind page (or reconnect MCP), you should see:
  ```
  Starting WebSocket server on ws://localhost:8765
  ✅ WebSocket server listening on port 8765
  ```

**If you see this instead:**
```
websockets library not installed. WebSocket cache unavailable.
```

**Fix:** Run `pip install websockets` in your Python environment, then restart MCP connector.

---

### Step 3: Test End-to-End

1. **Open Workflowy** in Chrome browser
2. **Expand some nodes** (manually click to expand - extension only sees what's visible in DOM)
3. **In TypingMind agent**, call:
   ```
   workflowy_glimpse(node_id="e5fdf005-02aa-49a9-9491-9bf7146aa61d")
   ```
4. **Check logs:**
   - Python logs should show: `🔌 Attempting WebSocket DOM extraction...`
   - Followed by: `✅ GLIMPSE via WebSocket successful`
   - Response should include: `"_source": "websocket"`

**If WebSocket fails:**
- Python automatically falls back to API fetch
- You'll see: `"_source": "api"` in response
- Check extension console for errors

---

## Troubleshooting

### Extension not connecting to WebSocket

**Symptoms:**
- Extension shows "Disconnected" in logs
- Python shows API fetch instead of WebSocket

**Solutions:**
1. Verify Python MCP server is running (check TypingMind MCP connection)
2. Verify `websockets` library installed: `pip list | grep websockets`
3. Check if port 8765 is available: `netstat -ano | findstr 8765`
4. Restart MCP connector in TypingMind
5. Reload extension: `chrome://extensions/` → Click reload button

### DOM extraction returning 0 nodes

**Symptoms:**
- WebSocket connects successfully
- But extraction returns empty tree

**Solutions:**
1. **Expand nodes manually** in Workflowy browser tab first
2. Extension only extracts what's visible in DOM (collapsed nodes have no children in DOM)
3. Try with a small, fully-expanded test node first

### Python WebSocket server not starting

**Symptoms:**
- Logs show "websockets library not installed"
- Or "WebSocket server failed to start"

**Solutions:**
1. Install websockets: `pip install websockets`
2. Check Python version (requires Python 3.7+)
3. Restart MCP connector
4. Check if another process is using port 8765

---

## How to Disable (Fallback to API)

**Method 1: Disable extension**
- `chrome://extensions/` → Toggle off "Workflowy GLIMPSE Cache"
- Python will automatically fall back to API fetches

**Method 2: Keep extension enabled**
- WebSocket connection simply won't establish if Python server not running
- Graceful fallback happens automatically

---

## Future Enhancements

**Potential improvements:**
- Cache invalidation mechanism (auto-refresh after ETCH operations)
- Visual indicator in Workflowy page (connection status)
- Manual "Refresh Cache" button
- Support for multiple simultaneous GLIMPSE requests

**Current status:** Working MVP - transparent WebSocket caching with API fallback.
