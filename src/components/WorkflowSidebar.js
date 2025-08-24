import React, { useState, useEffect } from 'react';
import { File, Save, FolderPlus, Trash2, Edit2, Check, X, Plus, RefreshCw, Clock, Layers } from 'lucide-react';
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
    <div className="workflow-sidebar-container">
      {/* 헤더 */}
      <div className="workflow-sidebar-header">
        <div className="sidebar-title">
          <h3>워크플로우</h3>
          <div className="connection-status">
            <div className={`status-dot ${backendConnected ? 'connected' : 'disconnected'}`} />
            <span className="status-text">
              {backendConnected ? '연결됨' : '오프라인'}
            </span>
          </div>
        </div>
        <button
          onClick={loadWorkflows}
          className="refresh-btn"
          title="새로고침"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      {/* 현재 워크플로우 정보 */}
      {currentWorkflowName && (
        <div className="current-workflow-card">
          <div className="current-workflow-info">
            <div className="workflow-icon">
              <File size={16} />
            </div>
            <div className="workflow-details">
              <div className="workflow-name">{currentWorkflowName}</div>
              <div className="workflow-status">현재 작업 중</div>
            </div>
          </div>
          <button
            onClick={handleSaveCurrent}
            className={`save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
            disabled={!hasUnsavedChanges}
            title={hasUnsavedChanges ? '변경사항 저장' : '저장할 변경사항 없음'}
          >
            <Save size={14} />
          </button>
        </div>
      )}

      {/* 새 워크플로우 생성 */}
      <div className="new-workflow-section">
        <div className="input-group">
          <input
            type="text"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            placeholder="새 워크플로우 이름"
            className="workflow-name-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSaveNew()}
          />
          <button
            onClick={handleSaveNew}
            className="create-btn"
            disabled={!newWorkflowName.trim()}
            title="새 워크플로우 생성"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* 워크플로우 목록 */}
      <div className="workflow-list-section">
        <div className="section-header">
          <span>저장된 워크플로우</span>
          <span className="workflow-count">{workflows.length}</span>
        </div>
        
        <div className="workflow-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>로딩 중...</span>
            </div>
          ) : workflows.length === 0 ? (
            <div className="empty-state">
              <File size={24} className="empty-icon" />
              <span>저장된 워크플로우가 없습니다</span>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`workflow-item ${currentWorkflowId === workflow.id ? 'active' : ''}`}
              >
                {editingId === workflow.id ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="edit-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleEditWorkflow(workflow.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleEditWorkflow(workflow.id)}
                        className="confirm-btn"
                        title="확인"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="cancel-btn"
                        title="취소"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="workflow-content"
                    onClick={() => handleLoadWorkflow(workflow)}
                  >
                    <div className="workflow-main-info">
                      <div className="workflow-header-info">
                        <File size={14} className="file-icon" />
                        <span className="workflow-title">{workflow.name}</span>
                      </div>
                      <div className="workflow-meta">
                        <div className="meta-item">
                          <Clock size={10} />
                          <span>{formatDate(workflow.updatedAt || workflow.createdAt)}</span>
                        </div>
                        {workflow.nodes && (
                          <div className="meta-item">
                            <Layers size={10} />
                            <span>{workflow.nodes.length}개 블록</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="workflow-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(workflow);
                        }}
                        className="action-btn edit-btn"
                        title="이름 변경"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id, workflow.name);
                        }}
                        className="action-btn delete-btn"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 새 워크플로우 버튼 */}
      <div className="sidebar-footer">
        <button
          onClick={onNew}
          className="new-workflow-btn"
          title="새 워크플로우"
        >
          <FolderPlus size={16} />
          <span>새 워크플로우</span>
        </button>
      </div>
    </div>
  );
};

export default WorkflowSidebar;
