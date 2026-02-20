import express, { Application } from 'express';
import healthRoutes from './routes/health.routes';
import taskRoutes from './routes/task.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger, captureStartTime } from './middleware/requestLogger';

const app: Application = express();

// Request logging middleware (must be early in the chain)
app.use(captureStartTime);
app.use(requestLogger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', healthRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
