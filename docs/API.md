# 🔌 API Documentation

Complete reference for all Insightful HR API endpoints.

## 📍 Base URL

```
http://localhost:5001/api
```

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔑 Authentication Endpoints

### 1. Register Company

Creates a new company with super admin account.

```http
POST /auth/register-company
Content-Type: application/json

{
  "name": "Tech Corp",
  "domain": "techcorp.com",
  "superAdminName": "John Admin",
  "superAdminEmail": "admin@techcorp.com",
  "superAdminPassword": "Admin@123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "companyId": "uuid-here",
    "superAdminId": "uuid-here"
  }
}
```

### 2. Request OTP

Sends OTP to email for verification.

```http
POST /auth/request-otp
Content-Type: application/json

{
  "email": "user@company.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Development only
}
```

### 3. Verify OTP

Verifies the OTP sent to email.

```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@company.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### 4. Register User

Registers a new user with verified OTP.

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Developer",
  "email": "john@techcorp.com",
  "phone": "1234567890",
  "password": "Pass@123",
  "role": "employee",
  "department": "Engineering",
  "position": "Software Developer",
  "otp": "123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "token": "jwt-token-here",
    "user": {
      "id": "uuid-here",
      "name": "John Developer",
      "email": "john@techcorp.com",
      "role": "employee",
      "companyId": "uuid-here"
    }
  }
}
```

### 5. Login

Authenticate user and get JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@techcorp.com",
  "password": "Pass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid-here",
      "name": "John Developer",
      "email": "john@techcorp.com",
      "role": "employee",
      "department": "Engineering",
      "position": "Software Developer",
      "companyId": "uuid-here"
    }
  }
}
```

### 6. Get Current User

Get authenticated user information.

```http
GET /auth/me
Authorization: Bearer JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "John Developer",
    "email": "john@techcorp.com",
    "role": "employee",
    "department": "Engineering",
    "position": "Software Developer",
    "companyId": "uuid-here"
  }
}
```

---

## 👥 User Endpoints

### 7. Get All Users

Get all users in your company.

```http
GET /users
Authorization: Bearer JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "John Developer",
      "email": "john@techcorp.com",
      "role": "employee",
      "department": "Engineering",
      "position": "Software Developer"
    }
  ]
}
```

---

## 📊 Attendance Endpoints

### 8. Create Attendance Record

Record daily attendance (check-in/check-out).

```http
POST /users/:userId/attendance
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "date": "2024-02-08",
  "checkIn": "09:00 AM",
  "checkOut": "05:00 PM",
  "status": "present",
  "workingHours": 8
}
```

**Parameters:**
- `status`: `"present"`, `"absent"`, `"late"`, `"half-day"`
- `workingHours`: Number of hours worked

**Response (201):**
```json
{
  "success": true,
  "message": "Attendance record created",
  "data": {
    "id": "attendance-id",
    "userId": "user-id",
    "date": "2024-02-08",
    "status": "present",
    "workingHours": 8
  }
}
```

### 9. Get Attendance Records

Retrieve attendance records for a user.

```http
GET /users/:userId/attendance?month=02&year=2024
Authorization: Bearer JWT_TOKEN
```

**Query Parameters:**
- `month`: Month number (1-12) - Optional
- `year`: Year - Optional

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "attendance-id",
      "userId": "user-id",
      "date": "2024-02-08",
      "checkIn": "09:00 AM",
      "checkOut": "05:00 PM",
      "status": "present",
      "workingHours": 8
    }
  ]
}
```

---

## 📋 Task Endpoints

### 10. Create Task

Create a new task for a user.

```http
POST /users/:userId/tasks
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Fix authentication issue on login page",
  "project": "HR System",
  "priority": "high",
  "dueDate": "2024-02-15",
  "status": "pending"
}
```

**Parameters:**
- `priority`: `"low"`, `"medium"`, `"high"`
- `status`: `"pending"`, `"in-progress"`, `"completed"`

**Response (201):**
```json
{
  "success": true,
  "message": "Task created",
  "data": {
    "id": "task-id",
    "userId": "user-id",
    "title": "Fix login bug",
    "priority": "high",
    "status": "pending",
    "dueDate": "2024-02-15"
  }
}
```

### 11. Get Tasks

Retrieve tasks for a user.

```http
GET /users/:userId/tasks?status=pending
Authorization: Bearer JWT_TOKEN
```

**Query Parameters:**
- `status`: Filter by status - Optional

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-id",
      "title": "Fix login bug",
      "description": "Fix authentication issue",
      "project": "HR System",
      "priority": "high",
      "status": "pending",
      "dueDate": "2024-02-15"
    }
  ]
}
```

### 12. Update Task

Update a task (mark complete, change status, etc).

```http
PUT /users/tasks/:taskId
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "status": "completed",
  "completedAt": "2024-02-10"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task updated",
  "data": {
    "id": "task-id",
    "status": "completed",
    "completedAt": "2024-02-10"
  }
}
```

---

## 📈 Appraisal Endpoints

### 13. Get Appraisals

Retrieve appraisal records for a user.

```http
GET /users/:userId/appraisals
Authorization: Bearer JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "appraisal-id",
      "userId": "user-id",
      "employeeName": "John Developer",
      "month": "February",
      "year": 2024,
      "overallScore": 85,
      "status": "pending",
      "finalRating": "meets-expectations"
    }
  ]
}
```

---

## ❌ Error Responses

### 400 - Bad Request

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Email is required", "Password must be at least 6 characters"]
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 - Forbidden

```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

### 404 - Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 - Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🧪 Testing with curl

### Register Company
```bash
curl -X POST http://localhost:5001/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "domain": "techcorp.com",
    "superAdminName": "John Admin",
    "superAdminEmail": "admin@techcorp.com",
    "superAdminPassword": "Admin@123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techcorp.com",
    "password": "Admin@123"
  }'
```

### Get Current User (with token)
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Task
```bash
curl -X POST http://localhost:5001/api/users/USER_ID/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix bug",
    "project": "HR System",
    "priority": "high",
    "dueDate": "2024-02-15"
  }'
```

---

## 🔗 Related Documentation

- [Setup Guide](../SETUP.md)
- [Testing Guide](TESTING.md)
- [Database Schema](DATABASE.md)
- [Backend README](../server/README.md)

---

**API Version**: 1.0
**Last Updated**: February 8, 2026
