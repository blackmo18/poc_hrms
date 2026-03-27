import { defaultCache } from "@serwist/next/worker";
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig, NavigationRoute, NetworkFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // We place custom strategies BEFORE the defaultCache
  runtimeCaching: [
    // FORCE the main pages to check the network first
    // This ensures your Sidebar JS and React Hydration match the server
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3, // If network is too slow, fallback to cache
      }),
    },
    // Network-first for authentication APIs used by sidebar
    {
      matcher: ({ request, url }) => {
        return url.pathname.includes('/api/auth/session') ||
               url.pathname.includes('/api/auth/roles-permissions') ||
               url.pathname.includes('/api/auth/sign-in') ||
               url.pathname.includes('/api/auth/sign-out');
      },
      handler: new NetworkFirst({
        cacheName: "auth-cache",
        networkTimeoutSeconds: 2, // Fast timeout for auth calls
        plugins: [{
          cacheKeyWillBeUsed: async ({ request }) => {
            // Don't cache auth responses - always fresh
            return request.url;
          }
        }]
      }),
    },
    // Network-first for sidebar components and context - NEVER CACHE
    {
      matcher: ({ request, url }) => {
        return url.pathname.includes('/context/SidebarContext') ||
               url.pathname.includes('/layout/AppSidebar') ||
               url.pathname.includes('/layout/AppHeader') ||
               url.pathname.includes('/layout/AppLayout');
      },
      handler: new NetworkFirst({
        cacheName: "sidebar-cache",
        networkTimeoutSeconds: 2,
        plugins: [{
          cacheKeyWillBeUsed: async ({ request }) => {
            // Never cache sidebar components - always fresh
            return null;
          },
          cacheWillUpdate: async ({ response }) => {
            // Don't store sidebar components in cache
            return null;
          }
        }]
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();