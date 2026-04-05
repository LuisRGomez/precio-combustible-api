// Re-export everything from context so existing imports don't break
export type { UserProfile, RegisterData, RegisterResult } from '../context/UserContext';
export { useUserContext as useUser } from '../context/UserContext';
