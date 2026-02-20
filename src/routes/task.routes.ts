import { Router } from 'express';
import taskController from '../controllers/task.controller';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId,
  handleValidationErrors,
} from '../middleware/taskValidation';

const router = Router();

// GET /api/tasks/stats/count - Get total task count (must be before /:id route)
router.get('/stats/count', taskController.getTaskCount);

// GET /api/tasks/stats/status - Get tasks grouped by status
router.get('/stats/status', taskController.getTasksByStatus);

// GET /api/tasks - Get all tasks (supports ?status=pending&priority=high)
router.get('/', taskController.getAllTasks);

// GET /api/tasks/:id - Get task by ID
router.get('/:id', validateTaskId, handleValidationErrors, taskController.getTaskById);

// POST /api/tasks - Create a new task
router.post('/', validateCreateTask, handleValidationErrors, taskController.createTask);

// POST /api/tasks/:id/reopen - Reopen a completed task
router.post('/:id/reopen', validateTaskId, handleValidationErrors, taskController.reopenTask);

// PUT /api/tasks/:id - Update a task
router.put(
  '/:id',
  validateTaskId,
  validateUpdateTask,
  handleValidationErrors,
  taskController.updateTask
);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', validateTaskId, handleValidationErrors, taskController.deleteTask);

export default router;
