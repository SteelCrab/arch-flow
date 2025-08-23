import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Settings, X } from 'lucide-react';

const AIAgentBlock = ({ data, isConnectable, id }) => {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  const [model, setModel] = useState(data.model || 'gpt-4o');
  const [apiKey, setApiKey] = useState(data.apiKey || '');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [provider, setProvider] = useState(data.provider || 'openai');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    data.onSystemPromptChange && data.onSystemPromptChange(e.target.value);
  };

  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
    data.onUserPromptChange && data.onUserPromptChange(e.target.value);
  };

  const handleProviderChange = (e) => {
    setProvider(e.target.value);
    setModel(getDefaultModel(e.target.value));
    data.onProviderChange && data.onProviderChange(e.target.value);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
    data.onModelChange && data.onModelChange(e.target.value);
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    data.onApiKeyChange && data.onApiKeyChange(e.target.value);
  };

  const handleTemperatureChange = (e) => {
    setTemperature(parseFloat(e.target.value));
    data.onTemperatureChange && data.onTemperatureChange(parseFloat(e.target.value));
  };

  const getDefaultModel = (provider) => {
    const defaults = {
      openai: 'gpt-4o',
      anthropic: 'claude-3-sonnet',
      google: 'gemini-pro',
      groq: 'llama-3-70b',
      ollama: 'llama2'
    };
    return defaults[provider] || 'gpt-4o';
  };

  const getModelOptions = () => {
    const models = {
      openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview'],
      anthropic: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
      google: ['gemini-pro', 'gemini-flash'],
      groq: ['llama-3-70b', 'mixtral-8x7b'],
      ollama: ['llama2', 'codellama', 'mistral']
    };
    return models[provider] || [];
  };

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
        {isProcessing && <div className="spinner" />}
      </div>
      <div className="block-content">
        <div className="provider-selector">
          <select value={provider} onChange={handleProviderChange}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="groq">Groq</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>
        <div className="model-selector">
          <select value={model} onChange={handleModelChange}>
            {getModelOptions().map(modelOption => (
              <option key={modelOption} value={modelOption}>{modelOption}</option>
            ))}
          </select>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="API 키를 입력하세요"
          className="api-key-input"
        />
        <div className="temperature-control">
          <label>온도: {temperature}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
            className="temperature-slider"
          />
        </div>
        <textarea
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          placeholder="시스템 프롬프트 (역할 정의)..."
          rows={2}
          className="system-prompt"
        />
        <textarea
          value={userPrompt}
          onChange={handleUserPromptChange}
          placeholder="사용자 프롬프트..."
          rows={3}
        />
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