import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, X } from 'lucide-react';

const RouteBlock = ({ data, isConnectable, id }) => {
  const [routeType, setRouteType] = useState(data.routeType || 'parallel');
  const [condition, setCondition] = useState(data.condition || '');

  const handleRouteTypeChange = (e) => {
    setRouteType(e.target.value);
    data.onRouteTypeChange && data.onRouteTypeChange(e.target.value);
  };

  const handleConditionChange = (e) => {
    setCondition(e.target.value);
    data.onConditionChange && data.onConditionChange(e.target.value);
  };

  return (
    <div className="route-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
      >
        <X size={12} />
      </button>
      <div className="block-header">
        <GitBranch size={16} />
        <span>라우트</span>
      </div>
      <div className="block-content">
        <select value={routeType} onChange={handleRouteTypeChange}>
          <option value="parallel">병렬 실행</option>
          <option value="conditional">조건 분기</option>
          <option value="sequential">순차 실행</option>
        </select>
        {routeType === 'conditional' && (
          <textarea
            value={condition}
            onChange={handleConditionChange}
            placeholder="조건을 자연어로 설명하세요.\n예: '개' 또는 '강아지'가 포함되면 True, 그렇지 않으면 False"
            rows={3}
            className="condition-prompt"
          />
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output1"
        style={{ top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output2"
        style={{ top: '70%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default RouteBlock;