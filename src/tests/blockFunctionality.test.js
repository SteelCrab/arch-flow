// 블록 기능 테스트
import WorkflowExecutor from '../utils/WorkflowExecutor';

describe('Block Functionality Tests', () => {
  let executor;
  
  beforeEach(() => {
    // 테스트용 노드와 엣지 설정
    const nodes = [];
    const edges = [];
    executor = new WorkflowExecutor(nodes, edges);
  });

  describe('Input Block Tests', () => {
    test('should process input block correctly', async () => {
      const inputNode = {
        id: 'input-1',
        type: 'inputBlock',
        data: { content: 'Hello World' }
      };
      
      const result = await executor.executeInputBlock(inputNode, {});
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('input');
      expect(result.content).toBe('Hello World');
      expect(result.timestamp).toBeDefined();
    });

    test('should handle empty input', async () => {
      const inputNode = {
        id: 'input-1',
        type: 'inputBlock',
        data: { content: '' }
      };
      
      const result = await executor.executeInputBlock(inputNode, {});
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('');
    });
  });

  describe('AI Agent Block Tests', () => {
    test('should process AI block with mock response', async () => {
      const aiNode = {
        id: 'ai-1',
        type: 'aiAgentBlock',
        data: {
          systemPrompt: 'You are a helpful assistant',
          userPrompt: 'Hello',
          model: 'mock',
          temperature: 0.7
        }
      };
      
      const inputData = {
        'input-1': { content: 'Test input' }
      };
      
      const result = await executor.executeAIAgentBlock(aiNode, inputData);
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('ai');
      expect(result.model).toBe('mock');
      expect(result.response).toContain('Mock AI 응답');
      expect(result.prompt).toContain('Test input');
    });

    test('should handle AI block without input data', async () => {
      const aiNode = {
        id: 'ai-1',
        type: 'aiAgentBlock',
        data: {
          systemPrompt: 'You are a helpful assistant',
          userPrompt: 'Hello',
          model: 'mock'
        }
      };
      
      const result = await executor.executeAIAgentBlock(aiNode, {});
      
      expect(result.success).toBe(true);
      expect(result.prompt).toBe('Hello');
    });
  });

  describe('Notion Block Tests', () => {
    test('should process Notion block correctly', async () => {
      const notionNode = {
        id: 'notion-1',
        type: 'notionBlock',
        data: {
          pageTitle: 'Test Page',
          content: 'Test content',
          databaseId: 'test-db-id'
        }
      };
      
      const inputData = {
        'ai-1': { response: 'AI generated content' }
      };
      
      const result = await executor.executeNotionBlock(notionNode, inputData);
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('notion');
      expect(result.pageTitle).toBe('Test Page');
      expect(result.content).toContain('Test content');
      expect(result.content).toContain('AI generated content');
      expect(result.pageUrl).toContain('notion.so');
    });
  });

  describe('Condition Block Tests', () => {
    test('should evaluate condition correctly - true case', async () => {
      const conditionNode = {
        id: 'condition-1',
        type: 'conditionBlock',
        data: {
          condition: 'hello world',
          trueValue: 'Condition is true',
          falseValue: 'Condition is false'
        }
      };
      
      const inputData = {
        'input-1': { content: 'Hello World Test' }
      };
      
      const result = await executor.executeConditionBlock(conditionNode, inputData);
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('condition');
      expect(result.result).toBe(true);
      expect(result.output).toBe('Condition is true');
    });

    test('should evaluate condition correctly - false case', async () => {
      const conditionNode = {
        id: 'condition-1',
        type: 'conditionBlock',
        data: {
          condition: 'goodbye',
          trueValue: 'Condition is true',
          falseValue: 'Condition is false'
        }
      };
      
      const inputData = {
        'input-1': { content: 'Hello World Test' }
      };
      
      const result = await executor.executeConditionBlock(conditionNode, inputData);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(false);
      expect(result.output).toBe('Condition is false');
    });
  });

  describe('Schedule Block Tests', () => {
    test('should process schedule block with interval', async () => {
      const scheduleNode = {
        id: 'schedule-1',
        type: 'scheduleBlock',
        data: {
          scheduleType: 'interval',
          interval: 60
        }
      };
      
      const result = await executor.executeScheduleBlock(scheduleNode, {});
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('schedule');
      expect(result.scheduleType).toBe('interval');
      expect(result.interval).toBe(60);
      expect(result.nextExecution).toBeDefined();
    });

    test('should process schedule block with cron', async () => {
      const scheduleNode = {
        id: 'schedule-1',
        type: 'scheduleBlock',
        data: {
          scheduleType: 'cron',
          cronExpression: '0 9 * * *'
        }
      };
      
      const result = await executor.executeScheduleBlock(scheduleNode, {});
      
      expect(result.success).toBe(true);
      expect(result.scheduleType).toBe('cron');
      expect(result.cronExpression).toBe('0 9 * * *');
    });
  });

  describe('Route Block Tests', () => {
    test('should route correctly based on input', async () => {
      const routeNode = {
        id: 'route-1',
        type: 'routeBlock',
        data: {
          routes: {
            'positive': 'good',
            'negative': 'bad',
            'neutral': 'okay'
          }
        }
      };
      
      const inputData = {
        'input-1': { content: 'This is a good result' }
      };
      
      const result = await executor.executeRouteBlock(routeNode, inputData);
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('route');
      expect(result.selectedRoute).toBe('positive');
      expect(result.availableRoutes).toContain('positive');
    });
  });

  describe('Workflow Execution Tests', () => {
    test('should execute simple workflow correctly', async () => {
      const nodes = [
        {
          id: 'input-1',
          type: 'inputBlock',
          data: { content: 'Hello World' }
        },
        {
          id: 'ai-1',
          type: 'aiAgentBlock',
          data: {
            systemPrompt: 'You are helpful',
            userPrompt: 'Process this',
            model: 'mock'
          }
        }
      ];
      
      const edges = [
        {
          id: 'edge-1',
          source: 'input-1',
          target: 'ai-1'
        }
      ];
      
      const workflowExecutor = new WorkflowExecutor(nodes, edges);
      const results = await workflowExecutor.executeWorkflow();
      
      expect(results.size).toBe(2);
      expect(results.get('input-1').success).toBe(true);
      expect(results.get('ai-1').success).toBe(true);
      
      const summary = workflowExecutor.getSummary();
      expect(summary.totalBlocks).toBe(2);
      expect(summary.successfulBlocks).toBe(2);
      expect(summary.failedBlocks).toBe(0);
    });

    test('should handle workflow with condition branching', async () => {
      const nodes = [
        {
          id: 'input-1',
          type: 'inputBlock',
          data: { content: 'positive feedback' }
        },
        {
          id: 'condition-1',
          type: 'conditionBlock',
          data: {
            condition: 'positive',
            trueValue: 'Good path',
            falseValue: 'Bad path'
          }
        }
      ];
      
      const edges = [
        {
          id: 'edge-1',
          source: 'input-1',
          target: 'condition-1'
        }
      ];
      
      const workflowExecutor = new WorkflowExecutor(nodes, edges);
      const results = await workflowExecutor.executeWorkflow();
      
      expect(results.get('condition-1').result).toBe(true);
      expect(results.get('condition-1').output).toBe('Good path');
    });

    test('should calculate execution order correctly', () => {
      const nodes = [
        { id: 'input-1', type: 'inputBlock' },
        { id: 'ai-1', type: 'aiAgentBlock' },
        { id: 'notion-1', type: 'notionBlock' }
      ];
      
      const edges = [
        { source: 'input-1', target: 'ai-1' },
        { source: 'ai-1', target: 'notion-1' }
      ];
      
      const workflowExecutor = new WorkflowExecutor(nodes, edges);
      const order = workflowExecutor.calculateExecutionOrder();
      
      expect(order).toEqual(['input-1', 'ai-1', 'notion-1']);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle unsupported block type', async () => {
      const unsupportedNode = {
        id: 'unknown-1',
        type: 'unknownBlock',
        data: {}
      };
      
      const result = await executor.executeBlock(unsupportedNode);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('지원하지 않는 블록 타입');
    });

    test('should handle circular dependencies', () => {
      const nodes = [
        { id: 'a', type: 'inputBlock' },
        { id: 'b', type: 'aiAgentBlock' },
        { id: 'c', type: 'notionBlock' }
      ];
      
      const edges = [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'a' } // 순환 참조
      ];
      
      const workflowExecutor = new WorkflowExecutor(nodes, edges);
      const order = workflowExecutor.calculateExecutionOrder();
      
      // 순환 참조가 있어도 일부 노드는 실행 가능해야 함
      expect(order.length).toBeGreaterThan(0);
    });
  });
});

