/**
 * Standardizes backend error responses into a single string message.
 * Handles FastAPI string details, list details (Pydantic validation errors), and standard errors.
 */
export const extractErrorMessage = (error) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response?.data) {
        const data = error.response.data;
        
        if (data.detail) {
            if (typeof data.detail === 'string') {
                errorMessage = data.detail;
            } else if (Array.isArray(data.detail)) {
                // Pydantic validation errors format: [{ loc: [...], msg: "error msg", type: "..." }]
                errorMessage = data.detail.map(err => err.msg).join(', ') || errorMessage;
            }
        } else if (data.message) {
            // Standard JSON message responses
            errorMessage = data.message;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return errorMessage;
};

/**
 * Ensures paginated response structures are uniform
 */
export const normalizePaginatedResponse = (response) => {
    if (!response) return { items: [], total: 0, page: 1, total_pages: 1 };
    
    // Support { data: [], total: ... } or { items: [], total: ... }
    return {
        items: response.items || response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        total_pages: response.total_pages || 1,
        has_next: !!response.has_next,
        has_prev: !!response.has_prev
    };
};
