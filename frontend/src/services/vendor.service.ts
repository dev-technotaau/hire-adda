import api from '@/lib/api';

export type VendorLeadStatus = 'PENDING' | 'RESPONDED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  contactEmail: string;
  contactPhone: string;
  services: string[];
  industries: string[];
  locations: string[];
  yearsInBusiness: number | null;
  teamSize: number | null;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPublicCard extends Pick<
  VendorProfile,
  | 'id'
  | 'slug'
  | 'businessName'
  | 'description'
  | 'logo'
  | 'website'
  | 'services'
  | 'industries'
  | 'locations'
  | 'yearsInBusiness'
  | 'teamSize'
  | 'isVerified'
> {
  avgRating: number | null;
  reviewCount: number;
}

export interface VendorReview {
  id: string;
  vendorProfileId: string;
  reviewerId: string;
  rating: number;
  text: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  } | null;
}

export interface VendorLead {
  id: string;
  vendorProfileId: string;
  jobPostId: string | null;
  employerId: string;
  requirementText: string;
  contactEmail: string;
  contactPhone: string | null;
  status: VendorLeadStatus;
  responseText: string | null;
  respondedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  jobPost?: { id: string; title: string; location: string | null } | null;
  employer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface BackendEnvelope<T> {
  status?: string;
  data: T;
}

export interface UpsertVendorInput {
  businessName: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  services?: string[];
  industries?: string[];
  locations?: string[];
  yearsInBusiness?: number;
  teamSize?: number;
}

export const vendorService = {
  // Owner
  async getMyProfile(): Promise<VendorProfile | null> {
    const { data } = await api.get<BackendEnvelope<VendorProfile | null>>('/vendor/me');
    return data.data;
  },
  async upsertMyProfile(input: UpsertVendorInput): Promise<VendorProfile> {
    const { data } = await api.put<BackendEnvelope<VendorProfile>>('/vendor/me', input);
    return data.data;
  },
  async setVisibility(isPublic: boolean): Promise<VendorProfile> {
    const { data } = await api.patch<BackendEnvelope<VendorProfile>>('/vendor/me/visibility', {
      isPublic,
    });
    return data.data;
  },

  async uploadLogo(file: File): Promise<{ logo: string }> {
    const form = new FormData();
    form.append('logo', file);
    const { data } = await api.post<BackendEnvelope<{ logo: string }>>('/vendor/me/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  // Leads (vendor inbox)
  async listMyLeads(
    args: {
      status?: VendorLeadStatus;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    items: VendorLead[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const { data } = await api.get<
      BackendEnvelope<{
        items: VendorLead[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>
    >('/vendor/me/leads', { params: args });
    return data.data;
  },
  async respondToLead(input: {
    leadId: string;
    status: 'RESPONDED' | 'ACCEPTED' | 'DECLINED';
    responseText?: string;
  }): Promise<VendorLead> {
    const { data } = await api.patch<BackendEnvelope<VendorLead>>(
      `/vendor/me/leads/${encodeURIComponent(input.leadId)}`,
      { status: input.status, responseText: input.responseText },
    );
    return data.data;
  },

  // Public directory
  async listPublic(
    args: {
      service?: string;
      location?: string;
      industry?: string;
      q?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    items: VendorPublicCard[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const { data } = await api.get<
      BackendEnvelope<{
        items: VendorPublicCard[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>
    >('/vendors', { params: args });
    return data.data;
  },
  async getPublicBySlug(
    slug: string,
  ): Promise<VendorPublicCard & { contactEmail: string; contactPhone: string }> {
    const { data } = await api.get<
      BackendEnvelope<VendorPublicCard & { contactEmail: string; contactPhone: string }>
    >(`/vendors/${encodeURIComponent(slug)}`);
    return data.data;
  },
  async listReviews(
    slug: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: VendorReview[];
    pagination: { total: number; page: number; limit: number; pages: number };
    avgRating: number | null;
    reviewCount: number;
  }> {
    const { data } = await api.get<
      BackendEnvelope<{
        items: VendorReview[];
        pagination: { total: number; page: number; limit: number; pages: number };
        avgRating: number | null;
        reviewCount: number;
      }>
    >(`/vendors/${encodeURIComponent(slug)}/reviews`, { params: { page, limit } });
    return data.data;
  },

  async upsertReview(input: {
    slug: string;
    rating: number;
    text?: string;
  }): Promise<VendorReview> {
    const { data } = await api.post<BackendEnvelope<VendorReview>>(
      `/vendors/${encodeURIComponent(input.slug)}/reviews`,
      { rating: input.rating, text: input.text },
    );
    return data.data;
  },

  async sendLead(input: {
    slug: string;
    requirementText: string;
    contactEmail: string;
    contactPhone?: string;
    jobPostId?: string;
  }): Promise<VendorLead> {
    const { data } = await api.post<BackendEnvelope<VendorLead>>(
      `/vendors/${encodeURIComponent(input.slug)}/leads`,
      input,
    );
    return data.data;
  },

  async matchAndSendLead(input: {
    requirementText: string;
    contactEmail: string;
    contactPhone?: string;
    jobPostId?: string;
    services?: string[];
    industries?: string[];
    locations?: string[];
    limit?: number;
    vendorIds?: string[];
  }): Promise<{
    matched: number;
    vendors: Array<{ id: string; slug: string; businessName: string; score: number }>;
  }> {
    const { data } = await api.post<
      BackendEnvelope<{
        matched: number;
        vendors: Array<{ id: string; slug: string; businessName: string; score: number }>;
      }>
    >('/vendors/match-and-send', input);
    return data.data;
  },

  async previewMatches(input: {
    services?: string[];
    industries?: string[];
    locations?: string[];
    limit?: number;
  }): Promise<{ matches: VendorMatchPreview[] }> {
    const { data } = await api.post<BackendEnvelope<{ matches: VendorMatchPreview[] }>>(
      '/vendors/match-preview',
      input,
    );
    return data.data;
  },
};

export interface VendorMatchPreview {
  id: string;
  slug: string;
  businessName: string;
  logo: string | null;
  description: string | null;
  services: string[];
  locations: string[];
  industries: string[];
  isVerified: boolean;
  yearsInBusiness: number | null;
  teamSize: number | null;
  score: number;
}

export default vendorService;
