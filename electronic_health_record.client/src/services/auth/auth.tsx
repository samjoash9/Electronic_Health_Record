import api from '../../config/axios';

export const login = async (credentials: any) => {
  const response = await api.post("/Auth/login", credentials);
  return response.data;
};

export const getUser = async () => {
  const response = await api.get("/Auth/me");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/Auth/logout");
  localStorage.removeItem("token");
  return response.data;
};