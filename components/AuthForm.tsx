
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthForm({ isLoginDefault }: { isLoginDefault: boolean }) {
  const [isLogin, setIsLogin] = useState(isLoginDefault);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { translations } = useLanguage();
  const t = translations.authForm;

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    if(password.length < 6){
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    try {
      // 1. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update the profile with the display name
      await updateProfile(user, {
        displayName: name,
      });

      // 3. Send the verification email
      await sendEmailVerification(user);
      
      // 4. Redirect to the verification page
      router.push(`/verify-email`);

    } catch (error: any) {
       switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use by another account.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('The password is too weak. Please use at least 6 characters.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          console.error("Sign-up error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The AuthProvider's onAuthStateChanged will handle all redirects
      // including to the verify-email page if needed.
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError("Invalid email or password.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The AuthProvider's onAuthStateChanged will handle the redirect.
    } catch (error: any) {
      setError(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
      >
        <Card className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl border border-[#4d3b16] bg-black text-white rounded-xl p-6 sm:p-8 lg:p-10 shadow-lg mx-auto">
          <div className="flex justify-center">
            <Image src="/png/brandLogo.png" alt="logo" width={70} height={70} />
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl text-center font-bold text-[#fec349] mt-3">
            {t.title}
          </h1>

          <div className="flex gap-3 mt-6 justify-center w-full">
            <Button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 font-semibold text-sm sm:text-base rounded-md hover:cursor-pointer ${
                isLogin
                  ? "bg-[#161b1f] text-white"
                  : "bg-[#000000] text-white hover:bg-[#303234]"
              }`}
            >
              {t.login}
            </Button>
            <Button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 font-semibold text-sm sm:text-base rounded-md hover:cursor-pointer ${
                !isLogin
                  ? "bg-[#161b1f] text-white"
                  : "bg-[#000000] text-white hover:bg-[#303234]"
              }`}
            >
              {t.signUp}
            </Button>
          </div>

          <CardContent className="space-y-4 mt-6">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4 w-full"
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <div className="grid gap-2">
                  <Label htmlFor="name">{t.nameLabel}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 w-full bg-[#161b1f] border border-[#323743] text-white"
                    required
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full bg-[#161b1f] border border-[#323743] text-white"
                  required
                />
              </div>

              {!isLogin && (
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t.phoneLabel}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 w-full bg-[#161b1f] border border-[#323743] text-white"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">{t.passwordLabel}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full bg-[#161b1f] border border-[#323743] text-white"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <CardFooter className="flex flex-col gap-4 w-full mt-4 px-0">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#fec349] text-[#352301] hover:bg-[#4d3b16] rounded-full text-sm sm:text-base hover:cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : isLogin ? t.signInButton : t.createAccountButton}
                  </Button>
                </motion.div>
              </CardFooter>
            </motion.form>
          </CardContent>

          <div className="flex flex-col gap-4 w-full px-6 pb-6">
            <div className="flex items-center w-full">
              <span className="flex-grow border-t border-[#323743]"></span>
              <span className="px-2 text-xs sm:text-sm text-gray-400">
                {t.orContinueWith}
              </span>
              <span className="flex-grow border-t border-[#323743]"></span>
            </div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 border border-[#4d3b16] text-white rounded-full text-sm sm:text-base hover:cursor-pointer"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <Image
                  src="/png/Google-png .png"
                  alt="google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                {t.googleSignIn}
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

    