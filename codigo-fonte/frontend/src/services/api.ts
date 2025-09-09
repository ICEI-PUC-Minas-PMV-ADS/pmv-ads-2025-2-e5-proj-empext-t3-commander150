import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

// Interceptor para incluir o sessionid automaticamente
api.interceptors.request.use((config) => {
    const sessionid = localStorage.getItem("sessionid");
    if (sessionid && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${sessionid}`;
    }
    return config;
});

export default api;