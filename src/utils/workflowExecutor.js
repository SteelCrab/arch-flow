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
    const { pageTitle, action, pageId, databaseId, apiToken } = node.data || {};
    
    // API 토큰 확인 (환경변수 또는 블록 설정)
    const token = apiToken || process.env.REACT_APP_NOTION_API_KEY;
    if (!token) {
      throw new Error('Notion API 토큰이 필요합니다. 블록 설정에서 입력하거나 환경변수 REACT_APP_NOTION_API_KEY를 설정하세요.');
    }
    
    // 입력 데이터를 Notion 콘텐츠에 포함
    let finalContent = '';
    Object.values(inputData).forEach(input => {
      if (input.content) {
        finalContent += input.content + '\n\n';
      }
      if (input.response) {
        finalContent += input.response + '\n\n';
      }
    });
    
    if (!finalContent.trim()) {
      finalContent = '워크플로우에서 생성된 콘텐츠';
    }
    
    // Notion API 호출
    const notionResult = await this.callNotionAPI(action, token, pageTitle, finalContent, pageId, databaseId);
    
    return {
      success: true,
      type: 'notion',
      action: action,
      pageTitle: pageTitle,
      content: finalContent.substring(0, 200) + '...',
      pageUrl: notionResult.url,
      pageId: notionResult.id,
      timestamp: new Date().toISOString()
    };
  }

  // Notion API 호출
  async callNotionAPI(action, apiToken, title, content, pageId, databaseId) {
    try {
      let result;
      
      switch (action) {
        case 'create_page':
          if (!pageId) {
            throw new Error('페이지 생성을 위해 부모 페이지 ID가 필요합니다.');
          }
          result = await this.createNotionPage(apiToken, pageId, title, content);
          break;
          
        case 'update_page':
          if (!pageId) {
            throw new Error('페이지 업데이트를 위해 페이지 ID가 필요합니다.');
          }
          result = await this.updateNotionPage(apiToken, pageId, title, content);
          break;
          
        case 'add_to_db':
          if (!databaseId) {
            throw new Error('데이터베이스 추가를 위해 데이터베이스 ID가 필요합니다.');
          }
          result = await this.addToNotionDatabase(apiToken, databaseId, title, content);
          break;
          
        default:
          throw new Error(`지원하지 않는 Notion 작업: ${action}`);
      }
      
      console.log(`✅ Notion ${action} 성공: ${title}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Notion API 오류:`, error);
      
      // 개발 모드에서는 Mock 응답 반환
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 개발 모드: Mock Notion 응답 사용');
        const mockPageId = `mock_${Date.now()}`;
        return {
          id: mockPageId,
          url: `https://notion.so/${mockPageId}`,
          title: title
        };
      }
      
      throw error;
    }
  }

  // Notion 페이지 생성
  async createNotionPage(apiToken, parentId, title, content) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          type: 'page_id',
          page_id: parentId.replace(/-/g, '')
        },
        properties: {
          title: {
            title: [{
              text: { content: title }
            }]
          }
        },
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: content }
            }]
          }
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion 페이지 생성 실패: ${error.message}`);
    }

    return await response.json();
  }

  // Notion 페이지 업데이트
  async updateNotionPage(apiToken, pageId, title, content) {
    const cleanPageId = pageId.replace(/-/g, '');
    
    // 페이지에 새 블록 추가
    const response = await fetch(`https://api.notion.com/v1/blocks/${cleanPageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: `[${new Date().toLocaleString()}] ${content}` }
            }]
          }
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion 페이지 업데이트 실패: ${error.message}`);
    }

    return {
      id: cleanPageId,
      url: `https://notion.so/${cleanPageId}`,
      title: title
    };
  }

  // Notion 데이터베이스에 추가
  async addToNotionDatabase(apiToken, databaseId, title, content) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          type: 'database_id',
          database_id: databaseId.replace(/-/g, '')
        },
        properties: {
          Name: {
            title: [{
              text: { content: title }
            }]
          }
        },
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: content }
            }]
          }
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion 데이터베이스 추가 실패: ${error.message}`);
    }

    return await response.json();
  }

  // Smart Route Block 실행
  async executeRouteBlock(node, inputData) {
    const { routingMode, categories, customRules, aiModel, confidence } = node.data || {};
    
    // 입력 데이터 수집
    const inputText = Object.values(inputData)
      .map(input => input.content || input.response || '')
      .join(' ');
    
    if (!inputText.trim()) {
      return {
        success: false,
        error: '라우팅할 입력 데이터가 없습니다.',
        timestamp: new Date().toISOString()
      };
    }

    let selectedCategory = categories[0] || 'default';
    let confidenceScore = 0.5;
    let reasoning = '';

    try {
      if (routingMode === 'ai-smart') {
        const aiResult = await this.performAIRouting(inputText, categories, aiModel, confidence);
        selectedCategory = aiResult.category;
        confidenceScore = aiResult.confidence;
        reasoning = aiResult.reasoning;
      } else if (routingMode === 'keyword') {
        const keywordResult = this.performKeywordRouting(inputText, categories, customRules);
        selectedCategory = keywordResult.category;
        confidenceScore = keywordResult.confidence;
        reasoning = keywordResult.reasoning;
      } else if (routingMode === 'hybrid') {
        const hybridResult = await this.performHybridRouting(inputText, categories, customRules, aiModel, confidence);
        selectedCategory = hybridResult.category;
        confidenceScore = hybridResult.confidence;
        reasoning = hybridResult.reasoning;
      }

      return {
        success: true,
        type: 'smart-route',
        routingMode: routingMode,
        selectedCategory: selectedCategory,
        confidence: confidenceScore,
        reasoning: reasoning,
        inputText: inputText.substring(0, 200) + (inputText.length > 200 ? '...' : ''),
        availableCategories: categories,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `라우팅 실행 오류: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // AI 기반 라우팅
  async performAIRouting(inputText, categories, aiModel, confidence) {
    // Mock AI 분석 (실제로는 Bedrock API 호출)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const systemPrompt = `다음 텍스트를 분석하여 가장 적절한 카테고리로 분류해주세요.

사용 가능한 카테고리: ${categories.join(', ')}

분류 기준:
- 텍스트의 감정, 의도, 내용을 종합적으로 분석
- 가장 적합한 카테고리 하나만 선택
- 신뢰도 점수 (0.0-1.0)도 함께 제공

응답 형식: {"category": "선택된카테고리", "confidence": 0.85, "reasoning": "분류 근거"}`;

    // 실제 구현에서는 Bedrock API 호출
    const mockAnalysis = this.mockAIAnalysis(inputText, categories);
    
    return {
      category: mockAnalysis.category,
      confidence: mockAnalysis.confidence,
      reasoning: `AI 분석 (${aiModel}): ${mockAnalysis.reasoning}`
    };
  }

  // 키워드 기반 라우팅
  performKeywordRouting(inputText, categories, customRules) {
    const text = inputText.toLowerCase();
    let bestMatch = { category: categories[0], score: 0, matchedKeywords: [] };

    for (const category of categories) {
      const rules = customRules[category] || '';
      if (!rules.trim()) continue;

      const keywords = rules.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
      const matchedKeywords = keywords.filter(keyword => text.includes(keyword));
      const score = matchedKeywords.length / keywords.length;

      if (score > bestMatch.score) {
        bestMatch = { category, score, matchedKeywords };
      }
    }

    return {
      category: bestMatch.category,
      confidence: bestMatch.score,
      reasoning: bestMatch.matchedKeywords.length > 0 
        ? `키워드 매칭: "${bestMatch.matchedKeywords.join(', ')}" 감지`
        : '매칭되는 키워드가 없어 기본 카테고리 선택'
    };
  }

  // 하이브리드 라우팅 (AI + 키워드)
  async performHybridRouting(inputText, categories, customRules, aiModel, confidence) {
    const aiResult = await this.performAIRouting(inputText, categories, aiModel, confidence);
    const keywordResult = this.performKeywordRouting(inputText, categories, customRules);

    // AI와 키워드 결과를 가중 평균으로 결합
    const aiWeight = 0.7;
    const keywordWeight = 0.3;

    let finalCategory = aiResult.category;
    let finalConfidence = (aiResult.confidence * aiWeight) + (keywordResult.confidence * keywordWeight);

    // 키워드 매칭이 매우 확실한 경우 우선시
    if (keywordResult.confidence === 1.0) {
      finalCategory = keywordResult.category;
      finalConfidence = Math.max(finalConfidence, 0.9);
    }

    return {
      category: finalCategory,
      confidence: finalConfidence,
      reasoning: `하이브리드 분석: AI(${Math.round(aiResult.confidence * 100)}%) + 키워드(${Math.round(keywordResult.confidence * 100)}%) = ${Math.round(finalConfidence * 100)}%`
    };
  }

  // Mock AI 분석 (개발용)
  mockAIAnalysis(inputText, categories) {
    const text = inputText.toLowerCase();
    
    // 간단한 감정 분석 시뮬레이션
    const positiveWords = ['좋', '훌륭', '추천', '만족', '최고', '완벽', '사랑', '행복'];
    const negativeWords = ['나쁘', '싫', '실망', '최악', '화', '짜증', '문제', '불만'];
    const neutralWords = ['보통', '그냥', '일반', '평범', '괜찮'];

    let positiveScore = positiveWords.filter(word => text.includes(word)).length;
    let negativeScore = negativeWords.filter(word => text.includes(word)).length;
    let neutralScore = neutralWords.filter(word => text.includes(word)).length;

    let selectedCategory = categories[0];
    let confidence = 0.5;
    let reasoning = '텍스트 패턴 분석 결과';

    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      selectedCategory = categories.find(cat => 
        cat.includes('긍정') || cat.includes('좋') || cat.includes('positive')
      ) || categories[0];
      confidence = Math.min(0.8 + (positiveScore * 0.1), 0.95);
      reasoning = `긍정적 표현 ${positiveScore}개 감지`;
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      selectedCategory = categories.find(cat => 
        cat.includes('부정') || cat.includes('나쁨') || cat.includes('negative')
      ) || categories[1] || categories[0];
      confidence = Math.min(0.8 + (negativeScore * 0.1), 0.95);
      reasoning = `부정적 표현 ${negativeScore}개 감지`;
    } else {
      selectedCategory = categories.find(cat => 
        cat.includes('중립') || cat.includes('보통') || cat.includes('neutral')
      ) || categories[Math.floor(categories.length / 2)] || categories[0];
      confidence = 0.6;
      reasoning = '중립적 또는 혼합된 표현 감지';
    }

    return { category: selectedCategory, confidence, reasoning };
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
