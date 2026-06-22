import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Токени тримаємо в localStorage
export const tokenStore = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Додаємо access-токен до кожного запиту
api.interceptors.request.use((config) => {
  const t = tokenStore.access;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Автооновлення токена при 401
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (response?.status === 401 && !config._retry && tokenStore.refresh) {
      config._retry = true;
      try {
        refreshing ??= axios.post('/api/auth/refresh', { refreshToken: tokenStore.refresh });
        const { data } = await refreshing;
        refreshing = null;
        tokenStore.set(data);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
