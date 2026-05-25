/**
 * toast.js — Simple toast notification utility.
 * Works with both the custom Kinetic Zest theme and the plain Tailwind CDN theme.
 */
export const showToast = (message, type = 'success') => {
    // Remove existing toast if any
    const existingToast = document.getElementById('swigato-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'swigato-toast';

    // Color based on type — uses hex values to work with ANY CSS theme
    const colorMap = {
        success: '#16a34a',  // green-600
        error: '#dc2626',    // red-600
        info: '#2563eb',     // blue-600
        warning: '#d97706',  // amber-600
    };
    const bgColor = colorMap[type] || colorMap.info;

    toast.style.cssText = `
        position: fixed;
        top: 1.25rem;
        right: 1.25rem;
        z-index: 9999;
        padding: 0.75rem 1.25rem;
        border-radius: 0.625rem;
        background: ${bgColor};
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        font-family: inherit;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 24rem;
        transform: translateY(-110%);
        opacity: 0;
        transition: transform 0.25s ease, opacity 0.25s ease;
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `<span style="font-weight:700;font-size:1rem;">${icon}</span> <span>${message}</span>`;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });
    });

    // Auto-dismiss after 3.5s
    setTimeout(() => {
        toast.style.transform = 'translateY(-110%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 280);
    }, 3500);
};

// Also export showError / showSuccess helpers for convenience
export const showError = (msg) => showToast(msg, 'error');
export const showSuccess = (msg) => showToast(msg, 'success');
