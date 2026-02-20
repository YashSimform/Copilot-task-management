import { Task, CreateTaskDTO, UpdateTaskDTO } from '../models/task.model';
import { v4 as uuidv4 } from 'uuid';

class TaskService {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    // Initialize with some sample data
    this.seedData();
  }

  private seedData(): void {
    const sampleTasks: Task[] = [
      {
        id: uuidv4(),
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the API',
        status: 'in-progress',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Review pull requests',
        description: 'Review and merge pending pull requests',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleTasks.forEach(task => this.tasks.set(task.id, task));
  }

  getAllTasks(status?: string, priority?: string): Task[] {
    let tasks = Array.from(this.tasks.values());

    // Filter by status if provided
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    // Filter by priority if provided
    if (priority) {
      tasks = tasks.filter(task => task.priority === priority);
    }

    // Sort by due date (nearest first), then by priority (high -> medium -> low), then by createdAt
    return tasks.sort((a, b) => {
      // First, sort by due date (tasks with due dates come first, earliest first)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate && !b.dueDate) return -1; // Tasks with due dates come first
      if (!a.dueDate && b.dueDate) return 1;
      
      // If no due dates, sort by priority
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Finally, sort by createdAt (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  createTask(taskData: CreateTaskDTO): Task {
    const newTask: Task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  updateTask(id: string, updateData: UpdateTaskDTO): Task | null {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }

    const updatedTask: Task = {
      ...task,
      ...updateData,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  getTaskCount(): number {
    return this.tasks.size;
  }

  getTasksByStatus(status: 'pending' | 'in-progress' | 'completed'): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }
}

export default new TaskService();
