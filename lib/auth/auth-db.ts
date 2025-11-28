import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import { User, UserWithRole, Role, Permission, RoleWithPermissions } from '@/models/auth';

/* ------------------------------------------------------------ */
/* User Queries                                                  */
/* ------------------------------------------------------------ */

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { 
      email: email,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      email: true,
      name: true,
      password_hash: true,
      status: true,
      organization_id: true,
      created_at: true,
      updated_at: true
    }
  });
  
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    passwordHash: user.password_hash || '',
    enabled: user.status === 'ACTIVE',
    organizationId: user.organization_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

export const findUserById = async (userId: bigint): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      email: true,
      name: true,
      password_hash: true,
      status: true,
      organization_id: true,
      created_at: true,
      updated_at: true
    }
  });
  
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    passwordHash: user.password_hash || '',
    enabled: user.status === 'ACTIVE',
    organizationId: user.organization_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

export const getUserRoles = async (userId: bigint): Promise<Role[]> => {
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: userId },
    include: {
      role: true
    }
  });

  return userRoles.map(ur => ({
    id: ur.role.id,
    name: ur.role.name,
    description: ur.role.description || '',
    organizationId: ur.role.organization_id,
    createdAt: ur.role.created_at,
    updatedAt: ur.role.updated_at
  }));
};

export const getUserWithRoles = async (userId: bigint): Promise<UserWithRole | null> => {
  const user = await findUserById(userId);
  if (!user) return null;

  const roles = await getUserRoles(userId);
  return { ...user, roles };
};

/* ------------------------------------------------------------ */
/* Authentication Helpers                                        */
/* ------------------------------------------------------------ */

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/* ------------------------------------------------------------ */
/* User Modification                                             */
/* ------------------------------------------------------------ */

export const createUser = async (
  email: string,
  password: string,
  name: string,
  organizationId: bigint,
  createdBy: string
): Promise<bigint> => {
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password_hash: hash,
      organization_id: organizationId,
      status: 'ACTIVE'
    }
  });

  return user.id;
};

export const assignRoleToUser = async (userId: bigint, roleId: bigint): Promise<void> => {
  await prisma.userRole.create({
    data: {
      user_id: userId,
      role_id: roleId
    }
  });
};

export const removeRoleFromUser = async (userId: bigint, roleId: bigint): Promise<void> => {
  await prisma.userRole.deleteMany({
    where: {
      user_id: userId,
      role_id: roleId
    }
  });
};

export const updateUserPassword = async (
  userId: bigint,
  newPassword: string
): Promise<void> => {
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: hash }
  });
};

export const updateUser = async (
  userId: bigint,
  updates: { status?: string }
): Promise<void> => {
  const data: any = {};
  if (updates.status !== undefined) {
    data.status = updates.status;
  }

  if (Object.keys(data).length === 0) return;

  await prisma.user.update({
    where: { id: userId },
    data
  });
};

/* ------------------------------------------------------------ */
/* User Listing                                                  */
/* ------------------------------------------------------------ */

export const listUsers = async (organizationId: bigint): Promise<UserWithRole[]> => {
  const users = await prisma.user.findMany({
    where: { organization_id: organizationId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name || '',
    passwordHash: user.password_hash || '',
    enabled: user.status === 'ACTIVE',
    organizationId: user.organization_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    roles: user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description || '',
      organizationId: ur.role.organization_id,
      createdAt: ur.role.created_at,
      updatedAt: ur.role.updated_at
    }))
  }));
};

/* ------------------------------------------------------------ */
/* Roles                                                         */
/* ------------------------------------------------------------ */

export const getRoleById = async (roleId: bigint): Promise<Role | null> => {
  const role = await prisma.role.findUnique({
    where: { id: roleId }
  });
  
  if (!role) return null;
  
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    organizationId: role.organization_id,
    createdAt: role.created_at,
    updatedAt: role.updated_at
  };
};

export const getRoleByName = async (name: string, organizationId: bigint): Promise<Role | null> => {
  const role = await prisma.role.findUnique({
    where: { 
      name: name,
      organization_id: organizationId
    }
  });
  
  if (!role) return null;
  
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    organizationId: role.organization_id,
    createdAt: role.created_at,
    updatedAt: role.updated_at
  };
};

export const getAllRoles = async (organizationId: bigint): Promise<Role[]> => {
  const roles = await prisma.role.findMany({
    where: { organization_id: organizationId },
    orderBy: { name: 'asc' }
  });

  return roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description || '',
    organizationId: role.organization_id,
    createdAt: role.created_at,
    updatedAt: role.updated_at
  }));
};

export const getRolePermissions = async (roleId: bigint): Promise<Permission[]> => {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role_id: roleId },
    include: {
      permission: true
    }
  });

  return rolePermissions.map(rp => ({
    id: rp.permission.id,
    name: rp.permission.name,
    description: rp.permission.description || '',
    createdAt: rp.permission.created_at,
    updatedAt: rp.permission.updated_at
  }));
};

export const getRoleWithPermissions = async (
  roleId: bigint
): Promise<RoleWithPermissions | null> => {
  const role = await getRoleById(roleId);
  if (!role) return null;

  const permissions = await getRolePermissions(roleId);

  return {
    ...role,
    permissions
  };
};

/* ------------------------------------------------------------ */
/* Permissions                                                   */
/* ------------------------------------------------------------ */

export const getUserPermissions = async (userId: bigint): Promise<string[]> => {
  const permissions = await prisma.rolePermission.findMany({
    where: {
      role: {
        userRoles: {
          some: {
            user_id: userId
          }
        }
      }
    },
    include: {
      permission: true
    },
    distinct: ['permission_id']
  });

  return permissions.map(rp => rp.permission.name);
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  const permissions = await prisma.permission.findMany({
    orderBy: { name: 'asc' }
  });

  return permissions.map(permission => ({
    id: permission.id,
    name: permission.name,
    description: permission.description || '',
    createdAt: permission.created_at,
    updatedAt: permission.updated_at
  }));
};

export const assignPermissionToRole = async (roleId: number, permId: number): Promise<void> => {
  await prisma.rolePermission.create({
    data: {
      role_id: roleId,
      permission_id: permId
    }
  });
};

export const removePermissionFromRole = async (roleId: number, permId: number): Promise<void> => {
  await prisma.rolePermission.deleteMany({
    where: {
      role_id: roleId,
      permission_id: permId
    }
  });
};
