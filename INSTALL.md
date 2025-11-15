# Quick Installation Guide

## 60-Second Setup

### Step 1: Install Python Dependency (5 seconds)

```bash
pip install websockets
```

### Step 2: Restart MCP Connector (10 seconds)

In TypingMind:
1. Settings → MCP
2. Toggle Workflowy MCP off
3. Toggle Workflowy MCP on

**OR** just refresh the browser page (kills and restarts MCP automatically)

### Step 3: Install Chrome Extension (30 seconds)

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select this folder:
   ```
   E:\__daniel347x\__Obsidian\__Inking into Mind\--TypingMind\Projects - All\Projects - Individual\TODO\Chrome_Extensions\workflowy-glimpse-cache
   ```
5. Done!

### Step 4: Test It (15 seconds)

1. Open Workflowy in browser
2. Expand a few nodes
3. In TypingMind, call:
   ```
   workflowy_glimpse(node_id="e5fdf005-02aa-49a9-9491-9bf7146aa61d")
   ```
4. Look for `"_source": "websocket"` in response

**If it says `"_source": "api"` instead:**
- Check extension console (F12 in Workflowy tab)
- Check Python logs (should show WebSocket connection)
- See DEPLOYMENT.md for troubleshooting

---

## What You Get

✅ **200K node API calls → 0 API calls** (DOM extraction instead)

✅ **Extraction speed:** API fetch ~2-5s → DOM walk <0.1s

✅ **Zero manual work:** Just open Workflowy, everything else is automatic

✅ **Graceful fallback:** If extension not running, API still works

---

## Files Overview

```
workflowy-glimpse-cache/
├── manifest.json       # Extension config
├── background.js       # WebSocket client (maintains connection)
├── content.js          # DOM extraction logic
├── test.html          # Local testing page
├── README.md          # Architecture overview
├── DEPLOYMENT.md      # Detailed troubleshooting
└── INSTALL.md         # This file (quick setup)
```

---

## Next Steps

After installation works:
- Document in Workflowy under Browser Extensions node
- Consider adding visual connection indicator
- Implement cache invalidation (auto-refresh after ETCH)
- Add manual "Refresh Cache" button (future enhancement)

**Current status:** Working MVP - completely invisible WebSocket caching!
