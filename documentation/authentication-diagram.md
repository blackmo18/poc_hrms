# Authentication Implementation Documentation

## Overview

This document describes the authentication system implementation that supports JWT-based local authentication, Google OAuth, and better-auth integration.

## Architecture Diagram

```mermaid
graph TB
    %% User Interface Layer
    User[User] --> Login[Login Page]
    User --> Dashboard[Dashboard]
    User --> Protected[Protected Routes]
    
    %% Authentication Flow
    Login --> AuthChoice{Authentication Method}
    AuthChoice -->|Local Auth| JWTFlow[JWT Flow]
    AuthChoice -->|Google OAuth| GoogleFlow[Google OAuth Flow]
    
    %% JWT Authentication Flow
    JWTFlow --> SignInAPI["/api/auth/sign-in"]
    SignInAPI --> JWTUtils[JWT Utils]
    JWTUtils --> AuthDB[(Auth Database)]
    AuthDB -->|User Found| JWTGenerate[Generate JWT Tokens]
    JWTGenerate --> SetCookies[Set HTTP-Only Cookies]
    SetCookies --> SessionCheck["/api/auth/session"]
    SessionCheck --> AuthProvider[Auth Provider]
    AuthProvider --> Dashboard
    
    %% Google OAuth Flow
    GoogleFlow --> BetterAuth[Better-Auth]
    BetterAuth --> GoogleAPI[Google OAuth API]
    GoogleAPI --> BetterAuthSession[Better-Auth Session]
    BetterAuthSession --> SessionCheck
    SessionCheck --> AuthProvider
    
    %% Session Management
    AuthProvider --> SessionCheck
    SessionCheck --> JWTValidate{JWT Token?}
    JWTValidate -->|Yes| JWTVerify[Verify JWT Token]
    JWTValidate -->|No| BetterAuthCheck{Better-Auth Session?}
    BetterAuthCheck -->|Yes| GetBetterAuthSession[Get Better-Auth Session]
    BetterAuthCheck -->|No| ReturnNull[Return User: null]
    
    JWTVerify --> GetUserRoles[Get User Roles/Permissions]
    GetBetterAuthSession --> GetUserRoles
    GetUserRoles --> ReturnUser[Return User Data]
    
    %% Token Refresh Flow
    AuthProvider --> TokenRefresh["/api/auth/refresh"]
    TokenRefresh --> RefreshToken[Refresh JWT Token]
    RefreshToken --> NewTokens[Generate New Tokens]
    NewTokens --> UpdateCookies[Update Cookies]
    UpdateCookies --> AuthProvider
    
    %% Logout Flow
    AuthProvider --> SignOutAPI["/api/auth/sign-out"]
    SignOutAPI --> ClearCookies[Clear All Cookies]
    ClearCookies --> AuthProvider
    
    %% Protected Routes
    Protected --> ProtectedRoute[ProtectedRoute Component]
    ProtectedRoute --> AuthProvider
    AuthProvider -->|Not Authenticated| RedirectToLogin[Redirect to Login]
    AuthProvider -->|Authenticated| RenderComponent[Render Component]
    
    %% Database Layer
    AuthDB --> UsersTable[Users Table]
    AuthDB --> RolesTable[Roles Table]
    AuthDB --> UserRolesTable[User Roles Table]
    AuthDB --> PermissionsTable[Permissions Table]
    AuthDB --> RolePermissionsTable[Role Permissions Table]
    
    %% Styling
    classDef userInterface fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef auth fill:#fff3e0
    classDef flow fill:#fce4ec
    
    class User,Login,Dashboard,Protected userInterface
    class SignInAPI,SessionCheck,TokenRefresh,SignOutAPI api
    class AuthDB,UsersTable,RolesTable,UserRolesTable,PermissionsTable,RolePermissionsTable database
    class JWTUtils,BetterAuth,AuthProvider,ProtectedRoute auth
    class JWTFlow,GoogleFlow,AuthChoice flow
```

