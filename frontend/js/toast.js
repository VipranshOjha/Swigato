export const showToast = (message, type = 'success') => {
    // Remove existing toast if any
    const existingToast = document.getElementById('swigato-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'swigato-toast';
    
    // Base classes
    toast.className = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-body-md text-white flex items-center gap-2 transform transition-all duration-300 translate-y-[-100%] opacity-0';
    
    // Type classes
    if (type === 'error') {
        toast.classList.add('bg-status-error');
    } else if (type === 'success') {
        toast.classList.add('bg-status-success');
    } else {
        toast.classList.add('bg-primary-container');
    }

    // Icon
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[20px]';
    icon.textContent = type === 'error' ? 'error' : 'check_circle';
    
    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-[-100%]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-100%]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
