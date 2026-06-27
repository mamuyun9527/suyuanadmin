import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type TraceMode = 'per_item' | 'per_batch';

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Merchant {
  id: string;
  name: string;
  credit_code: string;
  legal_person?: string;
  contact_name: string;
  contact_phone: string;
  address?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  spec?: string;
  category?: string;
  origin?: string;
  shelf_life?: string;
  description?: string;
  cover_image_url?: string;
  is_active: boolean;
  merchant_name?: string;
}

export interface Batch {
  id: string;
  product_id: string;
  batch_no: string;
  trace_mode: TraceMode;
  production_date?: string;
  expiry_date?: string;
  planting_enterprise?: string;
  planting_contact?: string;
  planting_phone?: string;
  processing_enterprise?: string;
  processing_contact?: string;
  processing_phone?: string;
  processing_date?: string;
  processing_method?: string;
  planting_base?: string;
  seed_source?: string;
  plant_date?: string;
  harvest_date?: string;
  sales_merchant?: string;
  sales_date?: string;
  status: string;
  product_name?: string;
  trace_code_count: number;
}

export interface TraceCode {
  id: string;
  code: string;
  qr_content: string;
  scan_count: number;
  is_active: boolean;
}

export const TRACE_MODE_LABEL: Record<TraceMode, string> = {
  per_batch: '一批次一码',
  per_item: '一物一码',
};
