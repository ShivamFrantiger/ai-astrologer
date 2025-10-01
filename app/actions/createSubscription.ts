"use server";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CreateSubscriptionParams {
  userId: string;
  planName: string;
  tokens: number;
  validityDays: number;
}

export async function createSubscription(params: CreateSubscriptionParams) {
  const { userId, planName, tokens, validityDays } = params;

  if (!userId) {
    throw new Error("User ID is required to create a subscription.");
  }

  try {
    const subRef = doc(db, "subscriptions", userId);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + validityDays);

    await setDoc(subRef, {
      planName,
      tokens,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return { success: true, message: "Subscription created successfully." };
  } catch (error) {
    console.error("Error creating subscription in Firestore:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
}
