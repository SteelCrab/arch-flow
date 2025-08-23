const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WorkflowService = require('../services/workflowService');
const ExecutionService = require('../services/executionService');

const router = express.Router();

// POST /api/executions - 워크플로우 실행
router.post('/', async (req, res, next) => {
  try {
    const { workflowId, inputData = {} } = req.body;

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: { message: 'workflowId is required', status: 400 }
      });
    }

    // 워크플로우 존재 확인
    const workflow = await WorkflowService.getWorkflowById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workflow not found', status: 404 }
      });
    }

    // 실행 기록 생성
    const executionId = uuidv4();
    const execution = {
      id: executionId,
      workflowId,
      status: 'running',
      inputData,
      startTime: new Date().toISOString(),
      logs: []
    };

    await ExecutionService.createExecution(execution);

    // 비동기로 워크플로우 실행
    ExecutionService.executeWorkflow(executionId, workflow, inputData)
      .catch(error => {
        console.error(`Execution ${executionId} failed:`, error);
      });

    res.status(202).json({
      success: true,
      data: {
        executionId,
        status: 'running',
        message: 'Workflow execution started'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/executions/:id - 실행 결과 조회
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const execution = await ExecutionService.getExecutionById(id);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: { message: 'Execution not found', status: 404 }
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/executions - 실행 기록 목록 조회
router.get('/', async (req, res, next) => {
  try {
    const { workflowId, limit = 50, offset = 0 } = req.query;
    const executions = await ExecutionService.getExecutions({
      workflowId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: executions,
      count: executions.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
