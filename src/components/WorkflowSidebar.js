import React, { useState } from 'react';
import { File, Save, FolderPlus } from 'lucide-react';

const WorkflowSidebar = ({ onSaveWorkflow, onLoadWorkflow }) => {
  const [workflows, setWorkflows] = useState([
    { id: 1, name: '고객 문의 자동 응답', type: 'file' },
    { id: 2, name: '콘텐츠 생성 파이프라인', type: 'file' },
    { id: 3, name: '데이터 분석 워크플로우', type: 'file' }
  ]);
  const [newWorkflowName, setNewWorkflowName] = useState('');

  const handleSave = () => {
    if (newWorkflowName.trim()) {
      const newWorkflow = {
        id: Date.now(),
        name: newWorkflowName,
        type: 'file'
      };
      setWorkflows([...workflows, newWorkflow]);
      setNewWorkflowName('');
      onSaveWorkflow && onSaveWorkflow(newWorkflow);
    }
  };

  return (
    <div className="workflow-sidebar">
      <div className="workflow-header">
        <h4>나의 워크플로우</h4>
        <button className="new-folder-btn">
          <FolderPlus size={14} />
        </button>
      </div>
      
      <div className="save-section">
        <input
          type="text"
          value={newWorkflowName}
          onChange={(e) => setNewWorkflowName(e.target.value)}
          placeholder="워크플로우 이름"
          className="workflow-name-input"
        />
        <button onClick={handleSave} className="save-btn">
          <Save size={14} />
        </button>
      </div>

      <div className="workflow-list">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="workflow-item"
            onClick={() => onLoadWorkflow && onLoadWorkflow(workflow)}
          >
            <File size={16} />
            <span>{workflow.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowSidebar;