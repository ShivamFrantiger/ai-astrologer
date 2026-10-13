
# Jyotix-Astro: Your Cosmic Companion ✨

<div align="center">
  <img src="/public/png/brandLogo.png" alt="Jyotix-Astro Logo" width="150">
</div>

<p align="center">
  <strong>Unlock the secrets of the cosmos and discover your path with Jyotix-Astro, a personalized AI-powered astrology guide.</strong>
</p>

---

Jyotix-Astro is a modern, full-stack web application designed to bring the wisdom of the stars to your fingertips. Built with a powerful tech stack including Next.js, Firebase, and Google's Gemini AI, it offers a seamless and insightful astrological experience.

<!-- You can add a GIF or screenshots of your application here! -->
<!-- <img src="link-to-your-app-demo.gif" alt="App Demo"> -->

## 🌟 Key Features

- **AI-Powered Astrologer:** Engage in personalized conversations with an AI expert trained to provide guidance on love, career, and life's biggest questions based on your unique birth details.
- **Dynamic Horoscopes:** Get your daily, weekly, monthly, or yearly horoscope for any zodiac sign, generated on-the-fly.
- **Secure User Authentication:** Easy and secure sign-up and login using email/password or Google, complete with email verification.
- **Subscription Tiers:** Monetize with a built-in subscription system, offering different levels of access and features, powered by Razorpay.
- **Multi-Language Support:** Reach a wider audience with built-in support for English, Hindi, and Urdu. The entire UI adapts to the user's selected language.
- **Interactive UI:** A beautiful and responsive interface built with ShadCN UI, Tailwind CSS, and Framer Motion for delightful animations.
- **User Profile Dashboard:** A dedicated space for users to manage their profile, view their horoscope, and track their subscription status and profile completion.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI & Generative:** [Google Gemini via Genkit](https://firebase.google.com/docs/genkit)
- **Authentication & Database:** [Firebase](https://firebase.google.com/)
- **Payments:** [Razorpay](https://razorpay.com/)
- **Deployment:** Ready for [Vercel](https://vercel.com/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/jyotix-astro.git
    cd jyotix-astro
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**

    Create a `.env.local` file in the root of your project and add your Firebase and other service credentials.
    ```env
    # Firebase Configuration (from your Firebase project settings)
    NEXT_PUBLIC_FIREBASE_API_KEY="xxx"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="xxx"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="xxx"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="xxx"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="xxx"
    NEXT_PUBLIC_FIREBASE_APP_ID="xxx"

    # Genkit/Gemini API Key
    GEMINI_API_KEY="xxx"

    # Razorpay Keys (for payments)
    NEXT_PUBLIC_RAZORPAY_KEY_ID="xxx"

    # Nodemailer (for contact form)
    EMAIL_USER="xxx"
    # Prokerala Astrology API (Server-only credentials)
    PROKERALA_CLIENT_ID="your_prokerala_client_id"
    PROKERALA_CLIENT_SECRET="your_prokerala_client_secret"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result!

## 🪐 Vedic Kundli Feature Setup & Testing

### 1. Prokerala API Setup
1. Register a free account at [Prokerala Developer Portal](https://api.prokerala.com/).
2. Create an App to obtain your `PROKERALA_CLIENT_ID` and `PROKERALA_CLIENT_SECRET`.
3. The free plan provides 5,000 monthly credits and a 5 requests/min rate limit.
4. Add credentials to `.env`:
   ```bash
   PROKERALA_CLIENT_ID=your_client_id
   PROKERALA_CLIENT_SECRET=your_client_secret
   ```

### 3. Conversational AI Chat Flow (/chat)
The `/chat` route features an intelligent in-chat Vedic astrologer:
- **Natural Language Intake**: Users can enter details naturally (e.g., *"14 may 2000, shaam 6:32, Jaipur"*). Gemini extracts `{ date, time, place }`, confirms with the user, and generates the chart.
- **Fallback Inline Card**: Chat also provides an inline form card (`BirthInputCard`) if users prefer direct input.
- **Traceable Predictions**: Astrological rules are evaluated deterministically in code via `lib/rules/engine.ts`. Gemini cites rules in brackets (e.g. `[BIZ-001]`).
- **Context Persistence**: Profiles are saved under Firestore (`users/{uid}/kundlis/{id}`). Returning users can switch profiles ("Self", "Wife", "Friend") or create new ones without losing context.

### 4. Adding New Astrology Rules
Rules are stored as JSON files under `rules/` categorized by topic (`business_career.json`, `marriage.json`, `finance.json`, `education.json`, `health_general.json`).

To add a new rule:
```json
{
  "id": "BIZ-026",
  "topic": "business_career",
  "source": "BPHS principle, paraphrased",
  "condition": { "house": 10, "lordInHouse": [1, 5, 9, 10, 11] },
  "effect": "Paraphrased explanation of astrological influence in Hindi/English.",
  "weight": 2.2,
  "confidence": "classical"
}
```
Supported condition DSL parameters:
- `house`: Target house (1-12)
- `lordInHouse`: Allowed placements for the house lord (e.g. `[1, 10, 11]`)
- `planet`: Specific planet name (`Sun`, `Moon`, `Mars`, `Mercury`, `Jupiter`, `Venus`, `Saturn`, `Rahu`, `Ketu`)
- `inHouse`: Allowed houses for the planet
- `aspectOnHouse`: House aspected by `byPlanet` (evaluates authentic Vedic Graha Drishti)
- `conjunction`: Array of planet names in the same house
- `dashaLord`: `"current"` + `houseOwned`: Array of houses owned by the active Mahadasha lord
- `isExalted` / `isDebilitated` / `isRetrograde`: Boolean status

## ✨ A Personal Touch

This product was built to be more than just code; it's a launchpad for your own cosmic explorations. Feel free to use it, and let it guide you in creating something magical. 

## 📜 License & Ownership

This project's source code is provided as a template and is available for you to use only!!!!.The "Jyotix-Astro" name, brand, and logo are for demonstration purposes only. You may not use the "Jyotix-Astro" branding , code in your own derivative commercial or non-commercial projects.

