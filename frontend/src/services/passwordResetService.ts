import { apiClient } from './apiClient';

interface PasswordResetResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

interface ForgotPasswordRequest {
  email: string;
}

interface ValidateTokenRequest {
  token: string;
  userId: string;
}

interface ResetPasswordRequest {
  token: string;
  userId: string;
  newPassword: string;
  confirmNewPassword: string;
}

class PasswordResetService {
  async forgotPassword(email: string): Promise<PasswordResetResponse> {
    const request: ForgotPasswordRequest = { email };
    return apiClient.post<PasswordResetResponse>('/api/passwordreset/forgot-password', request);
  }

  async validateToken(token: string, userId: string): Promise<PasswordResetResponse> {
    const request: ValidateTokenRequest = { token, userId };
    return apiClient.post<PasswordResetResponse>('/api/passwordreset/validate-token', request);
  }

  async resetPassword(token: string, userId: string, newPassword: string, confirmNewPassword: string): Promise<PasswordResetResponse> {
    const request: ResetPasswordRequest = {
      token,
      userId,
      newPassword,
      confirmNewPassword
    };
    return apiClient.post<PasswordResetResponse>('/api/passwordreset/reset-password', request);
  }
}

export const passwordResetService = new PasswordResetService();
