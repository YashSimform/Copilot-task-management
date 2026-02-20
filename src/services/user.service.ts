import { User, CreateUserDTO, UpdateUserDTO } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

class UserService {
  private users: Map<string, User> = new Map();

  constructor() {
    // Initialize with some sample data
    this.seedData();
  }

  private seedData(): void {
    const sampleUser: User = {
      id: uuidv4(),
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123', // In real app, this should be hashed
      role: 'customer',
      phone: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  createUser(userData: CreateUserDTO): User {
    const newUser: User = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: userData.password, // In real app, hash this
      role: userData.role || 'customer',
      phone: userData.phone,
      address: userData.address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  updateUser(id: string, updateData: UpdateUserDTO): User | null {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...updateData,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  getUserCount(): number {
    return this.users.size;
  }
}

export default new UserService();
