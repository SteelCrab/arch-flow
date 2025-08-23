import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import ConditionBlock from './blocks/ConditionBlock';
import ScheduleBlock from './blocks/ScheduleBlock';
import BlockSidebar from './BlockSidebar';
import WorkflowSidebar from './WorkflowSidebar';
import { WorkflowExecutor } from '../utils/workflowExecutor';
import { ChevronLeft } from 'lucide-react';

const nodeTypes = {
  inputBlock: InputBlock,
  aiAgentBlock: AIAgentBlock,
  notionBlock: NotionBlock,
  conditionBlock: ConditionBlock,
  scheduleBlock: ScheduleBlock,
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
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // 자동 저장 함수
  const autoSaveWorkflow = useCallback(() => {
    if (!autoSaveEnabled || nodes.length === 0) return;

    const workflowId = currentWorkflowId || `auto_${Date.now()}`;
    const workflowData = {
      id: workflowId,
      name: currentWorkflowId ? `워크플로우 ${workflowId}` : `자동 저장 ${new Date().toLocaleTimeString()}`,
      nodes,
      edges,
      updatedAt: new Date().toISOString()
    };

    try {
      // 현재 워크플로우 저장
      localStorage.setItem(`workflow_${workflowId}`, JSON.stringify(workflowData));
      
      // 워크플로우 목록 업데이트
      const savedWorkflows = JSON.parse(localStorage.getItem('arch_flow_workflows') || '[]');
      const existingIndex = savedWorkflows.findIndex(w => w.id === workflowId);
      
      if (existingIndex >= 0) {
        savedWorkflows[existingIndex] = {
          ...savedWorkflows[existingIndex],
          name: workflowData.name,
          updatedAt: workflowData.updatedAt
        };
      } else {
        savedWorkflows.push({
          id: workflowId,
          name: workflowData.name,
          type: 'file',
          createdAt: workflowData.updatedAt,
          updatedAt: workflowData.updatedAt
        });
      }
      
      localStorage.setItem('arch_flow_workflows', JSON.stringify(savedWorkflows));
      
      if (!currentWorkflowId) {
        setCurrentWorkflowId(workflowId);
      }
      
      console.log('자동 저장 완료:', workflowData.name);
    } catch (error) {
      console.error('자동 저장 실패:', error);
    }
  }, [nodes, edges, currentWorkflowId, autoSaveEnabled]);

  // nodes나 edges가 변경될 때마다 자동 저장 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSaveWorkflow();
    }, 2000); // 2초 후 자동 저장

    return () => clearTimeout(timer);
  }, [nodes, edges, autoSaveWorkflow]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodesDelete = useCallback(
    (nodesToDelete) => {
      setNodes((nds) => nds.filter((node) => !nodesToDelete.find((n) => n.id === node.id)));
    },
    [setNodes]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      setEdges((eds) => eds.filter((edge) => !edgesToDelete.find((e) => e.id === edge.id)));
    },
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodes(nodes);
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      onNodesDelete(selectedNodes);
      setSelectedNodes([]);
    }
  }, [selectedNodes, onNodesDelete]);

  const onSaveWorkflow = (workflow) => {
    const workflowData = { nodes, edges, name: workflow.name };
    localStorage.setItem(`workflow_${workflow.id}`, JSON.stringify(workflowData));
    alert(`워크플로우 '${workflow.name}'이 저장되었습니다.`);
  };

  const onLoadWorkflow = (workflow) => {
    const saved = localStorage.getItem(`workflow_${workflow.id}`);
    if (saved) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
      setNodes(savedNodes || []);
      setEdges(savedEdges || []);
      setCurrentWorkflowId(workflow.id); // 현재 워크플로우 ID 설정
      alert(`워크플로우 '${workflow.name}'을 불러왔습니다.`);
    }
  };

  const deleteNode = useCallback((nodeIdToDelete) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
    ));
  }, [setNodes, setEdges]);

  const createNewNode = useCallback((type, position) => {
    const baseData = {
      inputBlock: { content: '', onDelete: deleteNode },
      aiAgentBlock: { 
        systemPrompt: '', 
        userPrompt: '', 
        model: 'gpt-4o', 
        provider: 'openai',
        apiKey: '', 
        temperature: 0.7,
        onDelete: deleteNode 
      },
      notionBlock: { pageTitle: '', action: 'create_page', onDelete: deleteNode },
      conditionBlock: { conditionType: 'contains', condition: '', onDelete: deleteNode },
      scheduleBlock: { scheduleType: 'interval', cronExpression: '0 9 * * *', interval: 60, onDelete: deleteNode },
    };

    return {
      id: `${nodeId}`,
      type,
      position,
      data: baseData[type] || {},
    };
  }, [nodeId, deleteNode]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode = createNewNode(type, position);
      setNodes((nds) => nds.concat(newNode));
      setNodeId((id) => id + 1);
    },
    [createNewNode, setNodes]
  );

  const onAddBlock = (blockType) => {
    const position = { x: 300 + Math.random() * 200, y: 100 + Math.random() * 200 };
    const newNode = createNewNode(blockType, position);
    setNodes((nds) => nds.concat(newNode));
    setNodeId((id) => id + 1);
  };

  const executeWorkflow = async () => {
    console.log('워크플로우 실행 시작');
    
    // 입력 블록 확인
    const inputNodes = nodes.filter(node => node.type === 'inputBlock');
    if (inputNodes.length === 0) {
      alert('입력 블록이 필요합니다.');
      return;
    }

    const hasEmptyInput = inputNodes.some(node => !node.data.content?.trim());
    if (hasEmptyInput) {
      alert('모든 입력 블록에 데이터를 입력해주세요.');
      return;
    }

    try {
      // 워크플로우 실행 엔진 생성
      const executor = new WorkflowExecutor(nodes, edges);
      
      // 실행 시작
      const results = await executor.executeWorkflow();
      
      console.log('실행 결과:', results);
      
      // 결과 표시
      let resultMessage = '워크플로우 실행 완료!\n\n';
      results.forEach((result, nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        resultMessage += `${node?.type || nodeId}: ${result}\n`;
      });
      
      alert(resultMessage);
      
    } catch (error) {
      console.error('워크플로우 실행 오류:', error);
      alert(`워크플로우 실행 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 키보드 이벤트 처리
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedNodes();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedNodes]);

  return (
    <div className="workflow-container">
      <div className={`sidebar-container ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-toggle-header">
          <div className="header-controls">
            <div className="auto-save-toggle">
              <label>
                <input 
                  type="checkbox" 
                  checked={autoSaveEnabled} 
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                />
                <span>자동 저장</span>
              </label>
            </div>
            <button className="sidebar-toggle-btn-top" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <ChevronLeft size={16} className={!sidebarOpen ? 'rotated' : ''} />
            </button>
          </div>
        </div>
        {sidebarOpen && (
          <>
            <WorkflowSidebar 
              onSaveWorkflow={onSaveWorkflow}
              onLoadWorkflow={onLoadWorkflow}
            />
            <BlockSidebar 
              onAddBlock={onAddBlock} 
              isOpen={sidebarOpen} 
              onToggle={() => setSidebarOpen(!sidebarOpen)} 
            />
          </>
        )}
      </div>
      <div className="workflow-main" ref={reactFlowWrapper}>
        <div className="workflow-controls">
          <button onClick={executeWorkflow} className="execute-btn">
            워크플로우 실행
          </button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onSelectionChange={onSelectionChange}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

const WorkflowCanvas = () => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;