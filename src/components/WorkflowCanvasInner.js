import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
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

  // 수동 저장 함수
  const saveWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('저장할 워크플로우가 없습니다.');
      return;
    }

    try {
      const workflowData = {
        id: currentWorkflowId || `workflow_${Date.now()}`,
        name: currentWorkflowName || 'Untitled Workflow',
        nodes: nodes,
        edges: edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ApiService.saveWorkflow(workflowData);
      setCurrentWorkflowId(workflowData.id);
      setCurrentWorkflowName(workflowData.name);
      setHasUnsavedChanges(false);
      alert('워크플로우가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert(`저장 실패: ${error.message}`);
    }
  }, [nodes, edges, currentWorkflowId, currentWorkflowName]);

  // 워크플로우 로드 함수
  const loadWorkflow = useCallback(async (workflowId) => {
    try {
      const workflow = await ApiService.getWorkflow(workflowId);
      if (workflow && workflow.nodes && workflow.edges) {
        setNodes(workflow.nodes);
        setEdges(workflow.edges);
        setCurrentWorkflowId(workflow.id);
        setCurrentWorkflowName(workflow.name);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      alert(`로드 실패: ${error.message}`);
    }
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }) => {
      setSelectedNodes(selectedNodes || []);
    },
    []
  );

  // 변경사항 추적
  useEffect(() => {
    if (currentWorkflowId && (nodes.length > 0 || edges.length > 0)) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges, currentWorkflowId]);

  return (
    <div className="flex h-screen bg-gray-50">
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
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="top-right"
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowCanvasInner;
