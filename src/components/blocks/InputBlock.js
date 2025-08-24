import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, X } from 'lucide-react';

const InputBlock = ({ data, isConnectable, id }) => {
  const [inputValue, setInputValue] = useState(data.content || '');

  // 데이터가 외부에서 변경될 때 상태 업데이트
  useEffect(() => {
    if (data.content !== undefined && data.content !== inputValue) {
      setInputValue(data.content);
    }
  }, [data.content]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // 부모 컴포넌트에 변경사항 알림
    if (data.onChange) {
      data.onChange({ content: newValue });
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

  return (
    <div className="input-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
        title="블록 삭제"
      >
        <X size={12} />
      </button>
      
      <div className="block-header">
        <FileText size={16} />
        <span>입력</span>
      </div>
      
      <div className="block-content">
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="텍스트를 입력하세요..."
          rows={3}
        />
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default InputBlock;
