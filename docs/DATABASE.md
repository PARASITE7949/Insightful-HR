# 🗄️ Database Schema Documentation

Complete MongoDB database schema for Insightful HR.

## 📊 Collections Overview

| Collection | Purpose | Records |
|-----------|---------|---------|
| Companies | Store organization data | 1+ per deployment |
| Users | Store user accounts | 10-1000+ |
| Attendance | Track daily attendance | 100-10000+ |
| Tasks | Store task assignments | 50-5001+ |
| Appraisals | Performance reviews | 50-1000+ |
| SystemLogs | Audit trail | 1000+ |

---

## 📋 Companies Collection

Stores organization/company information.

### Schema

```javascript
{
  _id: ObjectId,
  name: String,                    // Company name
  domain: String,                  // Email domain (unique)
  superAdminId: String,            // Reference to super admin user
  createdAt: ISODate,              // Creation timestamp
  updatedAt: ISODate               // Last update timestamp
}
```

### Indexes

```javascript
// Unique domain
db.companies.createIndex({ domain: 1 }, { unique: true })
```

### Example Document

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Tech Corp",
  "domain": "techcorp.com",
  "superAdminId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": ISODate("2024-02-08T10:00:00Z"),
  "updatedAt": ISODate("2024-02-08T10:00:00Z")
}
```

### Queries

```javascript
// Find company by domain
db.companies.findOne({ domain: "techcorp.com" })

// Find all companies
db.companies.find({}).pretty()

// Find company by ID
db.companies.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })
```

---

## 👤 Users Collection

Stores user account information.

### Schema

```javascript
{
  _id: ObjectId,
  companyId: String,               // Reference to company
  email: String,                   // Unique email per company
  phone: String,                   // Optional phone number
  phoneVerified: Boolean,          // Phone verification status
  name: String,                    // User full name
  password: String,                // Hashed password (bcrypt)
  role: String,                    // User role (enum)
  department: String,              // Department name
  position: String,                // Job position
  joinDate: ISODate,               // Join date
  avatar: String,                  // Optional avatar URL
  address: String,                 // Optional address
  isActive: Boolean,               // Account active status
  createdAt: ISODate,              // Creation timestamp
  updatedAt: ISODate               // Last update timestamp
}
```

### Indexes

```javascript
// Unique email
db.users.createIndex({ email: 1 }, { unique: true })

// Compound index for company and email
db.users.createIndex({ companyId: 1, email: 1 })

// For queries by company
db.users.createIndex({ companyId: 1 })
```

### User Roles

- `super_admin` - Full system access
- `hr_manager` - HR department access
- `admin_staff` - Administrative tasks
- `employee` - Regular employee access

### Example Document

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@techcorp.com",
  "phone": "1234567890",
  "phoneVerified": true,
  "name": "John Developer",
  "password": "$2b$10$...", // bcrypt hash
  "role": "employee",
  "department": "Engineering",
  "position": "Software Developer",
  "joinDate": ISODate("2024-02-01T00:00:00Z"),
  "isActive": true,
  "createdAt": ISODate("2024-02-08T10:05:00Z"),
  "updatedAt": ISODate("2024-02-08T10:05:00Z")
}
```

### Queries

```javascript
// Find user by email
db.users.findOne({ email: "john@techcorp.com" })

// Find all users in company
db.users.find({ companyId: "550e8400-e29b-41d4-a716-446655440000" })

// Find all active employees
db.users.find({ 
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  isActive: true,
  role: "employee"
})

// Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

---

## 📊 Attendance Collection

Stores daily attendance records.

### Schema

```javascript
{
  _id: ObjectId,
  userId: String,                  // Reference to user
  companyId: String,               // Reference to company
  date: String,                    // Date (YYYY-MM-DD format)
  checkIn: String,                 // Check-in time (HH:MM format)
  checkOut: String,                // Check-out time (HH:MM format)
  status: String,                  // Attendance status (enum)
  workingHours: Number,            // Hours worked
  createdAt: ISODate,              // Creation timestamp
  updatedAt: ISODate               // Last update timestamp
}
```

### Status Values

- `present` - Marked present
- `absent` - Marked absent
- `late` - Late arrival
- `half-day` - Half day leave

### Indexes

```javascript
// User and date index
db.attendance.createIndex({ userId: 1, date: 1 })

