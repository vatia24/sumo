// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Types
export interface ApiResponse<T = any> {
  status: 'SUCCESS' | 'ERROR';
  message?: string;
  data?: T;
  error_code?: string;
}

export interface User {
  id: number;
  identifier: string;
  role: 'customer' | 'owner' | 'manager';
  name?: string;
  email?: string;
  mobile?: string;
}

export interface Product {
  id: number;
  company_id: number;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Discount-related fields
  discount_id?: number;
  discount_price?: number;
  discount_percent?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  discount_status?: string;
  discount_created_at?: string;
  discount_updated_at?: string;
  primary_image_url?: string;
  effective_price?: number;
  discount_amount?: number;
}

export interface Company {
  id: number;
  user_id: number;
  full_name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  status: 'pending' | 'verified' | 'suspended';
  latitude?: number;
  longitude?: number;
  logo_url?: string;
}

export interface Discount {
  id: number;
  company_id: number;
  product_id?: number;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  status: 'active' | 'inactive';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  period: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      let url = `${API_BASE_URL}/${endpoint}`;
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      if (data && method === 'GET') {
        const params = new URLSearchParams(data);
        url += `?${params.toString()}`;
      }

      console.log('API Request:', {
        url,
        method,
        headers: this.getHeaders(),
        body: data && method !== 'GET' ? JSON.stringify(data) : undefined
      });

      const response = await fetch(url, options);
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      
      const result = await response.json();
      console.log('API Response Data:', result);

      if (!response.ok) {
        console.error('API Error Response:', result);
        throw new Error(result.message || 'API request failed');
      }

