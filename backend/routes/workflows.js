const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const WorkflowService = require('../services/workflowService');

const router = express.Router();

// Validation schemas
const workflowSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500),
  nodes: Joi.array().required(),
  edges: Joi.array().required(),
  settings: Joi.object().default({})
});

// GET /api/workflows - 모든 워크플로우 조회
router.get('/', async (req, res, next) => {
  try {
    const workflows = await WorkflowService.getAllWorkflows();
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workflows/:id - 특정 워크플로우 조회
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const workflow = await WorkflowService.getWorkflowById(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workflow not found', status: 404 }
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workflows - 새 워크플로우 생성
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = workflowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message, status: 400 }
      });
    }

    const workflowData = {
      id: uuidv4(),
      ...value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const workflow = await WorkflowService.createWorkflow(workflowData);
    
    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/workflows/:id - 워크플로우 수정
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = workflowSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message, status: 400 }
      });
    }

    const updatedData = {
      ...value,
      updatedAt: new Date().toISOString()
    };

    const workflow = await WorkflowService.updateWorkflow(id, updatedData);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workflow not found', status: 404 }
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/workflows/:id - 워크플로우 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await WorkflowService.deleteWorkflow(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workflow not found', status: 404 }
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
