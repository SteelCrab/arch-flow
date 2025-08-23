import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, X } from 'lucide-react';

const ScheduleBlock = ({ data, isConnectable, id }) => {
  const [scheduleType, setScheduleType] = useState(data.scheduleType || 'interval');
  const [cronExpression, setCronExpression] = useState(data.cronExpression || '0 9 * * *');
  const [interval, setInterval] = useState(data.interval || 60);

  const handleScheduleTypeChange = (e) => {
    setScheduleType(e.target.value);
    data.onScheduleTypeChange && data.onScheduleTypeChange(e.target.value);
  };

  const handleCronChange = (e) => {
    setCronExpression(e.target.value);
    data.onCronChange && data.onCronChange(e.target.value);
  };

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
    data.onIntervalChange && data.onIntervalChange(e.target.value);
  };

  return (
    <div className="schedule-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
      >
        <X size={12} />
      </button>
      <div className="block-header">
        <Clock size={16} />
        <span>스케줄</span>
      </div>
      <div className="block-content">
        <select value={scheduleType} onChange={handleScheduleTypeChange}>
          <option value="interval">반복 간격</option>
          <option value="cron">Cron 표현식</option>
          <option value="daily">매일</option>
          <option value="weekly">매주</option>
        </select>
        {scheduleType === 'cron' && (
          <input
            type="text"
            value={cronExpression}
            onChange={handleCronChange}
            placeholder="0 9 * * * (매일 오전 9시)"
          />
        )}
        {scheduleType === 'interval' && (
          <div>
            <input
              type="number"
              value={interval}
              onChange={handleIntervalChange}
              min="1"
            />
            <span> 분마다</span>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ScheduleBlock;