      return result;
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('API Error Details:', {
        message: error.message,
        stack: error.stack,
        url: `${API_BASE_URL}/${endpoint}`
      });
      throw error;
    }
  }

  // Authentication Methods
  async authorize(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>('POST', 'authorize', { identifier, password });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response.data!;
  }

  async registerUser(userData: {
    username: string;
    name: string;
    email: string;
    mobile: string;
    password: string;
    type: 'customer' | 'owner';
  }): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>('POST', 'registerUser', userData);
    return response.data!;
  }

  async verifyCustomer(mobile: string, otp: string): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>('POST', 'verifyCustomer', { mobile, otp });
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.request('POST', 'logout');
    this.clearToken();
  }

  async requestPasswordReset(identifier: string): Promise<void> {
    await this.request('POST', 'requestPasswordReset', { identifier });
  }

  async confirmPasswordReset(identifier: string, otp: string, new_password: string): Promise<void> {
    await this.request('POST', 'confirmPasswordReset', { identifier, otp, new_password });
  }

  // Product Methods
  async getProducts(id?: number): Promise<Product[]> {
    const params = id ? { id: id.toString() } : {};
    const response = await this.request<Product[]>('GET', 'getProductsWithDiscounts', params);
    return response.data!;
  }

  async getProduct(id: number): Promise<Product> {
    const response = await this.request<Product>('GET', 'getProduct', { id: id.toString() });
    return response.data!;
  }

  async listProducts(params: {
    company_id?: number;
    status?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const response = await this.request<{ products: Product[]; total: number }>('GET', 'listProducts', params);
    return response.data!;
  }

  async upsertProduct(productData: Partial<Product>): Promise<Product> {
    const response = await this.request<Product>('POST', 'upsertProduct', productData);
    return response.data!;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.request('POST', 'deleteProduct', { id });
  }

  async bulkProductStatus(ids: number[], status: string): Promise<void> {
    await this.request('POST', 'bulkProductStatus', { ids, status });
  }

  // Company Methods
  async upsertCompany(companyData: Partial<Company>): Promise<Company> {
    const response = await this.request<Company>('POST', 'upsertCompany', companyData);
    return response.data!;
  }

  async getUserCompany(): Promise<Company> {
    const response = await this.request<Company>('GET', 'getUserCompany');
    return response.data!;
  }

  async getCompany(id: number): Promise<Company> {
    const response = await this.request<Company>('GET', 'getCompany', { id: id.toString() });
    return response.data!;
  }

  async setCompanyStatus(company_id: number, status: string): Promise<void> {
    await this.request('POST', 'setCompanyStatus', { company_id, status });
  }

  // Discount Methods
  async listDiscounts(params?: {
    company_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ discounts: Discount[]; total: number }> {
    const response = await this.request<{ discounts: Discount[]; total: number }>('GET', 'listDiscounts', params);
    return response.data!;
  }

  async upsertDiscount(discountData: Partial<Discount>): Promise<Discount> {
    const response = await this.request<Discount>('POST', 'upsertDiscount', discountData);
    return response.data!;
  }

  async bulkDiscountStatus(ids: number[], status: string): Promise<void> {
    await this.request('POST', 'bulkDiscountStatus', { ids, status });
  }

  // Analytics Methods
  async trackAction(data: {
    discount_id: number;
    action: string;
    user_agent?: string;
    ip_address?: string;
  }): Promise<void> {
    await this.request('POST', 'trackAction', data);
  }

  async analyticsSummary(discount_id?: number): Promise<AnalyticsSummary> {
    const params = discount_id ? { discount_id: discount_id.toString() } : {};
    const response = await this.request<AnalyticsSummary>('GET', 'analyticsSummary', params);
    return response.data!;
  }

  async topDiscounts(action: string, limit: number = 10): Promise<Discount[]> {
    const response = await this.request<Discount[]>('GET', 'topDiscounts', { action, limit: limit.toString() });
    return response.data!;
  }

  // Company Hours Methods
  async setCompanyHours(company_id: number, hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>): Promise<void> {
    await this.request('POST', 'setCompanyHours', { company_id, hours });
  }

  async getCompanyHours(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'getCompanyHours', { company_id: company_id.toString() });
    return response.data!;
  }

  // Company Social Methods
  async addCompanySocial(company_id: number, platform: string, url: string): Promise<any> {
    const response = await this.request<any>('POST', 'addCompanySocial', { company_id, platform, url });
    return response.data!;
  }

  async listCompanySocials(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'listCompanySocials', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteCompanySocial(company_id: number, id: number): Promise<void> {
    await this.request('POST', 'deleteCompanySocial', { company_id, id });
  }

  // Company Gallery Methods
  async addCompanyGallery(company_id: number, file_base64: string): Promise<any> {
    const response = await this.request<any>('POST', 'addCompanyGallery', { company_id, file_base64 });
    return response.data!;
  }

  async listCompanyGallery(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'listCompanyGallery', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteCompanyGallery(company_id: number, id: number): Promise<void> {
    await this.request('POST', 'deleteCompanyGallery', { company_id, id });
  }

  // Company Document Methods
  async addCompanyDocument(company_id: number, doc_type: string, file_base64: string): Promise<any> {
    const response = await this.request<any>('POST', 'addCompanyDocument', { company_id, doc_type, file_base64 });
    return response.data!;
  }

  async listCompanyDocuments(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'listCompanyDocuments', { company_id: company_id.toString() });
    return response.data!;
  }

  async reviewCompanyDocument(company_id: number, id: number, status: string): Promise<void> {
    await this.request('POST', 'reviewCompanyDocument', { company_id, id, status });
  }

  // Delivery Zone Methods
  async upsertDeliveryZone(zoneData: {
    id?: number;
    company_id: number;
    name: string;
    zone_type: string;
    center_lat?: number;
    center_lng?: number;
    radius_m?: number;
    polygon?: string;
  }): Promise<any> {
    const response = await this.request<any>('POST', 'upsertDeliveryZone', zoneData);
    return response.data!;
  }

  async listDeliveryZones(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'listDeliveryZones', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteDeliveryZone(company_id: number, id: number): Promise<void> {
    await this.request('POST', 'deleteDeliveryZone', { company_id, id });
  }

  // Branch Methods
  async upsertBranch(branchData: {
    id?: number;
    company_id: number;
    branch_name: string;
    branch_address?: string;
    branch_image?: string;
  }): Promise<any> {
    const response = await this.request<any>('POST', 'upsertBranch', branchData);
    return response.data!;
  }

  async listBranches(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'listBranches', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteBranch(company_id: number, id: number): Promise<void> {
    await this.request('POST', 'deleteBranch', { company_id, id });
  }

  // Contact Methods
  async addContact(contactData: {
    company_id: number;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<any> {
    const response = await this.request<any>('POST', 'addContact', contactData);
    return response.data!;
  }

  async listContacts(company_id: number): Promise<any[]> {
    const response = await this.request<any[]>('GET', 'listContacts', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteContact(company_id: number, id: number): Promise<void> {
    await this.request('POST', 'deleteContact', { company_id, id });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();



