export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  enabled: boolean;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRole extends User {
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  roleIds: number[];
  permissions: string[];
}

export interface JWTPayload {
  userId: number;
  email: string;
  organizationId: number;
  roleIds: number[];
  username: string;
  type: 'access' | 'refresh';
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    organizationId?: number;
  };
}

// Interface for JWT serialization (uses strings for JSON compatibility)
export interface JWTSerializablePayload {
  userId: string;
  email: string;
  organizationId: string | undefined;
  roleIds: string[];
  username: string;
  type: 'access' | 'refresh';
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    organizationId?: number;
  };
}
