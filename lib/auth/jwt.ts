import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import bcrypt from 'bcryptjs';
import { findUserByEmail, findUserById, getUserRoles, getUserPermissions, verifyPassword } from './auth-db';
import { JWTPayload, JWTSerializablePayload } from '@/models/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

export class JWTUtils {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    // Convert to serializable payload
    const serializablePayload: Omit<JWTSerializablePayload, 'type'> = {
      userId: payload.userId.toString(),
      email: payload.email,
      organizationId: payload.organizationId?.toString(),
      roleIds: payload.roleIds.map(id => id.toString()),
      username: payload.username
    };
    
    return jwt.sign(
      { ...serializablePayload, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    // Convert to serializable payload
    const serializablePayload: Omit<JWTSerializablePayload, 'type'> = {
      userId: payload.userId.toString(),
      email: payload.email,
      organizationId: payload.organizationId?.toString(),
      roleIds: payload.roleIds.map(id => id.toString()),
      username: payload.username
    };
    
    return jwt.sign(
      { ...serializablePayload, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Long-lived refresh token
    );
  }

  /**
   * Authenticate user and generate tokens
   */
  static async authenticateUser(email: string, password: string): Promise<{ user: any; accessToken: string; refreshToken: string } | null> {
    try {
      // Find user by email
      const user = await findUserByEmail(email);
      if (!user || !user.enabled) {
        return null;
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      // Get user roles
      const roles = await getUserRoles(user.id);
      const roleIds = roles.map(role => role.id);

      // Generate tokens
      const payload: Omit<JWTPayload, 'type'> = {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        roleIds,
        username: user.email // Use email as username for now
      };

      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // Get user permissions
      const permissions = await getUserPermissions(user.id);

      return {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: roles[0]?.name || 'EMPLOYEE',
          permissions,
          organizationId: user.organizationId?.toString()
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTSerializablePayload;
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      // Convert back to JWTPayload with BigInt types
      return {
        userId: BigInt(decoded.userId),
        email: decoded.email,
        organizationId: decoded.organizationId ? BigInt(decoded.organizationId) : BigInt(0),
        roleIds: decoded.roleIds.map(id => BigInt(id)),
        username: decoded.username,
        type: 'access'
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static async refreshToken(refreshToken: string) {
  try {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) return null;

    // Check if user exists and is active
    const user = await findUserById(payload.userId);
    if (!user || !user.enabled) return null;

    // Get user roles
    const roles = await getUserRoles(user.id);
    const roleIds = roles.map(role => role.id);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      username: user.email,
      roleIds
    });

    const newRefreshToken = this.generateRefreshToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      username: user.email,
      roleIds
    });

    // Get user permissions
    const permissions = await getUserPermissions(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roles[0]?.name || 'EMPLOYEE',
        permissions,
        organizationId: user.organizationId
      }
    };

  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTSerializablePayload;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Convert back to JWTPayload with BigInt types
      return {
        userId: BigInt(decoded.userId),
        email: decoded.email,
        organizationId: decoded.organizationId ? BigInt(decoded.organizationId) : BigInt(0),
        roleIds: decoded.roleIds.map(id => BigInt(id)),
        username: decoded.username,
        type: 'refresh'
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password using bcrypt
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded.exp) return null;
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Decode JWT token without verification (for extracting payload)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwtDecode<JWTSerializablePayload>(token);
      
      // Convert back to JWTPayload with BigInt types
      return {
        userId: BigInt(decoded.userId),
        email: decoded.email,
        organizationId: decoded.organizationId ? BigInt(decoded.organizationId) : BigInt(0),
        roleIds: decoded.roleIds.map(id => BigInt(id)),
        username: decoded.username,
        type: decoded.type
      };
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Extract user ID from token
   */
  static extractUserId(token: string): bigint | null {
    const decoded = this.decodeToken(token);
    return decoded?.userId || null;
  }

  /**
   * Extract email from token
   */
  static extractEmail(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.email || null;
  }

  /**
   * Extract organization ID from token
   */
  static extractOrganizationId(token: string): bigint | null {
    const decoded = this.decodeToken(token);
    return decoded?.organizationId || null;
  }

  /**
   * Extract role IDs from token
   */
  static extractRoleIds(token: string): bigint[] {
    const decoded = this.decodeToken(token);
    return decoded?.roleIds || [];
  }

  /**
   * Extract username from token
   */
  static extractUsername(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.username || null;
  }

  /**
   * Check if token is of specific type
   */
  static isTokenType(token: string, type: 'access' | 'refresh'): boolean {
    const decoded = this.decodeToken(token);
    return decoded?.type === type;
  }

  /**
   * Get all token claims as a readable object
   */
  static getTokenClaims(token: string): Partial<JWTPayload> | null {
    return this.decodeToken(token);
  }
}

export default JWTUtils;
