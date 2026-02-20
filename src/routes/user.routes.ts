import { Router } from 'express';
import userController from '../controllers/user.controller';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

// GET /api/users/stats/count - Get total user count (must be before /:id route)
router.get('/stats/count', userController.getUserCount);

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', validateUserId, handleValidationErrors, userController.getUserById);

// POST /api/users - Create a new user
router.post('/', validateCreateUser, handleValidationErrors, userController.createUser);

// PUT /api/users/:id - Update a user
router.put(
  '/:id',
  validateUserId,
  validateUpdateUser,
  handleValidationErrors,
  userController.updateUser
);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', validateUserId, handleValidationErrors, userController.deleteUser);

export default router;
