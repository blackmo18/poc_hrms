# JWT Utilities for Service-to-Service Communication

## Purpose
The JWT utilities in this directory are retained for future service-to-service authentication needs.

## Current Status
- **NOT** used for main application authentication (switched to Better-Auth)
- **PRESERVED** for potential microservices or external API integrations
- **AVAILABLE** for background jobs, cron tasks, or system-to-system communication

## Files Preserved
- `jwt.ts` - JWT token generation and validation utilities
- `auth-middleware.ts` - Alternative authentication middleware (if needed)

## When to Use These JWT Utilities
1. **Microservices**: When breaking the monolith into separate services
2. **External APIs**: When authenticating with third-party services
3. **Background Jobs**: When cron jobs or workers need system access
4. **Webhooks**: When validating incoming webhook signatures
5. **Mobile Apps**: If native mobile apps need JWT tokens instead of sessions

## Environment Variables for JWT
```bash
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN_MINUTES=10080  # 7 days default
```

## Security Notes
- JWT secrets are separate from Better-Auth secrets
- Use longer expiration times for service-to-service tokens
- Consider implementing token rotation for long-lived services
- Store secrets securely in production

## Migration Path
When implementing service-to-service authentication:
1. Use existing `JWTUtils.generateAccessToken()` and `JWTUtils.generateRefreshToken()`
2. Implement token refresh logic using `JWTUtils.refreshToken()`
3. Use `JWTUtils.verifyAccessToken()` for token validation
4. Consider adding service-specific claims to JWT payloads
