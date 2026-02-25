export interface ParsedResumeData {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    experience: {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        description: string | null;
    }[];
    education: {
        institution: string;
        degree: string;
        field: string | null;
        startDate: string | null;
        endDate: string | null;
    }[];
    certifications: string[];
    summary: string | null;
}

export interface ApplyableResumeFields {
    bio?: string;
    phone?: string;
    skills?: string[];
    experience?: Array<{
        company: string; role: string; location: string;
        startDate: string; endDate: string; isCurrent: boolean; description: string;
    }>;
    education?: Array<{
        institution: string; degree: string; field: string;
        startDate: string; endDate: string; grade: string;
    }>;
    certifications?: Array<{
        name: string; issuer: string; issueDate: string;
        expiryDate: string; credentialId: string; url: string;
    }>;
}
