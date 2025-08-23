// API 서비스 - 백엔드와 통신
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://98.81.108.10:3001/api'
  : 'http://localhost:3001/api';

class ApiService {
  // 워크플로우 목록 조회
  async getWorkflows() {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('워크플로우 목록 조회 실패:', error);
      // 백엔드 연결 실패 시 로컬 스토리지 사용
      return this.getWorkflowsFromLocalStorage();
    }
  }

  // 워크플로우 저장
  async saveWorkflow(workflow) {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
      // 백엔드 연결 실패 시 로컬 스토리지 사용
      return this.saveWorkflowToLocalStorage(workflow);
    }
  }

  // 워크플로우 수정
  async updateWorkflow(id, workflow) {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('워크플로우 수정 실패:', error);
      // 백엔드 연결 실패 시 로컬 스토리지 사용
      return this.updateWorkflowInLocalStorage(id, workflow);
    }
  }

  // 워크플로우 삭제
  async deleteWorkflow(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('워크플로우 삭제 실패:', error);
      // 백엔드 연결 실패 시 로컬 스토리지 사용
      return this.deleteWorkflowFromLocalStorage(id);
    }
  }

  // 특정 워크플로우 조회
  async getWorkflow(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('워크플로우 조회 실패:', error);
      // 백엔드 연결 실패 시 로컬 스토리지 사용
      return this.getWorkflowFromLocalStorage(id);
    }
  }

  // === 로컬 스토리지 백업 메서드들 ===
  getWorkflowsFromLocalStorage() {
    try {
      const workflows = localStorage.getItem('arch_flow_workflows');
      return workflows ? JSON.parse(workflows) : [];
    } catch (error) {
      console.error('로컬 스토리지 조회 실패:', error);
      return [];
    }
  }

  saveWorkflowToLocalStorage(workflow) {
    try {
      // 워크플로우 데이터 저장
      localStorage.setItem(`workflow_${workflow.id}`, JSON.stringify(workflow));
      
      // 워크플로우 목록 업데이트
      const workflows = this.getWorkflowsFromLocalStorage();
      const existingIndex = workflows.findIndex(w => w.id === workflow.id);
      
      const workflowSummary = {
        id: workflow.id,
        name: workflow.name,
        type: 'file',
        createdAt: workflow.createdAt || new Date().toISOString(),
        updatedAt: workflow.updatedAt || new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        workflows[existingIndex] = workflowSummary;
      } else {
        workflows.push(workflowSummary);
      }
      
      localStorage.setItem('arch_flow_workflows', JSON.stringify(workflows));
      return workflow;
    } catch (error) {
      console.error('로컬 스토리지 저장 실패:', error);
      throw error;
    }
  }

  updateWorkflowInLocalStorage(id, workflow) {
    try {
      const updatedWorkflow = { ...workflow, id, updatedAt: new Date().toISOString() };
      return this.saveWorkflowToLocalStorage(updatedWorkflow);
    } catch (error) {
      console.error('로컬 스토리지 수정 실패:', error);
      throw error;
    }
  }

  deleteWorkflowFromLocalStorage(id) {
    try {
      // 워크플로우 데이터 삭제
      localStorage.removeItem(`workflow_${id}`);
      
      // 워크플로우 목록에서 제거
      const workflows = this.getWorkflowsFromLocalStorage();
      const filteredWorkflows = workflows.filter(w => w.id !== id);
      localStorage.setItem('arch_flow_workflows', JSON.stringify(filteredWorkflows));
      
      return true;
    } catch (error) {
      console.error('로컬 스토리지 삭제 실패:', error);
      return false;
    }
  }

  getWorkflowFromLocalStorage(id) {
    try {
      const workflow = localStorage.getItem(`workflow_${id}`);
      return workflow ? JSON.parse(workflow) : null;
    } catch (error) {
      console.error('로컬 스토리지 워크플로우 조회 실패:', error);
      return null;
    }
  }

  // 백엔드 연결 상태 확인
  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
