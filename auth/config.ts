/**
 * Authentication Configuration
 */

export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED !== 'false';
}

export function isExternalAuthEnabled(): boolean {
  return process.env.EXTERNAL_AUTH_ENABLED === 'true';
}

export function getAuthEndpointUrl(): string {
  return process.env.EXTERNAL_AUTH_ENDPOINT || 'http://localhost:8080/auth';
}

export function getMockUser() {
  return {
    id: 1,
    username: 'mock-user',
    role_id: 1,
    permissions: ['users.read', 'dashboard.read']
  };
}
