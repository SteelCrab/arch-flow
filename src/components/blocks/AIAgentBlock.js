import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, X, Settings } from 'lucide-react';

const AIAgentBlock = ({ data, isConnectable, id }) => {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '당신은 도움이 되는 AI 어시스턴트입니다.');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  const [modelId, setModelId] = useState(data.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(data.maxTokens || 1000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 데이터가 외부에서 변경될 때 상태 업데이트
  useEffect(() => {
    if (data.systemPrompt !== undefined) setSystemPrompt(data.systemPrompt);
    if (data.userPrompt !== undefined) setUserPrompt(data.userPrompt);
    if (data.modelId !== undefined) setModelId(data.modelId);
    if (data.temperature !== undefined) setTemperature(data.temperature);
    if (data.maxTokens !== undefined) setMaxTokens(data.maxTokens);
  }, [data]);

  const updateData = (updates) => {
    if (data.onChange) {
      data.onChange(updates);
    }
  };

  // 키보드 이벤트가 상위로 전파되지 않도록 방지
  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  const handleFocus = (e) => {
    e.stopPropagation();
  };

  const handleBlur = (e) => {
    e.stopPropagation();
  };

  const handleSystemPromptChange = (e) => {
    const value = e.target.value;
    setSystemPrompt(value);
    updateData({ systemPrompt: value });
  };

  const handleUserPromptChange = (e) => {
    const value = e.target.value;
    setUserPrompt(value);
    updateData({ userPrompt: value });
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    setModelId(value);
    updateData({ modelId: value });
  };

  const handleTemperatureChange = (e) => {
    const value = parseFloat(e.target.value);
    setTemperature(value);
    updateData({ temperature: value });
  };

  const handleMaxTokensChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxTokens(value);
    updateData({ maxTokens: value });
  };

  const modelOptions = [
    { value: 'anthropic.claude-3-sonnet-20240229-v1:0', label: 'Claude 3 Sonnet' },
    { value: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku' },
    { value: 'anthropic.claude-v2:1', label: 'Claude 2.1' },
    { value: 'amazon.titan-text-express-v1', label: 'Titan Text Express' },
    { value: 'ai21.j2-ultra-v1', label: 'Jurassic-2 Ultra' },
    { value: 'cohere.command-text-v14', label: 'Command Text' }
  ];

  return (
    <div className="ai-agent-block">
      <button 
        className="delete-btn" 
        onClick={() => data.onDelete && data.onDelete(id)}
        title="블록 삭제"
      >
        <X size={12} />
      </button>
      
      <div className="block-header">
        <Bot size={16} />
        <span>AI 에이전트</span>
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="고급 설정"
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="block-content">
        <div className="form-group">
          <label>모델 선택</label>
          <select 
            value={modelId} 
            onChange={handleModelChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            {modelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>시스템 프롬프트</label>
          <textarea
            value={systemPrompt}
            onChange={handleSystemPromptChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="AI의 역할과 행동을 정의하세요..."
            rows={2}
          />
        </div>

        <div className="form-group">
          <label>사용자 프롬프트</label>
          <textarea
            value={userPrompt}
            onChange={handleUserPromptChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="AI에게 전달할 메시지를 입력하세요..."
            rows={3}
          />
        </div>

        {showAdvanced && (
          <div className="advanced-settings">
            <div className="form-group">
              <label>Temperature: {temperature}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={handleTemperatureChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <small>창의성 조절 (0: 일관성, 1: 창의성)</small>
            </div>

            <div className="form-group">
              <label>최대 토큰</label>
              <input
                type="number"
                min="1"
                max="4000"
                value={maxTokens}
                onChange={handleMaxTokensChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <small>응답 길이 제한</small>
            </div>
          </div>
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
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default AIAgentBlock;
