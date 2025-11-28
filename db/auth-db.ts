import { getUserPermissions } from '../lib/auth/auth-db';

/**
 * Get user permissions from database
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  return await getUserPermissions(userId);
}

export default {
  getUserPermissions
};
