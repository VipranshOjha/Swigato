const TOKEN_KEY = 'swigato_access_token';

export const storageService = {
    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },
    
    setToken: (token) => {
        localStorage.setItem(TOKEN_KEY, token);
    },
    
    clearToken: () => {
        localStorage.removeItem(TOKEN_KEY);
    },
};
