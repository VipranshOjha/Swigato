import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 text-center">
            <div className="w-24 h-24 bg-error-container text-on-error-container rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-12 h-12" />
            </div>
            <h2 className="text-headline-xl font-bold text-on-surface mb-2">Access Denied</h2>
            <p className="text-body-lg text-on-surface-variant max-w-md mb-8">
                You don't have the required permissions to view this page.
            </p>
            <Link 
                to={ROUTES.HOME}
                className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
                Back to Safety
            </Link>
        </div>
    );
};
