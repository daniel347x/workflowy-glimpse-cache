/**
 * Workflowy GLIMPSE Cache - Content Script
 * 
 * Extracts DOM tree structure when requested by background script.
 * Uses DOM selectors documented in ARC SATCHEL.
 */

console.log('[GLIMPSE Cache] Content script loaded on Workflowy page');

/**
 * Extract complete node tree from DOM
 * 
 * @param {string} nodeId - UUID of root node to extract from
 * @returns {Object} - GLIMPSE-compatible response
 */
function extractDOMTree(nodeId) {
  console.log('[GLIMPSE Cache] 🔍 Extracting DOM tree for node:', nodeId);
  
  try {
    // Find root node in DOM
    const rootElement = document.querySelector(`div[projectid="${nodeId}"]`);
    
    if (!rootElement) {
      console.warn('[GLIMPSE Cache] ❌ Node not found in DOM:', nodeId);
      return {
        success: false,
        error: `Node ${nodeId} not found in DOM (may be collapsed or not loaded)`
      };
    }
    
    // Extract root metadata
    const rootName = extractNodeName(rootElement);
    const rootNote = extractNodeNote(rootElement);
    
    // Extract children recursively
    const children = extractChildren(rootElement);
    
    // Count total nodes
    const nodeCount = 1 + countNodesRecursive(children);
    
    // Calculate depth
    const depth = calculateDepth(children);
    
    console.log(`[GLIMPSE Cache] ✅ Extracted ${nodeCount} nodes, depth ${depth}`);
    
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

/**
 * Extract node name from DOM element
 */
function extractNodeName(element) {
  const nameContainer = element.querySelector(':scope > .name > .content > .innerContentContainer');
  return nameContainer ? nameContainer.textContent.trim() : 'Untitled';
}

/**
 * Extract note content from DOM element
 */
function extractNodeNote(element) {
  const noteContainer = element.querySelector(':scope > .notes > .content > .innerContentContainer');
  if (!noteContainer || !noteContainer.textContent.trim()) {
    return null;
  }
  return noteContainer.textContent;
}

/**
 * Extract children nodes recursively
 */
function extractChildren(parentElement) {
  const children = [];
  
  // Get direct children only (use :scope to avoid grabbing grandchildren)
  const childrenContainer = parentElement.querySelector(':scope > .children');
  if (!childrenContainer) {
    return children; // No children or collapsed
  }
  
  const childElements = childrenContainer.querySelectorAll(':scope > div[projectid]');
  
  childElements.forEach(childElement => {
    const childId = childElement.getAttribute('projectid');
    const childName = extractNodeName(childElement);
    const childNote = extractNodeNote(childElement);
    
    // Check if node has children in DOM (more reliable than CSS class check)
    const childrenContainer = childElement.querySelector(':scope > .children');
    const hasChildren = childrenContainer && childrenContainer.children.length > 0;
    
    // Recursively extract children if present in DOM
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

/**
 * Count total nodes in tree
 */
function countNodesRecursive(nodes) {
  let count = nodes.length;
  nodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      count += countNodesRecursive(node.children);
    }
  });
  return count;
}

/**
 * Calculate maximum depth of tree
 */
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

/**
 * Listen for requests from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[GLIMPSE Cache] 📨 Message from background:', request.action);
  
  if (request.action === 'extract_dom') {
    const result = extractDOMTree(request.node_id);
    sendResponse(result);
    return true; // Indicates async response
  }
  
  return false;
});

console.log('[GLIMPSE Cache] ✅ Ready to extract DOM trees');
