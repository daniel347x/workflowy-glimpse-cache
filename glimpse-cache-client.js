/**
 * Workflowy GLIMPSE Cache - Standalone WebSocket Client
 * 
 * Injected directly into Workflowy desktop app (Electron).
 * No Chrome extension APIs - pure WebSocket + DOM extraction.
 */

(function() {
  'use strict';
  
  console.log('[GLIMPSE Cache] Standalone client initializing...');
  
  let ws = null;
  let reconnectInterval = null;
  let isConnecting = false;
  
  const WS_URL = 'ws://localhost:8765';
  const RECONNECT_DELAY = 3000; // 3 seconds
  
  /**
   * Extract complete node tree from DOM
   */
  function extractDOMTree(nodeId) {
    console.log('[GLIMPSE Cache] 🔍 Extracting DOM tree for node:', nodeId);
    
    try {
      const rootElement = document.querySelector(`div[projectid="${nodeId}"]`);
      
      if (!rootElement) {
        console.warn('[GLIMPSE Cache] ❌ Node not found in DOM:', nodeId);
        return {
          success: false,
          error: `Node ${nodeId} not found in DOM (may be collapsed or not loaded)`
        };
      }
      
      const rootName = extractNodeName(rootElement);
      const rootNote = extractNodeNote(rootElement);
      const children = extractChildren(rootElement);
      const nodeCount = 1 + countNodesRecursive(children);
      const depth = calculateDepth(children);
      
      console.log(`[GLIMPSE Cache] ✅ Extracted ${nodeCount} nodes, depth ${depth}`);
      console.log('[GLIMPSE Cache] 📊 TREE STRUCTURE:');
      printTree(children, 0);
      
      return {
        success: true,
        root: {
          id: nodeId,
          name: rootName,
          note: rootNote,
          parent_id: rootElement.parentElement?.closest('div[projectid]')?.getAttribute('projectid') || null
        },
        children: children,
        node_count: nodeCount,
        depth: depth
      };
      
    } catch (error) {
      console.error('[GLIMPSE Cache] Error during extraction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  function extractNodeName(element) {
    const nameContainer = element.querySelector(':scope > .name > .content > .innerContentContainer');
    return nameContainer ? nameContainer.textContent.trim() : 'Untitled';
  }
  
  function extractNodeNote(element) {
    const noteContainer = element.querySelector(':scope > .notes > .content > .innerContentContainer');
    if (!noteContainer || !noteContainer.textContent.trim()) {
      return null;
    }
    return noteContainer.textContent;
  }
  
  function extractChildren(parentElement) {
    const children = [];
    const childrenContainer = parentElement.querySelector(':scope > .children');
    
    if (!childrenContainer) {
      return children;
    }
    
    const childElements = childrenContainer.querySelectorAll(':scope > div[projectid]');
    
    childElements.forEach(childElement => {
      const childId = childElement.getAttribute('projectid');
      const childName = extractNodeName(childElement);
      const childNote = extractNodeNote(childElement);
      // Check if node has children in DOM (more reliable than CSS class check)
      const childrenContainer = childElement.querySelector(':scope > .children');
      const hasChildren = childrenContainer && childrenContainer.children.length > 0;
      const grandchildren = hasChildren ? extractChildren(childElement) : [];
      
      children.push({
        id: childId,
        name: childName,
        note: childNote,
        parent_id: parentElement.getAttribute('projectid'),
        children: grandchildren
      });
    });
    
    return children;
  }
  
  function countNodesRecursive(nodes) {
    let count = nodes.length;
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        count += countNodesRecursive(node.children);
      }
    });
    return count;
  }
  
  function calculateDepth(nodes, currentDepth = 1) {
    if (!nodes || nodes.length === 0) {
      return currentDepth - 1;
    }
    
    let maxDepth = currentDepth;
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        const childDepth = calculateDepth(node.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    });
    
    return maxDepth;
  }
  
  function printTree(nodes, level) {
    const indent = '    '.repeat(level);
    nodes.forEach(node => {
      // Determine bullet emoji based on whether node has children
      const bullet = (node.children && node.children.length > 0) ? '◉' : '●';
      console.log(`${indent}${bullet} ${node.name}`);
      if (node.children && node.children.length > 0) {
        printTree(node.children, level + 1);
      }
    });
  }
  
  /**
   * Connect to Python MCP WebSocket server
   */
  function connectWebSocket() {
    if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
      return;
    }
    
    isConnecting = true;
    console.log('[GLIMPSE Cache] Connecting to', WS_URL);
    
    try {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('[GLIMPSE Cache] ✅ Connected to Python MCP server');
        isConnecting = false;
        
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
        
        // Send initial ping to keep connection alive
        ws.send(JSON.stringify({action: 'ping'}));
        console.log('[GLIMPSE Cache] Sent initial ping');
      };
      
      ws.onmessage = (event) => {
        try {
          const request = JSON.parse(event.data);
          console.log('[GLIMPSE Cache] 📩 Request from Python:', request.action);
          
          if (request.action === 'extract_dom') {
            const result = extractDOMTree(request.node_id);
            ws.send(JSON.stringify(result));
            console.log('[GLIMPSE Cache] ✅ Sent response:', result.node_count || 0, 'nodes');
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
        
        if (!reconnectInterval) {
          reconnectInterval = setInterval(connectWebSocket, RECONNECT_DELAY);
        }
      };
      
    } catch (error) {
      console.error('[GLIMPSE Cache] Failed to create WebSocket:', error);
      isConnecting = false;
      
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connectWebSocket, RECONNECT_DELAY);
      }
    }
  }
  
  // Wait for DOM to be ready, then connect
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[GLIMPSE Cache] DOM ready, connecting...');
      connectWebSocket();
    });
  } else {
    console.log('[GLIMPSE Cache] DOM already ready, connecting...');
    connectWebSocket();
  }
  
  console.log('[GLIMPSE Cache] ✅ Standalone client loaded');
  
})();
