
"use server";

import { revalidatePath } from "next/cache";
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { getPersonalizedDietPlan, PersonalizedDietPlanInput } from "@/ai/flows/get-personalized-diet-plan";
import { scanPrescriptionAndExtractDetails } from "@/ai/flows/scan-prescription-and-extract-details";
import { db } from "./firebase";

export async function handleScanPrescription(dataUri: string, userId: string) {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  const userDocRef = doc(db, "users", userId);
  const scanLimit = 3;

  try {
    const userDoc = await getDoc(userDocRef);
    let scanCount = 0;
    if (userDoc.exists()) {
      scanCount = userDoc.data()?.prescriptionScanCount || 0;
    }

    if (scanCount >= scanLimit) {
      return {
        success: false,
        error: "You have reached your maximum scan limit.",
        limitReached: true,
      };
    }

    const result = await scanPrescriptionAndExtractDetails({
      prescriptionDataUri: dataUri,
    });

    if (userDoc.exists()) {
      await updateDoc(userDocRef, { prescriptionScanCount: increment(1) });
    } else {
      await setDoc(userDocRef, { prescriptionScanCount: 1 });
    }

    revalidatePath("/prescription-scanner");
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to scan prescription." };
  }
}

export async function handleGetDietPlan(input: PersonalizedDietPlanInput, userId?: string) {
    try {
        if (!userId) {
            return { success: false, error: "User not authenticated." };
        }

        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const dietPlanLimit = 3;

        let dietPlanCount = 0;
        if (userDoc.exists()) {
            dietPlanCount = userDoc.data()?.dietPlanCount || 0;
        }

        if (dietPlanCount >= dietPlanLimit) {
            return {
                success: false,
                error: "You have reached your maximum diet plan generation limit.",
                limitReached: true,
            };
        }

        const result = await getPersonalizedDietPlan(input);

        if (userDoc.exists()) {
            await updateDoc(userDocRef, {
                dietInfo: input,
                dietPlanCount: increment(1)
            });
        } else {
            await setDoc(userDocRef, {
                dietInfo: input,
                dietPlanCount: 1
            });
        }

        revalidatePath("/diet-coach");
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to generate diet plan." };
    }
}

export async function getUserDietInfo(userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data().dietInfo };
        }
        return { success: true, data: null };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to get user diet info." };
    }
}
