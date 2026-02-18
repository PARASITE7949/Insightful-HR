# Data Persistence Migration Guide

## Current State
- **Problem**: Client uses localStorage for all data (tasks, attendance, appraisals)
- **Solution**: Switch to MongoDB backend API for persistent storage

## Server API Endpoints (Ready)

### Tasks
- `POST /api/users/:userId/tasks` - Create task
- `GET /api/users/:userId/tasks` - Get user tasks
- `PUT /api/users/tasks/:taskId` - Update task

### Attendance
- `POST /api/users/:userId/attendance` - Create attendance record
- `GET /api/users/:userId/attendance` - Get attendance records

### Appraisals
- `GET /api/users/:userId/appraisals` - Get appraisals for user

## Implementation Steps

### 1. Update Employee Tasks Page
**File**: `client/src/pages/employee/Tasks.tsx`

Change from:
```typescript
import { getTasks, addTask, updateTask, deleteTask } from "@/lib/storage";

const [tasks, setTasks] = useState<Task[]>(getTasks(user.id));

const handleSubmit = () => {
  addTask(newTask);  // localStorage only
};
```

To:
```typescript
import apiClient from "@/lib/apiClient";

useEffect(() => {
  const fetchTasks = async () => {
    const response = await apiClient.getTasks(user.id);
    if (response.success) setTasks(response.data);
  };
  fetchTasks();
}, [user.id]);

const handleSubmit = async () => {
  const response = await apiClient.post(`/users/${user.id}/tasks`, newTask);
  if (response.success) {
    toast.success("Task created in MongoDB");
    refreshTasks();
  }
};
```

### 2. Update Employee Attendance Page
**File**: `client/src/pages/employee/Attendance.tsx`

Change from:
```typescript
import { getAttendance, addAttendance, updateAttendance } from "@/lib/storage";
```

To:
```typescript
import apiClient from "@/lib/apiClient";

// Fetch from backend
const response = await apiClient.get(`/users/${user.id}/attendance`);

// Create new record
const response = await apiClient.post(`/users/${user.id}/attendance`, {
  date, checkIn, checkOut, status, workingHours
});
```

### 3. Key Pages to Update
- [x] Employee Tasks (critical)
- [x] Employee Attendance (critical)
- [ ] Employee Dashboard (fetch real data)
- [ ] HR Dashboard (fetch all company data)
- [ ] HR Appraisals (fetch MongoDB data)

## Data Flow Diagram

```
Client UI (React)
     ↓
apiClient (HTTP requests with auth token)
     ↓
Express Backend (5001)
     ↓
MongoDB (insightful-hr database)
     ↓
Collections: tasks, attendance, appraisals, users, companies
```

## Testing Data Persistence

### 1. Start dependencies
```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Server
cd server && npm run dev

# Terminal 3: Client
cd client && npm run dev
```

### 2. Test flow
1. Login at `http://localhost:8084`
2. Go to Employee → Tasks
3. Create a new task
4. Refresh the page (should persist from MongoDB)
5. Check MongoDB:
```bash
use insightful-hr
db.tasks.find()  # Should see your task
```

### 3. Verify endpoint responses
```bash
# Get user tasks
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/users/USER_ID/tasks

# Create task
curl -X POST http://localhost:5001/api/users/USER_ID/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test task","priority":"high","dueDate":"2026-02-15"}'
```

## Fallback Strategy (for offline support)

Keep localStorage as a cache:
```typescript
// Try backend first
try {
  const response = await apiClient.getTasks(userId);
  if (response.success) {
    setTasks(response.data);
    localStorage.setItem('cachedTasks', JSON.stringify(response.data));
  }
} catch (error) {
  // Use cached data if backend fails
  const cached = JSON.parse(localStorage.getItem('cachedTasks') || '[]');
  setTasks(cached);
}
```

## Database Schema Verification

Run this in MongoDB shell to verify collections:
```javascript
use insightful-hr
show collections

// Check task structure
db.tasks.findOne()
// Should return:
// {
//   "_id": "uuid",
//   "userId": "user-uuid",
//   "companyId": "company-uuid",
//   "title": string,
//   "description": string,
//   "project": string,
//   "status": "pending|in-progress|completed",
//   "priority": "low|medium|high",
//   "dueDate": "2026-02-15",
//   "completedAt": string (optional),
//   "createdAt": timestamp,
//   "updatedAt": timestamp
// }
```

## Environment Variables

Ensure server `.env` has:
```bash
MONGODB_URI=mongodb://localhost:27017/insightful-hr
PORT=5001
FRONTEND_URLS=http://localhost:8082,http://localhost:8083,http://localhost:8084
NODE_ENV=development
```

## Progress Checklist

- [ ] Update Employee Tasks page to use apiClient
- [ ] Update Employee Attendance page to use apiClient
- [ ] Update Employee Dashboard to fetch from backend
- [ ] Update HR Appraisals to use apiClient
- [ ] Update HR Dashboard to fetch real company data
- [ ] Test end-to-end data persistence
- [ ] Verify data appears in MongoDB collections
- [ ] Document API error handling
- [ ] Add loading states during API calls
- [ ] Implement request timeout handling

## Troubleshooting

**Problem**: "Cannot read property 'map' of undefined when fetching tasks"
- **Cause**: API response didn't return data array
- **Fix**: Check apiClient response structure, add null checks

**Problem**: "401 Unauthorized" on API calls
- **Cause**: Token not in localStorage or expired
- **Fix**: Login again, check token in DevTools → Application → localStorage

**Problem**: CORS error
- **Cause**: Client port not in server FRONTEND_URLS
- **Fix**: Add port 8084 to server `.env` FRONTEND_URLS

**Problem**: MongoDB connection refused
- **Cause**: MongoDB not running or wrong connection string
- **Fix**: Start MongoDB or verify MONGODB_URI in `.env`
