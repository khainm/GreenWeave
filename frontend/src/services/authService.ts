import { apiClient } from './apiClient';
import { emailVerificationService } from './emailVerificationService';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface User {
  id: string;
  customerCode: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  emailVerified: boolean;
  roles: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: string[];
}

export interface AuthError {
  success: false;
  message: string;
  errors: string[];
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  // Store auth data in localStorage
  private setAuthData(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get stored user
  getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Clear auth data
  clearAuthData() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.success && response.token && response.user) {
        this.setAuthData(response.token, response.user);
      }
      
      return response;
    } catch (error: any) {
      console.error('Login API error:', error);
      
      // Extract detailed error information
      let message = 'Đăng nhập thất bại';
      let errors: string[] = ['Có lỗi xảy ra khi đăng nhập'];
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Use specific message from backend
        if (data.message) {
          message = data.message;
        }
        
        // Use specific errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          errors = data.errors;
        } else if (data.message) {
          errors = [data.message];
        }
      } else if (error.message) {
        message = error.message;
        errors = [error.message];
      }
      
      const errorResponse: AuthError = {
        success: false,
        message: message,
        errors: errors
      };
      return errorResponse;
    }
  }

  // Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', userData);
      
      // Nếu đăng ký thành công, tự động gửi email xác thực
      if (response.success) {
        try {
          await emailVerificationService.sendVerificationEmail(userData.email);
          console.log('📧 [AuthService] Verification email sent successfully');
        } catch (emailError) {
          console.error('❌ [AuthService] Failed to send verification email:', emailError);
          // Không throw error vì đăng ký đã thành công, chỉ log
        }
      }
      
      return response;
    } catch (error: any) {
      console.error('Register API error:', error);
      
      // Extract detailed error information
      let message = 'Đăng ký thất bại';
      let errors: string[] = ['Có lỗi xảy ra khi đăng ký'];
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Use specific message from backend
        if (data.message) {
          message = data.message;
        }
        
        // Use specific errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          errors = data.errors;
        } else if (data.message) {
          errors = [data.message];
        }
      } else if (error.message) {
        message = error.message;
        errors = [error.message];
      }
      
      const errorResponse: AuthError = {
        success: false,
        message: message,
        errors: errors
      };
      return errorResponse;
    }
  }

  // Logout
  logout() {
    this.clearAuthData();
  }

  // Get current user profile
  async getProfile(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await apiClient.get<User>('/api/auth/profile');
      return response;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Update profile
  async updateProfile(profileData: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await apiClient.put<AuthResponse>('/api/auth/profile', profileData);
      
      if (response.success && response.user) {
        // Update stored user data
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      }
      
      return response;
    } catch (error: any) {
      const errorResponse: AuthError = {
        success: false,
        message: error.response?.data?.message || 'Cập nhật thông tin thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi cập nhật']
      };
      return errorResponse;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword
      });
      
      return response;
    } catch (error: any) {
      const errorResponse: AuthError = {
        success: false,
        message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi đổi mật khẩu']
      };
      return errorResponse;
    }
  }
}

export const authService = new AuthService();
