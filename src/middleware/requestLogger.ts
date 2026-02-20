import morgan from 'morgan';
import { Request, Response } from 'express';

// Create custom token for execution time
morgan.token('execution-time', (req: Request, res: Response) => {
  const startTime = res.locals.startTime;
  if (startTime) {
    const duration = Date.now() - startTime;
    return `${duration}ms`;
  }
  return '0ms';
});

// Custom format: [METHOD] /endpoint - Execution time: Xms
const customFormat = '[:method] :url - Execution time: :execution-time';

// Create morgan middleware with custom format
export const requestLogger = morgan(customFormat, {
  // Middleware to capture start time before morgan logs
  immediate: false,
  skip: (req: Request) => {
    // Skip logging for health check endpoint (optional)
    return req.url === '/health';
  },
});

// Middleware to capture request start time
export const captureStartTime = (req: Request, res: Response, next: Function) => {
  res.locals.startTime = Date.now();
  next();
};
