import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, X, Settings } from 'lucide-react';

const AIAgentBlock = ({ data, isConnectable, id }) => {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '당신은 도움이 되는 AI 어시스턴트입니다.');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  const [modelId, setModelId] = useState(data.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(data.maxTokens || 1000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    data.onChange && data.onChange({
      ...data,
      systemPrompt: e.target.value
    });
  };

  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
    data.onChange && data.onChange({
      ...data,
      userPrompt: e.target.value
    });
  };

  const handleModelChange = (e) => {
    setModelId(e.target.value);
    data.onChange && data.onChange({
      ...data,
      modelId: e.target.value
    });
  };

  const handleTemperatureChange = (e) => {
    setTemperature(parseFloat(e.target.value));
    data.onChange && data.onChange({
      ...data,
      temperature: parseFloat(e.target.value)
    });
  };

  const handleMaxTokensChange = (e) => {
    setMaxTokens(parseInt(e.target.value));
    data.onChange && data.onChange({
      ...data,
      maxTokens: parseInt(e.target.value)
    });
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
          <select value={modelId} onChange={handleModelChange}>
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
            placeholder="AI의 역할과 행동을 정의하세요..."
            rows={2}
          />
        </div>

        <div className="form-group">
          <label>사용자 프롬프트</label>
          <textarea
            value={userPrompt}
            onChange={handleUserPromptChange}
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
