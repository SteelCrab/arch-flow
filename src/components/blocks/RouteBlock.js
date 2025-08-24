import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split, X, Plus, Trash2, Brain } from 'lucide-react';

const RouteBlock = ({ data, isConnectable, id }) => {
  const [routingMode, setRoutingMode] = useState(data.routingMode || 'ai-smart');
  const [categories, setCategories] = useState(data.categories || ['긍정적', '부정적', '중립적']);
  const [aiModel, setAiModel] = useState(data.aiModel || 'claude-3-haiku');
  const [confidence, setConfidence] = useState(data.confidence || 0.7);
  const [keywordRules, setKeywordRules] = useState(data.keywordRules || '');

  // 데이터가 외부에서 변경될 때 상태 업데이트
  useEffect(() => {
    if (data.routingMode !== undefined) setRoutingMode(data.routingMode);
    if (data.categories !== undefined) setCategories(data.categories);
    if (data.aiModel !== undefined) setAiModel(data.aiModel);
    if (data.confidence !== undefined) setConfidence(data.confidence);
    if (data.keywordRules !== undefined) setKeywordRules(data.keywordRules);
  }, [data]);

  const updateData = (updates) => {
    if (data.onChange) {
      data.onChange(updates);
    }
  };

  const handleRoutingModeChange = (e) => {
    const value = e.target.value;
    setRoutingMode(value);
    updateData({ routingMode: value });
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
    updateData({ categories: newCategories });
  };

  const addCategory = () => {
    const newCategories = [...categories, `카테고리 ${categories.length + 1}`];
    setCategories(newCategories);
    updateData({ categories: newCategories });
  };

  const removeCategory = (index) => {
    if (categories.length <= 2) {
      alert('최소 2개의 카테고리가 필요합니다.');
      return;
    }
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
    updateData({ categories: newCategories });
  };

  const handleAiModelChange = (e) => {
    const value = e.target.value;
    setAiModel(value);
    updateData({ aiModel: value });
  };

  const handleConfidenceChange = (e) => {
    const value = parseFloat(e.target.value);
    setConfidence(value);
    updateData({ confidence: value });
  };

  const handleKeywordRulesChange = (e) => {
    const value = e.target.value;
    setKeywordRules(value);
    updateData({ keywordRules: value });
  };

  const aiModelOptions = [
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku (빠름)' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (균형)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4 (정확함)' }
  ];

  return (
    <div className="route-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
        title="블록 삭제"
      >
        <X size={12} />
      </button>
      
      <div className="block-header">
        <Split size={16} />
        <span>스마트 라우터</span>
        <Brain size={14} />
      </div>

      <div className="block-content">
        <div className="form-group">
          <label>라우팅 모드</label>
          <select value={routingMode} onChange={handleRoutingModeChange}>
            <option value="ai-smart">AI 스마트 분류</option>
            <option value="keyword">키워드 기반</option>
            <option value="manual">수동 분류</option>
          </select>
        </div>

        {routingMode === 'ai-smart' && (
          <div className="ai-settings">
            <div className="form-group">
              <label>AI 모델</label>
              <select value={aiModel} onChange={handleAiModelChange}>
                {aiModelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>신뢰도 임계값: {confidence}</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={confidence}
                onChange={handleConfidenceChange}
              />
              <small>분류 확신도 최소값</small>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>출력 카테고리</label>
          <div className="categories-list">
            {categories.map((category, index) => (
              <div key={index} className="route-item">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  placeholder={`카테고리 ${index + 1}`}
                />
                {categories.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="remove-category-btn"
                    title="카테고리 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCategory}
              className="add-category-btn"
              title="카테고리 추가"
            >
              <Plus size={14} />
              카테고리 추가
            </button>
          </div>
        </div>

        {routingMode === 'keyword' && (
          <div className="form-group">
            <label>키워드 규칙</label>
            <textarea
              value={keywordRules}
              onChange={handleKeywordRulesChange}
              placeholder="각 줄에 '키워드 -> 카테고리' 형식으로 입력&#10;예: 좋다 -> 긍정적&#10;나쁘다 -> 부정적"
              rows={3}
            />
            <small>각 줄에 하나씩 '키워드 → 카테고리' 형식으로 입력</small>
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      
      {/* 각 카테고리별 출력 핸들 */}
      {categories.map((category, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          style={{
            top: `${50 + (index - (categories.length - 1) / 2) * 20}%`,
            background: `hsl(${(index * 360) / categories.length}, 70%, 50%)`
          }}
          isConnectable={isConnectable}
        />
      ))}
    </div>
  );
};

export default RouteBlock;
