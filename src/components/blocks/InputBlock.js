import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, X } from 'lucide-react';

const InputBlock = ({ data, isConnectable, id }) => {
  const [inputValue, setInputValue] = useState(data.content || '');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    data.onChange && data.onChange(e.target.value);
  };

  return (
    <div className="input-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
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