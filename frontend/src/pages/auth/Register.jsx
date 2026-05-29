import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDashboardRoute } from '../../utils/roleRedirect';
import { authService } from '../../services/auth.service';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

export const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone_number: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const data = await authService.register(formData);
            addToast('Account created successfully!', 'success');
            
            // Auto login after registration
            await login(formData.email, formData.password);
            const from = location.state?.from?.pathname || getRoleDashboardRoute(data);
            navigate(from, { replace: true });
        } catch (error) {
            addToast(error.message || 'Registration failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">First Name</label>
                    <input 
                        type="text" 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Last Name</label>
                    <input 
                        type="text" 
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Phone Number</label>
                <input 
                    type="text" 
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
                <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-surface-container-high rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
            </div>
            
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors flex justify-center items-center mt-2 disabled:opacity-70"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
            
            <p className="text-center text-sm text-on-surface-variant mt-4">
                Already have an account? <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">Sign In</Link>
            </p>
        </form>
    );
};
