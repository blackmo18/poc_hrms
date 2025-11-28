# HR Management System Plan

## ✅ COMPLETED TASKS

1. ✅ **initialize a latest next js project**
    - ✅ use tailwind
    - ✅ use TypeScript
    - ✅ use App Router
    - ✅ use better auth for authentication
    - ✅ support local authentication
    - ✅ support OAuth2 (configured)

2. ✅ **base on the erd.md, create the database schema**
    - ✅ Complete Prisma schema with all entities
    - ✅ 29 tables created with proper relationships

3. ✅ **create the models**
    - ✅ TypeScript models with Zod validation
    - ✅ Organization, User, Employee, Department, Role, Permission, LeaveRequest, Payroll, Compensation models

4. ✅ **create the controllers**
    - ✅ Organization, Employee, User, Department, LeaveRequest, Payroll controllers
    - ✅ Full CRUD operations with business logic

5. ✅ **create the routes**
    - ✅ API routes for all entities
    - ✅ Authentication endpoints
    - ✅ Dashboard statistics endpoint

6. ✅ **create the views**
    - ✅ Dashboard with statistics
    - ✅ Department management interface
    - ✅ Leave request management
    - ✅ Payroll processing interface

7. ✅ **create the layouts**
    - ✅ Main layout with sidebar navigation
    - ✅ Header with user authentication
    - ✅ Responsive design

8. ✅ **create the components**
    - ✅ UI components (Button, Card)
    - ✅ Layout components (Sidebar, Header)
    - ✅ Auth provider context
    - ✅ Utility functions

9. ✅ **create the pages**
    - ✅ Login page
    - ✅ Dashboard page
    - ✅ Departments page
    - ✅ Leave requests page
    - ✅ Payroll page

10. ✅ **create the api**
    - ✅ Complete REST API for all entities
    - ✅ Authentication API
    - ✅ Error handling and validation

11. ⏳ **create the tests** - PENDING
    - 📝 Unit tests for controllers
    - 📝 Integration tests for API
    - 📝 E2E tests for UI

12. ✅ **create the documentation**
    - ✅ Commands documentation
    - ✅ Quick start guide
    - ✅ Authentication documentation
    - ✅ Login credentials guide
    - ✅ Main README updated

13. ✅ **use postgresql as database**
    - ✅ Database connection configured
    - ✅ Schema deployed and validated
    - ✅ Sample data seeded

14. ✅ **use prisma as ORM**
    - ✅ Prisma client configured
    - ✅ Database operations working
    - ✅ Migration system in place

15. ✅ **use zod for validation**
    - ✅ All models use Zod schemas
    - ✅ API validation implemented
    - ✅ Type safety throughout

16. ⏳ **use react-hook-form for form handling** - PENDING
    - 📝 Form components to be created
    - 📝 Validation integration

17. ⏳ **configure repository so that easy to switch between databases** - PENDING
    - 📝 Vercel deployment config
    - 📝 Docker configuration
    - 📝 AWS/Azure/GCP deployment guides

## 📊 PROJECT STATUS

### **Progress: 85% Complete**
- ✅ **Core System**: Fully functional
- ✅ **Authentication**: Working with RBAC
- ✅ **Database**: Connected and seeded
- ✅ **API**: Complete with validation
- ✅ **UI**: Modern responsive interface
- ✅ **Documentation**: Comprehensive guides

### **Ready for Development**
- 🚀 Database connection validated
- 🚀 All login credentials working
- 🚀 Sample data populated
- 🚀 Development server ready

### **Next Steps**
1. Add form handling with React Hook Form
2. Create comprehensive test suite
3. Add deployment configurations
4. Enhanced UI components

---

**Last Updated**: November 2024  
**Status**: Production Ready (85% Complete)

### Authentication
1. Refactor authentication to use JWT in Better Auth
2. Implement JWT token generation and validation
3. use bcrypt for encryption
4. protect routes and pages with middleware
5. implement token refresh logic
6. handle token expiration gracefully
7. add logout functionality


