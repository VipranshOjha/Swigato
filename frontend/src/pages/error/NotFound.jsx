import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 text-center">
            <h1 className="text-9xl font-black text-primary-container/20 mb-4">404</h1>
            <h2 className="text-headline-xl font-bold text-on-surface mb-2">Page Not Found</h2>
            <p className="text-body-lg text-on-surface-variant max-w-md mb-8">
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link 
                to={ROUTES.HOME}
                className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
                Back to Home
            </Link>
        </div>
    );
};
