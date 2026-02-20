import { Request, Response, NextFunction } from 'express';
import taskService from '../services/task.service';
import { CreateTaskDTO, UpdateTaskDTO } from '../models/task.model';

export class TaskController {
  // GET /api/tasks - Get all tasks
  getAllTasks = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { status, priority } = req.query;
      
      const tasks = taskService.getAllTasks(
        status as string | undefined,
        priority as string | undefined
      );
      
      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks/:id - Get task by ID
  getTaskById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const task = taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: `Task not found with id: ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks - Create a new task
  createTask = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const taskData: CreateTaskDTO = req.body;

      const newTask = taskService.createTask(taskData);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask,
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/tasks/:id - Update a task
  updateTask = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const updateData: UpdateTaskDTO = req.body;

      // First, get the existing task to check its status
      const existingTask = taskService.getTaskById(id);

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: `Task not found with id: ${id}`,
        });
        return;
      }

      // Check if task is completed - completed tasks cannot be edited
      if (existingTask.status === 'completed') {
        res.status(403).json({
          success: false,
          message: 'Cannot update a completed task. Completed tasks are locked and cannot be modified.',
          hint: 'If you need to make changes, first change the status back to "pending" or "in-progress" by updating only the status field.',
        });
        return;
      }

      const updatedTask = taskService.updateTask(id, updateData);

      if (!updatedTask) {
        res.status(404).json({
          success: false,
          message: `Task not found with id: ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/tasks/:id - Delete a task
  deleteTask = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;

      // First, get the task to check its status
      const existingTask = taskService.getTaskById(id);

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: `Task not found with id: ${id}`,
        });
        return;
      }

      // Check if task is completed - completed tasks cannot be deleted
      if (existingTask.status === 'completed') {
        res.status(403).json({
          success: false,
          message: 'Cannot delete a completed task. Completed tasks are archived and cannot be removed.',
          hint: 'Completed tasks are kept for record-keeping purposes.',
        });
        return;
      }

      const deleted = taskService.deleteTask(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `Task not found with id: ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/tasks/:id/reopen - Reopen a completed task
  reopenTask = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      
      const existingTask = taskService.getTaskById(id);

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: `Task not found with id: ${id}`,
        });
        return;
      }

      // Only allow reopening completed tasks
      if (existingTask.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Only completed tasks can be reopened.',
          currentStatus: existingTask.status,
        });
        return;
      }

      // Reopen the task by setting status to in-progress
      const reopenedTask = taskService.updateTask(id, { status: 'in-progress' });

      res.status(200).json({
        success: true,
        message: 'Task reopened successfully. You can now edit this task.',
        data: reopenedTask,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks/stats/count - Get total task count
  getTaskCount = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const count = taskService.getTaskCount();

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tasks/stats/status - Get tasks grouped by status
  getTasksByStatus = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const pending = taskService.getTasksByStatus('pending');
      const inProgress = taskService.getTasksByStatus('in-progress');
      const completed = taskService.getTasksByStatus('completed');

      res.status(200).json({
        success: true,
        data: {
          pending: {
            count: pending.length,
            tasks: pending,
          },
          inProgress: {
            count: inProgress.length,
            tasks: inProgress,
          },
          completed: {
            count: completed.length,
            tasks: completed,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new TaskController();
