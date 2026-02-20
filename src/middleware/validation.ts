import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors: { [key: string]: string } = {};
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        formattedErrors[error.path] = error.msg;
      }
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }
  
  next();
};

// Validation rules for user creation
export const validateCreateUser: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user', 'customer'])
    .withMessage('Role must be one of: admin, user, customer'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Invalid phone format')
    .custom((value) => {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        throw new Error('Phone number must contain at least 10 digits');
      }
      return true;
    })
];

// Validation rules for user update
export const validateUpdateUser: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user', 'customer'])
    .withMessage('Role must be one of: admin, user, customer'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Invalid phone format')
    .custom((value) => {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        throw new Error('Phone number must contain at least 10 digits');
      }
      return true;
    }),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  // Custom validation to ensure at least one field is provided
  body()
    .custom((value, { req }) => {
      const { name, email, password, phone, role, address } = req.body;
      if (!name && !email && !password && !phone && !role && !address) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    })
];

// Validation rules for user ID parameter
export const validateUserId: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format')
];
