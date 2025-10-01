
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { applyActionCode, onAuthStateChanged, User, sendEmailVerification, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState("We've sent a verification link to your email. Please check your inbox and click the link to continue.");
    const [error, setError] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');


    // This effect runs once to handle the verification link if it's in the URL
    const handleVerifyEmail = useCallback(async (actionCode: string) => {
        try {
            await applyActionCode(auth, actionCode);
            setMessage('Email verified successfully! You will be redirected to the homepage shortly.');
            setError('');
            // The onAuthStateChanged listener below will handle the redirect.
        } catch (error: any) {
            setError(`Error verifying email: ${error.message}. The link may be invalid or has expired.`);
            console.error(error);
        }
    }, []);

    useEffect(() => {
        const actionCode = searchParams.get('oobCode');
        if (actionCode) {
            handleVerifyEmail(actionCode);
        }
    }, [searchParams, handleVerifyEmail]);


    // This effect handles user state and polling
    useEffect(() => {
        setIsPolling(true);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (currentUser.emailVerified) {
                    setIsPolling(false); // Stop polling
                    setMessage("Email verified successfully! Redirecting...");
                    setError('');
                    setTimeout(() => router.push('/'), 2000);
                }
            } else {
                // If no user is logged in, they shouldn't be here.
                setIsPolling(false);
                router.push('/login');
            }
        });

        const interval = setInterval(async () => {
            const currentUser = auth.currentUser;
            if (currentUser && !currentUser.emailVerified) {
                try {
                    await currentUser.reload();
                    // The onAuthStateChanged listener above will catch the change if emailVerified becomes true
                } catch (err: any) {
                    console.error("Error reloading user:", err);
                    if (err.code === 'auth/user-token-expired') {
                        setError("Your session has expired. Please log in again.");
                        setIsPolling(false); // Stop polling
                    }
                }
            }
        }, 5000); // Poll every 5 seconds

        // Cleanup function
        return () => {
            unsubscribe();
            clearInterval(interval);
            setIsPolling(false);
        };
    }, [router]);

    const handleResendEmail = async () => {
        if (!user) {
            setError("No user is signed in to verify.");
            return;
        }
        setResendStatus('sending');
        setError('');
        try {
            await sendEmailVerification(user);
            setResendStatus('sent');
            setMessage("A new verification email has been sent. Please check your inbox.");
        } catch (error: any) {
            if (error.code === 'auth/too-many-requests') {
                setError("Too many requests. Please wait a few minutes before trying again.");
            } else {
                setError(`Failed to send verification email: ${error.message}`);
            }
            setResendStatus('error');
        } finally {
            // Reset status after a few seconds
            setTimeout(() => setResendStatus('idle'), 5000);
        }
    };

    const handleManualCheck = async () => {
        if (!user) {
            setError("No user to check.");
            return;
        }
        await user.reload();
        if (user.emailVerified) {
            setMessage("Success! Your email is verified. Redirecting...");
            router.push('/');
        } else {
            setError("Your email is not yet verified. Please click the link in your inbox.");
        }
    };

    const handleGoBack = async () => {
        await signOut(auth);
        router.push('/login');
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-[family-name:var(--font-cormorant-garamond)]">
            <div className="w-full max-w-md mx-auto bg-[#1e2128] rounded-2xl shadow-lg p-8 border border-gray-700 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#FFC249] mb-4">
                    Verify Your Email
                </h1>

                {user && <p className="text-gray-400 text-sm mb-2">A verification link was sent to: <br/> <span className="font-semibold text-white">{user.email}</span></p>}

                {message && !error && <p className="text-gray-300 mb-6">{message}</p>}

                {error && <p className="text-red-500 my-4">{error}</p>}

                <div className="flex flex-col gap-4 mt-6">
                    <Button onClick={handleManualCheck} className="bg-[#FFC249] text-black hover:bg-[#FFC249]/90">
                        I've Verified, Check Now
                    </Button>
                    <Button onClick={handleResendEmail} variant="outline" className="border-gray-600 hover:bg-gray-700" disabled={resendStatus === 'sending' || resendStatus === 'sent'}>
                        {resendStatus === 'sending' && 'Sending...'}
                        {resendStatus === 'sent' && 'Email Sent!'}
                        {resendStatus === 'idle' && 'Resend Verification Email'}
                        {resendStatus === 'error' && 'Error, Try Again'}
                    </Button>
                     <Button onClick={handleGoBack} variant="link" className="text-gray-400 hover:text-white">
                        Go Back & Edit
                    </Button>
                </div>


                <div className="mt-8 text-xs text-gray-500">
                    <p>Please check your inbox (and spam folder) for an email from us.</p>
                    <p className="mt-2">Click the verification link in the email to complete your sign-up. This page will automatically update once verified.</p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    );
}
