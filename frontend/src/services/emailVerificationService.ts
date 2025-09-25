import { apiClient } from './apiClient';

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export interface VerifyEmailRequest {
  token: string;
  userId: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export class EmailVerificationService {
  /**
   * Gửi email xác thực
   */
  async sendVerificationEmail(email: string): Promise<EmailVerificationResponse> {
    return apiClient.post('/api/emailverification/send-verification', { email });
  }

  /**
   * Xác thực email với token
   */
  async verifyEmail(token: string, userId: string): Promise<EmailVerificationResponse> {
    return apiClient.post('/api/emailverification/verify', { token, userId });
  }

  /**
   * Gửi lại email xác thực
   */
  async resendVerificationEmail(email: string): Promise<EmailVerificationResponse> {
    return apiClient.post('/api/emailverification/resend-verification', { email });
  }

  /**
   * Kiểm tra token có hợp lệ không
   */
  async checkToken(token: string, userId: string): Promise<boolean> {
    return apiClient.get(`/api/emailverification/check-token?token=${token}&userId=${userId}`);
  }
}

export const emailVerificationService = new EmailVerificationService();
