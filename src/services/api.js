/**
 * API Client Service for CryoFlow AI Frontend.
 * All CRUD operations and data queries call FastAPI REST Endpoints.
 * The backend is the single source of truth.
 */
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Auth & Profile
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },
  changePassword: async (data) => {
    const res = await apiClient.put('/profile/password', data);
    return res.data;
  },

  // Analytics & Dashboard
  getDashboardAnalytics: async () => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data;
  },

  // Shipments Module CRUD
  getShipments: async (params = {}) => {
    const res = await apiClient.get('/shipments', { params });
    return res.data;
  },
  getShipmentDetails: async (id) => {
    const res = await apiClient.get(`/shipments/${id}`);
    return res.data;
  },
  createShipment: async (data) => {
    const res = await apiClient.post('/shipments', data);
    return res.data;
  },
  updateShipment: async (id, data) => {
    const res = await apiClient.put(`/shipments/${id}`, data);
    return res.data;
  },
  deleteShipment: async (id) => {
    const res = await apiClient.delete(`/shipments/${id}`);
    return res.data;
  },

  // AI Prediction Core Innovation
  runPrediction: async (shipment_id) => {
    const res = await apiClient.post('/predictions/run', { shipment_id });
    return res.data;
  },

  // Decision Center
  getDecisionCenterShipments: async () => {
    const res = await apiClient.get('/decision-center');
    return res.data;
  },
  getDecisionCenterHistory: async () => {
    const res = await apiClient.get('/decision-center/history');
    return res.data;
  },
  executeDecisionAction: async (shipment_id, action, notes = '') => {
    const res = await apiClient.post('/decision-center/action', { shipment_id, action, notes });
    return res.data;
  },

  // Warehouses Module CRUD
  getWarehouses: async () => {
    const res = await apiClient.get('/warehouses');
    return res.data;
  },
  createWarehouse: async (data) => {
    const res = await apiClient.post('/warehouses', data);
    return res.data;
  },
  updateWarehouse: async (id, data) => {
    const res = await apiClient.put(`/warehouses/${id}`, data);
    return res.data;
  },
  deleteWarehouse: async (id) => {
    const res = await apiClient.delete(`/warehouses/${id}`);
    return res.data;
  },

  // Alerts Module
  getAlerts: async () => {
    const res = await apiClient.get('/alerts');
    return res.data;
  },
  resolveAlert: async (id) => {
    const res = await apiClient.put(`/alerts/${id}/resolve`);
    return res.data;
  },

  // Live Simulator
  triggerSimulatorTick: async () => {
    const res = await apiClient.post('/simulator/tick');
    return res.data;
  }
};

