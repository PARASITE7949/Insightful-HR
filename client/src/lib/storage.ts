import { User, AttendanceRecord, Task, AppraisalReport, Project, SystemSettings, Company, SystemLog, PromotionRecord } from "@/types";

const STORAGE_KEYS = {
  COMPANIES: "eas_companies",
  USERS: "eas_users",
  CURRENT_USER: "eas_current_user",
  ATTENDANCE: "eas_attendance",
  TASKS: "eas_tasks",
  APPRAISALS: "eas_appraisals",
  PROJECTS: "eas_projects",
  SETTINGS: "eas_settings",
  LOGS: "eas_logs",
  PROMOTIONS: "eas_promotions",
  OTP_STORE: "eas_otp_store",
};

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Company functions
export function getCompanies(): Company[] {
  return getItem(STORAGE_KEYS.COMPANIES, []);
}

export function getCompanyById(id: string): Company | undefined {
  return getCompanies().find(c => c.id === id);
}

export function getCompanyByDomain(domain: string): Company | undefined {
  return getCompanies().find(c => c.domain.toLowerCase() === domain.toLowerCase());
}

export function addCompany(company: Company): void {
  const companies = getCompanies();
  companies.push(company);
  setItem(STORAGE_KEYS.COMPANIES, companies);
}

export function updateCompany(id: string, updates: Partial<Company>): void {
  const companies = getCompanies();
  const index = companies.findIndex(c => c.id === id);
  if (index !== -1) {
    companies[index] = { ...companies[index], ...updates };
    setItem(STORAGE_KEYS.COMPANIES, companies);
  }
}

// Extract domain from email
export function extractDomainFromEmail(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1] : "";
}

// User functions
export function getUsers(): User[] {
  return getItem(STORAGE_KEYS.USERS, []);
}

export function getUsersByCompany(companyId: string): User[] {
  return getUsers().filter(u => u.companyId === companyId);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user: User): void {
  const users = getUsers();
  users.push(user);
  setItem(STORAGE_KEYS.USERS, users);
}

export function updateUser(id: string, updates: Partial<User>): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    setItem(STORAGE_KEYS.USERS, users);
  }
}

export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  setItem(STORAGE_KEYS.USERS, users);
}

// Session functions
export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
}

// Attendance functions
export function getAttendance(userId?: string, companyId?: string): AttendanceRecord[] {
  let records = getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  if (companyId) records = records.filter(r => r.companyId === companyId);
  if (userId) records = records.filter(r => r.userId === userId);
  return records;
}

export function addAttendance(record: AttendanceRecord): void {
  const records = getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  records.push(record);
  setItem(STORAGE_KEYS.ATTENDANCE, records);
}

export function updateAttendance(id: string, updates: Partial<AttendanceRecord>): void {
  const records = getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    setItem(STORAGE_KEYS.ATTENDANCE, records);
  }
}

export function getTodayAttendance(userId: string): AttendanceRecord | undefined {
  const today = new Date().toISOString().split("T")[0];
  return getAttendance(userId).find(r => r.date === today);
}

// Task functions
export function getTasks(userId?: string, companyId?: string): Task[] {
  let tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  if (companyId) tasks = tasks.filter(t => t.companyId === companyId);
  if (userId) tasks = tasks.filter(t => t.userId === userId);
  return tasks;
}

export function addTask(task: Task): void {
  const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  tasks.push(task);
  setItem(STORAGE_KEYS.TASKS, tasks);
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    setItem(STORAGE_KEYS.TASKS, tasks);
  }
}

export function deleteTask(id: string): void {
  const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []).filter(t => t.id !== id);
  setItem(STORAGE_KEYS.TASKS, tasks);
}

// Project functions
export function getProjects(companyId?: string): Project[] {
  const projects = getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  return companyId ? projects.filter(p => p.companyId === companyId) : projects;
}

export function addProject(project: Project): void {
  const projects = getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  projects.push(project);
  setItem(STORAGE_KEYS.PROJECTS, projects);
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates };
    setItem(STORAGE_KEYS.PROJECTS, projects);
  }
}

// Appraisal functions
export function getAppraisals(companyId?: string): AppraisalReport[] {
  const appraisals = getItem<AppraisalReport[]>(STORAGE_KEYS.APPRAISALS, []);
  return companyId ? appraisals.filter(a => a.companyId === companyId) : appraisals;
}

