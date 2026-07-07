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
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFDFC] px-4 py-12 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Organic Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] h-80 w-80 rounded-full bg-[#8B5CF6]/15 blur-[85px] mix-blend-multiply opacity-65 animate-blob"></div>
        <div className="absolute bottom-[20%] right-[20%] h-[380px] w-[380px] rounded-full bg-[#FF7EB6]/15 blur-[95px] mix-blend-multiply opacity-60 animate-blob animation-delay-3000"></div>
        <div className="absolute top-[40%] right-[10%] h-72 w-72 rounded-full bg-[#FFC371]/15 blur-[80px] mix-blend-multiply opacity-55 animate-blob animation-delay-6000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-6 glass-panel p-8 bg-white/40 shadow-2xl relative"
      >
        {/* Back Link to Landing */}
        <div className="absolute top-4 left-4">
          <Link to="/" className="flex items-center space-x-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all">
            <span>← Home</span>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center text-center pt-2">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white shadow-md shadow-[#7B61FF]/15"
          >
            <Shield className="h-6 w-6" />
          </motion.div>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-text-primary">
            Welcome back to <span className="text-gradient font-black">TrustZero</span>
          </h2>
          <p className="mt-1.5 text-xs font-medium text-text-secondary">
            AI-Powered Secure Escrow Engine
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4.5 w-4.5 text-text-muted" />
                </div>
                <input
                  type="email"
                  className={`block w-full glass-input py-3 pl-11 pr-3 text-sm placeholder-text-muted transition-all ${
                    errors.email ? 'border-danger focus:border-danger' : 'border-white/80'
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
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4.5 w-4.5 text-text-muted" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`block w-full glass-input py-3 pl-11 pr-10 text-sm placeholder-text-muted transition-all ${
                    errors.password ? 'border-danger focus:border-danger' : 'border-white/80'
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs font-medium text-text-secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#8B5CF6] hover:text-[#FF7EB6] transition-all"
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
