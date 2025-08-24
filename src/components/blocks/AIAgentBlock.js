import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, X, Play, CheckCircle, AlertCircle, Settings, Zap } from 'lucide-react';

const AIAgentBlock = ({ data, isConnectable, id }) => {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '당신은 도움이 되는 AI 어시스턴트입니다.');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  const [modelId, setModelId] = useState(data.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(data.maxTokens || 1000);
  const [topP, setTopP] = useState(data.topP || 0.9);
  const [region, setRegion] = useState(data.region || 'us-east-1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 데이터 변경 시 부모에게 알림
  useEffect(() => {
    if (data.onChange) {
      data.onChange({
        systemPrompt,
        userPrompt,
        modelId,
        temperature,
        maxTokens,
        topP,
        region
      });
    }
  }, [systemPrompt, userPrompt, modelId, temperature, maxTokens, topP, region, data]);

  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
  };

  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
  };

  const handleModelChange = (e) => {
    setModelId(e.target.value);
  };

  const handleTemperatureChange = (e) => {
    setTemperature(parseFloat(e.target.value));
  };

  const handleMaxTokensChange = (e) => {
    setMaxTokens(parseInt(e.target.value));
  };

  const handleTopPChange = (e) => {
    setTopP(parseFloat(e.target.value));
  };

  const handleRegionChange = (e) => {
    setRegion(e.target.value);
  };

  // AWS Bedrock 모델 옵션
  const getBedrockModels = () => [
    {
      id: 'anthropic.claude-3-opus-20240229-v1:0',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: '가장 강력한 모델, 복잡한 추론과 창작에 최적'
    },
    {
      id: 'anthropic.claude-3-sonnet-20240229-v1:0',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      description: '균형잡힌 성능과 속도, 대부분의 작업에 적합'
    },
    {
      id: 'anthropic.claude-3-haiku-20240307-v1:0',
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      description: '빠른 응답 속도, 간단한 작업에 최적'
    },
    {
      id: 'amazon.titan-text-premier-v1:0',
      name: 'Titan Text Premier',
      provider: 'Amazon',
      description: 'Amazon의 최신 텍스트 생성 모델'
    },
    {
      id: 'amazon.titan-text-express-v1',
      name: 'Titan Text Express',
      provider: 'Amazon',
      description: '빠르고 효율적인 텍스트 처리'
    },
    {
      id: 'meta.llama2-70b-chat-v1',
      name: 'Llama 2 70B Chat',
      provider: 'Meta',
      description: 'Meta의 오픈소스 대화형 모델'
    },
    {
      id: 'meta.llama2-13b-chat-v1',
      name: 'Llama 2 13B Chat',
      provider: 'Meta',
      description: '경량화된 Llama 2 모델'
    },
    {
      id: 'cohere.command-text-v14',
      name: 'Command Text',
      provider: 'Cohere',
      description: 'Cohere의 명령 수행 특화 모델'
    },
    {
      id: 'ai21.j2-ultra-v1',
      name: 'Jurassic-2 Ultra',
      provider: 'AI21 Labs',
      description: 'AI21의 고성능 언어 모델'
    },
    {
      id: 'ai21.j2-mid-v1',
      name: 'Jurassic-2 Mid',
      provider: 'AI21 Labs',
      description: '중간 성능의 효율적인 모델'
    }
  ];

  // AWS 리전 옵션
  const getAwsRegions = () => [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' }
  ];

  // 선택된 모델 정보 가져오기
  const getSelectedModelInfo = () => {
    return getBedrockModels().find(model => model.id === modelId) || getBedrockModels()[0];
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
      // Mock AWS Bedrock 응답 (실제로는 AWS SDK 사용)
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5초 대기
      
      const selectedModel = getSelectedModelInfo();
      const mockResponse = `AWS Bedrock ${selectedModel.name} 응답:

프롬프트: "${userPrompt}"

${selectedModel.provider}의 ${selectedModel.name} 모델을 사용하여 분석한 결과입니다.

시스템 설정:
- 온도: ${temperature} (창의성 수준)
- 최대 토큰: ${maxTokens}
- Top-P: ${topP}
- 리전: ${region}

이것은 테스트 응답입니다. 실제 워크플로우 실행 시에는 AWS Bedrock API를 통해 실제 AI 모델의 응답을 받게 됩니다.

모델 특성: ${selectedModel.description}`;

      setLastResult({
        success: true,
        response: mockResponse,
        modelInfo: selectedModel,
        inputTokens: Math.ceil(userPrompt.length / 4), // 대략적인 토큰 수
        outputTokens: Math.ceil(mockResponse.length / 4),
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
        return <Bot size={16} />;
    }
  };

  const selectedModel = getSelectedModelInfo();

  return (
    <div className="ai-agent-block bedrock-block">
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
        <span className="block-title">AWS Bedrock</span>
        <div className="bedrock-badge">
          <span className="aws-logo">AWS</span>
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
        {/* 모델 선택 */}
        <div className="form-group">
          <label>Bedrock 모델:</label>
          <select value={modelId} onChange={handleModelChange} className="model-select">
            {getBedrockModels().map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
          <div className="model-info">
            <small>{selectedModel.description}</small>
          </div>
        </div>

        {/* 시스템 프롬프트 */}
        <div className="form-group">
          <label>시스템 프롬프트:</label>
          <textarea
            value={systemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="AI의 역할과 행동 방식을 정의하세요..."
            rows={2}
            className="system-prompt"
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
            className="user-prompt"
          />
        </div>

        {/* 고급 설정 토글 */}
        <button 
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings size={14} />
          고급 설정 {showAdvanced ? '숨기기' : '보기'}
        </button>

        {/* 고급 설정 */}
        {showAdvanced && (
          <div className="advanced-settings">
            {/* AWS 리전 */}
            <div className="form-group">
              <label>AWS 리전:</label>
              <select value={region} onChange={handleRegionChange}>
                {getAwsRegions().map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 온도 설정 */}
            <div className="form-group">
              <label>Temperature: {temperature}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={handleTemperatureChange}
                className="temperature-slider"
              />
              <div className="temperature-labels">
                <span>정확함</span>
                <span>창의적</span>
              </div>
            </div>

            {/* 최대 토큰 */}
            <div className="form-group">
              <label>최대 토큰:</label>
              <input
                type="number"
                value={maxTokens}
                onChange={handleMaxTokensChange}
                min="1"
                max="4000"
                className="token-input"
              />
              <small className="help-text">응답의 최대 길이를 제한합니다.</small>
            </div>

            {/* Top-P */}
            <div className="form-group">
              <label>Top-P: {topP}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={topP}
                onChange={handleTopPChange}
                className="top-p-slider"
              />
              <small className="help-text">응답의 다양성을 조절합니다.</small>
            </div>
          </div>
        )}

        {/* 테스트 버튼 */}
        <button 
          className="test-btn bedrock-test-btn"
          onClick={handleTestExecution}
          disabled={isProcessing}
        >
          <Play size={14} />
          {isProcessing ? 'Bedrock 실행 중...' : 'Bedrock 테스트'}
        </button>

        {/* 실행 결과 */}
        {lastResult && (
          <div className={`result-display ${lastResult.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <strong>Bedrock 응답:</strong>
              <span className="timestamp">
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="result-content">
              {lastResult.success ? (
                <div>
                  <div className="token-usage">
                    <span>입력: {lastResult.inputTokens} 토큰</span>
                    <span>출력: {lastResult.outputTokens} 토큰</span>
                    <span>모델: {lastResult.modelInfo.name}</span>
                  </div>
                  <pre className="bedrock-response">{lastResult.response}</pre>
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

export default AIAgentBlock;
