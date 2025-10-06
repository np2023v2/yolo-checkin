import axios from 'axios';
import type { 
  User, 
  Dataset, 
  DatasetImage, 
  Annotation, 
  Model, 
  TrainingJob,
  PredictionResult,
  DatasetStatistics,
  Person,
  AttendanceRecord,
  FaceDetectionResult
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API
export const authApi = {
  register: async (email: string, username: string, password: string): Promise<User> => {
    const response = await apiClient.post('/auth/register', { email, username, password });
    return response.data;
  },
  
  login: async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Datasets API
export const datasetsApi = {
  list: async (): Promise<Dataset[]> => {
    const response = await apiClient.get('/datasets/');
    return response.data;
  },
  
  create: async (data: { name: string; description?: string; class_names: string[] }): Promise<Dataset> => {
    const response = await apiClient.post('/datasets/', data);
    return response.data;
  },
  
  get: async (id: number): Promise<Dataset> => {
    const response = await apiClient.get(`/datasets/${id}`);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Dataset>): Promise<Dataset> => {
    const response = await apiClient.put(`/datasets/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/datasets/${id}`);
  },
  
  uploadImage: async (datasetId: number, file: File, split: string = 'train'): Promise<DatasetImage> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('split', split);
    const response = await apiClient.post(`/datasets/${datasetId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  listImages: async (datasetId: number, split?: string): Promise<DatasetImage[]> => {
    const params = split ? { split } : {};
    const response = await apiClient.get(`/datasets/${datasetId}/images`, { params });
    return response.data;
  },
  
  getImage: async (datasetId: number, imageId: number): Promise<DatasetImage> => {
    const response = await apiClient.get(`/datasets/${datasetId}/images/${imageId}`);
    return response.data;
  },
  
  deleteImage: async (datasetId: number, imageId: number): Promise<void> => {
    await apiClient.delete(`/datasets/${datasetId}/images/${imageId}`);
  },
  
  getStatistics: async (datasetId: number): Promise<DatasetStatistics> => {
    const response = await apiClient.get(`/datasets/${datasetId}/statistics`);
    return response.data;
  },
  
  getAnnotations: async (datasetId: number, imageId: number): Promise<Annotation[]> => {
    const response = await apiClient.get(`/datasets/${datasetId}/images/${imageId}/annotations`);
    return response.data;
  },
  
  createAnnotation: async (datasetId: number, imageId: number, annotation: {
    class_id: number;
    class_name: string;
    x_center: number;
    y_center: number;
    width: number;
    height: number;
  }): Promise<Annotation> => {
    const response = await apiClient.post(`/datasets/${datasetId}/images/${imageId}/annotations`, annotation);
    return response.data;
  },
  
  deleteAnnotation: async (datasetId: number, imageId: number, annotationId: number): Promise<void> => {
    await apiClient.delete(`/datasets/${datasetId}/images/${imageId}/annotations/${annotationId}`);
  },
};

// Models API
export const modelsApi = {
  list: async (): Promise<Model[]> => {
    const response = await apiClient.get('/models/');
    return response.data;
  },
  
  create: async (data: { name: string; description?: string; model_type: string }): Promise<Model> => {
    const response = await apiClient.post('/models/', data);
    return response.data;
  },
  
  get: async (id: number): Promise<Model> => {
    const response = await apiClient.get(`/models/${id}`);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Model>): Promise<Model> => {
    const response = await apiClient.put(`/models/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/models/${id}`);
  },
  
  upload: async (id: number, file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/models/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  download: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/models/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  deploy: async (id: number): Promise<{ message: string; inference_endpoint: string }> => {
    const response = await apiClient.post(`/models/${id}/deploy`);
    return response.data;
  },
  
  undeploy: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/models/${id}/undeploy`);
    return response.data;
  },
};

// Training API
export const trainingApi = {
  list: async (): Promise<TrainingJob[]> => {
    const response = await apiClient.get('/training/');
    return response.data;
  },
  
  create: async (data: {
    dataset_id: number;
    model_type: string;
    epochs?: number;
    batch_size?: number;
    img_size?: number;
    learning_rate?: number;
    patience?: number;
  }): Promise<TrainingJob> => {
    const response = await apiClient.post('/training/', data);
    return response.data;
  },
  
  get: async (id: number): Promise<TrainingJob> => {
    const response = await apiClient.get(`/training/${id}`);
    return response.data;
  },
  
  cancel: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/training/${id}`);
    return response.data;
  },
  
  getLogs: async (id: number): Promise<{ job_id: number; status: string; current_epoch: number; total_epochs: number; best_map?: number; logs: string }> => {
    const response = await apiClient.get(`/training/${id}/logs`);
    return response.data;
  },
};

// Predictions API
export const predictionsApi = {
  predict: async (file: File, modelId: number, confidence?: number): Promise<PredictionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', modelId.toString());
    if (confidence !== undefined) {
      formData.append('confidence', confidence.toString());
    }
    const response = await apiClient.post('/predictions/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Check-in API
export const checkinApi = {
  // Persons management
  listPersons: async (activeOnly: boolean = true): Promise<Person[]> => {
    const response = await apiClient.get('/checkin/persons/', {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  getPerson: async (id: number): Promise<Person> => {
    const response = await apiClient.get(`/checkin/persons/${id}`);
    return response.data;
  },

  createPerson: async (name: string, file: File, employeeId?: string, department?: string): Promise<Person> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    if (employeeId) formData.append('employee_id', employeeId);
    if (department) formData.append('department', department);
    
    const response = await apiClient.post('/checkin/persons/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updatePerson: async (id: number, data: Partial<Person>): Promise<Person> => {
    const response = await apiClient.put(`/checkin/persons/${id}`, data);
    return response.data;
  },

  deletePerson: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/checkin/persons/${id}`);
    return response.data;
  },

  // Face detection
  detectFaces: async (file: File): Promise<FaceDetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/checkin/detect-faces', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Check-in
  checkIn: async (file: File, location?: string): Promise<AttendanceRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    if (location) formData.append('location', location);
    
    const response = await apiClient.post('/checkin/check-in', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Attendance records
  listAttendance: async (startDate?: string, endDate?: string, personId?: number): Promise<AttendanceRecord[]> => {
    const response = await apiClient.get('/checkin/attendance/', {
      params: {
        start_date: startDate,
        end_date: endDate,
        person_id: personId
      }
    });
    return response.data;
  },

  exportAttendance: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const response = await apiClient.get('/checkin/attendance/export', {
      params: {
        start_date: startDate,
        end_date: endDate
      },
      responseType: 'blob'
    });
    return response.data;
  },

  todayAttendance: async (): Promise<{
    date: string;
    total_persons: number;
    checked_in: number;
    attendance_rate: string;
    records: number;
  }> => {
    const response = await apiClient.get('/checkin/attendance/today');
    return response.data;
  },
};

export default apiClient;
