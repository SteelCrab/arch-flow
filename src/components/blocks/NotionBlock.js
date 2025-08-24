import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, ExternalLink, X } from 'lucide-react';

const NotionBlock = ({ data, isConnectable, id }) => {
  const [pageTitle, setPageTitle] = useState(data.pageTitle || '');
  const [databaseId, setDatabaseId] = useState(data.databaseId || '');
  const [action, setAction] = useState(data.action || 'create_page');
  const [isSaving] = useState(false);

  // 데이터가 외부에서 변경될 때 상태 업데이트
  useEffect(() => {
    if (data.pageTitle !== undefined) setPageTitle(data.pageTitle);
    if (data.databaseId !== undefined) setDatabaseId(data.databaseId);
    if (data.action !== undefined) setAction(data.action);
  }, [data]);

  const updateData = (updates) => {
    if (data.onChange) {
      data.onChange(updates);
    }
  };

  // 키보드 이벤트가 상위로 전파되지 않도록 방지
  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  const handleFocus = (e) => {
    e.stopPropagation();
  };

  const handleBlur = (e) => {
    e.stopPropagation();
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setPageTitle(value);
    updateData({ pageTitle: value });
  };

  const handleDatabaseIdChange = (e) => {
    const value = e.target.value;
    setDatabaseId(value);
    updateData({ databaseId: value });
  };

  const handleActionChange = (e) => {
    const value = e.target.value;
    setAction(value);
    updateData({ action: value });
  };

  return (
    <div className="notion-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
        title="블록 삭제"
      >
        <X size={12} />
      </button>
      
      <div className="block-header">
        <BookOpen size={16} />
        <span>Notion 저장</span>
        {isSaving && <div className="spinner" />}
      </div>
      
      <div className="block-content">
        <div className="form-group">
          <label>작업 유형</label>
          <select 
            value={action} 
            onChange={handleActionChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="create_page">페이지 생성</option>
            <option value="add_to_db">DB에 추가</option>
            <option value="update_page">페이지 업데이트</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>페이지 제목</label>
          <input
            type="text"
            value={pageTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="페이지 제목을 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>Database ID (선택사항)</label>
          <input
            type="text"
            value={databaseId}
            onChange={handleDatabaseIdChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Notion Database ID"
          />
          <small>데이터베이스에 추가할 때만 필요</small>
        </div>
        
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