// 통합 테스트 실행 함수
export const runIntegrationTests = async () => {
  console.log('🧪 블록 기능 통합 테스트 시작...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };
  
  // 테스트 케이스들
  const testCases = [
    {
      name: 'Input Block 기본 기능',
      test: async () => {
        const executor = new WorkflowExecutor([], []);
        const result = await executor.executeInputBlock({
          id: 'test',
          type: 'inputBlock',
          data: { content: 'Test' }
        }, {});
        return result.success && result.content === 'Test';
      }
    },
    {
      name: 'AI Block Mock 응답',
      test: async () => {
        const executor = new WorkflowExecutor([], []);
        const result = await executor.executeAIAgentBlock({
          id: 'test',
          type: 'aiAgentBlock',
          data: { model: 'mock', userPrompt: 'Hello' }
        }, {});
        return result.success && result.response.includes('Mock AI');
      }
    },
    {
      name: 'Condition Block 평가',
      test: async () => {
        const executor = new WorkflowExecutor([], []);
        const result = await executor.executeConditionBlock({
          id: 'test',
          type: 'conditionBlock',
          data: { condition: 'test', trueValue: 'yes', falseValue: 'no' }
        }, { input: { content: 'this is a test' } });
        return result.success && result.result === true;
      }
    },
    {
      name: '전체 워크플로우 실행',
      test: async () => {
        const nodes = [
          { id: '1', type: 'inputBlock', data: { content: 'Hello' } },
          { id: '2', type: 'aiAgentBlock', data: { model: 'mock', userPrompt: 'Process' } }
        ];
        const edges = [{ source: '1', target: '2' }];
        const executor = new WorkflowExecutor(nodes, edges);
        const results = await executor.executeWorkflow();
        return results.size === 2;
      }
    }
  ];
  
  // 테스트 실행
  for (const testCase of testCases) {
    testResults.total++;
    try {
      const passed = await testCase.test();
      if (passed) {
        testResults.passed++;
        testResults.details.push(`✅ ${testCase.name}: PASS`);
      } else {
        testResults.failed++;
        testResults.details.push(`❌ ${testCase.name}: FAIL`);
      }
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ ${testCase.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('📊 테스트 결과:', testResults);
  return testResults;
};
