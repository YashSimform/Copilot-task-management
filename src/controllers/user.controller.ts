import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { CreateUserDTO, UpdateUserDTO } from '../models/user.model';

export class UserController {
  // GET /api/users - Get all users
  getAllUsers = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const users = userService.getAllUsers();
      
      // Remove password from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      
      res.status(200).json({
        success: true,
        count: users.length,
        data: sanitizedUsers,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/:id - Get user by ID
  getUserById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const user = userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: `User not found with id: ${id}`,
        });
        return;
      }

      // Remove password from response
      const { password, ...sanitizedUser } = user;

      res.status(200).json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users - Create a new user
  createUser = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userData: CreateUserDTO = req.body;

      // Check if email already exists
      const existingUser = userService.getUserByEmail(userData.email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      const newUser = userService.createUser(userData);

      // Remove password from response
      const { password, ...sanitizedUser } = newUser;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: sanitizedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/users/:id - Update a user
  updateUser = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const updateData: UpdateUserDTO = req.body;

      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const existingUser = userService.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== id) {
          res.status(400).json({
            success: false,
            message: 'Email already in use by another user',
          });
          return;
        }
      }

      const updatedUser = userService.updateUser(id, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: `User not found with id: ${id}`,
        });
        return;
      }

      // Remove password from response
      const { password, ...sanitizedUser } = updatedUser;

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: sanitizedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/users/:id - Delete a user
  deleteUser = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;

      const deleted = userService.deleteUser(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `User not found with id: ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/stats/count - Get total user count
  getUserCount = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const count = userService.getUserCount();

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();
