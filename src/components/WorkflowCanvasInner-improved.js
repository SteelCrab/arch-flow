import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import InputBlock from './blocks/InputBlock';
import AIAgentBlock from './blocks/AIAgentBlock';
import NotionBlock from './blocks/NotionBlock';
import ScheduleBlock from './blocks/ScheduleBlock';
import RouteBlock from './blocks/RouteBlock';
import WorkflowExecutor from './WorkflowExecutor';
import ApiService from '../services/api';
import BlockSidebar from './BlockSidebar';
import WorkflowSidebar from './WorkflowSidebar';
import { ChevronLeft } from 'lucide-react';

// Memoize nodeTypes to prevent recreation on every render
const nodeTypes = {
  inputBlock: InputBlock,
  aiAgentBlock: AIAgentBlock,
  notionBlock: NotionBlock,
  scheduleBlock: ScheduleBlock,
  routeBlock: RouteBlock,
};

const initialNodes = [];
const initialEdges = [];

const WorkflowCanvasInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Error boundary-like error handling
  const handleError = useCallback((error, errorInfo) => {
    console.error('WorkflowCanvas Error:', error, errorInfo);
    setError(error.message || 'An unexpected error occurred');
  }, []);

  // Wrap API calls with error handling
  const safeApiCall = useCallback(async (apiCall, errorMessage) => {
    try {
      setError(null);
      setIsLoading(true);
      return await apiCall();
    } catch (error) {
      console.error(errorMessage, error);
      setError(error.message || errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 수동 저장 함수 with error handling
  const saveWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('저장할 워크플로우가 없습니다.');
      return;
    }

    try {
      const workflowData = {
        id: currentWorkflowId || `workflow_${Date.now()}`,
        name: currentWorkflowName || 'Untitled Workflow',
        nodes: nodes.map(node => ({
          ...node,
          // Ensure data is serializable
          data: node.data ? JSON.parse(JSON.stringify(node.data)) : {}
        })),
        edges: edges.map(edge => ({
          ...edge,
          // Ensure data is serializable
          data: edge.data ? JSON.parse(JSON.stringify(edge.data)) : {}
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await safeApiCall(
        () => ApiService.saveWorkflow(workflowData),
        'Failed to save workflow'
      );

      setCurrentWorkflowId(workflowData.id);
      setCurrentWorkflowName(workflowData.name);
      setHasUnsavedChanges(false);
      alert('워크플로우가 성공적으로 저장되었습니다.');
    } catch (error) {
      alert(`저장 실패: ${error.message}`);
    }
  }, [nodes, edges, currentWorkflowId, currentWorkflowName, safeApiCall]);

  // Load workflow with error handling
  const loadWorkflow = useCallback(async (workflowId) => {
    try {
      const workflow = await safeApiCall(
        () => ApiService.getWorkflow(workflowId),
        'Failed to load workflow'
      );

      if (workflow && workflow.nodes && workflow.edges) {
        // Validate and sanitize loaded data
        const validNodes = workflow.nodes.filter(node => 
          node && node.id && node.type && nodeTypes[node.type]
        );
        const validEdges = workflow.edges.filter(edge => 
          edge && edge.id && edge.source && edge.target
        );

        setNodes(validNodes);
        setEdges(validEdges);
        setCurrentWorkflowId(workflow.id);
        setCurrentWorkflowName(workflow.name);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      alert(`로드 실패: ${error.message}`);
    }
  }, [setNodes, setEdges, safeApiCall]);

  // Memoize onConnect to prevent recreation
  const onConnect = useCallback(
    (params) => {
      try {
        setEdges((eds) => addEdge(params, eds));
        setHasUnsavedChanges(true);
      } catch (error) {
        handleError(error, 'Error connecting nodes');
      }
    },
    [setEdges, handleError]
  );

  // Handle node selection with error boundary
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }) => {
      try {
        setSelectedNodes(selectedNodes || []);
      } catch (error) {
        handleError(error, 'Error handling node selection');
      }
    },
    [handleError]
  );

  // Track changes for unsaved indicator
  useEffect(() => {
    const handleNodesChange = () => setHasUnsavedChanges(true);
    const handleEdgesChange = () => setHasUnsavedChanges(true);

    // Only set unsaved changes if we have a current workflow
    if (currentWorkflowId && (nodes.length > 0 || edges.length > 0)) {
      handleNodesChange();
    }
  }, [nodes, edges, currentWorkflowId]);

  // Memoize ReactFlow props to prevent unnecessary re-renders
  const reactFlowProps = useMemo(() => ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    nodeTypes,
    fitView: true,
    attributionPosition: 'top-right',
  }), [nodes, edges, onNodesChange, onEdgesChange, onConnect, onSelectionChange]);

  // Error display component
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">오류가 발생했습니다</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">처리 중...</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}>
        <div className="flex-1 overflow-hidden">
          <BlockSidebar />
        </div>
        <div className="border-t border-gray-200">
          <WorkflowSidebar 
            onSave={saveWorkflow}
            onLoad={loadWorkflow}
            hasUnsavedChanges={hasUnsavedChanges}
            currentWorkflowName={currentWorkflowName}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          aria-label={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
        >
          <ChevronLeft 
            className={`w-5 h-5 text-gray-600 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} 
          />
        </button>

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-200">
            저장되지 않은 변경사항
          </div>
        )}

        {/* ReactFlow Canvas */}
        <div ref={reactFlowWrapper} className="w-full h-full">
          <ReactFlow
            {...reactFlowProps}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Workflow Executor */}
        {selectedNodes.length > 0 && (
          <div className="absolute bottom-4 right-4 z-10">
            <WorkflowExecutor 
              nodes={nodes} 
              edges={edges} 
              selectedNodes={selectedNodes}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowCanvasInner;
