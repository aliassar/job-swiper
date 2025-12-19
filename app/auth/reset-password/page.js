'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
        isValid: false,
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
    });

    const token = searchParams.get('token');

    // Password strength validation
    const validatePasswordStrength = (password) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        return {
            isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
        };
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setPasswordValidation(validatePasswordStrength(password));
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (!token) {
            setError('Invalid reset link. No token provided.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!passwordValidation.isValid) {
            setError('Password does not meet strength requirements');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || data.message || 'Password reset failed');
            }

            setSuccess(true);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    // No token provided
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Invalid Reset Link
                        </h1>
                        <p className="text-gray-600">
                            This password reset link is invalid or has expired.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/login/forgot-password')}
                        className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg"
                    >
                        Request New Reset Link
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Password Reset!
                        </h1>
                        <p className="text-gray-600">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/login')}
                        className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    // Form view
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔐</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Reset Your Password
                    </h1>
                    <p className="text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleResetPassword}>
                    <div className="mb-4">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            required
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />

                        {/* Password strength indicator */}
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${passwordValidation.minLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={passwordValidation.minLength ? 'text-green-700' : 'text-gray-600'}>
                                    At least 8 characters
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={passwordValidation.hasUpperCase ? 'text-green-700' : 'text-gray-600'}>
                                    One uppercase letter
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={passwordValidation.hasLowerCase ? 'text-green-700' : 'text-gray-600'}>
                                    One lowercase letter
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${passwordValidation.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={passwordValidation.hasNumber ? 'text-green-700' : 'text-gray-600'}>
                                    One number
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !passwordValidation.isValid}
                        className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
