"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { PLANS, PLAN_LIMITS, PlanType } from "@/lib/subscription-constants";

export const useSubscription = () => {
  const { isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  const isLoaded = isAuthLoaded && isUserLoaded;

  if (!isLoaded) {
    return {
      plan: PLANS.FREE,
      limits: PLAN_LIMITS[PLANS.FREE],
      isLoaded: false,
    };
  }

  let plan: PlanType = PLANS.FREE;

  // Extract metadata safely
  const metadataPlan = (
    user?.publicMetadata?.plan ||
    user?.publicMetadata?.product ||
    user?.publicMetadata?.billingPlan
  )
    ?.toString()
    .toLowerCase();

  // Determine the plan based on metadata
  if (metadataPlan === "pro") {
    plan = PLANS.PRO;
  } else if (metadataPlan === "standard") {
    plan = PLANS.STANDARD;
  }

  return {
    plan,
    limits: PLAN_LIMITS[plan],
    isLoaded: true,
  };
};
