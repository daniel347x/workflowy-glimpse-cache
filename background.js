/**
 * Workflowy GLIMPSE Cache - Background Service Worker
 * 
 * Maintains WebSocket connection to Python MCP server (localhost:8765).
 * Relays GLIMPSE requests between Python and content script (DOM walker).
 */

let ws = null;
let reconnectInterval = null;
let isConnecting = false;

const WS_URL = 'ws://localhost:8765';
const RECONNECT_DELAY = 3000; // 3 seconds

/**
 * Connect to Python MCP WebSocket server
 */
function connectWebSocket() {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return; // Already connecting or connected
  }
  
  isConnecting = true;
  console.log('[GLIMPSE Cache] Connecting to', WS_URL);
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('[GLIMPSE Cache] ✅ Connected to Python MCP server');
      isConnecting = false;
      
      // Clear reconnect interval if it was running
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };
    
    ws.onmessage = async (event) => {
      try {
        const request = JSON.parse(event.data);
        console.log('[GLIMPSE Cache] 📩 Request from Python:', request.action);
        
        if (request.action === 'extract_dom') {
          // Forward to content script for DOM extraction
          const tabs = await chrome.tabs.query({ url: '*://workflowy.com/*' });
          
          if (tabs.length === 0) {
            // No Workflowy tab open
            ws.send(JSON.stringify({
              success: false,
              error: 'No Workflowy tab open'
            }));
            return;
          }
          
          // Send to first Workflowy tab
          const response = await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'extract_dom',
            node_id: request.node_id
          });
          
          // Relay response back to Python
          ws.send(JSON.stringify(response));
          console.log('[GLIMPSE Cache] ✅ Sent response to Python:', response.node_count, 'nodes');
        }
        
      } catch (error) {
        console.error('[GLIMPSE Cache] Error handling message:', error);
        ws.send(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    };
    
    ws.onerror = (error) => {
      console.error('[GLIMPSE Cache] WebSocket error:', error);
      isConnecting = false;
    };
    
    ws.onclose = () => {
      console.log('[GLIMPSE Cache] ⚠️ Disconnected from Python MCP server');
      ws = null;
      isConnecting = false;
      
      // Start reconnection attempts
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connectWebSocket, RECONNECT_DELAY);
      }
    };
    
  } catch (error) {
    console.error('[GLIMPSE Cache] Failed to create WebSocket:', error);
    isConnecting = false;
    
    // Retry connection
    if (!reconnectInterval) {
      reconnectInterval = setInterval(connectWebSocket, RECONNECT_DELAY);
    }
  }
}

// Start connection on extension load
connectWebSocket();

// Keep alive mechanism for service worker
chrome.runtime.onStartup.addListener(() => {
  console.log('[GLIMPSE Cache] Extension started');
  connectWebSocket();
});

// Reconnect if extension wakes from idle
chrome.runtime.onInstalled.addListener(() => {
  console.log('[GLIMPSE Cache] Extension installed/updated');
  connectWebSocket();
});
