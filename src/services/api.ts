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
  role: 'customer' | 'owner' | 'manager' | 'legal_person';
  name?: string;
  email?: string;
  mobile?: string;
}

export interface Product {
  id: number;
  company_id: number;
  branch_id?: number;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  description?: string;
  image_url?: string;
  address?: string;
  link?: string;
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
  discount_percent?: number;
  discount_price?: number;
  status: 'active' | 'inactive' | 'scheduled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface CompanySocial {
  id: number;
  company_id: number;
  platform: string;
  url: string;
  created_at: string;
}

export interface CompanyGallery {
  id: number;
  company_id: number;
  path: string;
  created_at: string;
}

export interface CompanyDocument {
  id: number;
  company_id: number;
  doc_type: string;
  path: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

export interface DeliveryZone {
  id: number;
  company_id: number;
  name: string;
  zone_type: 'radius' | 'polygon';
  center_lat?: number;
  center_lng?: number;
  radius_m?: number;
  polygon?: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number;
  company_id: number;
  branch_name: string;
  branch_address?: string;
  branch_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  company_id: number;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  period: string;
  demographics?: any;
  timeseries?: any;
}

export interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  created_at: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  // Set authentication tokens
  setTokens(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }

  // Clear authentication tokens
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
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
  async authorize(identifier: string, password: string): Promise<{ token: string; refresh_token: string; expires_in: number; user: User }> {
    const response = await this.request<{ token: string; refresh_token: string; expires_in: number }>('POST', 'authorize', { identifier, password });
    if (response.data?.token && response.data?.refresh_token) {
      this.setTokens(response.data.token, response.data.refresh_token);
      // Decode JWT token to get user information
      const user = this.decodeJWTToken(response.data.token);
      return { ...response.data, user };
    }
    throw new Error('Invalid response from server');
  }

