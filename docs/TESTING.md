# 🧪 Complete Testing Guide

Comprehensive guide for testing the Insightful HR application.

## 📋 Prerequisites

- ✅ Backend running on http://localhost:5001
- ✅ Frontend running on http://localhost:5173
- ✅ MongoDB connected
- ✅ Postman or curl (for API testing)
- ✅ Browser DevTools (F12)

---

## 🎯 Test Flow Overview

```
1. API Health Check
   ↓
2. Company Registration
   ↓
3. User Registration (with OTP)
   ↓
4. User Login
   ↓
5. Feature Testing (Attendance, Tasks, Appraisals)
   ↓
6. Database Verification
```

---

## 🧪 API Testing

### Test 1: Health Check

**Verify backend is running**

```bash
curl http://localhost:5001/health
```

**Expected Response:**
```json
{ "status": "ok" }
```

### Test 2: Register Company

**Create company with super admin**

```bash
curl -X POST http://localhost:5001/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "domain": "techcorp.com",
    "superAdminName": "Admin User",
    "superAdminEmail": "admin@techcorp.com",
    "superAdminPassword": "Admin@123"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "companyId": "550e8400-...",
    "superAdminId": "550e8400-..."
  }
}
```

**✅ Status**: Company created

### Test 3: Request OTP

**Get OTP for email verification**

```bash
curl -X POST http://localhost:5001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "john@techcorp.com"}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

**📝 Save OTP for next test**

### Test 4: Verify OTP

**Verify the OTP**

```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@techcorp.com",
    "otp": "123456"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

**✅ Status**: OTP verified

### Test 5: Register User

**Register employee with verified OTP**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Developer",
    "email": "john@techcorp.com",
    "phone": "1234567890",
    "password": "Pass@123",
    "role": "employee",
    "department": "Engineering",
    "position": "Software Developer",
    "otp": "123456"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "550e8400-...",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-...",
      "name": "John Developer",
      "email": "john@techcorp.com",
      "role": "employee",
      "companyId": "550e8400-..."
    }
  }
}
```

**📝 Save JWT token for next tests**

### Test 6: Login User

**Authenticate user and get token**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@techcorp.com",
    "password": "Pass@123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-...",
      "name": "John Developer",
      "email": "john@techcorp.com",
      "role": "employee"
    }
  }
}
```

**✅ Status**: User authenticated

### Test 7: Get Current User

**Get authenticated user details**

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Replace `YOUR_JWT_TOKEN` with token from Test 6**

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "name": "John Developer",
    "email": "john@techcorp.com",
    "role": "employee"
  }
}
```

**✅ Status**: Auth working

### Test 8: Create Attendance

**Record daily attendance**

```bash
curl -X POST http://localhost:5001/api/users/USER_ID/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-02-08",
    "checkIn": "09:00 AM",
    "checkOut": "05:00 PM",
    "status": "present",
    "workingHours": 8
  }'
```

**Replace `USER_ID` with user ID from Test 5**

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Attendance record created",
  "data": {
    "id": "550e8400-...",
    "date": "2024-02-08",
    "status": "present"
  }
}
```

**✅ Status**: Attendance recorded

### Test 9: Get Attendance

**Retrieve attendance records**

```bash
curl -X GET "http://localhost:5001/api/users/USER_ID/attendance?month=02&year=2024" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "date": "2024-02-08",
      "checkIn": "09:00 AM",
      "checkOut": "05:00 PM",
      "status": "present",
      "workingHours": 8
    }
  ]
}
```

**✅ Status**: Attendance retrieved

### Test 10: Create Task

**Create a task for user**

```bash
curl -X POST http://localhost:5001/api/users/USER_ID/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "description": "Fix authentication issue",
    "project": "HR System",
    "priority": "high",
    "dueDate": "2024-02-15"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Task created",
  "data": {
    "id": "550e8400-...",
    "title": "Fix login bug",
    "priority": "high"
  }
}
```

**✅ Status**: Task created

### Test 11: Get Tasks

**Retrieve user tasks**

```bash
curl -X GET "http://localhost:5001/api/users/USER_ID/tasks?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "title": "Fix login bug",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**✅ Status**: Tasks retrieved

### Test 12: Update Task

**Mark task as completed**

```bash
curl -X PUT http://localhost:5001/api/users/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completedAt": "2024-02-10"
  }'
```

**Replace `TASK_ID` with task ID from Test 10**

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Task updated",
  "data": {
    "status": "completed",
    "completedAt": "2024-02-10"
  }
}
```

**✅ Status**: Task updated

---

## 🌐 Browser Testing

### Step 1: Open Application

1. Open browser: http://localhost:5173
2. You should see login page

### Step 2: Register Company

1. Click "Create Company Account"
2. Fill form:
   - Company: Tech Corp
   - Domain: techcorp.com
   - Admin Name: Admin User
   - Email: admin@techcorp.com
   - Password: Admin@123
3. Click "Register"
4. ✅ Should see success message

### Step 3: Register Employee

1. Click "Register as Employee"
2. Fill form:
   - Email: jane@techcorp.com
   - Name: Jane Developer
   - Phone: 9876543210
   - Password: Pass@123
   - Role: Employee
   - Department: Engineering
   - Position: Developer
3. Click "Request OTP"
4. Check browser console for OTP (in development)
5. Enter OTP
6. Click "Submit"
7. ✅ Should redirect to dashboard

