import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';

// Middleware to handle validation errors with detailed messages
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors: { [key: string]: string } = {};
    const allErrors: string[] = [];
    
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        formattedErrors[error.path] = error.msg;
        allErrors.push(`${error.path}: ${error.msg}`);
      }
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the errors below.',
      errors: formattedErrors,
      details: allErrors,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  next();
};

// Validation rules for task creation with sanitization
export const validateCreateTask: ValidationChain[] = [
  // Title validation with sanitization
  body('title')
    .trim() // Remove whitespace from both ends
    .escape() // Escape HTML characters to prevent XSS
    .notEmpty()
    .withMessage('Title is required and cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-_,.!?()]+$/)
    .withMessage('Title can only contain letters, numbers, spaces, and basic punctuation (- _ , . ! ? ( ))')
    .customSanitizer((value) => {
      // Additional sanitization: normalize multiple spaces to single space
      return value.replace(/\s+/g, ' ');
    }),
  
  // Description validation with sanitization
  body('description')
    .optional()
    .trim()
    .escape() // Escape HTML to prevent XSS
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .customSanitizer((value) => {
      if (value) {
        // Normalize multiple spaces and line breaks
        return value.replace(/\s+/g, ' ').trim();
      }
      return value;
    }),
  
  // Status validation
  body('status')
    .optional()
    .trim()
    .toLowerCase() // Normalize to lowercase
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be one of: pending, in-progress, completed'),
  
  // Priority validation
  body('priority')
    .optional()
    .trim()
    .toLowerCase() // Normalize to lowercase
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high')
    .custom((value, { req }) => {
      // If priority is high, dueDate is required
      if (value === 'high' && !req.body.dueDate) {
        throw new Error('Due date is required for high priority tasks and must be within 7 days.');
      }
      return true;
    }),
  
  // Due date validation with custom rules
  body('dueDate')
    .optional()
    .trim()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date format (e.g., 2026-12-31T10:00:00Z)')
    .custom((value, { req }) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is valid
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid date format. Please provide a valid date.');
      }
      
      // Check if date is in the past
      if (dueDate < today) {
        throw new Error('Due date cannot be in the past. Please select a future date.');
      }
      
      // Check if date is too far in the future (e.g., more than 5 years)
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
      
      if (dueDate > fiveYearsFromNow) {
        throw new Error('Due date cannot be more than 5 years in the future.');
      }
      
      // If priority is high, due date must be within 7 days
      const priority = req.body.priority?.toLowerCase();
      if (priority === 'high') {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999);
        
        if (dueDate > sevenDaysFromNow) {
          throw new Error('High priority tasks must have a due date within 7 days from today.');
        }
      }
      
      return true;
    })
    .toDate(), // Convert to Date object
  
  // Additional custom validation for the entire body
  body()
    .custom((value, { req }) => {
      // Check for unexpected fields
      const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate'];
      const requestFields = Object.keys(req.body);
      const unexpectedFields = requestFields.filter(field => !allowedFields.includes(field));
      
      if (unexpectedFields.length > 0) {
        throw new Error(`Unexpected fields found: ${unexpectedFields.join(', ')}. Allowed fields are: ${allowedFields.join(', ')}`);
      }
      
      return true;
    })
];

// Validation rules for task update with sanitization
export const validateUpdateTask: ValidationChain[] = [
  // Title validation with sanitization
  body('title')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-_,.!?()]+$/)
    .withMessage('Title can only contain letters, numbers, spaces, and basic punctuation (- _ , . ! ? ( ))')
    .customSanitizer((value) => {
      return value ? value.replace(/\s+/g, ' ') : value;
    }),
  
  // Description validation with sanitization
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .customSanitizer((value) => {
      if (value) {
        return value.replace(/\s+/g, ' ').trim();
      }
      return value;
    }),
  
  // Status validation
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be one of: pending, in-progress, completed')
    .custom((value, { req }) => {
      // Custom rule: Cannot mark as completed if status is currently pending (business logic example)
      // This is just an example, you can adjust based on requirements
      return true;
    }),
  
  // Priority validation
  body('priority')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high')
    .custom((value, { req }) => {
      // If priority is being set to high, dueDate must be present and within 7 days
      if (value === 'high' && !req.body.dueDate) {
        throw new Error('Due date is required for high priority tasks and must be within 7 days.');
      }
      return true;
    }),
  
  // Due date validation
  body('dueDate')
    .optional()
    .trim()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date format')
    .custom((value, { req }) => {
      if (value) {
        const dueDate = new Date(value);
        
        if (isNaN(dueDate.getTime())) {
          throw new Error('Invalid date format. Please provide a valid date.');
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          throw new Error('Due date cannot be in the past.');
        }
        
        // If priority is high, due date must be within 7 days
        const priority = req.body.priority?.toLowerCase();
        if (priority === 'high') {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          sevenDaysFromNow.setHours(23, 59, 59, 999);
          
          if (dueDate > sevenDaysFromNow) {
            throw new Error('High priority tasks must have a due date within 7 days from today.');
          }
        }
      }
      return true;
    })
    .toDate(),
  
  // Custom validation to ensure at least one field is provided
  body()
    .custom((value, { req }) => {
      const { title, description, status, priority, dueDate } = req.body;
      
      if (!title && !description && status === undefined && priority === undefined && dueDate === undefined) {
        throw new Error('At least one field must be provided for update. Allowed fields: title, description, status, priority, dueDate');
      }
      
      // Check for unexpected fields
      const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate'];
      const requestFields = Object.keys(req.body);
      const unexpectedFields = requestFields.filter(field => !allowedFields.includes(field));
      
      if (unexpectedFields.length > 0) {
        throw new Error(`Unexpected fields found: ${unexpectedFields.join(', ')}. Allowed fields are: ${allowedFields.join(', ')}`);
      }
      
      return true;
    })
];

// Validation rules for task ID parameter
export const validateTaskId: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Task ID is required in the URL path')
    .isUUID()
    .withMessage('Invalid task ID format. Task ID must be a valid UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)')
    .customSanitizer((value) => {
      // Ensure UUID is lowercase for consistency
      return value.toLowerCase();
    })
];
