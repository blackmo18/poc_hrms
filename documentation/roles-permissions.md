# Roles and Permissions Documentation

## Overview

This document outlines all supported roles and permissions in the HR Management System. The system uses a Role-Based Access Control (RBAC) model with granular permissions for fine-grained access control.

## Role Hierarchy

### Organization Roles
- **ADMIN** - System administrator with full access within organization
- **HR_MANAGER** - Human Resources manager with employee management access
- **EMPLOYEE** - Regular employee with self-service access

## Actual Permission Values

### 1. User Management Permissions
| Permission | Description | Assigned Roles |
|------------|-------------|----------------|
| `users.create` | Create users | ADMIN |
| `users.read` | View users | ADMIN, EMPLOYEE |
| `users.update` | Update users | ADMIN |
| `users.delete` | Delete users | ADMIN |

### 2. Employee Management Permissions
| Permission | Description | Assigned Roles |
|------------|-------------|----------------|
| `employees.create` | Create employees | ADMIN, HR_MANAGER |
| `employees.read` | View employees | ADMIN, HR_MANAGER, EMPLOYEE |
| `employees.update` | Update employees | ADMIN, HR_MANAGER |
| `employees.delete` | Delete employees | ADMIN, HR_MANAGER |

### 3. Payroll Management Permissions
| Permission | Description | Assigned Roles |
|------------|-------------|----------------|
| `payroll.process` | Process payroll | ADMIN, HR_MANAGER |

### 4. Leave Management Permissions
| Permission | Description | Assigned Roles |
|------------|-------------|----------------|
| `leave.approve` | Approve leave requests | ADMIN, HR_MANAGER |

## Role-Permission Mapping

### ADMIN Role
**Full Access** - All permissions:
- `users.create`, `users.read`, `users.update`, `users.delete`
- `employees.create`, `employees.read`, `employees.update`, `employees.delete`
- `payroll.process`
- `leave.approve`

### HR_MANAGER Role
**HR & Employee Management**:
- `employees.create`, `employees.read`, `employees.update`, `employees.delete`
- `leave.approve`

### EMPLOYEE Role
**Read-Only Access**:
- `users.read`
- `employees.read`

## Database Schema

### Tables Structure
```sql
-- Roles table
CREATE TABLE roles (
  id BIGINT PRIMARY KEY,
  organization_id BIGINT,
  name VARCHAR UNIQUE,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
  id BIGINT PRIMARY KEY,
  name VARCHAR UNIQUE,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  organization_id BIGINT
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
  id BIGINT PRIMARY KEY,
  role_id BIGINT,
  permission_id BIGINT,
  created_at TIMESTAMP
);
```

### Current Database Values

#### Roles
| ID | Name | Description |
|----|------|-------------|
| 1 | ADMIN | System administrator with full access |
| 2 | HR_MANAGER | Human Resources manager with employee management access |
| 3 | EMPLOYEE | Regular employee with self-service access |

#### Permissions
| ID | Name | Description |
|----|------|-------------|
| 1 | users.create | Create users |
| 2 | users.read | Read users |
| 3 | users.update | Update users |
| 4 | users.delete | Delete users |
| 5 | employees.create | Create employees |
| 6 | employees.read | Read employees |
| 7 | employees.update | Update employees |
| 8 | employees.delete | Delete employees |
| 9 | payroll.process | Process payroll |
| 10 | leave.approve | Approve leave requests |

#### Role-Permission Mapping
| Role | Permission |
|------|------------|
| ADMIN | All permissions (1-10) |
| HR_MANAGER | employees.* (5-8), leave.approve (10) |
| EMPLOYEE | users.read (2), employees.read (6) |

## Implementation Examples

### Using Role-Based Authorization

```typescript
// API Route with role check
export async function GET(request: NextRequest) {
  return await requireRoles(
    request,
    ['ADMIN', 'HR_MANAGER'],
    async (authRequest) => {
      const employees = await employeeController.getAll();
      return NextResponse.json(employees);
    }
  );
}
```

### Using Permission-Based Authorization

```typescript
// API Route with permission check
export async function DELETE(request: NextRequest) {
  return await requirePermission(
    request,
    ['employees.delete'],
    async (authRequest) => {
      const employeeId = request.nextUrl.searchParams.get('id');
      await employeeController.delete(BigInt(employeeId));
      return NextResponse.json({ message: 'Employee deleted successfully' });
    }
  );
}
```

### Database Query Examples

```sql
-- Get all permissions for a role
SELECT p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 1; -- ADMIN role

-- Get all roles for a permission
SELECT r.name, r.description 
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
WHERE rp.permission_id = 5; -- employees.create

-- Get user permissions through roles
SELECT DISTINCT p.name, p.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 1; -- Specific user
```

## Security Considerations

1. **Principle of Least Privilege**: Users should only have permissions necessary for their job functions
2. **Regular Audits**: Periodically review user roles and permissions
3. **Permission Separation**: Critical operations should require multiple permissions
4. **Audit Logging**: All permission-based actions should be logged
5. **Role Validation**: Validate role assignments during user creation/update

## Best Practices

1. **Use Permission-Based Authorization**: More granular and flexible than role-based
2. **Combine Approaches**: Use roles for broad categories and permissions for specific actions
3. **Document Changes**: Keep this documentation updated when adding new roles/permissions
4. **Test Thoroughly**: Test all permission combinations during development
5. **Error Handling**: Provide clear error messages for permission failures

## Future Enhancements

1. **Dynamic Permissions**: Permission sets that change based on context
2. **Time-Based Permissions**: Temporary permissions for specific periods
3. **Conditional Permissions**: Permissions based on data ownership
4. **Permission Templates**: Pre-defined permission sets for common roles
5. **Audit Dashboard**: Real-time permission usage monitoring

## API Usage

### Check User Permissions
```typescript
// Get permissions for user role
const permissions = await permissionController.getPermissionsByRoleId(BigInt(1));
// Result: ['users.create', 'users.read', 'users.update', 'users.delete', ...]

// Check specific permission
const hasPermission = permissions.includes('employees.create');
```

### Role Management
```typescript
// Create new role
const role = await roleController.create({
  name: 'DEPARTMENT_HEAD',
  description: 'Department level manager',
  organization_id: BigInt(1)
});

// Assign permission to role
await roleController.assignPermission(role.id, BigInt(5)); // employees.create
```

This documentation reflects the current implementation with actual database values and can be used as a reference for developers and administrators.
