export interface User {
  id: bigint;
  email: string;
  name: string;
  passwordHash: string;
  enabled: boolean;
  organizationId: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRole extends User {
  roles: Role[];
}

export interface Role {
  id: bigint;
  name: string;
  description: string;
  organizationId: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: bigint;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface AuthenticatedUser {
  id: bigint;
  username: string;
  roleIds: bigint[];
  permissions: string[];
}

export interface JWTPayload {
  userId: bigint;
  email: string;
  organizationId: bigint;
  roleIds: bigint[];
  username: string;
  type: 'access' | 'refresh';
  user?: {
    id: bigint;
    email: string;
    name: string;
    role: string;
    organizationId?: bigint;
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
    id: bigint;
    email: string;
    name: string;
    role: string;
    organizationId?: bigint;
  };
}
