import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, X, Play, CheckCircle, AlertCircle } from 'lucide-react';

const ConditionBlock = ({ data, isConnectable, id }) => {
  const [condition, setCondition] = useState(data.condition || '');
  const [operator, setOperator] = useState(data.operator || 'contains');
  const [value, setValue] = useState(data.value || '');
  const [trueAction, setTrueAction] = useState(data.trueAction || '');
  const [falseAction, setFalseAction] = useState(data.falseAction || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle');

  useEffect(() => {
    if (data.onChange) {
      data.onChange({
        condition,
        operator,
        value,
        trueAction,
        falseAction
      });
    }
  }, [condition, operator, value, trueAction, falseAction, data]);

  const handleConditionChange = (e) => {
    setCondition(e.target.value);
  };

  const handleOperatorChange = (e) => {
    setOperator(e.target.value);
  };

  const handleValueChange = (e) => {
    setValue(e.target.value);
  };

  const handleTrueActionChange = (e) => {
    setTrueAction(e.target.value);
  };

  const handleFalseActionChange = (e) => {
    setFalseAction(e.target.value);
  };

  // 조건 평가 함수
  const evaluateCondition = (inputText, condition, operator, value) => {
    const text = inputText.toLowerCase();
    const conditionValue = value.toLowerCase();
    
    switch (operator) {
      case 'contains':
        return text.includes(conditionValue);
      case 'equals':
        return text === conditionValue;
      case 'startsWith':
        return text.startsWith(conditionValue);
      case 'endsWith':
        return text.endsWith(conditionValue);
      case 'length_gt':
        return text.length > parseInt(conditionValue);
      case 'length_lt':
        return text.length < parseInt(conditionValue);
      case 'regex':
        try {
          const regex = new RegExp(conditionValue, 'i');
          return regex.test(text);
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  // 테스트 실행
  const handleTestExecution = async () => {
    if (!condition.trim() || !value.trim()) {
      alert('조건과 값을 모두 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setExecutionStatus('running');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 테스트용 입력 데이터
      const testInput = condition;
      const result = evaluateCondition(testInput, condition, operator, value);
      const selectedAction = result ? trueAction : falseAction;
      
      setLastResult({
        success: true,
        condition: condition,
        operator: operator,
        value: value,
        result: result,
        selectedAction: selectedAction,
        testInput: testInput,
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
        return <GitBranch size={16} />;
    }
  };

  const getOperatorLabel = (op) => {
    const labels = {
      contains: '포함',
      equals: '일치',
      startsWith: '시작',
      endsWith: '끝',
      length_gt: '길이 >',
      length_lt: '길이 <',
      regex: '정규식'
    };
    return labels[op] || op;
  };

  return (
    <div className="condition-block">
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
        <span className="block-title">조건 분기</span>
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
        {/* 조건 입력 */}
        <div className="form-group">
          <label>조건 (테스트용 입력):</label>
          <input
            type="text"
            value={condition}
            onChange={handleConditionChange}
            placeholder="테스트할 텍스트를 입력하세요..."
          />
        </div>

        {/* 연산자 선택 */}
        <div className="form-group">
          <label>연산자:</label>
          <select value={operator} onChange={handleOperatorChange}>
            <option value="contains">포함 (contains)</option>
            <option value="equals">일치 (equals)</option>
            <option value="startsWith">시작 (starts with)</option>
            <option value="endsWith">끝 (ends with)</option>
            <option value="length_gt">길이 초과 (length &gt;)</option>
            <option value="length_lt">길이 미만 (length &lt;)</option>
            <option value="regex">정규식 (regex)</option>
          </select>
        </div>

        {/* 비교 값 */}
        <div className="form-group">
          <label>비교 값:</label>
          <input
            type="text"
            value={value}
            onChange={handleValueChange}
            placeholder="비교할 값을 입력하세요..."
          />
        </div>

        {/* True 액션 */}
        <div className="form-group">
          <label>조건이 참일 때 액션:</label>
          <input
            type="text"
            value={trueAction}
            onChange={handleTrueActionChange}
            placeholder="참일 때 실행할 액션..."
          />
        </div>

        {/* False 액션 */}
        <div className="form-group">
          <label>조건이 거짓일 때 액션:</label>
          <input
            type="text"
            value={falseAction}
            onChange={handleFalseActionChange}
            placeholder="거짓일 때 실행할 액션..."
          />
        </div>

        {/* 테스트 버튼 */}
        <button 
          className="test-btn"
          onClick={handleTestExecution}
          disabled={isProcessing}
        >
          <Play size={14} />
          {isProcessing ? '조건 평가 중...' : '테스트 실행'}
        </button>

        {/* 실행 결과 */}
        {lastResult && (
          <div className={`result-display ${lastResult.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <strong>조건 평가 결과:</strong>
              <span className="timestamp">
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="result-content">
              {lastResult.success ? (
                <div>
                  <p><strong>입력:</strong> "{lastResult.testInput}"</p>
                  <p><strong>조건:</strong> {getOperatorLabel(lastResult.operator)} "{lastResult.value}"</p>
                  <p><strong>결과:</strong> 
                    <span className={lastResult.result ? 'text-green-600' : 'text-red-600'}>
                      {lastResult.result ? ' ✅ 참 (True)' : ' ❌ 거짓 (False)'}
                    </span>
                  </p>
                  <p><strong>선택된 액션:</strong> {lastResult.selectedAction}</p>
                </div>
              ) : (
                <span className="error-text">❌ {lastResult.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* True/False 출력 핸들 */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '60%' }}
        isConnectable={isConnectable}
        className="handle-right handle-true"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '80%' }}
        isConnectable={isConnectable}
        className="handle-right handle-false"
      />
      
      <div className="condition-labels">
        <span className="true-label">True</span>
        <span className="false-label">False</span>
      </div>
    </div>
  );
};

export default ConditionBlock;
