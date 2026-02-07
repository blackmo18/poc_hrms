// migrate this as authentication service
// use existing service calls if available
// update all calls referecing this file
import bcrypt from 'bcryptjs';
import { User, UserWithRole, Role, Permission, RoleWithPermissions } from '@/models/auth';
import { getUserService } from '@/lib/service';
import { getRoleService } from '@/lib/service';
import { getPermissionService } from '@/lib/service';
import { getUserRoleService } from '@/lib/service';
import { getRolePermissionService } from '@/lib/service';

/* ------------------------------------------------------------ */
/* User Queries                                                  */
/* ------------------------------------------------------------ */

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const userService = getUserService();
  const user = await userService.getByEmail(email);

  if (!user || user.status !== 'ACTIVE') return null;

  // Get employee name if available
  let userName = '';
  let firstName = '';
  let lastName = '';
  if (user.employeeId) {
    const { prisma } = await import('@/lib/db');
    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      select: { firstName: true, lastName: true }
    });
    if (employee) {
      userName = `${employee.firstName} ${employee.lastName}`;
      firstName = employee.firstName;
      lastName = employee.lastName;
    }
  }

  return {
    id: user.id,  // Return CUID string ID
    email: user.email,
    name: userName,
    firstName: firstName,
    lastName: lastName,
    passwordHash: user.passwordHash || '',
    enabled: user.status === 'ACTIVE',
    organizationId: user.organizationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const findUserById = async (userId: string): Promise<User | null> => {
  const userService = getUserService();
  const user = await userService.getById(userId);

  if (!user || user.status !== 'ACTIVE') return null;

  // Get employee name if available
  let userName = '';
  let firstName = '';
  let lastName = '';
  if (user.employeeId) {
    const { prisma } = await import('@/lib/db');
    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      select: { firstName: true, lastName: true }
    });
    if (employee) {
      userName = `${employee.firstName} ${employee.lastName}`;
      firstName = employee.firstName;
      lastName = employee.lastName;
    }
  }

  return {
    id: user.id,  // Return CUID string ID
    email: user.email,
    name: userName,
    firstName: firstName,
    lastName: lastName,
    passwordHash: user.passwordHash || '',
    enabled: user.status === 'ACTIVE',
    organizationId: user.organizationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const getUserRoles = async (userId: string): Promise<Role[]> => {
  const userRoleService = getUserRoleService();
  const userRoles = await userRoleService.getByUserId(userId);

  const roleService = getRoleService();
  const roles = await Promise.all(
    userRoles.map(async (userRole) => {
      const role = await roleService.getById(userRole.roleId);
      if (!role) return null;
      return {
        id: role.id,
        name: role.name,
        description: (role as any).description || '',
        organizationId: role.organizationId,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
    })
  );

  return roles.filter((role): role is Role => role !== null);
};

export const getUserWithRoles = async (userId: string): Promise<UserWithRole | null> => {
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
  organizationId: string,
  createdBy: string
): Promise<string> => {  // Changed return type from number to string
  const hash = await bcrypt.hash(password, 12);

  const userService = getUserService();
  const user = await userService.create({
    email,
    organizationId: organizationId,
    status: 'ACTIVE',
    employeeId: null, // Will be set later when employee is created
    roleIds: [], // Will be assigned separately
    generatedPassword: hash
  });

  return user.id;  // Return CUID string ID instead of internal_id
};

export const assignRoleToUser = async (userId: string, roleId: string): Promise<void> => {
  const userRoleService = getUserRoleService();
  await userRoleService.create({
    userId: userId,
    roleId: roleId
  });
};

export const removeRoleFromUser = async (userId: string, roleId: string): Promise<void> => {
  const userRoleService = getUserRoleService();
  await userRoleService.deleteByUserAndRole(userId, roleId);
};

export const updateUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  const hash = await bcrypt.hash(newPassword, 12);
  const userService = getUserService();
  await userService.update(userId, { passwordHash: hash });
};

export const updateUser = async (
  userId: string,
  updates: { status?: string }
): Promise<void> => {
  const data: any = {};
  if (updates.status !== undefined) {
    data.status = updates.status;
  }

  if (Object.keys(data).length === 0) return;

  const userService = getUserService();
  await userService.update(userId, data);
};

/* ------------------------------------------------------------ */
/* User Listing                                                  */
/* ------------------------------------------------------------ */

export const listUsers = async (organizationId: string): Promise<UserWithRole[]> => {
  const userService = getUserService();
  const users = await userService.getByOrganizationId(organizationId);

  // For each user, get their roles
  const usersWithRoles = await Promise.all(
    users.map(async (user) => {
      const roles = await getUserRoles(user.id);
      return {
        id: user.id,  // Return CUID string ID
        email: user.email,
        name: '', // Name is now derived from employee, will be set separately if needed
        passwordHash: user.passwordHash || '',
        enabled: user.status === 'ACTIVE',
        organizationId: user.organizationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: roles
      };
    })
  );

  return usersWithRoles;
};

/* ------------------------------------------------------------ */
/* Roles                                                         */
/* ------------------------------------------------------------ */

export const getRoleById = async (roleId: string): Promise<Role | null> => {
  const roleService = getRoleService();
  const role = await roleService.getById(roleId);

  if (!role) return null;

  return {
    id: role.id,  // Return CUID string ID
    name: role.name,
    description: '',
    organizationId: role.organizationId,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  };
};

export const getRoleByName = async (name: string, organizationId: string): Promise<Role | null> => {
  const roleService = getRoleService();
  const role = await roleService.getByName(name);

  if (!role || role.organizationId !== organizationId) return null;

  return {
    id: role.id,  // Return CUID string ID
    name: role.name,
    description: '',
    organizationId: role.organizationId,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  };
};

export const getAllRoles = async (organizationId: string): Promise<Role[]> => {
  const roleService = getRoleService();
  const roles = await roleService.getByOrganizationId(organizationId);

  return roles.map(role => ({
    id: role.id,  // Return CUID string ID
    name: role.name,
    description: '',
    organizationId: role.organizationId,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  }));
};

export const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
  const rolePermissionService = getRolePermissionService();
  const rolePermissions = await rolePermissionService.getByRoleId(roleId);

  const permissionService = getPermissionService();
  const permissions = await Promise.all(
    rolePermissions.map(async (rolePermission) => {
      const permission = await permissionService.getById(rolePermission.permissionId);
      if (!permission) return null;
      return {
        id: permission.id,  // Return CUID string ID
        name: permission.name,
        description: permission.description || '',
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      };
    })
  );

  return permissions.filter((permission): permission is Permission => permission !== null);
};

export const getRoleWithPermissions = async (
  roleId: string
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

export const getUserPermissions = async (userId: string): Promise<string[]> => {
  const userService = getUserService();
  return await userService.getUserPermissions(userId);
};

export const getPermissionsByRoleIds = async (roleIds: string[]): Promise<string[]> => {
  const roleService = getRoleService();
  return await roleService.getPermissionsByRoleIds(roleIds);
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  const permissionService = getPermissionService();
  const permissions = await permissionService.getAll();

  return permissions.map(permission => ({
    id: permission.id,  // Return CUID string ID
    name: permission.name,
    description: permission.description || '',
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt
  }));
};

export const assignPermissionToRole = async (roleId: string, permId: string): Promise<void> => {
  const rolePermissionService = getRolePermissionService();
  await rolePermissionService.create({
    roleId: roleId,
    permissionId: permId
  });
};

export const removePermissionFromRole = async (roleId: string, permId: string): Promise<void> => {
  const rolePermissionService = getRolePermissionService();
  await rolePermissionService.deleteByRoleAndPermission(roleId, permId);
};
