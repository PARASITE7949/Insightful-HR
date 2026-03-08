const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
      });

      // Handle rate limiting (429) gracefully
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        return {
          success: false,
          message: `Rate limit exceeded. Please wait ${retryAfter || "a moment"} before trying again.`,
          data: null as any,
        };
      }

      // Handle unauthorized (401) - Clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        // Don't redirect if we're already on an auth page
        const isAuthPage = window.location.pathname.includes("/login") ||
          window.location.pathname.includes("/register") ||
          window.location.pathname === "/";

        if (!isAuthPage) {
          window.location.href = "/login";
        }

        return {
          success: false,
          message: "Session expired. Please login again.",
          data: null as any,
        };
      }

      // Try to parse JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        // If it's a rate limit message, return a proper error
        if (response.status === 429 || text.includes("Too many requests")) {
          return {
            success: false,
            message: "Too many requests. Please wait a moment before trying again.",
            data: null as any,
          };
        }
        throw new Error(text || "API request failed");
      }

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error: any) {
      // Handle JSON parse errors
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        console.error("API Error: Non-JSON response", error);
        return {
          success: false,
          message: "Server error. Please try again later.",
          data: null as any,
        };
      }
      console.error("API Error:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Auth endpoints
  async registerCompany(companyData: {
    name: string;
    domain: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
  }): Promise<ApiResponse> {
    return this.request("/auth/register-company", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
    department: string;
    position: string;
  }): Promise<ApiResponse> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request("/auth/me", {
      method: "GET",
    });
  }

  async getPendingApprovals(): Promise<ApiResponse> {
    return this.request("/auth/pending-approvals", {
      method: "GET",
    });
  }

  async approveUser(userId: string): Promise<ApiResponse> {
    return this.request("/auth/approve-user", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async rejectUser(userId: string, reason: string): Promise<ApiResponse> {
    return this.request("/auth/reject-user", {
      method: "POST",
      body: JSON.stringify({ userId, reason }),
    });
  }

  // User endpoints
  async getUsers(): Promise<ApiResponse> {
    return this.request("/users", {
      method: "GET",
    });
  }

  async updateUser(userId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async createAttendance(userId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/${userId}/attendance`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAttendance(userId: string, month?: string, year?: string): Promise<ApiResponse> {
    let url = `/users/${userId}/attendance`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.request(url, { method: "GET" });
  }

  async getCompanyAttendance(date?: string): Promise<ApiResponse> {
    let url = `/users/attendance/company`;
    if (date) url += `?date=${date}`;
    return this.request(url, { method: "GET" });
  }

  async updateAttendance(attendanceId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/attendance/${attendanceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateAppraisal(appraisalId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/appraisals/${appraisalId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async createTask(userId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/${userId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTasks(userId: string, status?: string): Promise<ApiResponse> {
    let url = `/users/${userId}/tasks`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.request(url, {
      method: "GET",
    });
  }

  async updateTask(taskId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getAppraisals(): Promise<ApiResponse> {
    return this.request(`/users${this.getUserIdFromToken()}/appraisals`, {
      method: "GET",
    });
  }

  async getAppraisalsByUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}/appraisals`, {
      method: "GET",
    });
  }

  async getCompanyAppraisals(month?: string, year?: string, status?: string): Promise<ApiResponse> {
    let url = `/users/appraisals/all`;
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, { method: "GET" });
  }

  async generateMonthlyAppraisals(month: number, year: number): Promise<ApiResponse> {
    return this.request(`/users/appraisals/generate/monthly`, {
      method: "POST",
      body: JSON.stringify({ month, year }),
    });
  }

  // Daily Report endpoints
  async generateDailyReport(userId: string, date?: string, isHalfDay: boolean = false): Promise<ApiResponse> {
    return this.request(`/users/${userId}/daily-report`, {
      method: "POST",
      body: JSON.stringify({ date, isHalfDay }),
    });
  }

  async getDailyReport(userId: string, date?: string): Promise<ApiResponse> {
    let url = `/users/${userId}/daily-report`;
    if (date) url += `?date=${date}`;
    return this.request(url, { method: "GET" });
  }

  async getCompanyDailyReports(date?: string, status?: string): Promise<ApiResponse> {
    let url = `/users/daily-reports/all`;
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, { method: "GET" });
  }

  async replyToDailyReport(reportId: string, reply: string, replyType: "manager" | "hr"): Promise<ApiResponse> {
    return this.request(`/users/daily-reports/${reportId}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply, replyType }),
    });
  }

  // Real-time Performance
  async getRealTimePerformance(userId: string, date?: string): Promise<ApiResponse> {
    let url = `/users/${userId}/performance/realtime`;
    if (date) url += `?date=${date}`;
    return this.request(url, { method: "GET" });
  }

  // System Logs
  async getSystemLogs(category?: string, limit?: number): Promise<ApiResponse> {
    let url = `/system-logs`;
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (limit) params.append("limit", limit.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, { method: "GET" });
  }

  // Holidays & Events
  async getHolidays(month?: number, year?: number): Promise<ApiResponse> {
    let url = `/holidays`;
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, { method: "GET" });
  }

  async createHoliday(data: {
    date: string;
    name: string;
    type: "holiday" | "festival" | "government" | "company_event" | "other";
    description?: string;
    isRecurring?: boolean;
    recurringMonth?: number;
    recurringDay?: number;
  }): Promise<ApiResponse> {
    return this.request(`/holidays`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateHoliday(holidayId: string, data: any): Promise<ApiResponse> {
    return this.request(`/holidays/${holidayId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteHoliday(holidayId: string): Promise<ApiResponse> {
    return this.request(`/holidays/${holidayId}`, { method: "DELETE" });
  }

  // Notifications
  async getNotifications(limit: number = 20, skip: number = 0, unreadOnly: boolean = false): Promise<ApiResponse> {
    let url = `/notifications?limit=${limit}&skip=${skip}`;
    if (unreadOnly) url += "&unreadOnly=true";
    return this.request(url, { method: "GET" });
  }

  async sendNotification(data: { title: string; message: string; type?: string; targetUserIds?: string[] }): Promise<ApiResponse> {
    return this.request("/notifications/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUnreadCount(): Promise<ApiResponse> {
    return this.request(`/notifications/unread-count`, { method: "GET" });
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request(`/notifications/all/read`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
  }

  private getUserIdFromToken(): string {
    // Extract userId from JWT if available
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return `/${payload.userId}`;
    } catch {
      return "";
    }
  }
}

export default new ApiClient();
