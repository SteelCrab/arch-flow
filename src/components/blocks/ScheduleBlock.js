import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, X, Play, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const ScheduleBlock = ({ data, isConnectable, id }) => {
  const [scheduleType, setScheduleType] = useState(data.scheduleType || 'interval');
  const [interval, setInterval] = useState(data.interval || 60);
  const [cronExpression, setCronExpression] = useState(data.cronExpression || '0 9 * * *');
  const [timezone, setTimezone] = useState(data.timezone || 'Asia/Seoul');
  const [isActive, setIsActive] = useState(data.isActive || false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle');

  useEffect(() => {
    if (data.onChange) {
      data.onChange({
        scheduleType,
        interval,
        cronExpression,
        timezone,
        isActive
      });
    }
  }, [scheduleType, interval, cronExpression, timezone, isActive, data]);

  const handleScheduleTypeChange = (e) => {
    setScheduleType(e.target.value);
  };

  const handleIntervalChange = (e) => {
    setInterval(parseInt(e.target.value));
  };

  const handleCronExpressionChange = (e) => {
    setCronExpression(e.target.value);
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
  };

  const handleActiveToggle = (e) => {
    setIsActive(e.target.checked);
  };

  // 다음 실행 시간 계산
  const calculateNextExecution = () => {
    const now = new Date();
    
    if (scheduleType === 'interval') {
      return new Date(now.getTime() + interval * 60000);
    }
    
    if (scheduleType === 'cron') {
      // 간단한 cron 파싱 (실제로는 cron-parser 라이브러리 사용)
      const parts = cronExpression.split(' ');
      if (parts.length >= 5) {
        const hour = parseInt(parts[1]) || 9;
        const nextExecution = new Date(now);
        nextExecution.setHours(hour, 0, 0, 0);
        
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        
        return nextExecution;
      }
    }
    
    return new Date(now.getTime() + 3600000); // 1시간 후
  };

  // 스케줄 설명 생성
  const getScheduleDescription = () => {
    if (scheduleType === 'interval') {
      const hours = Math.floor(interval / 60);
      const minutes = interval % 60;
      
      if (hours > 0 && minutes > 0) {
        return `${hours}시간 ${minutes}분마다 실행`;
      } else if (hours > 0) {
        return `${hours}시간마다 실행`;
      } else {
        return `${minutes}분마다 실행`;
      }
    }
    
    if (scheduleType === 'cron') {
      // 간단한 cron 설명
      const parts = cronExpression.split(' ');
      if (parts.length >= 5) {
        const minute = parts[0];
        const hour = parts[1];
        const day = parts[2];
        const month = parts[3];
        const weekday = parts[4];
        
        if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
          return `매일 ${hour}시에 실행`;
        }
      }
      return `Cron 표현식: ${cronExpression}`;
    }
    
    return '스케줄 설정 없음';
  };

  // 테스트 실행
  const handleTestExecution = async () => {
    setIsProcessing(true);
    setExecutionStatus('running');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const nextExecution = calculateNextExecution();
      const description = getScheduleDescription();
      
      setLastResult({
        success: true,
        scheduleType: scheduleType,
        description: description,
        nextExecution: nextExecution.toLocaleString('ko-KR', { timeZone: timezone }),
        timezone: timezone,
        isActive: isActive,
        timestamp: new Date().toISOString()
      });
      setExecutionStatus('success');
      
    } catch (error) {
      setLastResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      setExecutionStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (executionStatus) {
      case 'running':
        return <div className="animate-spin">⚡</div>;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} />;
    }
  };

  const getCommonCronExpressions = () => [
    { value: '0 9 * * *', label: '매일 오전 9시' },
    { value: '0 18 * * *', label: '매일 오후 6시' },
    { value: '0 9 * * 1', label: '매주 월요일 오전 9시' },
    { value: '0 9 1 * *', label: '매월 1일 오전 9시' },
    { value: '*/30 * * * *', label: '30분마다' },
    { value: '0 */2 * * *', label: '2시간마다' }
  ];

  return (
    <div className="schedule-block">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="handle-left"
      />
      
      <div className="block-header">
        <div className="block-icon">
          {getStatusIcon()}
        </div>
        <span className="block-title">스케줄러</span>
        {data.onDelete && (
          <button 
            className="delete-btn"
            onClick={() => data.onDelete(id)}
            title="블록 삭제"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="block-content">
        {/* 스케줄 타입 선택 */}
        <div className="form-group">
          <label>스케줄 타입:</label>
          <select value={scheduleType} onChange={handleScheduleTypeChange}>
            <option value="interval">간격 (Interval)</option>
            <option value="cron">Cron 표현식</option>
            <option value="once">한 번만 실행</option>
          </select>
        </div>

        {/* 간격 설정 */}
        {scheduleType === 'interval' && (
          <div className="form-group">
            <label>실행 간격 (분):</label>
            <input
              type="number"
              value={interval}
              onChange={handleIntervalChange}
              min="1"
              max="10080"
              placeholder="60"
            />
            <small className="help-text">
              1분 ~ 7일 (10080분) 사이로 설정하세요.
            </small>
          </div>
        )}

        {/* Cron 표현식 설정 */}
        {scheduleType === 'cron' && (
          <div className="form-group">
            <label>Cron 표현식:</label>
            <input
              type="text"
              value={cronExpression}
              onChange={handleCronExpressionChange}
              placeholder="0 9 * * *"
            />
            <small className="help-text">
              형식: 분 시 일 월 요일 (예: 0 9 * * * = 매일 오전 9시)
            </small>
            
            {/* 자주 사용하는 Cron 표현식 */}
            <div className="cron-presets">
              <label>자주 사용하는 설정:</label>
              <select 
                onChange={(e) => setCronExpression(e.target.value)}
                value=""
              >
                <option value="">선택하세요...</option>
                {getCommonCronExpressions().map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 타임존 설정 */}
        <div className="form-group">
          <label>타임존:</label>
          <select value={timezone} onChange={handleTimezoneChange}>
            <option value="Asia/Seoul">한국 표준시 (KST)</option>
            <option value="UTC">협정 세계시 (UTC)</option>
            <option value="America/New_York">미국 동부 (EST)</option>
            <option value="America/Los_Angeles">미국 서부 (PST)</option>
            <option value="Europe/London">영국 (GMT)</option>
            <option value="Asia/Tokyo">일본 (JST)</option>
          </select>
        </div>

        {/* 활성화 토글 */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isActive}
              onChange={handleActiveToggle}
            />
            <span>스케줄 활성화</span>
          </label>
        </div>

        {/* 스케줄 설명 */}
        <div className="schedule-info">
          <Calendar size={14} />
          <span>{getScheduleDescription()}</span>
        </div>

        {/* 테스트 버튼 */}
        <button 
          className="test-btn"
          onClick={handleTestExecution}
          disabled={isProcessing}
        >
          <Play size={14} />
          {isProcessing ? '스케줄 계산 중...' : '테스트 실행'}
        </button>

        {/* 실행 결과 */}
        {lastResult && (
          <div className={`result-display ${lastResult.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <strong>스케줄 정보:</strong>
              <span className="timestamp">
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="result-content">
              {lastResult.success ? (
                <div>
                  <p><strong>타입:</strong> {lastResult.scheduleType}</p>
                  <p><strong>설명:</strong> {lastResult.description}</p>
                  <p><strong>다음 실행:</strong> {lastResult.nextExecution}</p>
                  <p><strong>타임존:</strong> {lastResult.timezone}</p>
                  <p><strong>상태:</strong> 
                    <span className={lastResult.isActive ? 'text-green-600' : 'text-red-600'}>
                      {lastResult.isActive ? ' ✅ 활성화' : ' ❌ 비활성화'}
                    </span>
                  </p>
                </div>
              ) : (
                <span className="error-text">❌ {lastResult.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="handle-right"
      />
    </div>
  );
};

export default ScheduleBlock;
