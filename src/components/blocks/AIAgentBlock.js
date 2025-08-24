import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, X, Play, CheckCircle, AlertCircle } from 'lucide-react';

const AIAgentBlock = ({ data, isConnectable, id }) => {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '도움이 되는 AI 어시스턴트입니다.');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  const [model, setModel] = useState(data.model || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [provider, setProvider] = useState(data.provider || 'openai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, success, error

  // 데이터 변경 시 부모에게 알림
  useEffect(() => {
    if (data.onChange) {
      data.onChange({
        systemPrompt,
        userPrompt,
        model,
        temperature,
        provider
      });
    }
  }, [systemPrompt, userPrompt, model, temperature, provider, data]);

  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
  };

  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
  };

  const handleTemperatureChange = (e) => {
    setTemperature(parseFloat(e.target.value));
  };

  const getDefaultModel = (provider) => {
    const models = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-sonnet',
      google: 'gemini-pro',
      groq: 'llama2-70b',
      ollama: 'llama2'
    };
    return models[provider] || 'gpt-4o-mini';
  };

  const getModelOptions = (provider) => {
    const modelOptions = {
      openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ],
      anthropic: [
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
      ],
      google: [
        { value: 'gemini-pro', label: 'Gemini Pro' },
        { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' }
      ],
      groq: [
        { value: 'llama2-70b', label: 'Llama 2 70B' },
        { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' }
      ],
      ollama: [
        { value: 'llama2', label: 'Llama 2' },
        { value: 'codellama', label: 'Code Llama' },
        { value: 'mistral', label: 'Mistral' }
      ]
    };
    return modelOptions[provider] || modelOptions.openai;
  };

  // 테스트 실행
  const handleTestExecution = async () => {
    if (!userPrompt.trim()) {
      alert('사용자 프롬프트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setExecutionStatus('running');

    try {
      // Mock AI 응답 (실제로는 WorkflowExecutor 사용)
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      
      const mockResponse = `Mock ${model} 응답: "${userPrompt}"에 대한 AI 분석 결과입니다. 
      
시스템 프롬프트: ${systemPrompt}
온도 설정: ${temperature}
      
이것은 테스트 응답입니다. 실제 워크플로우 실행 시에는 실제 AI 모델의 응답을 받게 됩니다.`;

      setLastResult({
        success: true,
        response: mockResponse,
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
        return <Bot size={16} />;
    }
  };

  return (
    <div className="ai-agent-block">
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
        <span className="block-title">AI Agent</span>
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
        {/* AI 제공자 선택 */}
        <div className="form-group">
          <label>AI 제공자:</label>
          <select value={provider} onChange={handleProviderChange}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="groq">Groq</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        {/* 모델 선택 */}
        <div className="form-group">
          <label>모델:</label>
          <select value={model} onChange={handleModelChange}>
            {getModelOptions(provider).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 시스템 프롬프트 */}
        <div className="form-group">
          <label>시스템 프롬프트:</label>
          <textarea
            value={systemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="AI의 역할과 행동 방식을 정의하세요..."
            rows={2}
          />
        </div>

        {/* 사용자 프롬프트 */}
        <div className="form-group">
          <label>사용자 프롬프트:</label>
          <textarea
            value={userPrompt}
            onChange={handleUserPromptChange}
            placeholder="AI에게 요청할 내용을 입력하세요..."
            rows={3}
          />
        </div>

        {/* 온도 설정 */}
        <div className="form-group">
          <label>창의성 (Temperature): {temperature}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
          />
          <div className="temperature-labels">
            <span>정확함</span>
            <span>창의적</span>
          </div>
        </div>

        {/* 테스트 버튼 */}
        <button 
          className="test-btn"
          onClick={handleTestExecution}
          disabled={isProcessing}
        >
          <Play size={14} />
          {isProcessing ? '실행 중...' : '테스트 실행'}
        </button>

        {/* 실행 결과 */}
        {lastResult && (
          <div className={`result-display ${lastResult.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <strong>실행 결과:</strong>
              <span className="timestamp">
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="result-content">
              {lastResult.success ? (
                <pre>{lastResult.response}</pre>
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

export default AIAgentBlock;
