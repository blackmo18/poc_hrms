export interface User {
  id: string;  // Changed from number to string (CUID)
  email: string;
  name: string;
  passwordHash: string;
  enabled: boolean;
  organization_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRole extends User {
  roles: Role[];
}

export interface Role {
  id: string;  // Changed from number to string (CUID)
  name: string;
  description: string;
  organization_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;  // Changed from number to string (CUID)
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface AuthenticatedUser {
  id: string;  // Changed from number to string (CUID)
  username: string;
  roleIds: string[];  // Changed from number[] to string[] (CUID)
  permissions: string[];
}

export interface JWTPayload {
  userId: string;  // Updated to string to match CUID IDs
  email: string;
  organization_id: string;
  roleIds: string[];  // Updated to string[] to match CUID IDs
  username: string;
  type: 'access' | 'refresh';
  user?: {
    id: string;  // Updated to string to match CUID IDs
    email: string;
    name: string;
    role: string;
    organization_id?: string;
  };
}

// Interface for JWT serialization (uses strings for JSON compatibility)
export interface JWTSerializablePayload {
  userId: string;
  email: string;
  organizationId?: string;
  roleIds: string[];
  username: string;
  type: 'access' | 'refresh';
  user?: {
    id: string;  // Changed from number to string (CUID)
    email: string;
    name: string;
    role: string;
    organization_id?: string;
  };
}
