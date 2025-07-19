# Authentication Service

This service provides JWT-based authentication with refresh token functionality for the EduBridge application.

## Features

- JWT authentication with access and refresh tokens
- Access token expiration: 1 hour
- Refresh token expiration: 7 days
- Token invalidation on password change
- Session tracking for device management
- Refresh token rotation

## API

### generateTokens(user)

Generates a new pair of access and refresh tokens for a user.

- **Parameters**:
  - `user`: User object containing at least `id` and `role`
- **Returns**: Object containing `accessToken`, `refreshToken`, and `expiresIn`

### storeRefreshToken(userId, refreshToken, userAgent, ipAddress)

Stores a refresh token in the database with device information.

- **Parameters**:
  - `userId`: User ID
  - `refreshToken`: Refresh token
  - `userAgent`: User agent string
  - `ipAddress`: IP address
- **Returns**: Promise resolving to the stored session object

### refreshAccessToken(refreshToken)

Verifies a refresh token and generates a new access token.

- **Parameters**:
  - `refreshToken`: Refresh token
- **Returns**: Promise resolving to an object containing `accessToken` and `expiresIn`
- **Throws**: Error if refresh token is invalid or blacklisted

### invalidateAllUserTokens(userId)

Invalidates all refresh tokens for a user.

- **Parameters**:
  - `userId`: User ID
- **Returns**: Promise resolving when tokens are invalidated
- **Throws**: Error if invalidation fails

### invalidateRefreshToken(refreshToken)

Invalidates a specific refresh token.

- **Parameters**:
  - `refreshToken`: Refresh token
- **Returns**: Promise resolving when token is invalidated
- **Throws**: Error if invalidation fails

### validateCredentials(email, password)

Validates user credentials.

- **Parameters**:
  - `email`: User email
  - `password`: User password
- **Returns**: Promise resolving to user object if credentials are valid
- **Throws**: Error if credentials are invalid

### cleanupExpiredSessions()

Cleans up expired sessions from the database.

- **Returns**: Promise resolving when cleanup is complete

## Database Schema

The service uses a `user_sessions` table with the following structure:

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Considerations

- Access tokens are short-lived (1 hour) to minimize the impact of token theft
- Refresh tokens are stored in the database and can be invalidated
- Refresh tokens are invalidated when a user changes their password
- Device information is stored with refresh tokens to detect suspicious activity
- Expired sessions are automatically cleaned up