export function getAppraisalsByUser(userId: string): AppraisalReport[] {
  return getItem<AppraisalReport[]>(STORAGE_KEYS.APPRAISALS, []).filter(a => a.userId === userId);
}

export function addAppraisal(appraisal: AppraisalReport): void {
  const appraisals = getItem<AppraisalReport[]>(STORAGE_KEYS.APPRAISALS, []);
  appraisals.push(appraisal);
  setItem(STORAGE_KEYS.APPRAISALS, appraisals);
}

export function updateAppraisal(id: string, updates: Partial<AppraisalReport>): void {
  const appraisals = getItem<AppraisalReport[]>(STORAGE_KEYS.APPRAISALS, []);
  const index = appraisals.findIndex(a => a.id === id);
  if (index !== -1) {
    appraisals[index] = { ...appraisals[index], ...updates };
    setItem(STORAGE_KEYS.APPRAISALS, appraisals);
  }
}

// Settings functions
export function getSettings(companyId: string): SystemSettings {
  const raw = getItem<SystemSettings[] | Record<string, any>>(STORAGE_KEYS.SETTINGS, []);
  const allSettings = Array.isArray(raw) ? raw : [];
  const companySettings = allSettings.find(s => s.companyId === companyId);
  return companySettings || {
    companyId,
    companyName: "Company",
    workingHoursPerDay: 8,
    lateThresholdMinutes: 15,
    performanceWeights: {
      attendance: 25,
      punctuality: 20,
      taskCompletion: 30,
      projects: 25,
    },
  };
}

export function updateSettings(companyId: string, settings: Partial<SystemSettings>): void {
  const raw = getItem<SystemSettings[] | Record<string, any>>(STORAGE_KEYS.SETTINGS, []);
  const allSettings = Array.isArray(raw) ? raw : [];
  const index = allSettings.findIndex(s => s.companyId === companyId);
  if (index !== -1) {
    allSettings[index] = { ...allSettings[index], ...settings };
  } else {
    allSettings.push({ ...getSettings(companyId), ...settings, companyId });
  }
  setItem(STORAGE_KEYS.SETTINGS, allSettings);
}

