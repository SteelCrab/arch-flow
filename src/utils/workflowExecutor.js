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

  // AI Agent Block 실행
  async executeAIAgentBlock(node, inputData) {
    const { systemPrompt, userPrompt, model, temperature } = node.data || {};
    
    // 입력 데이터를 프롬프트에 포함
    let finalUserPrompt = userPrompt || '';
    Object.values(inputData).forEach(input => {
      if (input.content) {
        finalUserPrompt += `\n\n입력 데이터: ${input.content}`;
      }
    });
    
    // AI API 호출 시뮬레이션 (실제로는 OpenAI, Claude 등 호출)
    const aiResponse = await this.callAIService(model, systemPrompt, finalUserPrompt, temperature);
    
    return {
      success: true,
      type: 'ai',
      model: model,
      prompt: finalUserPrompt,
      response: aiResponse,
      timestamp: new Date().toISOString()
    };
  }

  // AI 서비스 호출
  async callAIService(model, systemPrompt, userPrompt, temperature = 0.7) {
    // 실제 구현에서는 각 AI 서비스의 API를 호출
    // 현재는 시뮬레이션
    
    if (model === 'mock') {
      return `Mock AI 응답: "${userPrompt}"에 대한 처리 결과입니다.`;
    }
    
    try {
      // OpenAI API 호출 예시 (실제 API 키 필요)
      if (model?.includes('gpt')) {
        return await this.callOpenAI(systemPrompt, userPrompt, temperature);
      }
      
      // Claude API 호출 예시
      if (model?.includes('claude')) {
        return await this.callClaude(systemPrompt, userPrompt, temperature);
      }
      
      // 기본 응답
      return `AI 모델 ${model}의 응답: 입력된 내용을 분석하여 다음과 같이 처리했습니다: "${userPrompt}"`;
      
    } catch (error) {
      console.warn('AI 서비스 호출 실패, Mock 응답 반환:', error.message);
      return `Mock AI 응답 (${model}): "${userPrompt}"에 대한 분석 결과입니다.`;
    }
  }

  // OpenAI API 호출
  async callOpenAI(systemPrompt, userPrompt, temperature) {
    // 실제 구현 시 환경변수에서 API 키 가져오기
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt || '도움이 되는 AI 어시스턴트입니다.' },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  }

  // Claude API 호출
  async callClaude(systemPrompt, userPrompt, temperature) {
    // Claude API 구현 (Anthropic)
    throw new Error('Claude API는 아직 구현되지 않았습니다.');
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
