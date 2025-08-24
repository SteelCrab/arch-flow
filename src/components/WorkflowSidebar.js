import React, { useState, useEffect } from 'react';
import { File, Save, FolderPlus, Trash2, Edit2, Check, X, Plus, RefreshCw } from 'lucide-react';
import ApiService from '../services/api';

const WorkflowSidebar = ({ 
  onSave, 
  onLoad, 
  onNew, 
  hasUnsavedChanges, 
  currentWorkflowName, 
  currentWorkflowId 
}) => {
  const [workflows, setWorkflows] = useState([]);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // 컴포넌트 마운트 시 저장된 워크플로우 불러오기
  useEffect(() => {
    loadWorkflows();
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const connected = await ApiService.checkBackendHealth();
      setBackendConnected(connected);
    } catch (error) {
      console.warn('Backend connection check failed:', error);
      setBackendConnected(false);
    }
  };

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const workflowList = await ApiService.getWorkflows();
      console.log('Loaded workflows:', workflowList);
      setWorkflows(workflowList);
    } catch (error) {
      console.error('워크플로우 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNew = async () => {
    if (!newWorkflowName.trim()) {
      alert('워크플로우 이름을 입력해주세요.');
      return;
    }

    try {
      // 현재 워크플로우를 새 이름으로 저장
      const newWorkflow = {
        id: `wf_${Date.now()}`,
        name: newWorkflowName.trim(),
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ApiService.saveWorkflow(newWorkflow);
      setNewWorkflowName('');
      await loadWorkflows();
      
      // 새 워크플로우 생성
      if (onNew) {
        onNew();
      }
      
      alert(`새 워크플로우 "${newWorkflow.name}"가 생성되었습니다.`);
    } catch (error) {
      console.error('새 워크플로우 생성 실패:', error);
      alert(`생성 실패: ${error.message}`);
    }
  };

  const handleLoadWorkflow = async (workflow) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('저장되지 않은 변경사항이 있습니다. 다른 워크플로우를 불러오시겠습니까?');
      if (!confirmed) return;
    }

    try {
      console.log('Loading workflow from sidebar:', workflow);
      if (onLoad) {
        await onLoad(workflow.id);
      }
    } catch (error) {
      console.error('워크플로우 로드 실패:', error);
      alert(`로드 실패: ${error.message}`);
    }
  };

  const handleSaveCurrent = async () => {
    if (onSave) {
      await onSave();
      await loadWorkflows(); // 목록 새로고침
    }
  };

  const handleDeleteWorkflow = async (workflowId, workflowName) => {
    const confirmed = window.confirm(`"${workflowName}" 워크플로우를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await ApiService.deleteWorkflow(workflowId);
      await loadWorkflows();
      
      // 현재 열린 워크플로우가 삭제된 경우 새 워크플로우로 전환
      if (currentWorkflowId === workflowId && onNew) {
        onNew();
      }
      
      alert(`워크플로우 "${workflowName}"가 삭제되었습니다.`);
    } catch (error) {
      console.error('워크플로우 삭제 실패:', error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const handleEditWorkflow = async (workflowId) => {
    if (!editingName.trim()) {
      alert('워크플로우 이름을 입력해주세요.');
      return;
    }

    try {
      const workflow = await ApiService.getWorkflow(workflowId);
      if (workflow) {
        const updatedWorkflow = {
          ...workflow,
          name: editingName.trim(),
          updatedAt: new Date().toISOString()
        };
        
        await ApiService.updateWorkflow(workflowId, updatedWorkflow);
        await loadWorkflows();
        setEditingId(null);
        setEditingName('');
        alert('워크플로우 이름이 변경되었습니다.');
      }
    } catch (error) {
      console.error('워크플로우 이름 변경 실패:', error);
      alert(`이름 변경 실패: ${error.message}`);
    }
  };

  const startEditing = (workflow) => {
    setEditingId(workflow.id);
    setEditingName(workflow.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '날짜 없음';
    }
  };

  return (
    <div className="workflow-sidebar p-4 bg-white border-t border-gray-200">
      {/* 연결 상태 표시 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">워크플로우</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {backendConnected ? '연결됨' : '오프라인'}
          </span>
          <button
            onClick={loadWorkflows}
            className="p-1 hover:bg-gray-100 rounded"
            title="새로고침"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* 현재 워크플로우 정보 */}
      {currentWorkflowName && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">
                {currentWorkflowName}
              </div>
              <div className="text-xs text-blue-600">
                현재 워크플로우
              </div>
            </div>
            <button
              onClick={handleSaveCurrent}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              disabled={!hasUnsavedChanges}
            >
              <Save size={12} className="inline mr-1" />
              저장
            </button>
          </div>
        </div>
      )}

      {/* 새 워크플로우 생성 */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            placeholder="새 워크플로우 이름"
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
            onKeyPress={(e) => e.key === 'Enter' && handleSaveNew()}
          />
          <button
            onClick={handleSaveNew}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* 워크플로우 목록 */}
      <div className="workflow-list max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-gray-500">
            로딩 중...
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            저장된 워크플로우가 없습니다.
          </div>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`workflow-item p-2 mb-2 border rounded cursor-pointer hover:bg-gray-50 ${
                currentWorkflowId === workflow.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {editingId === workflow.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleEditWorkflow(workflow.id);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleEditWorkflow(workflow.id)}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div onClick={() => handleLoadWorkflow(workflow)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File size={14} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {workflow.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(workflow.updatedAt || workflow.createdAt)}
                        </div>
                        {workflow.nodes && (
                          <div className="text-xs text-gray-400">
                            {workflow.nodes.length}개 블록
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(workflow);
                        }}
                        className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id, workflow.name);
                        }}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 새 워크플로우 버튼 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onNew}
          className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          <FolderPlus size={14} />
          새 워크플로우
        </button>
      </div>
    </div>
  );
};

export default WorkflowSidebar;
