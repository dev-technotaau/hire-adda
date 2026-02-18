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
