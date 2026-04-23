import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { pagesConfig } from '@/pages.config';
import { isPublicPath } from './publicRoutes';

// LAZY SDK — avoid importing @/api/base44Client at module top-level,
// which otherwise kicks off the SDK's auth worker and crashes public routes
// with `TypeError: Right-hand side of 'instanceof' is not callable` on 401.

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    // Log user activity when navigating to a page
    useEffect(() => {
        // ⚡ On public routes, NEVER attempt to log user activity — would trigger
        // authenticated API calls that crash anonymous visitors.
        if (isPublicPath(location.pathname)) return;

        // Extract page name from pathname
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            // Remove leading slash and get the first segment
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];

            // Try case-insensitive lookup in Pages config
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );

            pageName = matchedKey || null;
        }

        if (isAuthenticated && pageName) {
            (async () => {
                try {
                    const { base44 } = await import('@/api/base44Client');
                    base44.appLogs?.logUserInApp?.(pageName)?.catch?.(() => {});
                } catch {
                    // Silently fail - logging shouldn't break the app
                }
            })();
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}