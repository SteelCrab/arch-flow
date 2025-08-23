// 메모리 기반 워크플로우 서비스 (개발용)
class MemoryWorkflowService {
  constructor() {
    this.workflows = new Map();
  }

  static async getAllWorkflows() {
    const instance = MemoryWorkflowService.getInstance();
    return Array.from(instance.workflows.values());
  }

  static async getWorkflowById(id) {
    const instance = MemoryWorkflowService.getInstance();
    return instance.workflows.get(id) || null;
  }

  static async createWorkflow(workflowData) {
    const instance = MemoryWorkflowService.getInstance();
    
    if (instance.workflows.has(workflowData.id)) {
      throw new Error('Workflow with this ID already exists');
    }
    
    instance.workflows.set(workflowData.id, workflowData);
    return workflowData;
  }

  static async updateWorkflow(id, updateData) {
    const instance = MemoryWorkflowService.getInstance();
    
    if (!instance.workflows.has(id)) {
      return null;
    }
    
    const existing = instance.workflows.get(id);
    const updated = { ...existing, ...updateData };
    instance.workflows.set(id, updated);
    return updated;
  }

  static async deleteWorkflow(id) {
    const instance = MemoryWorkflowService.getInstance();
    return instance.workflows.delete(id);
  }

  static getInstance() {
    if (!MemoryWorkflowService.instance) {
      MemoryWorkflowService.instance = new MemoryWorkflowService();
    }
    return MemoryWorkflowService.instance;
  }
}

module.exports = MemoryWorkflowService;
