import { getCurrentUser, login, logout, register } from './api';

export const extractUser = (response) => response?.user || response?.data?.user || null;

export { getCurrentUser, login, logout, register };