// Company and date index
db.attendance.createIndex({ companyId: 1, date: 1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "550e8400-e29b-41d4-a716-446655440001",
  "date": "2024-02-08",
  "checkIn": "09:00",
  "checkOut": "17:30",
  "status": "present",
  "workingHours": 8.5,
  "createdAt": ISODate("2024-02-08T09:00:00Z"),
  "updatedAt": ISODate("2024-02-08T17:30:00Z")
}
```

### Queries

```javascript
// Get attendance for user in February 2024
db.attendance.find({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  date: { $gte: "2024-02-01", $lte: "2024-02-29" }
})

// Get all present records for company
db.attendance.find({
  companyId: "550e8400-e29b-41d4-a716-446655440001",
  status: "present"
})

// Calculate monthly attendance statistics
db.attendance.aggregate([
  { $match: { 
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    date: { $gte: "2024-02-01", $lte: "2024-02-29" }
  }},
  { $group: { 
    _id: "$status", 
    count: { $sum: 1 },
    totalHours: { $sum: "$workingHours" }
  }}
])
```

---

## 📝 Tasks Collection

Stores task assignments and tracking.

### Schema

```javascript
{
  _id: ObjectId,
  userId: String,                  // Assigned to user
  companyId: String,               // Reference to company
  title: String,                   // Task title
  description: String,             // Task description
  project: String,                 // Project name
  status: String,                  // Task status (enum)
  priority: String,                // Task priority (enum)
  dueDate: String,                 // Due date (YYYY-MM-DD)
  completedAt: String,             // Completion date (if completed)
  createdAt: ISODate,              // Creation timestamp
  updatedAt: ISODate               // Last update timestamp
}
```

### Status Values

- `pending` - Not started
- `in-progress` - Currently working
- `completed` - Task finished

### Priority Values

- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority

### Indexes

```javascript
// User and status index
db.tasks.createIndex({ userId: 1, status: 1 })

// Company and status index
db.tasks.createIndex({ companyId: 1, status: 1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Fix login bug",
  "description": "Fix authentication issue on login page",
  "project": "HR System",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2024-02-15",
  "createdAt": ISODate("2024-02-08T10:00:00Z"),
  "updatedAt": ISODate("2024-02-08T14:00:00Z")
}
```

### Queries

```javascript
// Get pending tasks for user
db.tasks.find({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  status: "pending"
})

// Get high priority tasks due today
db.tasks.find({
  dueDate: "2024-02-08",
  priority: "high"
})

// Get completed tasks statistics
db.tasks.aggregate([
  { $match: { 
    companyId: "550e8400-e29b-41d4-a716-446655440001",
    status: "completed"
  }},
  { $group: { 
    _id: "$priority", 
    count: { $sum: 1 }
  }}
])
```

---

## 📈 Appraisals Collection

Stores performance appraisal records.

### Schema

```javascript
{
  _id: ObjectId,
  userId: String,                  // User being appraised
  companyId: String,               // Reference to company
  employeeName: String,            // Employee name (snapshot)
  department: String,              // Department name (snapshot)
  month: String,                   // Review month
  year: Number,                    // Review year
  attendanceScore: Number,         // 0-100
  punctualityScore: Number,        // 0-100
  taskCompletionScore: Number,     // 0-100
  projectScore: Number,            // 0-100
  overallScore: Number,            // 0-100 (calculated)
  aiAnalysis: String,              // AI-generated analysis
  status: String,                  // Appraisal status (enum)
  hrComments: String,              // HR comments
  finalRating: String,             // Final rating (enum)
  createdAt: ISODate,              // Creation timestamp
  updatedAt: ISODate               // Last update timestamp
}
```

### Status Values

- `pending` - Not reviewed
- `reviewed` - Under review
- `approved` - Approved
- `rejected` - Rejected

### Rating Values

- `exceptional` - Exceptional performance
- `exceeds-expectations` - Exceeds expectations
- `meets-expectations` - Meets expectations
- `needs-improvement` - Needs improvement
- `unsatisfactory` - Unsatisfactory

### Indexes

```javascript
// User and month/year index
db.appraisals.createIndex({ userId: 1, month: 1, year: 1 })

// Company and status index
db.appraisals.createIndex({ companyId: 1, status: 1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "550e8400-e29b-41d4-a716-446655440001",
  "employeeName": "John Developer",
  "department": "Engineering",
  "month": "February",
  "year": 2024,
  "attendanceScore": 95,
  "punctualityScore": 90,
  "taskCompletionScore": 85,
  "projectScore": 88,
  "overallScore": 89.5,
  "aiAnalysis": "Strong performer with good attendance...",
  "status": "pending",
  "finalRating": "meets-expectations",
  "createdAt": ISODate("2024-02-08T11:00:00Z"),
  "updatedAt": ISODate("2024-02-08T11:00:00Z")
}
```

### Queries

```javascript
// Get appraisals for user
db.appraisals.find({
  userId: "550e8400-e29b-41d4-a716-446655440000"
})

// Get pending appraisals
db.appraisals.find({
  companyId: "550e8400-e29b-41d4-a716-446655440001",
  status: "pending"
})

// Get average scores by rating
db.appraisals.aggregate([
  { $group: { 
    _id: "$finalRating", 
    avgScore: { $avg: "$overallScore" },
    count: { $sum: 1 }
  }}
])
```

---

## 🔍 SystemLogs Collection

Audit trail for all system actions.

### Schema

```javascript
{
  _id: ObjectId,
  userId: String,                  // User who performed action
  companyId: String,               // Reference to company
  action: String,                  // Action type
  resource: String,                // Resource affected
  description: String,             // Action description
  ipAddress: String,               // IP address of requester
  userAgent: String,               // Browser/client info
  timestamp: ISODate               // When action occurred
}
```

### Indexes

```javascript
// Company and timestamp index
db.systemlogs.createIndex({ companyId: 1, timestamp: -1 })

// User action tracking
db.systemlogs.createIndex({ userId: 1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "550e8400-e29b-41d4-a716-446655440001",
  "action": "USER_LOGIN",
  "resource": "User",
  "description": "John Developer logged in",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": ISODate("2024-02-08T10:00:00Z")
}
```

### Queries

```javascript
// Get all actions by user
db.systemlogs.find({
  userId: "550e8400-e29b-41d4-a716-446655440000"
})

// Get actions in date range
db.systemlogs.find({
  companyId: "550e8400-e29b-41d4-a716-446655440001",
  timestamp: { $gte: ISODate("2024-02-01"), $lte: ISODate("2024-02-28") }
})

// Get action statistics
db.systemlogs.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } }
])
```

---

## 🔗 Relationships

```
┌─────────────────┐
│   Companies     │
└─────────────────┘
        ↑
        │ 1:N (companyId)
        │
