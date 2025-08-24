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
  const [nodeId, setNodeId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 블록 데이터 변경 핸들러
  const handleBlockDataChange = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData
            }
          };
        }
        return node;
      })
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  // 블록 삭제 핸들러
  const handleDeleteBlock = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setHasUnsavedChanges(true);
  }, [setNodes, setEdges]);

  // 드래그 앤 드롭으로 새 블록 추가
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNodeId = `${type}_${nodeId}`;
      const newNode = {
        id: newNodeId,
        type,
        position,
        data: {
          label: `${type} node`,
          onChange: (data) => handleBlockDataChange(newNodeId, data),
          onDelete: handleDeleteBlock,
          // 블록 타입별 기본 데이터
          ...(type === 'inputBlock' && { content: '' }),
          ...(type === 'aiAgentBlock' && { 
            systemPrompt: '당신은 도움이 되는 AI 어시스턴트입니다.',
            userPrompt: '',
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            temperature: 0.7,
            maxTokens: 1000
          }),
          ...(type === 'notionBlock' && { 
            pageTitle: '',
            databaseId: '',
            action: 'create_page'
          }),
          ...(type === 'scheduleBlock' && { 
            cronExpression: '0 9 * * *',
            timezone: 'Asia/Seoul',
            enabled: true
          }),
          ...(type === 'routeBlock' && { 
            routingMode: 'ai-smart',
            categories: ['긍정적', '부정적', '중립적'],
            aiModel: 'claude-3-haiku',
            confidence: 0.7
          })
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeId((id) => id + 1);
      setHasUnsavedChanges(true);
    },
    [nodeId, setNodes, handleBlockDataChange, handleDeleteBlock]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 워크플로우 저장 함수 (블록 데이터 포함)
  const saveWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('저장할 워크플로우가 없습니다.');
      return;
    }

    try {
      // 블록 데이터를 직렬화 가능한 형태로 변환
      const serializedNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          // 함수들은 제외하고 데이터만 저장
          ...Object.fromEntries(
            Object.entries(node.data).filter(([key, value]) => 
              typeof value !== 'function'
            )
          )
        },
        selected: node.selected || false,
        dragging: node.dragging || false
      }));

      const serializedEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        selected: edge.selected || false
      }));

      const workflowData = {
        id: currentWorkflowId || `workflow_${Date.now()}`,
        name: currentWorkflowName || 'Untitled Workflow',
        nodes: serializedNodes,
        edges: serializedEdges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving workflow data:', workflowData);
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

  // 워크플로우 로드 함수 (블록 데이터 복원)
  const loadWorkflow = useCallback(async (workflowId) => {
    try {
      console.log('Loading workflow:', workflowId);
      const workflow = await ApiService.getWorkflow(workflowId);
      
      if (workflow && workflow.nodes && workflow.edges) {
        // 로드된 노드에 이벤트 핸들러 다시 연결
        const restoredNodes = workflow.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onChange: (data) => handleBlockDataChange(node.id, data),
            onDelete: handleDeleteBlock
          }
        }));

        console.log('Restored nodes:', restoredNodes);
        setNodes(restoredNodes);
        setEdges(workflow.edges);
        setCurrentWorkflowId(workflow.id);
        setCurrentWorkflowName(workflow.name);
        setHasUnsavedChanges(false);
        
        // 다음 노드 ID 설정
        const maxId = Math.max(
          ...workflow.nodes.map(node => {
            const match = node.id.match(/_(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          }),
          0
        );
        setNodeId(maxId + 1);
        
        alert(`워크플로우 "${workflow.name}"를 불러왔습니다.`);
      } else {
        alert('워크플로우 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      alert(`로드 실패: ${error.message}`);
    }
  }, [setNodes, setEdges, handleBlockDataChange, handleDeleteBlock]);

  // 새 워크플로우 생성
  const createNewWorkflow = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('저장되지 않은 변경사항이 있습니다. 새 워크플로우를 만드시겠습니까?');
      if (!confirmed) return;
    }
    
    setNodes([]);
    setEdges([]);
    setCurrentWorkflowId(null);
    setCurrentWorkflowName(null);
    setHasUnsavedChanges(false);
    setNodeId(1);
  }, [hasUnsavedChanges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      setHasUnsavedChanges(true);
    },
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
            onNew={createNewWorkflow}
            hasUnsavedChanges={hasUnsavedChanges}
            currentWorkflowName={currentWorkflowName}
            currentWorkflowId={currentWorkflowId}
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

        {/* Workflow Info */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {currentWorkflowName && (
            <div className="px-3 py-1 bg-white text-sm rounded-full border border-gray-200 shadow-sm">
              {currentWorkflowName}
            </div>
          )}
          {hasUnsavedChanges && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-200">
              저장되지 않은 변경사항
            </div>
          )}
        </div>

        {/* ReactFlow Canvas */}
        <div 
          ref={reactFlowWrapper} 
          className="w-full h-full"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
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
