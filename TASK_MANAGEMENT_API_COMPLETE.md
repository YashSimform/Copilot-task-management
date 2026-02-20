# Task Management API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Features Implemented](#features-implemented)
4. [Completed Task Protection](#completed-task-protection)
5. [High Priority Task Rules](#high-priority-task-rules)
6. [Advanced Validation](#advanced-validation)
7. [Request Logging](#request-logging)
8. [Complete Testing Guide](#complete-testing-guide)
9. [Error Handling](#error-handling)
10. [Quick Reference](#quick-reference)

---

## Overview

This is a RESTful API for task management with advanced features including validation, completed task protection, and priority-based rules. The API follows REST conventions with proper HTTP methods, status codes, and includes comprehensive input validation and error handling. All data is stored in-memory (no database).

**Base URL:** `http://localhost:5000`

**Technology Stack:**
- Node.js + Express.js + TypeScript
- express-validator for validation
- Morgan for request logging
- UUID for unique identifiers

---

## API Endpoints

### Task Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | Get all tasks (with filtering) | No |
| GET | `/api/tasks/:id` | Get task by ID | No |
| POST | `/api/tasks` | Create a new task | No |
| PUT | `/api/tasks/:id` | Update a task | No |
| DELETE | `/api/tasks/:id` | Delete a task | No |
| POST | `/api/tasks/:id/reopen` | Reopen completed task | No |
| GET | `/api/tasks/stats/count` | Get total task count | No |
| GET | `/api/tasks/stats/status` | Get tasks grouped by status | No |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |

---

## Features Implemented

### ✅ Core Features
- RESTful API design
- Full CRUD operations (Create, Read, Update, Delete)
- In-memory data storage (no database required)
- Request logging with Morgan
- Input validation with express-validator
- Error handling middleware
- Proper HTTP status codes
- TypeScript for type safety
- Modular MVC architecture

### ✅ Advanced Features
- **Completed Task Protection** - Prevents editing/deleting completed tasks
- **High Priority Rules** - Enforces 7-day deadline for high priority tasks
- **Advanced Validation** - Custom rules, sanitization, detailed errors
- **Due Date Sorting** - Tasks sorted by urgency
- **Request Logging** - Tracks all API calls with execution time
- **Task Reopening** - Workflow to modify completed tasks

---

## Completed Task Protection

### 🔒 Protection Rules

#### Rule 1: Completed tasks CANNOT be edited
- Once status is set to **"completed"**, task becomes **read-only**
- No fields can be modified (title, description, priority, etc.)
- Returns **403 Forbidden** error if attempted

#### Rule 2: Completed tasks CANNOT be deleted
- Completed tasks are **archived** for record-keeping
- Returns **403 Forbidden** error if attempted
- Ensures historical data is preserved

#### Rule 3: How to edit a completed task
- Use the **Reopen** endpoint: `POST /api/tasks/:id/reopen`
- Changes status back to "in-progress"
- After reopening, task becomes editable again

### Examples

#### Create and Complete a Task
```bash
# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull requests",
    "status": "pending",
    "priority": "medium"
  }'

# Mark as completed
curl -X PUT http://localhost:5000/api/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

#### Try to Edit Completed Task (FAILS)
```bash
curl -X PUT http://localhost:5000/api/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Cannot update a completed task. Completed tasks are locked and cannot be modified.",
  "hint": "If you need to make changes, first change the status back to \"pending\" or \"in-progress\" by updating only the status field."
}
```

#### Reopen and Edit
```bash
# Reopen the task
curl -X POST http://localhost:5000/api/tasks/{taskId}/reopen

# Now edit successfully
curl -X PUT http://localhost:5000/api/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated After Reopen"}'
```

---

## High Priority Task Rules

### 📋 The 7-Day Rule

When creating or updating a task with **priority = "high"**:
- ✅ Due date is **REQUIRED** (cannot be omitted)
- ✅ Due date must be **within 7 days** from today
- ❌ Cannot have due date more than 7 days in future
- ❌ Cannot have due date in the past

### Task Sorting Logic

Tasks are sorted by:
1. **Due Date** (Primary) - Nearest due date first
2. **Priority** (Secondary) - High → Medium → Low
3. **Created Date** (Tertiary) - Newest first

### Business Logic Summary

| Priority | Due Date Required? | Due Date Constraint |
|----------|-------------------|---------------------|
| High     | ✅ Yes            | Within 7 days       |
| Medium   | ❌ No             | Any future date     |
| Low      | ❌ No             | Any future date     |

### Examples

#### ✅ Valid: High Priority with Due Date
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Critical Bug Fix",
    "priority": "high",
    "dueDate": "2026-02-25T23:59:59Z"
  }'
```

#### ❌ Invalid: High Priority WITHOUT Due Date
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urgent Task",
    "priority": "high"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed. Please check the errors below.",
  "errors": {
    "priority": "Due date is required for high priority tasks and must be within 7 days."
  }
}
```

#### ❌ Invalid: High Priority with Due Date > 7 Days
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urgent Task",
    "priority": "high",
    "dueDate": "2026-03-15T10:00:00Z"
  }'
```

**Response:**
```json
{
  "success": false,
  "errors": {
    "dueDate": "High priority tasks must have a due date within 7 days from today."
  }
}
```

---

## Advanced Validation

### 🛡️ Validation Features

#### Title Validation
- **Length**: 3-200 characters
- **Characters**: Letters, numbers, spaces, and punctuation (- _ , . ! ? ( ))
- **XSS Prevention**: HTML characters escaped
- **Normalization**: Multiple spaces → single space

#### Description Validation
- **Length**: Max 1000 characters
- **XSS Prevention**: HTML escaped
- **Normalization**: Whitespace normalized

#### Due Date Validation
- **Format**: Valid ISO 8601 format
- **Past Prevention**: Cannot be in the past
- **Future Limit**: Cannot exceed 5 years
- **High Priority**: Must be within 7 days for high priority

#### Status & Priority Validation
- **Enumeration**: Must match predefined values
- **Case Normalization**: Automatically lowercase
- **Business Rules**: Priority affects due date requirements

#### Field Whitelisting
- Only allows specified fields
- Reports unexpected fields with detailed error

### Request Body Sanitization

Automatic sanitization applied:
- `trim()` - Removes whitespace
- `escape()` - Escapes HTML (prevents XSS)
- `toLowerCase()` - Normalizes enums
- `customSanitizer()` - Space normalization
- `toDate()` - Converts date strings

### Enhanced Error Response Format

```json
{
  "success": false,
  "message": "Validation failed. Please check the errors below.",
  "errors": {
    "title": "Title must be between 3 and 200 characters",
    "dueDate": "Due date cannot be in the past. Please select a future date."
  },
  "details": [
    "title: Title must be between 3 and 200 characters",
    "dueDate: Due date cannot be in the past. Please select a future date."
  ],
  "timestamp": "2026-02-20T10:30:00.000Z"
}
```

### Validation Test Cases

#### Test: XSS Attack Prevention
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test <script>alert(\"XSS\")</script>",
    "description": "<img src=x onerror=alert(1)>"
  }'
```
**Result:** HTML characters are escaped

#### Test: Title Too Short
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "AB"}'
```

#### Test: Unexpected Fields
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "unknownField": "value"
  }'
```

#### Test: Multiple Errors
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB",
    "status": "invalid",
    "priority": "urgent",
    "dueDate": "2020-01-01"
  }'
```

---

## Request Logging

### 📊 Morgan Integration

Every request is logged with the format:
```
[METHOD] /endpoint - Execution time: Xms
```

**Example logs:**
```
[POST] /api/tasks - Execution time: 45ms
[GET] /api/tasks - Execution time: 12ms
[PUT] /api/tasks/abc123 - Execution time: 28ms
[DELETE] /api/tasks/abc123 - Execution time: 15ms
```

**Features:**
- Captures all incoming requests
- Includes request method, URL, and execution time
- Health check endpoint is skipped (optional)
- Console output for development

---

## Complete Testing Guide

### 🧪 Basic CRUD Tests

#### 1. Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "pending",
    "priority": "medium",
    "dueDate": "2026-03-15T10:00:00Z"
  }'
```

#### 2. Get All Tasks
```bash
curl -X GET http://localhost:5000/api/tasks
```

#### 3. Get Task by ID
```bash
curl -X GET http://localhost:5000/api/tasks/{taskId}
```

#### 4. Update Task
```bash
curl -X PUT http://localhost:5000/api/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2026-02-25T10:00:00Z"
  }'
```

#### 5. Delete Task
```bash
curl -X DELETE http://localhost:5000/api/tasks/{taskId}
```

---

### 🔥 Filtering Tests

```bash
# Filter by status
curl -X GET "http://localhost:5000/api/tasks?status=pending"

# Filter by priority
curl -X GET "http://localhost:5000/api/tasks?priority=high"

# Filter by both
curl -X GET "http://localhost:5000/api/tasks?status=in-progress&priority=high"
```

---

### 📈 Statistics Tests

```bash
# Get total count
curl -X GET http://localhost:5000/api/tasks/stats/count

# Get tasks grouped by status
curl -X GET http://localhost:5000/api/tasks/stats/status
```

---

### 🎯 Complete Workflow Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api/tasks"

echo "=== Task Management API Complete Test ==="

# 1. Create high priority task
echo -e "\n1. Creating high priority task..."
RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Critical Bug Fix",
    "priority": "high",
    "dueDate": "2026-02-25T10:00:00Z"
  }')
echo "$RESPONSE" | jq '.'
TASK_ID=$(echo "$RESPONSE" | jq -r '.data.id')

# 2. Update to in-progress
echo -e "\n2. Updating to in-progress..."
curl -s -X PUT "$BASE_URL/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}' | jq '.'

# 3. Mark as completed
echo -e "\n3. Marking as completed..."
curl -s -X PUT "$BASE_URL/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}' | jq '.'

# 4. Try to edit (should fail)
echo -e "\n4. Attempting to edit completed task (should fail)..."
curl -s -X PUT "$BASE_URL/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated"}' | jq '.'

# 5. Try to delete (should fail)
echo -e "\n5. Attempting to delete completed task (should fail)..."
curl -s -X DELETE "$BASE_URL/$TASK_ID" | jq '.'

# 6. Reopen the task
echo -e "\n6. Reopening the task..."
curl -s -X POST "$BASE_URL/$TASK_ID/reopen" | jq '.'

# 7. Edit after reopening
echo -e "\n7. Editing after reopen (should succeed)..."
curl -s -X PUT "$BASE_URL/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated After Reopen"}' | jq '.'

# 8. Delete the task
echo -e "\n8. Deleting the reopened task..."
curl -s -X DELETE "$BASE_URL/$TASK_ID" | jq '.'

echo -e "\n=== Test Complete ==="
```

**Save as:** `test-complete.sh`

**Run with:**
```bash
chmod +x test-complete.sh
./test-complete.sh
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error |
| 403 | Forbidden | Completed task edit/delete |
| 404 | Not Found | Task not found |
| 500 | Server Error | Internal error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Specific error message"
  },
  "details": ["field: error message"],
  "timestamp": "2026-02-20T10:30:00.000Z",
  "hint": "Optional helpful hint"
}
```

---

## Quick Reference

### Task Model

```typescript
{
  id: string;              // UUID
  title: string;           // 3-200 chars
  description?: string;    // Max 1000 chars
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;          // ISO 8601
  createdAt: Date;
  updatedAt: Date;
}
```

### Validation Rules Summary

| Field | Required | Rules |
|-------|----------|-------|
| title | Yes | 3-200 chars, alphanumeric + punctuation |
| description | No | Max 1000 chars |
| status | No | pending/in-progress/completed |
| priority | No | low/medium/high |
| dueDate | Conditional | Required for high priority, within 7 days |

### Special Rules

- ✅ High priority tasks **require** due date within 7 days
- ✅ Completed tasks **cannot** be edited (use reopen)
- ✅ Completed tasks **cannot** be deleted
- ✅ Tasks sorted by: due date → priority → created date
- ✅ All inputs are sanitized (XSS prevention)
- ✅ Detailed validation errors returned

### Endpoint Quick List

```bash
# CRUD Operations
POST   /api/tasks              # Create
GET    /api/tasks              # Read all (with filters)
GET    /api/tasks/:id          # Read one
PUT    /api/tasks/:id          # Update
DELETE /api/tasks/:id          # Delete

# Special Operations
POST   /api/tasks/:id/reopen   # Reopen completed task

# Statistics
GET    /api/tasks/stats/count  # Total count
GET    /api/tasks/stats/status # Group by status
```

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                          # Express configuration
│   ├── server.ts                       # Server entry point
│   ├── controllers/
│   │   ├── task.controller.ts          # Task CRUD + reopen logic
│   │   └── health.controller.ts        # Health check
│   ├── models/
│   │   └── task.model.ts               # Task interfaces & DTOs
│   ├── services/
│   │   └── task.service.ts             # In-memory storage + sorting
│   ├── routes/
│   │   ├── task.routes.ts              # Task route definitions
│   │   └── health.routes.ts            # Health routes
│   └── middleware/
│       ├── taskValidation.ts           # Validation rules
│       ├── requestLogger.ts            # Morgan logging
│       └── errorHandler.ts             # Global error handler
├── TASK_MANAGEMENT_API_COMPLETE.md     # This file
├── package.json
├── tsconfig.json
└── nodemon.json
```

---

## Running the Application

### Prerequisites
```bash
Node.js >= 16.x
npm >= 8.x
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment

Default server runs on: `http://localhost:5000`

---

## Best Practices

1. ✅ **Always check task status** before operations
2. ✅ **Use reopen endpoint** to modify completed tasks
3. ✅ **High priority tasks** must have due dates within 7 days
4. ✅ **Validate inputs** on client side for better UX
5. ✅ **Handle errors gracefully** with proper messages
6. ✅ **Use filtering** to get specific task subsets
7. ✅ **Check logs** for request execution times
8. ✅ **Test thoroughly** before production

---

## Security Features

- ✅ XSS Prevention (HTML escaping)
- ✅ Input Sanitization (trim, normalize)
- ✅ Type Validation (dates, UUIDs, enums)
- ✅ Length Constraints (prevents overflow)
- ✅ Character Whitelisting (prevents injection)
- ✅ Field Whitelisting (rejects unexpected fields)
- ✅ Error Messages (no sensitive data leak)
- ✅ Request Logging (audit trail)

---

## Summary

This Task Management API provides a complete solution with:

✅ **Full CRUD Operations** - Create, Read, Update, Delete tasks
✅ **Smart Protection** - Completed tasks are locked
✅ **Priority Rules** - High priority = 7-day deadline
✅ **Advanced Validation** - Custom rules + sanitization
✅ **Due Date Sorting** - Most urgent tasks first
✅ **Request Logging** - Track all API calls
✅ **Error Handling** - Detailed, helpful error messages
✅ **Type Safety** - TypeScript throughout
✅ **Security** - XSS prevention, input sanitization

**Need Help?** Check the test scripts and examples above!

---

**Last Updated:** February 20, 2026
**Version:** 1.0.0
**License:** MIT