┌───────────────────────────────────────────────────┐
│                   Users                           │
└───────────────────────────────────────────────────┘
        ↑                    ↑
        │ 1:N (userId)       │ 1:N (userId)
        │                    │
        ├─────────────────────┼─────────────────────┐
        │                     │                     │
    Attendance             Tasks               Appraisals
                                               
SystemLogs: Tracks all actions from Users
```

---

## 🧪 MongoDB Queries

### Connection

```bash
# Connect to MongoDB
mongosh

# Use database
use insightful-hr
```

### View All Collections

```javascript
show collections
```

### Database Statistics

```javascript
db.stats()
```

### Collection Statistics

```javascript
db.users.stats()
db.attendance.stats()
db.tasks.stats()
db.appraisals.stats()
```

### Find Total Documents

```javascript
db.users.countDocuments()
db.attendance.countDocuments()
db.tasks.countDocuments()
db.appraisals.countDocuments()
db.systemlogs.countDocuments()
```

---

## 🔐 Security & Best Practices

1. **Passwords**: Always stored as bcrypt hashes
2. **Tokens**: JWT tokens, never stored in database
3. **Unique Constraints**: Email is unique across system
4. **Indexes**: Optimize query performance
5. **Timestamps**: Track all modifications
6. **Soft Deletes**: Use `isActive` flag instead of deleting
7. **Company Isolation**: All queries filtered by `companyId`

---

## 📈 Performance Considerations

### Common Queries to Index
- ✅ User by email: `{ email: 1 }`
- ✅ User by company: `{ companyId: 1 }`
- ✅ Attendance by user: `{ userId: 1, date: 1 }`
- ✅ Tasks by status: `{ status: 1 }`
- ✅ Appraisals by rating: `{ finalRating: 1 }`

### Query Optimization Tips
1. Use indexes for frequent queries
2. Limit results with pagination
3. Project only needed fields
4. Use aggregation for complex queries
5. Monitor slow queries

---

## 🔄 Data Maintenance

### Backup MongoDB

```bash
# Export database
mongodump --db insightful-hr --out backup/

# Import database
mongorestore --db insightful-hr backup/insightful-hr/
```

### Cleanup Old Logs

```javascript
// Delete logs older than 90 days
db.systemlogs.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

---

**Last Updated**: February 8, 2026
**Version**: 1.0
