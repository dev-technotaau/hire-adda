export interface FeatureFlags {
    enableNewJobSearch: boolean;
    enableAIMatching: boolean;
    enableVideoInterviews: boolean;
    maintenanceMode: boolean;
    maxUploadSizeMB: number;
    enableBetaFeatures: boolean;
    [key: string]: boolean | string | number;
}
