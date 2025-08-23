import { ConditionEngine } from './conditionEngine';

export class WorkflowExecutor {
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    this.executionResults = new Map();
  }

  async executeWorkflow() {
    const startNodes = this.nodes.filter(node => node.type === 'inputBlock');
    
    for (const startNode of startNodes) {
      await this.executeNode(startNode.id, startNode.data.content);
    }
    
    return this.executionResults;
  }

  async executeNode(nodeId, inputData) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    console.log(`실행 중: ${node.type} (${nodeId})`);

    switch (node.type) {
      case 'inputBlock':
        this.executionResults.set(nodeId, inputData);
        await this.executeNextNodes(nodeId, inputData);
        break;

      case 'conditionBlock':
        await this.executeConditionBlock(node, inputData);
        break;

      case 'aiAgentBlock':
        await this.executeAIAgent(node, inputData);
        break;

      case 'notionBlock':
        await this.executeNotionBlock(node, inputData);
        break;

      case 'scheduleBlock':
        await this.executeScheduleBlock(node, inputData);
        break;

      default:
        console.warn(`Unknown node type: ${node.type}`);
        break;
    }
  }

  async executeConditionBlock(node, inputData) {
    const { conditionType, condition } = node.data;
    
    // 빠른 규칙 기반 조건 평가
    const conditionResult = ConditionEngine.evaluateCondition(inputData, conditionType, condition);
    
    console.log(`조건 평가: ${ConditionEngine.getConditionDescription(conditionType, condition)} = ${conditionResult}`);
    
    // True/False에 따른 분기
    const targetHandle = conditionResult ? 'true' : 'false';
    const nextEdges = this.edges.filter(edge => 
      edge.source === node.id && edge.sourceHandle === targetHandle
    );

    for (const edge of nextEdges) {
      await this.executeNode(edge.target, inputData);
    }
    
    this.executionResults.set(node.id, `조건: ${conditionResult}`);
  }

  async executeAIAgent(node, inputData) {
    const { systemPrompt, model, provider } = node.data;
    
    console.log(`AI 에이전트 실행: ${provider}/${model}`);
    
    // 실제 AI API 호출 시뮬레이션
    const result = `[${model}] ${systemPrompt ? systemPrompt + ' ' : ''}처리 결과: ${inputData}`;
    
    this.executionResults.set(node.id, result);
    await this.executeNextNodes(node.id, result);
  }

  async executeNotionBlock(node, inputData) {
    const { pageTitle, action } = node.data;
    
    console.log(`Notion ${action}: ${pageTitle}`);
    
    const result = `Notion에 저장됨: ${pageTitle}`;
    this.executionResults.set(node.id, result);
    await this.executeNextNodes(node.id, result);
  }

  async executeScheduleBlock(node, inputData) {
    const { scheduleType } = node.data;
    
    console.log(`스케줄 설정: ${scheduleType}`);
    
    const result = `스케줄 등록됨: ${scheduleType}`;
    this.executionResults.set(node.id, result);
    await this.executeNextNodes(node.id, result);
  }

  async executeNextNodes(sourceNodeId, outputData) {
    const nextEdges = this.edges.filter(edge => edge.source === sourceNodeId);
    
    for (const edge of nextEdges) {
      await this.executeNode(edge.target, outputData);
    }
  }

  getAvailableApiKey() {
    // AI 에이전트 블록에서 API 키 찾기
    const aiNode = this.nodes.find(node => 
      node.type === 'aiAgentBlock' && node.data.apiKey
    );
    return aiNode?.data.apiKey;
  }
}