import api from '@/lib/api';
import { API } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type {
    WebAuthnCredential,
    RegisterCredentialResult,
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
} from '@/types/webauthn';
import type { AuthResponse } from '@/types/auth';

export const webauthnService = {
    async getRegistrationOptions(): Promise<ApiResponse<PublicKeyCredentialCreationOptionsJSON>> {
        const res = await api.post(API.WEBAUTHN.REGISTER_OPTIONS);
        return res.data;
    },

    async verifyRegistration(credential: unknown, friendlyName?: string): Promise<ApiResponse<RegisterCredentialResult>> {
        const res = await api.post(API.WEBAUTHN.REGISTER_VERIFY, { credential, friendlyName });
        return res.data;
    },

    async getAuthenticationOptions(email?: string): Promise<ApiResponse<PublicKeyCredentialRequestOptionsJSON>> {
        const res = await api.post(API.WEBAUTHN.LOGIN_OPTIONS, email ? { email } : {});
        return res.data;
    },

    async verifyAuthentication(credential: unknown, mfaCode?: string): Promise<ApiResponse<AuthResponse>> {
        const res = await api.post(API.WEBAUTHN.LOGIN_VERIFY, { credential, ...(mfaCode && { mfaCode }) });
        return res.data;
    },

    async listCredentials(): Promise<ApiResponse<WebAuthnCredential[]>> {
        const res = await api.get(API.WEBAUTHN.CREDENTIALS);
        return res.data;
    },

    async deleteCredential(id: string): Promise<ApiResponse<null>> {
        const res = await api.delete(`${API.WEBAUTHN.CREDENTIALS}/${id}`);
        return res.data;
    },
};
