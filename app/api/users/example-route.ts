import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, hasPermission, hasRole } from '@/lib/auth/context';

export async function GET(req: NextRequest) {
  // Get user context from headers
  const userContext = getUserContext(req);
  
  if (!userContext) {
    return NextResponse.json(
      { error: 'Unauthorized - No user context found' },
      { status: 401 }
    );
  }

  // Example 1: Check specific permission
  if (!hasPermission(userContext, 'users:read')) {
    return NextResponse.json(
      { error: 'Forbidden - Missing users:read permission' },
      { status: 403 }
    );
  }

  // Example 2: Check admin role
  if (hasRole(userContext, 'ADMIN')) {
    // Admin can see all users
    return NextResponse.json({
      message: 'Admin access - all users data',
      user: userContext
    });
  }

  // Example 3: Regular user with limited access
  return NextResponse.json({
    message: 'Limited access - your own data only',
    user: {
      id: userContext.id,
      roles: userContext.roles,
      permissions: userContext.permissions
    }
  });
}

export async function POST(req: NextRequest) {
  const userContext = getUserContext(req);
  
  if (!userContext) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Example: Require both users:create permission and ADMIN role
  if (!hasPermission(userContext, 'users:create') || !hasRole(userContext, 'ADMIN')) {
    return NextResponse.json(
      { error: 'Forbidden - Requires users:create permission and ADMIN role' },
      { status: 403 }
    );
  }

  // Process the request...
  return NextResponse.json({
    message: 'User created successfully',
    createdBy: userContext.id
  });
}
