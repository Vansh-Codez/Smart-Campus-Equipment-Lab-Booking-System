const API_BASE_URL = 'http://localhost:8000/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not on login page, remove token
    if (!window.location.pathname.includes('/login')) {
      removeAuthToken();
    }
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Users
  getUsers: () => request<any[]>('/users'),
  approveUser: (id: number) => request<any>(`/users/${id}/approve`, { method: 'PUT' }),
  updateUserApproval: (id: number, is_approved: boolean) => request<any>(`/users/${id}/approval`, { method: 'PUT', body: JSON.stringify({ is_approved }) }),
  updateUserRole: (id: number, role: string) => request<any>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  getStudentRecords: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<any[]>(`/users/student-records${query}`);
  },
  createStudentRecord: (data: any) => request<any>('/users/student-records', { method: 'POST', body: JSON.stringify(data) }),

  // Labs
  getLabs: () => request<any[]>('/labs'),
  getLab: (id: number) => request<any>(`/labs/${id}`),
  createLab: (data: any) => request<any>('/labs', { method: 'POST', body: JSON.stringify(data) }),
  updateLab: (id: number, data: any) => request<any>(`/labs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLab: (id: number) => request<void>(`/labs/${id}`, { method: 'DELETE' }),

  // Equipment
  getEquipment: (params?: { category?: string; status?: string; lab_id?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.lab_id) query.set('lab_id', String(params.lab_id));
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/equipment${queryString}`);
  },
  getCategories: () => request<string[]>('/equipment/categories'),
  getEquipmentDetail: (id: number) => request<any>(`/equipment/${id}`),
  getEquipmentLifecycles: (id: number) => request<any[]>(`/equipment/${id}/lifecycles`),
  createEquipment: (data: any) => request<any>('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipment: (id: number, data: any) => request<any>(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEquipment: (id: number) => request<void>(`/equipment/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (data: { equipment_id: number; start_time: string; end_time: string; justification: string }) =>
    request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => request<any[]>('/bookings/my'),
  getCalendarSlots: (params?: { equipment_id?: number; lab_id?: number; start?: string; end?: string }) => {
    const query = new URLSearchParams();
    if (params?.equipment_id) query.set('equipment_id', String(params.equipment_id));
    if (params?.lab_id) query.set('lab_id', String(params.lab_id));
    if (params?.start) query.set('start', params.start);
    if (params?.end) query.set('end', params.end);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/bookings/calendar${queryString}`);
  },
  getQueue: (status_filter: string = 'all') => request<any[]>(`/bookings/queue?status_filter=${status_filter}`),
  reviewBooking: (id: number, data: { status: string; assistant_notes?: string }) =>
    request<any>(`/bookings/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  checkoutBooking: (id: number, data: { check_out_condition?: string; check_out_photo?: string; assistant_notes?: string }) =>
    request<any>(`/bookings/${id}/checkout`, { method: 'POST', body: JSON.stringify(data) }),
  checkinBooking: (id: number, data: { check_in_condition?: string; is_damaged?: boolean; damage_description?: string; assistant_notes?: string }) =>
    request<any>(`/bookings/${id}/checkin`, { method: 'POST', body: JSON.stringify(data) }),
  cancelBooking: (id: number) => request<any>(`/bookings/${id}/cancel`, { method: 'POST' }),

  // Maintenance
  getMaintenance: (resolved_status: string = 'all') => request<any[]>(`/maintenance?resolved_status=${resolved_status}`),
  createMaintenance: (data: { equipment_id: number; issue_description: string; cost?: number }) =>
    request<any>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id: number, data: { resolved_status?: string; cost?: number; resolution_notes?: string }) =>
    request<any>(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Analytics
  getAnalyticsDashboard: () => request<any>('/analytics/dashboard'),
};
