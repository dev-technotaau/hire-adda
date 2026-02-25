import api from '@/lib/api';
import { API } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type {
    AuthResponse,
    RegisterResponse,
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    VerifyMobileRequest,
    MfaSetupResponse,
    MfaVerifyRequest,
    User,
    TokenPair,
} from '@/types/auth';

/**
 * Generate a device fingerprint from browser properties.
 * Used for new-device detection on the backend.
 */
function getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return '';
    const raw = [
        navigator.userAgent,
        screen.width,
        screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
    ].join('|');
    // Simple hash (djb2)
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) + hash + raw.charCodeAt(i)) & 0xffffffff;
    }
    return hash.toString(16);
}

export const authService = {
    async register(data: RegisterRequest, turnstileToken?: string): Promise<ApiResponse<RegisterResponse>> {
        const res = await api.post(API.AUTH.REGISTER, {
            ...data,
            ...(turnstileToken && { 'cf-turnstile-response': turnstileToken }),
        });
        return res.data;
    },

    async login(data: LoginRequest, turnstileToken?: string): Promise<ApiResponse<AuthResponse>> {
        const res = await api.post(API.AUTH.LOGIN, {
            ...data,
            ...(turnstileToken && { 'cf-turnstile-response': turnstileToken }),
        }, {
            headers: { 'X-Device-Fingerprint': getDeviceFingerprint() },
        });
        return res.data;
    },

    async logout(refreshToken?: string): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.LOGOUT, { refreshToken });
        return res.data;
    },

    async getMe(): Promise<ApiResponse<User>> {
        const res = await api.get(API.AUTH.ME);
        return res.data;
    },

    async refreshToken(refreshToken: string): Promise<ApiResponse<TokenPair>> {
        const res = await api.post(API.AUTH.REFRESH_TOKEN, { refreshToken });
        return res.data;
    },

    async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<AuthResponse>> {
        const res = await api.post(API.AUTH.VERIFY_EMAIL, data);
        return res.data;
    },

    async resendEmailVerification(email: string): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.RESEND_EMAIL_VERIFICATION, { email });
        return res.data;
    },

    async forgotPassword(data: ForgotPasswordRequest, turnstileToken?: string): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.FORGOT_PASSWORD, {
            ...data,
            ...(turnstileToken && { 'cf-turnstile-response': turnstileToken }),
        });
        return res.data;
    },

    async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.RESET_PASSWORD, data);
        return res.data;
    },

    async initiateChangePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_PASSWORD_INITIATE, data);
        return res.data;
    },

    async confirmChangePassword(data: { otp: string; newPassword: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_PASSWORD_CONFIRM, data);
        return res.data;
    },

    async logoutEverywhere(): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.LOGOUT_EVERYWHERE);
        return res.data;
    },

    async mfaSetup(): Promise<ApiResponse<MfaSetupResponse>> {
        const res = await api.post(API.AUTH.MFA_SETUP);
        return res.data;
    },

    async mfaEnable(data: MfaVerifyRequest): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.MFA_ENABLE, data);
        return res.data;
    },

    async mfaDisable(data: { password: string; token: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.MFA_DISABLE, data);
        return res.data;
    },

    async mfaRegenerateBackup(data: { password: string; token: string }): Promise<ApiResponse<{ backupCodes: string[] }>> {
        const res = await api.post(API.AUTH.MFA_REGENERATE_BACKUP, data);
        return res.data;
    },

    async mfaBackupCodeCount(): Promise<ApiResponse<{ count: number }>> {
        const res = await api.get(API.AUTH.MFA_BACKUP_CODE_COUNT);
        return res.data;
    },

    async initiateChangeEmail(data: { newEmail: string; password: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_EMAIL_INITIATE, data);
        return res.data;
    },

    async confirmChangeEmail(data: { otp: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_EMAIL_CONFIRM, data);
        return res.data;
    },

    async resendChangeEmailOtp(): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_EMAIL_RESEND_OTP);
        return res.data;
    },

    async initiateChangeMobile(data: { newMobileNumber: string; password: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_MOBILE_INITIATE, data);
        return res.data;
    },

    async confirmChangeMobile(data: { otp: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_MOBILE_CONFIRM, data);
        return res.data;
    },

    async resendChangeMobileOtp(): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_MOBILE_RESEND_OTP);
        return res.data;
    },

    async verifyMobile(data: VerifyMobileRequest): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.VERIFY_MOBILE, data);
        return res.data;
    },

    async resendMobileOtp(data: { mobileNumber: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.RESEND_MOBILE_OTP, data);
        return res.data;
    },

    async verifyWhatsApp(data: { mobileNumber: string; whatsappNumber?: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.VERIFY_WHATSAPP, data);
        return res.data;
    },

    async verifyWhatsAppOtp(data: { mobileNumber: string; otp: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.VERIFY_WHATSAPP_OTP, data);
        return res.data;
    },

    async changeWhatsappNumber(data: { newWhatsappNumber: string; password: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.AUTH.CHANGE_WHATSAPP_NUMBER, data);
        return res.data;
    },

    async removeWhatsappNumber(): Promise<ApiResponse<null>> {
        const res = await api.delete(API.AUTH.REMOVE_WHATSAPP_NUMBER);
        return res.data;
    },

    async firebaseLogin(idToken: string, role?: string): Promise<ApiResponse<AuthResponse & { isNewUser: boolean }>> {
        const res = await api.post(API.AUTH.FIREBASE_LOGIN, { idToken, role });
        return res.data;
    },

    getGoogleAuthUrl(role?: string): string {
        const params = role ? `?role=${role}` : '';
        return `${api.defaults.baseURL}${API.AUTH.GOOGLE}${params}`;
    },

    getLinkedInAuthUrl(): string {
        return `${api.defaults.baseURL}${API.AUTH.LINKEDIN}`;
    },
};