  // Helper method to decode JWT token
  private decodeJWTToken(token: string): User {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      return {
        id: payload.id,
        identifier: payload.identifier,
        role: payload.role as 'customer' | 'owner' | 'manager' | 'legal_person',
        name: payload.name,
        email: payload.email,
        mobile: payload.mobile
      };
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      throw new Error('Invalid token format');
    }
  }

  async registerUser(userData: {
    username: string;
    name: string;
    email: string;
    mobile: string;
    password: string;
    type: 'customer' | 'owner';
  }): Promise<{ status: string; user_id: number }> {
    const response = await this.request<{ status: string; user_id: number }>('POST', 'registerUser', userData);
    return response.data!;
  }

  async verifyCustomer(mobile: string, otp: string): Promise<{ status: string }> {
    const response = await this.request<{ status: string }>('POST', 'verifyCustomer', { mobile, otp });
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.request('POST', 'logout');
    this.clearTokens();
  }

  async requestPasswordReset(identifier: string): Promise<{ reset_sent: boolean }> {
    const response = await this.request<{ reset_sent: boolean }>('POST', 'requestPasswordReset', { identifier });
    return response.data!;
  }

  async confirmPasswordReset(identifier: string, otp: string, new_password: string): Promise<{ reset: boolean }> {
    const response = await this.request<{ reset: boolean }>('POST', 'confirmPasswordReset', { identifier, otp, new_password });
    return response.data!;
  }

  async refresh(): Promise<{ token: string; refresh_token: string; expires_in: number }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await this.request<{ token: string; refresh_token: string; expires_in: number }>('POST', 'refresh', { refresh_token: this.refreshToken });
    if (response.data?.token && response.data?.refresh_token) {
      this.setTokens(response.data.token, response.data.refresh_token);
    }
    return response.data!;
  }

  // Social OAuth Methods
  async facebookAuth(code: string): Promise<{ token: string; user: any }> {
    const response = await this.request<{ token: string; user: any }>('GET', 'facebookAuth', { code });
    return response.data!;
  }

  async googleAuth(code: string): Promise<{ token: string; user: any }> {
    const response = await this.request<{ token: string; user: any }>('GET', 'googleAuth', { code });
    return response.data!;
  }

  // Product Methods
  async getProducts(id?: number): Promise<Product[]> {
    const params = id ? { id: id.toString() } : {};
    const response = await this.request<Product[]>('GET', 'getProductsWithDiscounts', params);
    return response.data!;
  }

  async getProduct(id: number): Promise<{ product: Product }> {
    const response = await this.request<{ product: Product }>('GET', 'getProduct', { id: id.toString() });
    return response.data!;
  }

  async listProducts(params: {
    company_id?: number;
    status?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[] }> {
    const response = await this.request<{ products: Product[] }>('GET', 'listProducts', params);
    return response.data!;
  }

  async upsertProduct(productData: Partial<Product>): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'upsertProduct', productData);
    return response.data!;
  }

  async deleteProduct(id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteProduct', { id });
    return response.data!;
  }

  async bulkProductStatus(ids: number[], status: string): Promise<{ updated: number }> {
    const response = await this.request<{ updated: number }>('POST', 'bulkProductStatus', { ids, status });
    return response.data!;
  }

  // Product Image Methods
  async addProductImage(product_id: number, file_base64: string): Promise<{ image_id: number; path: string }> {
    const response = await this.request<{ image_id: number; path: string }>('POST', 'addProductImage', { product_id, file_base64 });
    return response.data!;
  }

  async listProductImages(product_id: number): Promise<{ images: ProductImage[] }> {
    const response = await this.request<{ images: ProductImage[] }>('GET', 'listProductImages', { product_id: product_id.toString() });
    return response.data!;
  }

  async deleteProductImage(image_id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteProductImage', { image_id });
    return response.data!;
  }

  // Company Methods
  async upsertCompany(companyData: Partial<Company>): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'upsertCompany', companyData);
    return response.data!;
  }

  async getCompany(id: number): Promise<{ company: Company }> {
    const response = await this.request<{ company: Company }>('GET', 'getCompany', { id: id.toString() });
    return response.data!;
  }

  async getUserCompany(): Promise<Company> {
    const response = await this.request<{ company: Company }>('GET', 'getUserCompany', {});
    return response.data!.company;
  }

  async setCompanyStatus(company_id: number, status: string): Promise<{ ok: boolean }> {
    const response = await this.request<{ ok: boolean }>('POST', 'setCompanyStatus', { company_id, status });
    return response.data!;
  }

  // Company Hours Methods
  async setCompanyHours(company_id: number, hours: CompanyHours[]): Promise<{ ok: boolean }> {
    const response = await this.request<{ ok: boolean }>('POST', 'setCompanyHours', { company_id, hours });
    return response.data!;
  }

  async getCompanyHours(company_id: number): Promise<{ hours: CompanyHours[] }> {
    const response = await this.request<{ hours: CompanyHours[] }>('GET', 'getCompanyHours', { company_id: company_id.toString() });
    return response.data!;
  }

  // Company Social Methods
  async addCompanySocial(company_id: number, platform: string, url: string): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'addCompanySocial', { company_id, platform, url });
    return response.data!;
  }

  async listCompanySocials(company_id: number): Promise<{ socials: CompanySocial[] }> {
    const response = await this.request<{ socials: CompanySocial[] }>('GET', 'listCompanySocials', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteCompanySocial(company_id: number, id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteCompanySocial', { company_id, id });
    return response.data!;
  }

  // Company Gallery Methods
  async addCompanyGallery(company_id: number, file_base64: string): Promise<{ id: number; path: string }> {
    const response = await this.request<{ id: number; path: string }>('POST', 'addCompanyGallery', { company_id, file_base64 });
    return response.data!;
  }

  async listCompanyGallery(company_id: number): Promise<{ gallery: CompanyGallery[] }> {
    const response = await this.request<{ gallery: CompanyGallery[] }>('GET', 'listCompanyGallery', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteCompanyGallery(company_id: number, id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteCompanyGallery', { company_id, id });
    return response.data!;
  }

  // Company Document Methods
  async addCompanyDocument(company_id: number, doc_type: string, file_base64: string): Promise<{ id: number; path: string }> {
    const response = await this.request<{ id: number; path: string }>('POST', 'addCompanyDocument', { company_id, doc_type, file_base64 });
    return response.data!;
  }

  async listCompanyDocuments(company_id: number): Promise<{ documents: CompanyDocument[] }> {
    const response = await this.request<{ documents: CompanyDocument[] }>('GET', 'listCompanyDocuments', { company_id: company_id.toString() });
    return response.data!;
  }

  async reviewCompanyDocument(company_id: number, id: number, status: string): Promise<{ ok: boolean }> {
    const response = await this.request<{ ok: boolean }>('POST', 'reviewCompanyDocument', { company_id, id, status });
    return response.data!;
  }

  async deleteCompanyDocument(company_id: number, id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteCompanyDocument', { company_id, id });
    return response.data!;
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
  }): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'upsertDeliveryZone', zoneData);
    return response.data!;
  }

  async listDeliveryZones(company_id: number): Promise<{ zones: DeliveryZone[] }> {
    const response = await this.request<{ zones: DeliveryZone[] }>('GET', 'listDeliveryZones', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteDeliveryZone(company_id: number, id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteDeliveryZone', { company_id, id });
    return response.data!;
  }

  // Branch Methods
  async upsertBranch(branchData: {
    id?: number;
    company_id: number;
    branch_name: string;
    branch_address?: string;
    branch_image?: string;
  }): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'upsertBranch', branchData);
    return response.data!;
  }

  async listBranches(company_id: number): Promise<{ branches: Branch[] }> {
    const response = await this.request<{ branches: Branch[] }>('GET', 'listBranches', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteBranch(company_id: number, id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteBranch', { company_id, id });
    return response.data!;
  }

  // Contact Methods
  async addContact(contactData: {
    company_id: number;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'addContact', contactData);
    return response.data!;
  }

  async listContacts(company_id: number): Promise<{ contacts: Contact[] }> {
    const response = await this.request<{ contacts: Contact[] }>('GET', 'listContacts', { company_id: company_id.toString() });
    return response.data!;
  }

  async deleteContact(company_id: number, id: number): Promise<{ deleted: boolean }> {
    const response = await this.request<{ deleted: boolean }>('POST', 'deleteContact', { company_id, id });
    return response.data!;
  }

  // Discount Methods
  async listDiscounts(params?: {
    company_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ discounts: Discount[] }> {
    const response = await this.request<{ discounts: Discount[] }>('GET', 'listDiscounts', params);
    return response.data!;
  }

  async upsertDiscount(discountData: Partial<Discount>): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('POST', 'upsertDiscount', discountData);
    return response.data!;
  }

  async bulkDiscountStatus(ids: number[], status: string): Promise<{ updated: number }> {
    const response = await this.request<{ updated: number }>('POST', 'bulkDiscountStatus', { ids, status });
    return response.data!;
  }

  // Analytics Methods
  async trackAction(data: {
    discount_id: number;
    action: 'view' | 'clicked' | 'redirect' | 'map_open' | 'share' | 'favorite';
    device_type?: string;
    city?: string;
    region?: string;
    age_group?: string;
    gender?: string;
  }): Promise<{ tracked: boolean }> {
    const response = await this.request<{ tracked: boolean }>('POST', 'trackAction', data);
    return response.data!;
  }

  async analyticsSummary(params: {
    discount_id: number;
    from?: string;
    to?: string;
    device_type?: string;
    city?: string;
    region?: string;
    age_group?: string;
    gender?: string;
    granularity?: string;
  }): Promise<AnalyticsSummary> {
    const response = await this.request<AnalyticsSummary>('GET', 'analyticsSummary', params);
    return response.data!;
  }

  async topDiscounts(params: {
    action: string;
    limit?: number;
    from?: string;
    to?: string;
    device_type?: string;
    city?: string;
    region?: string;
    age_group?: string;
    gender?: string;
    company_id?: number;
  }): Promise<{ top: Discount[] }> {
    const response = await this.request<{ top: Discount[] }>('GET', 'topDiscounts', params);
    return response.data!;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();



