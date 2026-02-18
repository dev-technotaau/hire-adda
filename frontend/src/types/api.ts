export interface ApiResponse<T = unknown> {
    status: 'success' | 'fail' | 'error';
    message: string;
    data: T;
}

export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface ApiError {
    status: 'fail' | 'error';
    message: string;
    statusCode: number;
    errors?: Record<string, string[]> | unknown;
    code?: string;
    requestId?: string;
}

export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