## JWT Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Page
    participant SignInAPI as /api/auth/sign-in
    participant JWTUtils as JWT Utils
    participant AuthDB as Auth DB
    participant AuthProvider as Auth Provider
    participant SessionAPI as /api/auth/session
    
    User->>Login: Enter credentials
    Login->>SignInAPI: POST {email, password}
    SignInAPI->>JWTUtils: authenticateUser()
    JWTUtils->>AuthDB: findUserByEmail()
    AuthDB-->>JWTUtils: User data
    JWTUtils->>AuthDB: getUserRoles()
    AuthDB-->>JWTUtils: User roles
    JWTUtils->>JWTUtils: generateAccessToken()
    JWTUtils->>JWTUtils: generateRefreshToken()
    JWTUtils-->>SignInAPI: {user, accessToken, refreshToken}
    SignInAPI-->>Login: Set HTTP-Only cookies
    Login->>AuthProvider: checkAuth()
    AuthProvider->>SessionAPI: GET /api/auth/session
    SessionAPI->>JWTUtils: verifyAccessToken()
    JWTUtils-->>SessionAPI: Valid payload
    SessionAPI->>AuthDB: getUserRoles()
    SessionAPI->>AuthDB: getUserPermissions()
    SessionAPI-->>AuthProvider: {user, roles, permissions}
    AuthProvider-->>User: Redirect to Dashboard
```

## Google OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Page
    participant BetterAuth as Better-Auth
    participant Google as Google OAuth
    participant SessionAPI as /api/auth/session
    participant AuthProvider as Auth Provider
    
    User->>Login: Click "Sign in with Google"
    Login->>BetterAuth: Initiate OAuth flow
    BetterAuth->>Google: Redirect to Google
    Google-->>User: Authorization prompt
    User-->>Google: Grant permission
    Google-->>BetterAuth: Authorization code
    BetterAuth->>Google: Exchange for tokens
    Google-->>BetterAuth: Access tokens + user info
    BetterAuth->>BetterAuth: Create session
    BetterAuth-->>Login: Set Better-Auth cookies
    Login->>AuthProvider: checkAuth()
    AuthProvider->>SessionAPI: GET /api/auth/session
    SessionAPI->>BetterAuth: getSession()
    BetterAuth-->>SessionAPI: Session data
    SessionAPI->>AuthDB: getUserRoles()
    SessionAPI->>AuthDB: getUserPermissions()
    SessionAPI-->>AuthProvider: {user, roles, permissions}
    AuthProvider-->>User: Redirect to Dashboard
```

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant AuthProvider as Auth Provider
    participant RefreshAPI as /api/auth/refresh
    participant JWTUtils as JWT Utils
    participant AuthDB as Auth DB
    
    Note over AuthProvider: Access token expiring soon
    AuthProvider->>RefreshAPI: POST {refreshToken}
    RefreshAPI->>JWTUtils: verifyRefreshToken()
    JWTUtils-->>RefreshAPI: Valid payload
    RefreshAPI->>AuthDB: findUserById()
    AuthDB-->>RefreshAPI: User data
    RefreshAPI->>AuthDB: getUserRoles()
    AuthDB-->>RefreshAPI: User roles
    RefreshAPI->>JWTUtils: generateAccessToken()
    RefreshAPI->>JWTUtils: generateRefreshToken()
    JWTUtils-->>RefreshAPI: New tokens
    RefreshAPI-->>AuthProvider: {accessToken, refreshToken, user}
    AuthProvider->>AuthProvider: Update localStorage
```

## Session Validation Logic

```mermaid
flowchart TD
    Start[/api/auth/session] --> CheckCookies{Check Cookies}
    CheckCookies -->|JWT Token| ValidateJWT[Validate JWT Token]
    CheckCookies -->|No JWT Token| CheckBetterAuth{Check Better-Auth Session}
    
    ValidateJWT -->|Valid| GetUserData[Get User Data]
    ValidateJWT -->|Invalid| ReturnNull[Return User: null]
    
    CheckBetterAuth -->|Valid Session| GetBetterAuthData[Get Better-Auth Data]
    CheckBetterAuth -->|No Session| ReturnNull
    
    GetUserData --> GetRoles[Get Roles/Permissions]
    GetBetterAuthData --> GetRoles
    GetRoles --> ReturnUser[Return User Data]
    ReturnNull --> End[End]
    ReturnUser --> End
    
    classDef api fill:#e1f5fe
    classDef logic fill:#f3e5f5
    classDef success fill:#e8f5e8
    classDef error fill:#ffebee
    
    class Start,CheckCookies,CheckBetterAuth api
    class ValidateJWT,GetUserData,GetBetterAuthData,GetRoles logic
    class ReturnUser,End success
    class ReturnNull error
