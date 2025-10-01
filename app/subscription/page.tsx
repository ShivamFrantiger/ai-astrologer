"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";
import { createSubscription } from "@/app/actions/createSubscription";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const { translations } = useLanguage();
  const t = translations.subscription;
  const router = useRouter();
  const { user } = useAuth();

  const plans = [
    {
      name: "Freemium",
      price: "₹0",
      amount: 0,
      tokens: 10,
      validityDays: 10,
      features: [
        "10 Free Tokens (Chat Credits)",
        "10 mins/day free chat (5 basic + 5 premium)",
        "Daily Horoscope",
        "Expires after 10 days",
      ],
      buttonText: "Current Plan",
      highlight: false,
    },
    {
      name: "Basic",
      price: "₹79",
      amount: 79,
      tokens: 50,
      validityDays: 10,
      features: [
        "50 tokens (≈ 30 min chat) per day",
        "Daily Horoscope",
        "10 days validity",
      ],
      buttonText: "Choose Basic",
      highlight: false,
    },
    {
      name: "Pro",
      price: "₹149",
      amount: 149,
      tokens: 100,
      validityDays: 30,
      features: [
        "60 minutes chat (≈ 100 tokens) per day",
        "Includes Basic features",
        "Personalized Horoscope",
        "Personalized Numerology Chart",
        "1-month validity",
      ],
      buttonText: "Choose Pro",
      highlight: true,
    },
    {
      name: "Pro+",
      price: "₹500",
      amount: 500,
      tokens: 600,
      validityDays: 60,
      features: [
        "500–600 tokens (≈ 2 months)",
        "Includes Pro features",
        "Membership Dashboard",
        "Extra Premium Features (VIP insights, advanced reports, etc.)",
      ],
      buttonText: "Choose Pro+",
      highlight: false,
    },
  ];

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!user) {
      router.push("/signup");
      return;
    }

    if (plan.amount === 0) {
      await createSubscription({
        userId: user.uid,
        planName: plan.name,
        tokens: plan.tokens,
        validityDays: plan.validityDays,
      });
      alert("Freemium plan is active!");
      router.push("/profile");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_wgFflhVvJqeVtj",
      amount: plan.amount * 100,
      currency: "INR",
      name: "Jyotix-Astro",
      description: `Subscription for ${plan.name}`,
      image: "/png/brandLogo.png",
      handler: async function () {
        try {
          await createSubscription({
            userId: user.uid,
            planName: plan.name,
            tokens: plan.tokens,
            validityDays: plan.validityDays,
          });
          alert(`Payment successful! Your ${plan.name} subscription is now active.`);
          router.push("/profile");
        } catch (error) {
          console.error("Failed to create subscription:", error);
          alert("Payment was successful, but we failed to update your subscription. Please contact support.");
        }
      },
      prefill: {
        name: user.displayName || "Test User",
        email: user.email,
        contact: user.phoneNumber || "9999999999",
      },
      notes: {
        address: "Jyotix Astro Corporate Office",
        userId: user.uid,
      },
      theme: {
        color: "#FFC249",
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } else {
      alert("Payment gateway is not loaded yet. Please try again in a moment.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="bg-[#0D0D0D] text-white">
        <main className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-cormorant-garamond)] text-white">
              Astrology Pricing Plans
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that aligns with your cosmic journey.
            </p>
          </motion.div>

          <div className="relative overflow-hidden bg-yellow-400 text-black py-3 mb-12 rounded-lg shadow-lg">
            <motion.div
              className="whitespace-nowrap"
              animate={{ x: ["-100%", "100%"] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
            >
              <span className="font-bold px-4">
                Special Offer: 30-day FREE membership worth ₹500! Valid only for the first 50 Pro users.
              </span>
              <span className="font-bold px-4">
                Special Offer: 30-day FREE membership worth ₹500! Valid only for the first 50 Pro users.
              </span>
            </motion.div>
          </div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: "easeOut",
                }}
                className={`border rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? "border-[#FFC249] shadow-lg shadow-[#FFC249]/20"
                    : "border-gray-700"
                } bg-[#1e2128] relative ${
                  index === 3 ? "lg:col-span-3 lg:justify-self-center lg:max-w-lg" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFC249] text-black px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                <p className="text-4xl font-extrabold text-white my-4">
                  {plan.price}
                </p>

                <ul className="space-y-4 text-gray-300 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={`${plan.name}-feature-${i}`} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => handlePayment(plan)}
                    className={`w-full text-lg py-6 rounded-full font-bold ${
                      plan.highlight
                        ? "bg-[#FFC249] text-black hover:bg-[#FFC249]/90"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                    disabled={plan.name === "Freemium"}
                  >
                    {plan.buttonText}
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
