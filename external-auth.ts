/**
 * External Authentication Service
 * 
 * Handles authentication with external authentication endpoint
 */

import { getAuthEndpointUrl } from './lib/config';
import { jwtDecode } from 'jwt-decode';

/* ------------------------------------------------------------ */
/* Types                                                         */
/* ------------------------------------------------------------ */

export interface ExternalAuthResponse {
    access_token: string;
}

export interface ExternalTokenPayload {
    sub: string;        // username / email
    permissions: string[];
    token_id?: string;
    iat?: number;
    exp?: number;
}

/* ------------------------------------------------------------ */
/* Helpers                                                       */
/* ------------------------------------------------------------ */

function failure(error: string) {
    return { success: false, error } as const;
}

function decodeToken(token: string): ExternalTokenPayload | null {
    try {
        const decoded = jwtDecode<ExternalTokenPayload>(token);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return null;
        }

        return decoded;
    } catch (err) {
        console.error('Failed to decode external JWT:', err);
        return null;
    }
}

/* ------------------------------------------------------------ */
/* Authentication                                                */
/* ------------------------------------------------------------ */

export async function authenticateExternal(
    username: string,
    password: string
): Promise<{
    success: boolean;
    token?: string;
    permissions?: string[];
    username?: string;
    error?: string;
}> {
    try {
        const url = getAuthEndpointUrl();
        
        if (!url) {
            return { success: false, error: 'Authentication endpoint URL not configured' };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) return failure('Invalid credentials');

        const data: ExternalAuthResponse = await response.json();
        if (!data.access_token) return failure('No access token received');

        const decoded = decodeToken(data.access_token);
        if (!decoded) return failure('Invalid external token received');

        return {
            success: true,
            token: data.access_token,
            permissions: decoded.permissions ?? [],
            username: decoded.sub,
        };
    } catch (err) {
        console.error('External authentication error:', err);
        return failure('Authentication service unavailable');
    }
}

/* ------------------------------------------------------------ */
/* Token Operations                                              */
/* ------------------------------------------------------------ */

export function verifyExternalToken(token: string): ExternalTokenPayload | null {
    return decodeToken(token);
}

export function extractPermissionsFromToken(token: string): string[] {
    return decodeToken(token)?.permissions ?? [];
}

export function extractUsernameFromToken(token: string): string | null {
    return decodeToken(token)?.sub ?? null;
}