### Step 4: Login

1. Click "Logout"
2. Click "Login"
3. Enter:
   - Email: jane@techcorp.com
   - Password: Pass@123
4. Click "Login"
5. ✅ Should see dashboard

### Step 5: Test Attendance

1. Go to "Attendance" tab
2. Click "Mark Attendance"
3. Enter:
   - Check In: 09:00 AM
   - Check Out: 05:00 PM
   - Status: Present
4. Click "Submit"
5. ✅ Should see record in list

### Step 6: Test Tasks

1. Go to "Tasks" tab
2. Click "Create Task"
3. Fill:
   - Title: Complete API testing
   - Project: HR System
   - Priority: High
   - Due Date: Tomorrow
4. Click "Submit"
5. ✅ Task appears in list
6. Click on task to expand
7. Change status to "Completed"
8. ✅ Status updates

### Step 7: Test Profile

1. Click "Profile" in menu
2. ✅ Should see user details
3. Verify all information is correct

---

## 🗄️ Database Testing

### Connect to MongoDB

```bash
mongosh
# or
mongo
```

### Select Database

```javascript
use insightful-hr
```

### Test 1: Verify Collections

```javascript
show collections
```

**Should see:**
- attendance
- appraisals
- companies
- tasks
- users
- systemlogs

### Test 2: Verify Companies

```javascript
db.companies.find().pretty()
```

**Should show:**
- Company "Tech Corp"
- Domain "techcorp.com"
- Super Admin ID

### Test 3: Verify Users

```javascript
db.users.find({}, { password: 0 }).pretty()
```

**Should show:**
- Super admin user
- Employee user (Jane)
- Correct roles and departments

### Test 4: Verify Attendance

```javascript
db.attendance.find().pretty()
```

**Should show:**
- Attendance record for today
- Check-in and check-out times
- Status: present
- Working hours: 8

### Test 5: Verify Tasks

```javascript
db.tasks.find().pretty()
```

**Should show:**
- Task created
- Correct title and project
- Priority: high
- Status: completed

### Test 6: Count Records

```javascript
db.users.countDocuments()
db.attendance.countDocuments()
db.tasks.countDocuments()
db.companies.countDocuments()
```

**Should show:**
- 1+ companies
- 2+ users
- 1+ attendance
- 1+ tasks

### Test 7: Query User

```javascript
db.users.findOne({ email: "jane@techcorp.com" })
```

**Should show:**
- User Jane
- Role: employee
- Department: Engineering

### Test 8: Query Attendance by Date

```javascript
db.attendance.find({ date: "2024-02-08" }).pretty()
```

**Should show:**
- Attendance record
- Correct check-in/out times

---

## 🐛 Troubleshooting

### Backend Not Responding

**Problem**: Cannot connect to localhost:5001

**Solutions**:
1. Check backend is running: `npm run dev` in server folder
2. Check port 5001 is not in use: `netstat -ano | findstr :5001`
3. Change port in `server/.env`
4. Restart backend server

### MongoDB Connection Error

**Problem**: "MongoDB connection error"

**Solutions**:
1. Start MongoDB: `mongod` or service
2. Check `MONGODB_URI` in `server/.env`
3. Verify connection string format
4. For Atlas: enable IP whitelist

### OTP Not Working

**Problem**: Cannot get or verify OTP

**Solutions**:
1. Check console for OTP (development mode)
2. Wait 5 minutes before requesting new OTP
3. Verify email format
4. Check backend logs for errors

### Port Already in Use

**Problem**: "Port 5001 already in use"

**Solutions**:
```bash
# Find process
netstat -ano | findstr :5001

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### CORS Error

**Problem**: "No 'Access-Control-Allow-Origin' header"

**Solutions**:
1. Check `FRONTEND_URL` in `server/.env`
2. Make sure it's `http://localhost:5173`
3. Restart backend after changing
4. Check browser console for exact error

### Token Invalid

**Problem**: "Invalid or expired token"

**Solutions**:
1. Re-login to get new token
2. Clear browser cache
3. Check token format in requests
4. Verify `JWT_SECRET` in `.env`

### Database Queries Slow

**Problem**: Queries taking long time

**Solutions**:
1. Check indexes: `db.collection.getIndexes()`
2. Use aggregation for complex queries
3. Limit results with pagination
4. Monitor with `db.setProfilingLevel(1)`

---

## ✅ Test Checklist

- [ ] Health check passes
- [ ] Company registration works
- [ ] OTP system working
- [ ] User registration successful
- [ ] Login authenticates correctly
- [ ] JWT token generated
- [ ] Protected routes accessible
- [ ] Attendance recording works
- [ ] Attendance retrieval works
- [ ] Task creation works
- [ ] Task updates work
- [ ] Database has all collections
- [ ] Database has correct data
- [ ] Users can view profile
- [ ] Security headers present
- [ ] CORS working properly
- [ ] Rate limiting working
- [ ] Logs being recorded

---

## 🎉 All Tests Pass?

Congratulations! Your application is fully functional and ready for:
- ✅ Development
- ✅ Testing
- ✅ Deployment

**Next Steps**:
1. Deploy to production
2. Monitor performance
3. Add more features
4. Scale as needed

---

**Last Updated**: February 8, 2026
**Version**: 1.0
