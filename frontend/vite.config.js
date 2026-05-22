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
      }
    }
  }
});
