const AWS = require('aws-sdk');

// DynamoDB 설정
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const EXECUTIONS_TABLE = process.env.EXECUTIONS_TABLE || 'arch-flow-executions';

class ExecutionService {
  static async createExecution(executionData) {
    try {
      const params = {
        TableName: EXECUTIONS_TABLE,
        Item: executionData
      };

      await dynamodb.put(params).promise();
      return executionData;
    } catch (error) {
      console.error('Error creating execution:', error);
      throw new Error('Failed to create execution record');
    }
  }

  static async getExecutionById(id) {
    try {
      const params = {
        TableName: EXECUTIONS_TABLE,
        Key: { id }
      };

      const result = await dynamodb.get(params).promise();
      return result.Item || null;
    } catch (error) {
      console.error('Error getting execution:', error);
      throw new Error('Failed to retrieve execution');
    }
  }

  static async getExecutions(options = {}) {
    try {
      let params = {
        TableName: EXECUTIONS_TABLE,
        Limit: options.limit || 50
      };

      if (options.workflowId) {
        params.FilterExpression = 'workflowId = :workflowId';
        params.ExpressionAttributeValues = {
          ':workflowId': options.workflowId
        };
      }

      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting executions:', error);
      throw new Error('Failed to retrieve executions');
    }
  }

  static async updateExecution(id, updateData) {
    try {
      const params = {
        TableName: EXECUTIONS_TABLE,
        Key: { id },
        UpdateExpression: 'SET #status = :status, endTime = :endTime, results = :results, logs = :logs, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': updateData.status,
          ':endTime': updateData.endTime,
          ':results': updateData.results,
          ':logs': updateData.logs,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating execution:', error);
      throw new Error('Failed to update execution');
    }
  }

  static async executeWorkflow(executionId, workflow, inputData) {
    const logs = [];
    const results = new Map();

    try {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Starting workflow execution: ${workflow.name}`
      });

      // 워크플로우 실행 로직 (프론트엔드의 WorkflowExecutor와 유사)
      const { nodes, edges } = workflow;
      
      // 시작 노드 찾기 (inputBlock)
      const startNodes = nodes.filter(node => node.type === 'inputBlock');
      
      for (const startNode of startNodes) {
        await this.executeNode(startNode.id, inputData, nodes, edges, results, logs);
      }

      // 실행 완료 업데이트
      await this.updateExecution(executionId, {
        status: 'completed',
        endTime: new Date().toISOString(),
        results: Object.fromEntries(results),
        logs
      });

      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Workflow execution completed successfully'
      });

    } catch (error) {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow execution failed: ${error.message}`
      });

      await this.updateExecution(executionId, {
        status: 'failed',
        endTime: new Date().toISOString(),
        results: Object.fromEntries(results),
        logs,
        error: error.message
      });

      throw error;
    }
  }

  static async executeNode(nodeId, inputData, nodes, edges, results, logs) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Executing node: ${node.type} (${nodeId})`
    });

    let output = inputData;

    switch (node.type) {
      case 'inputBlock':
        output = inputData;
        break;
      
      case 'aiAgentBlock':
        // AI 에이전트 실행 로직
        output = await this.executeAIAgent(node.data, inputData, logs);
        break;
      
      case 'conditionBlock':
        // 조건 평가 로직
        output = this.evaluateCondition(node.data, inputData, logs);
        break;
      
      case 'notionBlock':
        // Notion API 호출 로직
        output = await this.executeNotionBlock(node.data, inputData, logs);
        break;
      
      default:
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `Unknown node type: ${node.type}`
        });
    }

    results.set(nodeId, output);

    // 다음 노드들 실행
    const nextEdges = edges.filter(edge => edge.source === nodeId);
    for (const edge of nextEdges) {
      await this.executeNode(edge.target, output, nodes, edges, results, logs);
    }
  }

  static async executeAIAgent(nodeData, inputData, logs) {
    // AI 에이전트 실행 로직 (실제 구현 필요)
    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `AI Agent executed with model: ${nodeData.model || 'default'}`
    });
    
    return {
      ...inputData,
      aiResponse: `AI processed: ${JSON.stringify(inputData)}`
    };
  }

  static evaluateCondition(nodeData, inputData, logs) {
    // 조건 평가 로직
    const { field, operator, value } = nodeData;
    let result = false;

    try {
      const fieldValue = inputData[field];
      
      switch (operator) {
        case 'equals':
          result = fieldValue === value;
          break;
        case 'contains':
          result = String(fieldValue).includes(value);
          break;
        case 'greater':
          result = Number(fieldValue) > Number(value);
          break;
        default:
          result = false;
      }

      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Condition evaluated: ${field} ${operator} ${value} = ${result}`
      });

    } catch (error) {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Condition evaluation failed: ${error.message}`
      });
    }

    return {
      ...inputData,
      conditionResult: result
    };
  }

  static async executeNotionBlock(nodeData, inputData, logs) {
    // Notion API 호출 로직 (실제 구현 필요)
    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Notion block executed: ${nodeData.action || 'unknown'}`
    });
    
    return {
      ...inputData,
      notionResult: 'Notion action completed'
    };
  }
}

module.exports = ExecutionService;
