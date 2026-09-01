import axios from "axios";

// Relative baseURL: requests go to the Vite dev server's own origin
// (https://localhost:53807/api/...), which vite.config.js already proxies
// to the ASP.NET backend over HTTPS. This avoids CORS and redirect issues
// entirely, since the browser sees it as a same-origin request.
const api = axios.create({
  baseURL: "/api",
});

// Automatically attach the token to every outgoing request, if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;