/**
 * Debugging utilities for React error #185 and component state issues
 */

// React Error #185 typically occurs when:
// 1. Component state becomes corrupted
// 2. Props are not properly validated
// 3. Circular references in state
// 4. Invalid React elements in state

export const validateNodeData = (node) => {
  try {
    if (!node || typeof node !== 'object') {
      console.warn('Invalid node:', node);
      return false;
    }

    // Check required properties
    if (!node.id || !node.type) {
      console.warn('Node missing required properties:', node);
      return false;
    }

    // Validate data property
    if (node.data && typeof node.data !== 'object') {
      console.warn('Node data is not an object:', node);
      return false;
    }

    // Check for circular references
    try {
      JSON.stringify(node);
    } catch (error) {
      console.warn('Node contains circular references:', node, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating node:', error);
    return false;
  }
};

export const validateEdgeData = (edge) => {
  try {
    if (!edge || typeof edge !== 'object') {
      console.warn('Invalid edge:', edge);
      return false;
    }

    // Check required properties
    if (!edge.id || !edge.source || !edge.target) {
      console.warn('Edge missing required properties:', edge);
      return false;
    }

    // Check for circular references
    try {
      JSON.stringify(edge);
    } catch (error) {
      console.warn('Edge contains circular references:', edge, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating edge:', error);
    return false;
  }
};

export const sanitizeWorkflowData = (workflow) => {
  try {
    if (!workflow || typeof workflow !== 'object') {
      return null;
    }

    const sanitized = {
      id: workflow.id || `workflow_${Date.now()}`,
      name: workflow.name || 'Untitled Workflow',
      nodes: [],
      edges: [],
      createdAt: workflow.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sanitize nodes
    if (Array.isArray(workflow.nodes)) {
      sanitized.nodes = workflow.nodes
        .filter(validateNodeData)
        .map(node => ({
          id: String(node.id),
          type: String(node.type),
          position: {
            x: Number(node.position?.x) || 0,
            y: Number(node.position?.y) || 0
          },
          data: node.data ? JSON.parse(JSON.stringify(node.data)) : {},
          // Remove any non-serializable properties
          ...(node.selected !== undefined && { selected: Boolean(node.selected) }),
          ...(node.dragging !== undefined && { dragging: Boolean(node.dragging) })
        }));
    }

    // Sanitize edges
    if (Array.isArray(workflow.edges)) {
      sanitized.edges = workflow.edges
        .filter(validateEdgeData)
        .map(edge => ({
          id: String(edge.id),
          source: String(edge.source),
          target: String(edge.target),
          sourceHandle: edge.sourceHandle ? String(edge.sourceHandle) : null,
          targetHandle: edge.targetHandle ? String(edge.targetHandle) : null,
          data: edge.data ? JSON.parse(JSON.stringify(edge.data)) : {},
          // Remove any non-serializable properties
          ...(edge.selected !== undefined && { selected: Boolean(edge.selected) })
        }));
    }

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing workflow data:', error);
    return null;
  }
};

export const debugReactError185 = (error, errorInfo) => {
  console.group('🐛 React Error #185 Debug Information');
  
  console.log('Error Message:', error.message);
  console.log('Error Stack:', error.stack);
  console.log('Component Stack:', errorInfo?.componentStack);
  
  // Check localStorage for corrupted data
  try {
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('workflow')) {
        try {
          localStorageData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          console.warn(`Corrupted localStorage data for key: ${key}`, e);
          localStorageData[key] = 'CORRUPTED_DATA';
        }
      }
    }
    console.log('LocalStorage Workflow Data:', localStorageData);
  } catch (e) {
    console.warn('Could not access localStorage:', e);
  }

  // Check for common React error #185 causes
  console.log('Browser Info:', {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    reactVersion: React.version || 'Unknown'
  });

  console.groupEnd();
};

export const clearCorruptedData = () => {
  try {
    // Clear workflow-related localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('workflow') || key.includes('reactflow'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed corrupted localStorage key: ${key}`);
    });

    // Clear sessionStorage as well
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('workflow') || key.includes('reactflow'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`Removed corrupted sessionStorage key: ${key}`);
    });

    console.log('Cleared potentially corrupted data from storage');
    return true;
  } catch (error) {
    console.error('Error clearing corrupted data:', error);
    return false;
  }
};

export const createSafeComponent = (Component, fallback = null) => {
  return React.forwardRef((props, ref) => {
    try {
      return <Component {...props} ref={ref} />;
    } catch (error) {
      console.error('Component render error:', error);
      debugReactError185(error, { componentStack: Component.name });
      return fallback || <div>Component Error</div>;
    }
  });
};

// Hook for safe state updates
export const useSafeState = (initialState) => {
  const [state, setState] = React.useState(initialState);
  
  const safeSetState = React.useCallback((newState) => {
    try {
      // Validate new state
      if (typeof newState === 'function') {
        setState(prevState => {
          try {
            const result = newState(prevState);
            // Ensure result is serializable
            JSON.stringify(result);
            return result;
          } catch (error) {
            console.error('State update function error:', error);
            return prevState;
          }
        });
      } else {
        // Ensure new state is serializable
        JSON.stringify(newState);
        setState(newState);
      }
    } catch (error) {
      console.error('Safe state update error:', error);
      // Don't update state if there's an error
    }
  }, [setState]);

  return [state, safeSetState];
};
