import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDashboardRoute } from '../../utils/roleRedirect';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { Loader2 } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const user = await login(email, password);
            
            // Redirect based on role or previous location
            const from = location.state?.from?.pathname || getRoleDashboardRoute(user);
            
            // --- TEMPORARY DEBUGGING ---
            console.log('--- LOGIN DEBUGGING ---');
            console.log('1. Raw User Object:', user);
            console.log('2. Raw Roles:', user?.roles || user?.role);
            console.log('3. Is Array?', Array.isArray(user?.roles));
            
            const rawRolesArray = Array.isArray(user?.roles) 
                ? user.roles 
                : user?.role ? [user.role] : [];
                
            console.log('4. Extracted Roles Array:', rawRolesArray);
            
            const normalizedRoles = rawRolesArray.map(r => {
                if (typeof r === 'object') return r.name ? r.name.toUpperCase() : JSON.stringify(r);
                return typeof r === 'string' ? r.toUpperCase() : r;
            });
            console.log('5. Normalized Roles:', normalizedRoles);
            console.log('6. Computed Redirect Path:', from);
            console.log('-----------------------');
            // ---------------------------
            
            navigate(from, { replace: true });
        } catch (err) {
            // Error is handled by context toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                    placeholder="you@example.com"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                    placeholder="••••••••"
                />
            </div>
            
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors flex justify-center items-center disabled:opacity-70"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
            
            <p className="text-center text-sm text-on-surface-variant mt-6">
                Don't have an account? <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">Create one</Link>
            </p>
        </form>
    );
};
