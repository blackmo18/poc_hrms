import { JWTUtils } from './lib/auth/jwt';
import { JWTPayload } from './models/auth';



/**
 * Verify JWT token and return payload
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    return JWTUtils.verifyAccessToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Decode JWT token without verification
 */
export function decodeToken(token: string): JWTPayload | null {
  return JWTUtils.decodeToken(token);
}

/**
 * Extract user ID from token
 */
export function extractUserId(token: string): bigint | null {
  return JWTUtils.extractUserId(token);
}

/**
 * Extract username from token
 */
export function extractUsername(token: string): string | null {
  return JWTUtils.extractUsername(token);
}

export default {
  verifyToken,
  decodeToken,
  extractUserId,
  extractUsername
};
