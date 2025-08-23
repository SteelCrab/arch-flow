import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split, X } from 'lucide-react';

const ConditionBlock = ({ data, isConnectable, id }) => {
  const [condition, setCondition] = useState(data.condition || '');
  const [conditionType, setConditionType] = useState(data.conditionType || 'contains');

  const handleConditionChange = (e) => {
    setCondition(e.target.value);
    data.onConditionChange && data.onConditionChange(e.target.value);
  };

  const handleConditionTypeChange = (e) => {
    setConditionType(e.target.value);
    data.onConditionTypeChange && data.onConditionTypeChange(e.target.value);
  };

  const getPlaceholder = () => {
    switch (conditionType) {
      case 'contains': return '키워드 입력 (예: 개)';
      case 'length': return '숫자 입력 (예: 100)';
      case 'equals': return '정확한 값 (예: 완료)';
      case 'number': return '숫자 (예: 50)';
      case 'starts': return '시작 문자 (예: 안녕)';
      default: return '조건 값 입력';
    }
  };

  return (
    <div className="condition-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
      >
        <X size={12} />
      </button>
      <div className="block-header">
        <Split size={16} />
        <span>조건</span>
      </div>
      <div className="block-content">
        <select value={conditionType} onChange={handleConditionTypeChange}>
          <option value="contains">포함 (contains)</option>
          <option value="equals">같음 (equals)</option>
          <option value="length">길이 비교 (length &gt;)</option>
          <option value="number">숫자 비교 (&gt;)</option>
          <option value="starts">시작 문자 (starts with)</option>
          <option value="empty">비어있음 (is empty)</option>
        </select>
        {conditionType !== 'empty' && (
          <input
            type="text"
            value={condition}
            onChange={handleConditionChange}
            placeholder={getPlaceholder()}
          />
        )}
        <div className="condition-info">
          <small>True → 상단, False → 하단</small>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '70%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ConditionBlock;