import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        forgotPassword: resolve(__dirname, 'forgot-password.html'),
        resetPassword: resolve(__dirname, 'reset-password.html'),
        verifyEmail: resolve(__dirname, 'verify-email.html'),
        profileSettings: resolve(__dirname, 'profile-settings.html'),
        addressManagement: resolve(__dirname, 'address-management.html'),
        restaurants: resolve(__dirname, 'restaurants.html'),
        restaurant: resolve(__dirname, 'restaurant.html'),
        adminDashboard: resolve(__dirname, 'admin-dashboard.html'),
        restaurantOnboarding: resolve(__dirname, 'restaurant-onboarding.html'),
        ownerDashboard: resolve(__dirname, 'owner-dashboard.html'),
        ownerRestaurantDetail: resolve(__dirname, 'owner-restaurant-detail.html'),
      }
    }
  }
});
