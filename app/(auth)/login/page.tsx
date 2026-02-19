'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES, SITE_NAME } from '@/constants';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password, 'studio');

            if (result.success) {
                // Fetch fresh session to get actual role
                const { getSession } = await import('next-auth/react');
                const session = await getSession();

                // Redirect based on role
                if (session?.user?.role === 'admin') {
                    router.push(ROUTES.ADMIN_DASHBOARD);
                } else {
                    router.push(ROUTES.DASHBOARD);
                }
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');

        try {
            await signIn('google', {
                callbackUrl: ROUTES.DASHBOARD,
            });
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Failed to sign in with Google');
            setGoogleLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Branding */}
                <div className={styles.branding}>
                    <h1 className={styles.brandTitle}>{SITE_NAME}</h1>
                    <p className={styles.brandSubtitle}>Welcome Back</p>
                </div>

                {/* Login Card */}
                <div className={styles.card}>
                    <h2 className={styles.title}>Sign In</h2>
                    <p className={styles.subtitle}>
                        Access your account
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* Google Sign In - For Clients */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                        className={styles.googleButton}
                    >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {googleLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    {/* Divider */}
                    <div className={styles.divider}>
                        <span>or sign in as studio</span>
                    </div>

                    {/* Studio Login Form */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Email */}
                        <div className={styles.field}>
                            <label htmlFor="email" className={styles.label}>
                                Email
                            </label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="studio@example.com"
                                    className={styles.input}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={styles.field}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className={styles.input}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.togglePassword}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Keep Signed In */}
                        <div className={styles.checkbox}>
                            <input
                                id="keepSignedIn"
                                type="checkbox"
                                checked={keepSignedIn}
                                onChange={(e) => setKeepSignedIn(e.target.checked)}
                                className={styles.checkboxInput}
                            />
                            <label htmlFor="keepSignedIn" className={styles.checkboxLabel}>
                                Keep me signed in
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || isLoading || googleLoading}
                            className={styles.submitButton}
                        >
                            {loading ? 'Signing In...' : 'Sign In as Studio'}
                        </button>
                    </form>

                    {/* Switch to Signup */}
                    <p className={styles.switchLink}>
                        New to {SITE_NAME}? <Link href={ROUTES.SIGNUP}>Create an account</Link>
                    </p>

                    {/* Back Link */}
                    <Link href={ROUTES.HOME} className={styles.backLink}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
