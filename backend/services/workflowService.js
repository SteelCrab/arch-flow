const AWS = require('aws-sdk');

// DynamoDB 설정
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const TABLE_NAME = process.env.WORKFLOWS_TABLE || 'arch-flow-workflows';

class WorkflowService {
  static async getAllWorkflows() {
    try {
      const params = {
        TableName: TABLE_NAME
      };

      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw new Error('Failed to retrieve workflows');
    }
  }

  static async getWorkflowById(id) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: { id }
      };

      const result = await dynamodb.get(params).promise();
      return result.Item || null;
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw new Error('Failed to retrieve workflow');
    }
  }

  static async createWorkflow(workflowData) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Item: workflowData,
        ConditionExpression: 'attribute_not_exists(id)'
      };

      await dynamodb.put(params).promise();
      return workflowData;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Workflow with this ID already exists');
      }
      console.error('Error creating workflow:', error);
      throw new Error('Failed to create workflow');
    }
  }

  static async updateWorkflow(id, updateData) {
    try {
      // 먼저 워크플로우 존재 확인
      const existing = await this.getWorkflowById(id);
      if (!existing) {
        return null;
      }

      const params = {
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET #name = :name, description = :description, nodes = :nodes, edges = :edges, settings = :settings, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': updateData.name,
          ':description': updateData.description,
          ':nodes': updateData.nodes,
          ':edges': updateData.edges,
          ':settings': updateData.settings,
          ':updatedAt': updateData.updatedAt
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Failed to update workflow');
    }
  }

  static async deleteWorkflow(id) {
    try {
      // 먼저 워크플로우 존재 확인
      const existing = await this.getWorkflowById(id);
      if (!existing) {
        return false;
      }

      const params = {
        TableName: TABLE_NAME,
        Key: { id }
      };

      await dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new Error('Failed to delete workflow');
    }
  }
}

module.exports = WorkflowService;
