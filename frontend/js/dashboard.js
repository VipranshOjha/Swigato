import { isAuthenticated, getUserProfile, logout } from './auth.js';
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authSection = document.getElementById('header-auth-section');

    if (isAuthenticated()) {
        const user = getUserProfile();
        
        // Replace login button with User Profile + Logout
        authSection.innerHTML = `
            <a href="DESIGN.md" class="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold hover:bg-surface-container-low px-3 py-2 rounded-lg flex items-center gap-1 hidden sm:flex">
                <span class="material-symbols-outlined text-[20px]">palette</span>
                <span>Design Spec</span>
            </a>
            <div class="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant/30">
                <div class="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                    ${user?.sub ? user.sub.charAt(0).toUpperCase() : 'U'}
                </div>
                <span class="font-label-bold text-label-bold text-on-surface mr-2">User ${user?.sub || ''}</span>
            </div>
            <button id="header-logout-btn" class="text-status-error hover:bg-error-container/50 font-label-bold text-label-bold py-2 px-3 rounded-lg transition-all flex items-center gap-1">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                <span class="hidden sm:inline">Logout</span>
            </button>
        `;

        document.getElementById('header-logout-btn').addEventListener('click', async () => {
            await logout();
        });

        // Optionally fetch real user profile data
        try {
            // Wait, we don't have a /api/v1/users/me endpoint mentioned specifically, but standard is there.
            // Let's just rely on the JWT token for the dashboard display to be safe.
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }
    }
});
