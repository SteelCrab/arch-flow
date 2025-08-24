import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split, X, Play, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

const RouteBlock = ({ data, isConnectable, id }) => {
  const [routes, setRoutes] = useState(data.routes || { 'default': 'default' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle');

  useEffect(() => {
    if (data.onChange) {
      data.onChange({ routes });
    }
  }, [routes, data]);

  const handleRouteChange = (routeName, condition) => {
    setRoutes(prev => ({
      ...prev,
      [routeName]: condition
    }));
  };

  const addRoute = () => {
    const newRouteName = `route_${Object.keys(routes).length + 1}`;
    setRoutes(prev => ({
      ...prev,
      [newRouteName]: ''
    }));
  };

  const removeRoute = (routeName) => {
    if (routeName === 'default') return; // default 라우트는 삭제 불가
    
    setRoutes(prev => {
      const newRoutes = { ...prev };
      delete newRoutes[routeName];
      return newRoutes;
    });
  };

  // 테스트 실행
  const handleTestExecution = async () => {
    setIsProcessing(true);
    setExecutionStatus('running');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 테스트용 입력 데이터
      const testInput = 'This is a test input for routing';
      let selectedRoute = 'default';
      
      // 각 라우트 조건 확인
      for (const [routeName, condition] of Object.entries(routes)) {
        if (condition && testInput.toLowerCase().includes(condition.toLowerCase())) {
          selectedRoute = routeName;
          break;
        }
      }
      
      setLastResult({
        success: true,
        selectedRoute: selectedRoute,
        testInput: testInput,
        availableRoutes: Object.keys(routes),
        matchedCondition: routes[selectedRoute],
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
        return <Split size={16} />;
    }
  };

  return (
    <div className="route-block">
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
        <span className="block-title">라우터</span>
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
        {/* 라우트 설정 */}
        <div className="form-group">
          <label>라우트 설정:</label>
          {Object.entries(routes).map(([routeName, condition]) => (
            <div key={routeName} className="route-item">
              <input
                type="text"
                value={routeName}
                onChange={(e) => {
                  const newRouteName = e.target.value;
                  const newRoutes = { ...routes };
                  delete newRoutes[routeName];
                  newRoutes[newRouteName] = condition;
                  setRoutes(newRoutes);
                }}
                placeholder="라우트 이름"
                className="route-name"
                disabled={routeName === 'default'}
              />
              <input
                type="text"
                value={condition}
                onChange={(e) => handleRouteChange(routeName, e.target.value)}
                placeholder="조건 키워드"
                className="route-condition"
              />
              {routeName !== 'default' && (
                <button
                  onClick={() => removeRoute(routeName)}
                  className="remove-route-btn"
                  title="라우트 삭제"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          
          <button onClick={addRoute} className="add-route-btn">
            <Plus size={14} />
            라우트 추가
          </button>
        </div>

        {/* 테스트 버튼 */}
        <button 
          className="test-btn"
          onClick={handleTestExecution}
          disabled={isProcessing}
        >
          <Play size={14} />
          {isProcessing ? '라우팅 테스트 중...' : '테스트 실행'}
        </button>

        {/* 실행 결과 */}
        {lastResult && (
          <div className={`result-display ${lastResult.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <strong>라우팅 결과:</strong>
              <span className="timestamp">
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="result-content">
              {lastResult.success ? (
                <div>
                  <p><strong>테스트 입력:</strong> "{lastResult.testInput}"</p>
                  <p><strong>선택된 라우트:</strong> 
                    <span className="text-green-600"> {lastResult.selectedRoute}</span>
                  </p>
                  <p><strong>매칭 조건:</strong> "{lastResult.matchedCondition}"</p>
                  <p><strong>사용 가능한 라우트:</strong> {lastResult.availableRoutes.join(', ')}</p>
                </div>
              ) : (
                <span className="error-text">❌ {lastResult.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 동적 출력 핸들들 */}
      {Object.keys(routes).map((routeName, index) => (
        <Handle
          key={routeName}
          type="source"
          position={Position.Right}
          id={routeName}
          style={{ top: `${60 + index * 15}%` }}
          isConnectable={isConnectable}
          className="handle-right"
        />
      ))}
      
      <div className="route-labels">
        {Object.keys(routes).map((routeName, index) => (
          <span 
            key={routeName} 
            className="route-label"
            style={{ top: `${60 + index * 15}%` }}
          >
            {routeName}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RouteBlock;
