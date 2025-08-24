import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split, X, Play, CheckCircle, AlertCircle, Plus, Trash2, Brain, Zap, Settings } from 'lucide-react';

const RouteBlock = ({ data, isConnectable, id }) => {
  const [routingMode, setRoutingMode] = useState(data.routingMode || 'ai-smart');
  const [categories, setCategories] = useState(data.categories || ['긍정적', '부정적', '중립적']);
  const [customRules, setCustomRules] = useState(data.customRules || {});
  const [aiModel, setAiModel] = useState(data.aiModel || 'claude-3-haiku');
  const [confidence, setConfidence] = useState(data.confidence || 0.7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (data.onChange) {
      data.onChange({ 
        routingMode, 
        categories, 
        customRules, 
        aiModel, 
        confidence 
      });
    }
  }, [routingMode, categories, customRules, aiModel, confidence, data]);

  const handleRoutingModeChange = (e) => {
    setRoutingMode(e.target.value);
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const addCategory = () => {
    setCategories([...categories, `카테고리 ${categories.length + 1}`]);
  };

  const removeCategory = (index) => {
    if (categories.length <= 2) {
      alert('최소 2개의 카테고리가 필요합니다.');
      return;
    }
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
  };

  const handleRuleChange = (category, rule) => {
    setCustomRules(prev => ({
      ...prev,
      [category]: rule
    }));
  };

  const handleAiModelChange = (e) => {
    setAiModel(e.target.value);
  };

  const handleConfidenceChange = (e) => {
    setConfidence(parseFloat(e.target.value));
  };

  // AI 모델 옵션
  const getAiModels = () => [
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku (빠름)', cost: '저비용' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (균형)', cost: '중비용' },
    { value: 'titan-express', label: 'Titan Express (경제적)', cost: '최저비용' },
    { value: 'llama2-13b', label: 'Llama 2 13B (오픈소스)', cost: '저비용' }
  ];

  // 라우팅 모드별 설명
  const getRoutingModeDescription = () => {
    const descriptions = {
      'ai-smart': 'AI가 콘텐츠를 분석하여 자동으로 가장 적절한 카테고리를 선택합니다.',
      'keyword': '키워드 매칭을 통해 빠르고 정확한 분류를 수행합니다.',
      'hybrid': 'AI 분석과 키워드 매칭을 결합하여 최고의 정확도를 제공합니다.'
    };
    return descriptions[routingMode] || '';
  };

  // 테스트 실행
  const handleTestExecution = async () => {
    setIsProcessing(true);
    setExecutionStatus('running');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testInput = '이 제품은 정말 훌륭합니다! 강력히 추천합니다.';
      let selectedCategory = categories[0];
      let confidenceScore = confidence;
      let reasoning = '';

      if (routingMode === 'ai-smart') {
        // AI 기반 분류 시뮬레이션
        selectedCategory = '긍정적';
        confidenceScore = 0.92;
        reasoning = 'AI 분석 결과: "훌륭합니다", "강력히 추천" 등의 긍정적 표현을 감지했습니다.';
      } else if (routingMode === 'keyword') {
        // 키워드 기반 분류
        const rules = customRules[selectedCategory] || '';
        if (testInput.includes('훌륭') || testInput.includes('추천')) {
          selectedCategory = '긍정적';
          confidenceScore = 1.0;
          reasoning = '키워드 매칭: "훌륭", "추천" 키워드가 감지되었습니다.';
        }
      } else if (routingMode === 'hybrid') {
        // 하이브리드 분류
        selectedCategory = '긍정적';
        confidenceScore = 0.95;
        reasoning = '하이브리드 분석: AI 분석(92%)과 키워드 매칭(100%)을 결합한 결과입니다.';
      }
      
      setLastResult({
        success: true,
        testInput: testInput,
        selectedCategory: selectedCategory,
        confidence: confidenceScore,
        reasoning: reasoning,
        availableCategories: categories,
        routingMode: routingMode,
        aiModel: aiModel,
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
        return <div className="animate-spin"><Zap size={16} /></div>;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Brain size={16} />;
    }
  };

  const getModeIcon = () => {
    switch (routingMode) {
      case 'ai-smart':
        return <Brain size={14} className="text-purple-600" />;
      case 'keyword':
        return <Zap size={14} className="text-blue-600" />;
      case 'hybrid':
        return <Settings size={14} className="text-green-600" />;
      default:
        return <Split size={14} />;
    }
  };

  return (
    <div className="route-block smart-router">
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
        <span className="block-title">스마트 라우터</span>
        <div className="router-badge">
          {getModeIcon()}
        </div>
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
        {/* 라우팅 모드 선택 */}
        <div className="form-group">
          <label>라우팅 모드:</label>
          <select value={routingMode} onChange={handleRoutingModeChange} className="routing-mode-select">
            <option value="ai-smart">🧠 AI 스마트 분류</option>
            <option value="keyword">⚡ 키워드 매칭</option>
            <option value="hybrid">🔄 하이브리드 (AI + 키워드)</option>
          </select>
          <div className="mode-description">
            <small>{getRoutingModeDescription()}</small>
          </div>
        </div>

        {/* AI 모델 선택 (AI 모드일 때만) */}
        {(routingMode === 'ai-smart' || routingMode === 'hybrid') && (
          <div className="form-group">
            <label>AI 모델:</label>
            <select value={aiModel} onChange={handleAiModelChange} className="ai-model-select">
              {getAiModels().map(model => (
                <option key={model.value} value={model.value}>
                  {model.label} ({model.cost})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 카테고리 설정 */}
        <div className="form-group">
          <label>출력 카테고리:</label>
          {categories.map((category, index) => (
            <div key={index} className="category-item">
              <input
                type="text"
                value={category}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                placeholder="카테고리 이름"
                className="category-input"
              />
              
              {/* 키워드 규칙 (키워드 모드일 때) */}
              {(routingMode === 'keyword' || routingMode === 'hybrid') && (
                <input
                  type="text"
                  value={customRules[category] || ''}
                  onChange={(e) => handleRuleChange(category, e.target.value)}
                  placeholder="키워드 (쉼표로 구분)"
                  className="rule-input"
                />
              )}
              
              {categories.length > 2 && (
                <button
                  onClick={() => removeCategory(index)}
                  className="remove-category-btn"
                  title="카테고리 삭제"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          
          <button onClick={addCategory} className="add-category-btn">
            <Plus size={14} />
            카테고리 추가
          </button>
        </div>

        {/* 고급 설정 */}
        <button 
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings size={14} />
          고급 설정 {showAdvanced ? '숨기기' : '보기'}
        </button>

        {showAdvanced && (
          <div className="advanced-settings">
            {/* 신뢰도 임계값 */}
            <div className="form-group">
              <label>신뢰도 임계값: {confidence}</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={confidence}
                onChange={handleConfidenceChange}
                className="confidence-slider"
              />
              <div className="confidence-labels">
                <span>관대함</span>
                <span>엄격함</span>
              </div>
              <small className="help-text">
                낮을수록 더 많은 항목을 분류하고, 높을수록 확실한 것만 분류합니다.
              </small>
            </div>
          </div>
        )}

        {/* 테스트 버튼 */}
        <button 
          className="test-btn smart-router-test-btn"
          onClick={handleTestExecution}
          disabled={isProcessing}
        >
          <Play size={14} />
          {isProcessing ? '스마트 분석 중...' : '스마트 라우팅 테스트'}
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
                  <div className="routing-summary">
                    <div className="selected-route">
                      <strong>선택된 경로:</strong> 
                      <span className="route-name">{lastResult.selectedCategory}</span>
                      <span className="confidence-badge">
                        {Math.round(lastResult.confidence * 100)}% 신뢰도
                      </span>
                    </div>
                  </div>
                  
                  <div className="test-details">
                    <p><strong>테스트 입력:</strong> "{lastResult.testInput}"</p>
                    <p><strong>분석 방식:</strong> {lastResult.routingMode}</p>
                    {lastResult.aiModel && (
                      <p><strong>사용 모델:</strong> {lastResult.aiModel}</p>
                    )}
                    <p><strong>분석 근거:</strong> {lastResult.reasoning}</p>
                    <p><strong>가능한 경로:</strong> {lastResult.availableCategories.join(', ')}</p>
                  </div>
                </div>
              ) : (
                <span className="error-text">❌ {lastResult.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 동적 출력 핸들들 */}
      {categories.map((category, index) => (
        <Handle
          key={category}
          type="source"
          position={Position.Right}
          id={category}
          style={{ top: `${50 + index * 12}%` }}
          isConnectable={isConnectable}
          className="handle-right smart-handle"
        />
      ))}
      
      <div className="route-labels">
        {categories.map((category, index) => (
          <span 
            key={category} 
            className="route-label smart-label"
            style={{ top: `${50 + index * 12}%` }}
          >
            {category}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RouteBlock;
