import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split, X, Plus, Trash2, Brain } from 'lucide-react';

const RouteBlock = ({ data, isConnectable, id }) => {
  const [routingMode, setRoutingMode] = useState(data.routingMode || 'ai-smart');
  const [categories, setCategories] = useState(data.categories || ['긍정적', '부정적', '중립적']);
  const [aiModel, setAiModel] = useState(data.aiModel || 'claude-3-haiku');
  const [confidence, setConfidence] = useState(data.confidence || 0.7);

  const handleRoutingModeChange = (e) => {
    const newMode = e.target.value;
    setRoutingMode(newMode);
    data.onChange && data.onChange({
      ...data,
      routingMode: newMode
    });
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
    data.onChange && data.onChange({
      ...data,
      categories: newCategories
    });
  };

  const addCategory = () => {
    const newCategories = [...categories, `카테고리 ${categories.length + 1}`];
    setCategories(newCategories);
    data.onChange && data.onChange({
      ...data,
      categories: newCategories
    });
  };

  const removeCategory = (index) => {
    if (categories.length <= 2) {
      alert('최소 2개의 카테고리가 필요합니다.');
      return;
    }
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
    data.onChange && data.onChange({
      ...data,
      categories: newCategories
    });
  };

  const handleAiModelChange = (e) => {
    setAiModel(e.target.value);
    data.onChange && data.onChange({
      ...data,
      aiModel: e.target.value
    });
  };

  const handleConfidenceChange = (e) => {
    setConfidence(parseFloat(e.target.value));
    data.onChange && data.onChange({
      ...data,
      confidence: parseFloat(e.target.value)
    });
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
              placeholder="각 줄에 '키워드 -> 카테고리' 형식으로 입력&#10;예: 좋다 -> 긍정적&#10;나쁘다 -> 부정적"
              rows={3}
            />
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
