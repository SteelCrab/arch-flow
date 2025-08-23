import React, { useState, useEffect } from 'react';
import { File, Save, FolderPlus, Trash2 } from 'lucide-react';

const WorkflowSidebar = ({ onSaveWorkflow, onLoadWorkflow }) => {
  const [workflows, setWorkflows] = useState([]);
  const [newWorkflowName, setNewWorkflowName] = useState('');

  // 컴포넌트 마운트 시 저장된 워크플로우 불러오기
  useEffect(() => {
    loadSavedWorkflows();
  }, []);

  const loadSavedWorkflows = () => {
    try {
      const savedWorkflows = localStorage.getItem('arch_flow_workflows');
      if (savedWorkflows) {
        const parsed = JSON.parse(savedWorkflows);
        setWorkflows(parsed);
      }
    } catch (error) {
      console.error('워크플로우 불러오기 실패:', error);
    }
  };

  const saveWorkflowsList = (updatedWorkflows) => {
    try {
      localStorage.setItem('arch_flow_workflows', JSON.stringify(updatedWorkflows));
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error('워크플로우 목록 저장 실패:', error);
      alert('워크플로우 저장에 실패했습니다.');
    }
  };

  const handleSave = () => {
    if (!newWorkflowName.trim()) {
      alert('워크플로우 이름을 입력해주세요.');
      return;
    }

    const newWorkflow = {
      id: Date.now(),
      name: newWorkflowName.trim(),
      type: 'file',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedWorkflows = [...workflows, newWorkflow];
    saveWorkflowsList(updatedWorkflows);
    setNewWorkflowName('');
    
    // 부모 컴포넌트에 저장 요청
    if (onSaveWorkflow) {
      onSaveWorkflow(newWorkflow);
    }

    alert(`워크플로우 '${newWorkflow.name}'이 저장되었습니다.`);
  };

  const handleLoad = (workflow) => {
    if (onLoadWorkflow) {
      onLoadWorkflow(workflow);
    }
  };

  const handleDelete = (workflowId, workflowName) => {
    if (window.confirm(`'${workflowName}' 워크플로우를 삭제하시겠습니까?`)) {
      const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
      saveWorkflowsList(updatedWorkflows);
      
      // 로컬 스토리지에서 워크플로우 데이터도 삭제
      try {
        localStorage.removeItem(`workflow_${workflowId}`);
      } catch (error) {
        console.error('워크플로우 데이터 삭제 실패:', error);
      }
      
      alert(`워크플로우 '${workflowName}'이 삭제되었습니다.`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="workflow-sidebar">
      <div className="workflow-header">
        <h4>나의 워크플로우</h4>
        <button className="new-folder-btn" title="새 폴더">
          <FolderPlus size={14} />
        </button>
      </div>
      
      {/* 새 워크플로우 저장 */}
      <div className="save-workflow-section">
        <div className="input-group">
          <input
            type="text"
            placeholder="워크플로우 이름 입력..."
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="workflow-name-input"
          />
          <button 
            onClick={handleSave}
            className="save-btn"
            title="현재 워크플로우 저장"
            disabled={!newWorkflowName.trim()}
          >
            <Save size={14} />
          </button>
        </div>
      </div>

      {/* 저장된 워크플로우 목록 */}
      <div className="workflow-list">
        {workflows.length === 0 ? (
          <div className="empty-state">
            <p>저장된 워크플로우가 없습니다.</p>
            <p>위에서 워크플로우를 저장해보세요!</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="workflow-item">
              <div 
                className="workflow-info"
                onClick={() => handleLoad(workflow)}
                title={`'${workflow.name}' 불러오기`}
              >
                <File size={14} />
                <span className="workflow-name">{workflow.name}</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(workflow.id, workflow.name);
                }}
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .save-workflow-section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        .workflow-name-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .workflow-name-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .save-btn {
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .save-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .save-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: #6b7280;
        }

        .empty-state p {
          margin: 8px 0;
          font-size: 14px;
        }

        .workflow-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .workflow-item:hover {
          background: #f8fafc;
          border-color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .workflow-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          color: #374151;
        }

        .workflow-name {
          font-size: 14px;
          font-weight: 500;
        }

        .delete-btn {
          background: none;
          border: none;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
          opacity: 0;
        }

        .workflow-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default WorkflowSidebar;
