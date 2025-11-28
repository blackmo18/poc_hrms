export const isAuthEnabled = () => process.env.AUTH_ENABLED === 'true';
export const iAuthEnabledClient = () => process.env.NEXT_AUTH_ENABLED_CLIENT === 'true';
export const isExternalAuthEnabled = () => process.env.USE_AUTHENTICATION_ENDPOINT === 'true';
export const getAuthEndpointUrl = () => process.env.AUTHENTICATION_ENDPOINT_URL;
