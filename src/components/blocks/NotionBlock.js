import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, ExternalLink, X } from 'lucide-react';

const NotionBlock = ({ data, isConnectable, id }) => {
  const [pageTitle, setPageTitle] = useState(data.pageTitle || '');
  const [databaseId, setDatabaseId] = useState(data.databaseId || '');
  const [action, setAction] = useState(data.action || 'create_page');
  const [isSaving] = useState(false);

  const handleTitleChange = (e) => {
    setPageTitle(e.target.value);
    data.onTitleChange && data.onTitleChange(e.target.value);
  };

  const handleDatabaseIdChange = (e) => {
    setDatabaseId(e.target.value);
    data.onDatabaseIdChange && data.onDatabaseIdChange(e.target.value);
  };

  const handleActionChange = (e) => {
    setAction(e.target.value);
    data.onActionChange && data.onActionChange(e.target.value);
  };

  return (
    <div className="notion-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
      >
        <X size={12} />
      </button>
      <div className="block-header">
        <BookOpen size={16} />
        <span>Notion 저장</span>
        {isSaving && <div className="spinner" />}
      </div>
      <div className="block-content">
        <div className="action-selector">
          <select value={action} onChange={handleActionChange}>
            <option value="create_page">페이지 생성</option>
            <option value="add_to_db">DB에 추가</option>
            <option value="update_page">페이지 업데이트</option>
          </select>
        </div>
        <input
          type="text"
          value={pageTitle}
          onChange={handleTitleChange}
          placeholder="페이지 제목"
        />
        <input
          type="text"
          value={databaseId}
          onChange={handleDatabaseIdChange}
          placeholder="Database ID (선택사항)"
        />
        {data.notionUrl && (
          <div className="notion-link">
            <ExternalLink size={14} />
            <a href={data.notionUrl} target="_blank" rel="noopener noreferrer">
              Notion에서 보기
            </a>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default NotionBlock;