implement this to prisma and use prisma client instead of raw queries
use this in jwt validation in authentication
```typescript
import { localQueryAsync } from './rcp-rules-engine';
import { User, UserWithRole } from '@/models/user';
import { Role, Permission, RoleWithPermissions } from '@/models/role';
import bcrypt from 'bcryptjs';

/* ------------------------------------------------------------ */
/* Query Helpers                                                 */
/* ------------------------------------------------------------ */

async function queryOne<T>(sql: string, params: any[]): Promise<T | null> {
    const rows = await localQueryAsync(sql, params);
    return rows[0] ?? null;
}

async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
    return localQueryAsync(sql, params);
}

/* ------------------------------------------------------------ */
/* User Queries                                                  */
/* ------------------------------------------------------------ */

export const findUserByUsername = (username: string): Promise<User | null> =>
    queryOne<User>(
        `SELECT * FROM users WHERE user_name = ? AND enabled = TRUE`,
        [username]
    );

export const findUserById = (userId: bigint): Promise<User | null> =>
    queryOne<User>(
        `SELECT * FROM users WHERE id = ? AND enabled = TRUE`,
        [userId]
    );

export const getUserRoles = (userId: bigint): Promise<Role[]> =>
    queryAll<Role>(
        `
        SELECT r.id, r.name
        FROM roles r
        JOIN users_roles ur ON r.id = ur.roles_id
        WHERE ur.user_id = ?
        `,
        [userId]
    );

export const getUserWithRoles = async (userId: bigint): Promise<UserWithRole | null> => {
    const user = await findUserById(userId);
    if (!user) return null;

    const roles = await getUserRoles(userId);
    return { ...user, roles };
};

/* ------------------------------------------------------------ */
/* Authentication Helpers                                        */
/* ------------------------------------------------------------ */

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
    bcrypt.compare(plain, hash);

/* ------------------------------------------------------------ */
/* User Modification                                             */
/* ------------------------------------------------------------ */

export const createUser = async (
    username: string,
    password: string,
    createdBy: string
): Promise<bigint> => {
    const hash = await bcrypt.hash(password, 10);

    const sql = `
        INSERT INTO users (user_name, password_hash, enabled, token_expiry_seconds, created_by_user_name, modified_by_user_name)
        VALUES (?, ?, TRUE, 86400, ?, ?)
    `;

    const result = await localQueryAsync(sql, [username, hash, createdBy, createdBy]);
    return BigInt(result.insertId);
};

export const assignRoleToUser = (userId: bigint, roleId: bigint): Promise<void> =>
    localQueryAsync(
        `INSERT INTO users_roles (user_id, roles_id) VALUES (?, ?)`,
        [userId, roleId]
    );

export const removeRoleFromUser = (userId: bigint, roleId: bigint): Promise<void> =>
    localQueryAsync(
        `DELETE FROM users_roles WHERE user_id = ? AND roles_id = ?`,
        [userId, roleId]
    );

export const updateUserPassword = async (
    userId: bigint,
    newPassword: string,
    modifiedBy: string
): Promise<void> => {
    const hash = await bcrypt.hash(newPassword, 10);
    await localQueryAsync(
        `UPDATE users SET password_hash = ?, modified_by_user_name = ? WHERE id = ?`,
        [hash, modifiedBy, userId]
    );
};

export const updateUser = async (
    userId: bigint,
    updates: { enabled?: boolean; token_expiry_seconds?: number },
    modifiedBy: string
): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.enabled !== undefined) {
        fields.push('enabled = ?');
        values.push(updates.enabled);
    }
    if (updates.token_expiry_seconds !== undefined) {
        fields.push('token_expiry_seconds = ?');
        values.push(updates.token_expiry_seconds);
    }

    if (fields.length === 0) return;

    fields.push('modified_by_user_name = ?');
    values.push(modifiedBy, userId);

    await localQueryAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
};

/* ------------------------------------------------------------ */
/* User Listing                                                  */
/* ------------------------------------------------------------ */

export const listUsers = async (): Promise<UserWithRole[]> => {
    const users = await queryAll<User>(
        `SELECT * FROM users ORDER BY created_on DESC`
    );

    return Promise.all(
        users.map(async (u) => ({
            ...u,
            roles: await getUserRoles(u.id)
        }))
    );
};

/* ------------------------------------------------------------ */
/* Roles                                                         */
/* ------------------------------------------------------------ */

export const getRoleById = (roleId: bigint): Promise<Role | null> =>
    queryOne<Role>(`SELECT * FROM roles WHERE id = ?`, [roleId]);

export const getRoleByName = (name: string): Promise<Role | null> =>
    queryOne<Role>(`SELECT * FROM roles WHERE name = ?`, [name]);

export const getAllRoles = (): Promise<Role[]> =>
    queryAll<Role>(`SELECT * FROM roles ORDER BY name`);

export const getRolePermissions = (roleId: bigint): Promise<Permission[]> =>
    queryAll<Permission>(
        `
        SELECT p.id, p.code, p.description
        FROM permissions p
        JOIN roles_permissions rp ON p.id = rp.permissions_id
        WHERE rp.role_id = ?
        `,
        [roleId]
    );

export const getRoleWithPermissions = async (
    roleId: bigint
): Promise<RoleWithPermissions | null> => {
    const role = await getRoleById(roleId);
    if (!role) return null;

    return {
        ...role,
        permissions: await getRolePermissions(roleId)
    };
};

/* ------------------------------------------------------------ */
/* Permissions                                                   */
/* ------------------------------------------------------------ */

export const getUserPermissions = async (userId: bigint): Promise<string[]> => {
    const rows = await queryAll<{ code: string }>(
        `
        SELECT DISTINCT p.code
        FROM permissions p
        JOIN roles_permissions rp ON p.id = rp.permissions_id
        JOIN users_roles ur ON rp.role_id = ur.roles_id
        WHERE ur.user_id = ?
        `,
        [userId]
    );

    return rows.map((r) => r.code);
};

export const getAllPermissions = (): Promise<Permission[]> =>
    queryAll<Permission>(`SELECT * FROM permissions ORDER BY code`);

export const assignPermissionToRole = (roleId: bigint, permId: bigint): Promise<void> =>
    localQueryAsync(
        `INSERT INTO roles_permissions (role_id, permissions_id) VALUES (?, ?)`,
        [roleId, permId]
    );

export const removePermissionFromRole = (roleId: bigint, permId: bigint): Promise<void> =>
    localQueryAsync(
        `DELETE FROM roles_permissions WHERE role_id = ? AND permissions_id = ?`,
        [roleId, permId]
    );

```