'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES, SITE_NAME } from '@/constants';
import styles from './page.module.css';

export default function SignupPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            // Create account
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: 'studio' }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Registration failed');
                return;
            }

            // Auto-login after signup
            const loginResult = await login(email, password, 'studio');

            if (loginResult.success) {
                router.push(ROUTES.DASHBOARD);
            } else {
                // Signup succeeded but login failed - redirect to login
                router.push(ROUTES.LOGIN);
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Branding */}
                <div className={styles.branding}>
                    <h1 className={styles.brandTitle}>{SITE_NAME}</h1>
                    <p className={styles.brandSubtitle}>Create Your Studio</p>
                </div>

                {/* Signup Card */}
                <div className={styles.card}>
                    <h2 className={styles.title}>Get Started</h2>
                    <p className={styles.subtitle}>
                        Create your account to start showcasing your work
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Error Message */}
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        {/* Name */}
                        <div className={styles.field}>
                            <label htmlFor="name" className={styles.label}>
                                Studio Name
                            </label>
                            <div className={styles.inputWrapper}>
                                <User className={styles.inputIcon} size={18} />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your studio name"
                                    className={styles.input}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

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
                                    placeholder="Minimum 8 characters"
                                    className={styles.input}
                                    required
                                    autoComplete="new-password"
                                    minLength={8}
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

                        {/* Confirm Password */}
                        <div className={styles.field}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                Confirm Password
                            </label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className={styles.input}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitButton}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Switch to Login */}
                    <p className={styles.switchLink}>
                        Already have an account? <Link href={ROUTES.LOGIN}>Sign in</Link>
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
