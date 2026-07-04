import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Invalid email or password.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-dark px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 rounded-2xl glass-panel p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-r from-brand-primary to-brand-secondary text-text-primary shadow-lg shadow-brand-primary/20"
          >
            <Shield className="h-8 w-8" />
          </motion.div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back to <span className="text-gradient font-black">TrustZero</span>
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            AI-Powered Secure Escrow Engine
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-xs">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  className={`block w-full rounded-lg border bg-bg-dark/50 py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                    errors.email ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border-dark'
                  }`}
                  placeholder="name@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <div className="mt-1 flex items-center text-xs text-danger">
                  <AlertCircle className="mr-1 h-3.5 w-3.5" />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full rounded-lg border bg-bg-dark/50 py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                    errors.password ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border-dark'
                  }`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 flex items-center text-xs text-danger">
                  <AlertCircle className="mr-1 h-3.5 w-3.5" />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary py-3 px-4 text-sm font-semibold text-text-primary hover:opacity-90 focus:ring-2 focus:ring-brand-primary/50 focus:outline-hidden disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-primary border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-brand-primary hover:text-brand-secondary transition-all"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
