import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';

/**
 * Returns the highest priority dashboard route for a given user.
 * Priority: ADMIN -> OWNER -> DELIVERY -> CUSTOMER
 * @param {Object} user - The user object containing a roles array or single role
 * @returns {string} The dashboard route
 */
export const normalizeRoles = (rolesInput) => {
    if (!rolesInput) return [];
    
    const rawRoles = Array.isArray(rolesInput) ? rolesInput : [rolesInput];
    
    return rawRoles.map(r => {
        if (!r) return '';
        if (typeof r === 'object' && r.name) return String(r.name).toLowerCase();
        return String(r).toLowerCase();
    }).filter(Boolean);
};

/**
 * Returns the highest priority dashboard route for a given user.
 * Priority: SUPER_ADMIN -> ADMIN -> OWNER -> DELIVERY -> CUSTOMER
 * @param {Object} user - The user object containing a roles array or single role
 * @returns {string} The dashboard route
 */
export const getRoleDashboardRoute = (user) => {
    if (!user) return ROUTES.LOGIN;

    const userRoles = normalizeRoles(user.roles || user.role);

    if (userRoles.includes(ROLES.SUPER_ADMIN)) return ROUTES.ADMIN_DASHBOARD;
    if (userRoles.includes(ROLES.ADMIN)) return ROUTES.ADMIN_DASHBOARD;
    if (userRoles.includes(ROLES.RESTAURANT_OWNER)) return ROUTES.OWNER_DASHBOARD;
    if (userRoles.includes(ROLES.DELIVERY_PARTNER)) return ROUTES.DELIVERY_DASHBOARD;
    
    // Default fallback to customer home
    return ROUTES.HOME;
};
