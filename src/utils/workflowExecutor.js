// 워크플로우 실행 엔진
import axios from 'axios';

class WorkflowExecutor {
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    this.results = new Map();
    this.executionOrder = [];
  }

  // 실행 순서 계산 (토폴로지 정렬)
  calculateExecutionOrder() {
    const inDegree = new Map();
    const adjList = new Map();
    
    // 초기화
    this.nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });
    
    // 엣지 정보로 그래프 구성
    this.edges.forEach(edge => {
      adjList.get(edge.source).push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    });
    
    // 토폴로지 정렬
    const queue = [];
    const order = [];
    
    // 진입 차수가 0인 노드들을 큐에 추가
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);
      
      adjList.get(current).forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    this.executionOrder = order;
    return order;
  }

  // 노드의 입력 데이터 수집
  getInputData(nodeId) {
    const inputEdges = this.edges.filter(edge => edge.target === nodeId);
    const inputData = {};
    
    inputEdges.forEach(edge => {
      const sourceResult = this.results.get(edge.source);
      if (sourceResult) {
        inputData[edge.source] = sourceResult;
      }
    });
    
    return inputData;
  }

  // 개별 블록 실행
  async executeBlock(node) {
    console.log(`🔄 블록 실행 중: ${node.type} (${node.id})`);
    
    const inputData = this.getInputData(node.id);
    let result = null;
    
    try {
      switch (node.type) {
        case 'inputBlock':
          result = await this.executeInputBlock(node, inputData);
          break;
        case 'aiAgentBlock':
          result = await this.executeAIAgentBlock(node, inputData);
          break;
        case 'notionBlock':
          result = await this.executeNotionBlock(node, inputData);
          break;
        case 'conditionBlock':
          result = await this.executeConditionBlock(node, inputData);
          break;
        case 'scheduleBlock':
          result = await this.executeScheduleBlock(node, inputData);
          break;
        case 'routeBlock':
          result = await this.executeRouteBlock(node, inputData);
          break;
        default:
          throw new Error(`지원하지 않는 블록 타입: ${node.type}`);
      }
      
      this.results.set(node.id, result);
      console.log(`✅ 블록 실행 완료: ${node.id}`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ 블록 실행 실패: ${node.id}`, error);
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.results.set(node.id, errorResult);
      return errorResult;
    }
  }

  // Input Block 실행
  async executeInputBlock(node, inputData) {
    const content = node.data?.content || '';
    return {
      success: true,
      type: 'input',
      content: content,
      timestamp: new Date().toISOString()
    };
  }

  // AI Agent Block 실행 (AWS Bedrock)
  async executeAIAgentBlock(node, inputData) {
    const { systemPrompt, userPrompt, modelId, temperature, maxTokens, topP, region } = node.data || {};
    
    // 입력 데이터를 프롬프트에 포함
    let finalUserPrompt = userPrompt || '';
    Object.values(inputData).forEach(input => {
      if (input.content) {
        finalUserPrompt += `\n\n입력 데이터: ${input.content}`;
      }
    });
    
    // AWS Bedrock API 호출
    const bedrockResponse = await this.callBedrockService(
      modelId, 
      systemPrompt, 
      finalUserPrompt, 
      temperature, 
      maxTokens, 
      topP, 
      region
    );
    
    return {
      success: true,
      type: 'ai',
      provider: 'aws-bedrock',
      modelId: modelId,
      region: region,
      prompt: finalUserPrompt,
      response: bedrockResponse.response,
      inputTokens: bedrockResponse.inputTokens,
      outputTokens: bedrockResponse.outputTokens,
      timestamp: new Date().toISOString()
    };
  }

  // AWS Bedrock 서비스 호출
  async callBedrockService(modelId, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 1000, topP = 0.9, region = 'us-east-1') {
    try {
      // 실제 AWS Bedrock 호출 (AWS SDK 필요)
      if (process.env.REACT_APP_AWS_ACCESS_KEY_ID && process.env.REACT_APP_AWS_SECRET_ACCESS_KEY) {
        return await this.callActualBedrock(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP, region);
      }
      
      // Mock 응답 (개발/테스트용)
      return await this.callMockBedrock(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP);
      
    } catch (error) {
      console.warn('Bedrock 서비스 호출 실패, Mock 응답 반환:', error.message);
      return await this.callMockBedrock(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP);
    }
  }

  // 실제 AWS Bedrock API 호출
  async callActualBedrock(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP, region) {
    // AWS SDK를 사용한 실제 Bedrock 호출
    // 실제 구현에서는 @aws-sdk/client-bedrock-runtime 사용
    
    const AWS = window.AWS; // AWS SDK가 로드된 경우
    if (!AWS) {
      throw new Error('AWS SDK가 로드되지 않았습니다.');
    }

    // AWS 자격 증명 설정
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: region
    });

    const bedrockRuntime = new AWS.BedrockRuntime();
    
    // 모델별 요청 형식 구성
    const requestBody = this.buildBedrockRequest(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP);
    
    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    };

    const response = await bedrockRuntime.invokeModel(params).promise();
    const responseBody = JSON.parse(response.body.toString());
    
    return this.parseBedrockResponse(modelId, responseBody);
  }

  // Mock AWS Bedrock 응답
  async callMockBedrock(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP) {
    // 실제 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const modelInfo = this.getModelInfo(modelId);
    const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const outputTokens = Math.min(Math.ceil(Math.random() * maxTokens * 0.8), maxTokens);
    
    const mockResponse = `AWS Bedrock ${modelInfo.name} 응답:

시스템 컨텍스트: ${systemPrompt}

사용자 요청에 대한 분석:
"${userPrompt}"

${modelInfo.provider}의 ${modelInfo.name} 모델을 사용하여 처리한 결과입니다.

모델 설정:
- Temperature: ${temperature} (창의성 수준)
- Max Tokens: ${maxTokens}
- Top-P: ${topP}
- 리전: us-east-1

${modelInfo.description}

이 응답은 실제 AWS Bedrock 서비스의 동작을 시뮬레이션한 것입니다. 
프로덕션 환경에서는 실제 AWS 자격 증명과 함께 실제 모델의 응답을 받게 됩니다.`;

    return {
      response: mockResponse,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      modelInfo: modelInfo
    };
  }

  // 모델 정보 가져오기
  getModelInfo(modelId) {
    const models = {
      'anthropic.claude-3-opus-20240229-v1:0': {
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: '가장 강력한 모델로 복잡한 추론과 창작 작업에 최적화되어 있습니다.'
      },
      'anthropic.claude-3-sonnet-20240229-v1:0': {
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        description: '균형잡힌 성능과 속도를 제공하여 대부분의 작업에 적합합니다.'
      },
      'anthropic.claude-3-haiku-20240307-v1:0': {
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        description: '빠른 응답 속도로 간단한 작업에 최적화되어 있습니다.'
      },
      'amazon.titan-text-premier-v1:0': {
        name: 'Titan Text Premier',
        provider: 'Amazon',
        description: 'Amazon의 최신 텍스트 생성 모델입니다.'
      },
      'amazon.titan-text-express-v1': {
        name: 'Titan Text Express',
        provider: 'Amazon',
        description: '빠르고 효율적인 텍스트 처리에 특화되어 있습니다.'
      },
      'meta.llama2-70b-chat-v1': {
        name: 'Llama 2 70B Chat',
        provider: 'Meta',
        description: 'Meta의 오픈소스 대화형 모델입니다.'
      },
      'cohere.command-text-v14': {
        name: 'Command Text',
        provider: 'Cohere',
        description: 'Cohere의 명령 수행에 특화된 모델입니다.'
      },
      'ai21.j2-ultra-v1': {
        name: 'Jurassic-2 Ultra',
        provider: 'AI21 Labs',
        description: 'AI21의 고성능 언어 모델입니다.'
      }
    };
    
    return models[modelId] || {
      name: 'Unknown Model',
      provider: 'Unknown',
      description: '알 수 없는 모델입니다.'
    };
  }

  // Bedrock 요청 본문 구성
  buildBedrockRequest(modelId, systemPrompt, userPrompt, temperature, maxTokens, topP) {
    if (modelId.startsWith('anthropic.claude')) {
      return {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        messages: [
          {
            role: "user",
            content: `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant:`
          }
        ]
      };
    }
    
    if (modelId.startsWith('amazon.titan')) {
      return {
        inputText: `${systemPrompt}\n\n${userPrompt}`,
        textGenerationConfig: {
          maxTokenCount: maxTokens,
          temperature: temperature,
          topP: topP
        }
      };
    }
    
    if (modelId.startsWith('meta.llama')) {
      return {
        prompt: `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`,
        max_gen_len: maxTokens,
        temperature: temperature,
        top_p: topP
      };
    }
    
    // 기본 형식
    return {
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP
    };
  }

  // Bedrock 응답 파싱
  parseBedrockResponse(modelId, responseBody) {
    if (modelId.startsWith('anthropic.claude')) {
      return {
        response: responseBody.content[0].text,
        inputTokens: responseBody.usage.input_tokens,
        outputTokens: responseBody.usage.output_tokens
      };
    }
    
    if (modelId.startsWith('amazon.titan')) {
      return {
        response: responseBody.results[0].outputText,
        inputTokens: responseBody.inputTextTokenCount,
        outputTokens: responseBody.results[0].tokenCount
      };
    }
    
    if (modelId.startsWith('meta.llama')) {
      return {
        response: responseBody.generation,
        inputTokens: responseBody.prompt_token_count,
        outputTokens: responseBody.generation_token_count
      };
    }
    
    // 기본 파싱
    return {
      response: responseBody.completion || responseBody.text || responseBody.output,
      inputTokens: responseBody.input_tokens || 0,
      outputTokens: responseBody.output_tokens || 0
    };
  }

  // Notion Block 실행
  async executeNotionBlock(node, inputData) {
    const { pageTitle, content, databaseId } = node.data || {};
    
    // 입력 데이터를 Notion 콘텐츠에 포함
    let finalContent = content || '';
    Object.values(inputData).forEach(input => {
      if (input.content || input.response) {
        finalContent += `\n\n${input.content || input.response}`;
      }
    });
    
    // Notion API 호출 시뮬레이션
    const notionResult = await this.callNotionAPI(pageTitle, finalContent, databaseId);
    
    return {
      success: true,
      type: 'notion',
      pageTitle: pageTitle,
      content: finalContent,
      pageUrl: notionResult.url,
      timestamp: new Date().toISOString()
    };
  }

  // Notion API 호출
  async callNotionAPI(title, content, databaseId) {
    // 실제 구현에서는 Notion API 호출
    // 현재는 시뮬레이션
    
    const mockPageId = `page_${Date.now()}`;
    const mockUrl = `https://notion.so/${mockPageId}`;
    
    console.log(`📄 Notion 페이지 생성: ${title}`);
    console.log(`📝 내용: ${content.substring(0, 100)}...`);
    
    return {
      id: mockPageId,
      url: mockUrl,
      title: title
    };
  }

  // Condition Block 실행
  async executeConditionBlock(node, inputData) {
    const { condition, trueValue, falseValue } = node.data || {};
    
    // 조건 평가 (간단한 문자열 포함 검사)
    let conditionResult = false;
    
    if (condition && Object.keys(inputData).length > 0) {
      const inputText = Object.values(inputData)
        .map(input => input.content || input.response || '')
        .join(' ')
        .toLowerCase();
      
      conditionResult = inputText.includes(condition.toLowerCase());
    }
    
    const result = conditionResult ? trueValue : falseValue;
    
    return {
      success: true,
      type: 'condition',
      condition: condition,
      result: conditionResult,
      output: result,
      timestamp: new Date().toISOString()
    };
  }

  // Schedule Block 실행
  async executeScheduleBlock(node, inputData) {
    const { scheduleType, cronExpression, interval } = node.data || {};
    
    // 스케줄 정보만 반환 (실제 스케줄링은 백엔드에서 처리)
    return {
      success: true,
      type: 'schedule',
      scheduleType: scheduleType,
      cronExpression: cronExpression,
      interval: interval,
      nextExecution: this.calculateNextExecution(scheduleType, cronExpression, interval),
      timestamp: new Date().toISOString()
    };
  }

  // 다음 실행 시간 계산
  calculateNextExecution(scheduleType, cronExpression, interval) {
    const now = new Date();
    
    if (scheduleType === 'interval' && interval) {
      return new Date(now.getTime() + interval * 60000).toISOString();
    }
    
    if (scheduleType === 'cron' && cronExpression) {
      // 간단한 cron 파싱 (실제로는 cron-parser 라이브러리 사용)
      return new Date(now.getTime() + 3600000).toISOString(); // 1시간 후
    }
    
    return new Date(now.getTime() + 3600000).toISOString();
  }

  // Route Block 실행
  async executeRouteBlock(node, inputData) {
    const { routes } = node.data || {};
    
    // 입력 데이터 기반으로 라우팅 결정
    let selectedRoute = 'default';
    
    if (routes && Object.keys(inputData).length > 0) {
      const inputText = Object.values(inputData)
        .map(input => input.content || input.response || '')
        .join(' ')
        .toLowerCase();
      
      // 각 라우트 조건 확인
      for (const [routeName, condition] of Object.entries(routes)) {
        if (inputText.includes(condition.toLowerCase())) {
          selectedRoute = routeName;
          break;
        }
      }
    }
    
    return {
      success: true,
      type: 'route',
      selectedRoute: selectedRoute,
      availableRoutes: Object.keys(routes || {}),
      timestamp: new Date().toISOString()
    };
  }

  // 전체 워크플로우 실행
  async executeWorkflow() {
    console.log('🚀 워크플로우 실행 시작');
    
    // 실행 순서 계산
    this.calculateExecutionOrder();
    
    if (this.executionOrder.length === 0) {
      throw new Error('실행할 블록이 없습니다.');
    }
    
    console.log('📋 실행 순서:', this.executionOrder);
    
    // 순차적으로 블록 실행
    for (const nodeId of this.executionOrder) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        await this.executeBlock(node);
        
        // 각 블록 실행 후 잠시 대기 (시각적 효과)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('🎉 워크플로우 실행 완료');
    return this.results;
  }

  // 실행 결과 요약
  getSummary() {
    const summary = {
      totalBlocks: this.nodes.length,
      executedBlocks: this.results.size,
      successfulBlocks: 0,
      failedBlocks: 0,
      results: {}
    };
    
    this.results.forEach((result, nodeId) => {
      if (result.success) {
        summary.successfulBlocks++;
      } else {
        summary.failedBlocks++;
      }
      summary.results[nodeId] = result;
    });
    
    return summary;
  }
}

export default WorkflowExecutor;
