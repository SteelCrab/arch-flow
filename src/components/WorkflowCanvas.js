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
import ApiService from '../services/api';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 수동 저장 함수
  const saveWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('저장할 워크플로우가 없습니다.');
      return;
    }

    const workflowId = currentWorkflowId || `workflow_${Date.now()}`;
    
    // 기존 워크플로우 정보 가져오기
    let existingName = null;
    if (currentWorkflowId) {
      try {
        const existing = await ApiService.getWorkflow(currentWorkflowId);
        existingName = existing?.name;
      } catch (error) {
        console.warn('기존 워크플로우 정보 조회 실패:', error);
      }
    }
    
    const workflowData = {
      id: workflowId,
      name: existingName || (currentWorkflowId ? `워크플로우 ${workflowId}` : `새 워크플로우 ${new Date().toLocaleTimeString()}`),
      nodes,
      edges,
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentWorkflowId) {
        // 기존 워크플로우 업데이트 (이름 유지)
        await ApiService.updateWorkflow(workflowId, {
          nodes,
          edges,
          updatedAt: workflowData.updatedAt
        });
      } else {
        // 새 워크플로우 저장
        await ApiService.saveWorkflow(workflowData);
        setCurrentWorkflowId(workflowId);
      }
      
      setHasUnsavedChanges(false);
      console.log('워크플로우 저장 완료:', workflowData.name);
      alert('워크플로우가 저장되었습니다!');
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
      // 백엔드 실패 시 로컬 스토리지에 백업
      try {
        localStorage.setItem(`workflow_${workflowId}`, JSON.stringify(workflowData));
        
        const savedWorkflows = JSON.parse(localStorage.getItem('arch_flow_workflows') || '[]');
        const existingIndex = savedWorkflows.findIndex(w => w.id === workflowId);
        
        if (existingIndex >= 0) {
          // 기존 워크플로우는 이름 유지
          savedWorkflows[existingIndex] = {
            ...savedWorkflows[existingIndex],
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
        
        setHasUnsavedChanges(false);
        console.log('로컬 백업 저장 완료:', workflowData.name);
        alert('워크플로우가 로컬에 저장되었습니다!');
      } catch (localError) {
        console.error('로컬 백업 저장 실패:', localError);
        alert('워크플로우 저장에 실패했습니다.');
      }
    }
  }, [nodes, edges, currentWorkflowId]);

  // nodes나 edges가 변경될 때마다 변경사항 추적
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges]);

  // Cmd+S (Mac) / Ctrl+S (Windows) 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        saveWorkflow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveWorkflow]);

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

  const onSaveWorkflow = async (workflow) => {
    const workflowData = { 
      ...workflow,
      nodes, 
      edges, 
      name: workflow.name,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await ApiService.saveWorkflow(workflowData);
      setCurrentWorkflowId(workflow.id);
      setHasUnsavedChanges(false);
      console.log('새 워크플로우 저장 완료:', workflowData.name);
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
      // 로컬 스토리지에 백업
      localStorage.setItem(`workflow_${workflowData.id}`, JSON.stringify(workflowData));
      
      const savedWorkflows = JSON.parse(localStorage.getItem('arch_flow_workflows') || '[]');
      savedWorkflows.push({
        id: workflowData.id,
        name: workflowData.name,
        type: 'file',
        createdAt: workflowData.updatedAt,
        updatedAt: workflowData.updatedAt
      });
      localStorage.setItem('arch_flow_workflows', JSON.stringify(savedWorkflows));
      
      setCurrentWorkflowId(workflowData.id);
      setHasUnsavedChanges(false);
      console.log('로컬 백업 저장 완료:', workflowData.name);
    }
  };

  const onLoadWorkflow = async (workflow) => {
    try {
      const workflowData = await ApiService.getWorkflow(workflow.id);
      if (workflowData) {
        const { nodes: savedNodes, edges: savedEdges } = workflowData;
        setNodes(savedNodes || []);
        setEdges(savedEdges || []);
        setCurrentWorkflowId(workflow.id);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('워크플로우 불러오기 실패:', error);
    }
  };

  const deleteNode = useCallback((nodeIdToDelete) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
    ));
  }, [setNodes, setEdges]);

  // 기존 노드들에 onDelete 함수 추가
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: deleteNode
        }
      }))
    );
  }, [deleteNode]);

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
            <div className="current-workflow-info">
              {currentWorkflowId && (
                <div className="workflow-status">
                  <span className="workflow-indicator">📄</span>
                  <span className="workflow-text">
                    워크플로우 편집 중
                    {hasUnsavedChanges && <span className="unsaved-indicator"> *</span>}
                  </span>
                </div>
              )}
            </div>
            <div className="header-actions">
              <button 
                className="save-btn"
                onClick={saveWorkflow}
                disabled={!hasUnsavedChanges}
                title="Cmd+S로도 저장 가능"
              >
                💾 저장
              </button>
              <button className="sidebar-toggle-btn-top" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <ChevronLeft size={16} className={!sidebarOpen ? 'rotated' : ''} />
              </button>
            </div>
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