```

## Protected Route Flow

```mermaid
flowchart TD
    Component[Protected Component] --> ProtectedRoute[ProtectedRoute HOC]
    ProtectedRoute --> AuthProvider[Auth Provider]
    AuthProvider --> CheckUser{User Exists?}
    
    CheckUser -->|No User| RedirectToLogin[Redirect to /login]
    CheckUser -->|Has User| CheckRole{Check Required Role}
    
    CheckRole -->|Role Mismatch| RedirectToFallback[Redirect to Fallback]
    CheckRole -->|Role Valid| CheckPermission{Check Required Permission}
    
    CheckPermission -->|Permission Mismatch| RedirectToFallback
    CheckPermission -->|Permission Valid| RenderComponent[Render Component]
    
    RedirectToLogin --> End[End]
    RedirectToFallback --> End
    RenderComponent --> End
    
    classDef component fill:#e1f5fe
    classDef auth fill:#fff3e0
    classDef logic fill:#f3e5f5
    classDef redirect fill:#fce4ec
    classDef success fill:#e8f5e8
    
    class Component,ProtectedRoute component
    class AuthProvider auth
    class CheckUser,CheckRole,CheckPermission logic
    class RedirectToLogin,RedirectToFallback redirect
    class RenderComponent,End success
```

## Database Schema

```mermaid
erDiagram
    Users {
        bigint id PK
        string email UK
        string name
        string password_hash
        string status
        bigint organization_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    Roles {
        bigint id PK
        string name
        string description
        bigint organization_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    UserRoles {
        bigint user_id FK
        bigint role_id FK
        timestamp created_at
    }
    
    Permissions {
        bigint id PK
        string name UK
        string description
        timestamp created_at
        timestamp updated_at
    }
    
    RolePermissions {
        bigint role_id FK
        bigint permission_id FK
        timestamp created_at
    }
    
    Organizations {
        bigint id PK
        string name
        string description
        timestamp created_at
        timestamp updated_at
    }
    
    Users ||--o{ UserRoles : has
    Roles ||--o{ UserRoles : assigned
    Roles ||--o{ RolePermissions : has
    Permissions ||--o{ RolePermissions : granted
    Organizations ||--o{ Users : contains
    Organizations ||--o{ Roles : contains
```

## Configuration Summary

### JWT Configuration
- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration  
- **Storage**: HTTP-Only cookies + localStorage (refresh only)
- **Algorithm**: HS256 with server secret

### Better-Auth Configuration
- **Session**: 7 days expiration
- **Providers**: Google OAuth, GitHub OAuth
- **Cookie Cache**: 5 minutes
- **Database**: PostgreSQL via Prisma adapter

### Security Features
- HTTP-Only cookies for tokens
- Secure flag in production
- SameSite lax policy
- Automatic token refresh
- Role-based access control (RBAC)
- Permission-based authorization

## File Structure

```
lib/
├── auth.ts              # Better-auth configuration
├── auth/
│   ├── jwt.ts           # JWT utilities
│   ├── auth-db.ts       # Database auth functions
│   └── middleware.ts    # Auth middleware
app/
├── api/auth/
│   ├── sign-in/         # JWT login
│   ├── sign-out/        # Logout endpoint
│   ├── session/         # Session validation
│   └── refresh/         # Token refresh
├── components/
│   ├── providers/
│   │   └── auth-provider.tsx  # React auth context
│   └── protected-route.tsx    # Route protection HOC
└── not-found.tsx        # Generic 404 page
```