// System Logs
export function getLogs(companyId: string): SystemLog[] {
  return getItem<SystemLog[]>(STORAGE_KEYS.LOGS, [])
    .filter(l => l.companyId === companyId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addLog(log: Omit<SystemLog, "id" | "timestamp">): void {
  const logs = getItem<SystemLog[]>(STORAGE_KEYS.LOGS, []);
  logs.push({
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  });
  setItem(STORAGE_KEYS.LOGS, logs);
}

// Promotion functions
export function getPromotions(companyId?: string, userId?: string): PromotionRecord[] {
  let records = getItem<PromotionRecord[]>(STORAGE_KEYS.PROMOTIONS, []);
  if (companyId) records = records.filter(r => r.companyId === companyId);
  if (userId) records = records.filter(r => r.userId === userId);
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addPromotion(record: PromotionRecord): void {
  const records = getItem<PromotionRecord[]>(STORAGE_KEYS.PROMOTIONS, []);
  records.push(record);
  setItem(STORAGE_KEYS.PROMOTIONS, records);
}

// OTP simulation
export function generateOTP(phone: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpStore = getItem<Record<string, { otp: string; expiresAt: number }>>(STORAGE_KEYS.OTP_STORE, {});
  otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min expiry
  setItem(STORAGE_KEYS.OTP_STORE, otpStore);
  return otp;
}

export function verifyOTP(phone: string, otp: string): boolean {
  const otpStore = getItem<Record<string, { otp: string; expiresAt: number }>>(STORAGE_KEYS.OTP_STORE, {});
  const entry = otpStore[phone];
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  if (entry.otp !== otp) return false;
  // Clean up
  delete otpStore[phone];
  setItem(STORAGE_KEYS.OTP_STORE, otpStore);
  return true;
}

// Generate sample data for a company
export function generateCompanySampleData(companyId: string, superAdminId: string): void {
  const employees: User[] = [
    {
      id: `${companyId}-emp-001`,
      companyId,
      email: `john@${companyId}.com`,
      name: "John Smith",
      role: "employee",
      department: "Engineering",
      position: "Software Developer",
      joinDate: "2023-01-15",
      isActive: true,
    },
    {
      id: `${companyId}-emp-002`,
      companyId,
      email: `sarah@${companyId}.com`,
      name: "Sarah Johnson",
      role: "employee",
      department: "Marketing",
      position: "Marketing Specialist",
      joinDate: "2023-03-20",
      isActive: true,
    },
    {
      id: `${companyId}-emp-003`,
      companyId,
      email: `mike@${companyId}.com`,
      name: "Mike Wilson",
      role: "employee",
      department: "Engineering",
      position: "Senior Developer",
      joinDate: "2022-08-10",
      isActive: true,
    },
  ];

  const hrManager: User = {
    id: `${companyId}-hr-001`,
    companyId,
    email: `hr@${companyId}.com`,
    name: "Emily Brown",
    role: "hr_manager",
    department: "Human Resources",
    position: "HR Manager",
    joinDate: "2021-05-01",
    isActive: true,
  };

  const adminStaff: User = {
    id: `${companyId}-admin-001`,
    companyId,
    email: `admin@${companyId}.com`,
    name: "Admin Staff",
    role: "admin_staff",
    department: "Administration",
    position: "Administrative Manager",
    joinDate: "2021-01-01",
    isActive: true,
  };

  // Add users
  const existingUsers = getUsers();
  const newUsers = [...employees, hrManager, adminStaff].filter(
    u => !existingUsers.some(eu => eu.email === u.email)
  );
  newUsers.forEach(u => addUser(u));

  // Add projects
  const projects: Project[] = [
    {
      id: `${companyId}-proj-001`,
      companyId,
      name: "Website Redesign",
      description: "Complete overhaul of company website",
      status: "active",
      startDate: "2024-01-01",
      teamMembers: [`${companyId}-emp-001`, `${companyId}-emp-003`],
    },
    {
      id: `${companyId}-proj-002`,
      companyId,
      name: "Marketing Campaign Q1",
      description: "Q1 2024 marketing initiatives",
      status: "active",
      startDate: "2024-01-15",
      teamMembers: [`${companyId}-emp-002`],
    },
  ];
  projects.forEach(p => addProject(p));

  // Generate attendance for employees
  const allEmployees = [...employees];
  const today = new Date();
  
  allEmployees.forEach(emp => {
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const isPresent = Math.random() > 0.1;
      const isLate = Math.random() > 0.7;
      const checkInHour = isLate ? 9 + Math.floor(Math.random() * 2) : 9;
      const checkInMin = isLate ? Math.floor(Math.random() * 45) + 15 : Math.floor(Math.random() * 15);
      
      addAttendance({
        id: `att-${emp.id}-${date.toISOString().split("T")[0]}`,
        userId: emp.id,
        companyId,
        date: date.toISOString().split("T")[0],
        checkIn: isPresent ? `${checkInHour.toString().padStart(2, "0")}:${checkInMin.toString().padStart(2, "0")}` : null,
        checkOut: isPresent ? `${17 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}` : null,
        status: isPresent ? (isLate ? "late" : "present") : "absent",
        workingHours: isPresent ? 7 + Math.random() * 2 : 0,
      });
    }
  });

  // Generate tasks
  const statuses: Task["status"][] = ["pending", "in-progress", "completed"];
  const priorities: Task["priority"][] = ["low", "medium", "high"];
  
  allEmployees.forEach(emp => {
    const empProjects = projects.filter(p => p.teamMembers.includes(emp.id));
    
    for (let i = 0; i < 6; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) - 10);
      
      addTask({
        id: `task-${emp.id}-${i}`,
        userId: emp.id,
        companyId,
        title: `Task ${i + 1} for ${emp.name}`,
        description: `Description for task ${i + 1}`,
        project: empProjects[Math.floor(Math.random() * empProjects.length)]?.name || "General",
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        dueDate: dueDate.toISOString().split("T")[0],
        completedAt: status === "completed" ? new Date().toISOString() : undefined,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  });

  // Initialize settings
  updateSettings(companyId, {
    companyId,
    companyName: "Company",
    workingHoursPerDay: 8,
    lateThresholdMinutes: 15,
    performanceWeights: {
      attendance: 25,
      punctuality: 20,
      taskCompletion: 30,
      projects: 25,
    },
  });
}

// Check if any company exists
export function hasAnyCompany(): boolean {
  return getCompanies().length > 0;
}
