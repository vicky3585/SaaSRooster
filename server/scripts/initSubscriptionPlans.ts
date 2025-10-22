import { db } from "../db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

const PLANS = [
  {
    name: "Free",
    description: "Perfect for getting started with basic features",
    monthlyPrice: "0.00",
    quarterlyPrice: "0.00",
    annualPrice: "0.00",
    currency: "INR",
    features: [
      "Up to 10 invoices per month",
      "Basic customer management",
      "Single warehouse",
      "Email support",
      "1GB storage",
    ],
    limits: {
      maxUsers: 1,
      maxInvoicesPerMonth: 10,
      maxCustomers: 50,
      maxWarehouses: 1,
      storageGB: 1,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    name: "Basic",
    description: "Ideal for small businesses and startups",
    monthlyPrice: "999.00",
    quarterlyPrice: "2699.00",
    annualPrice: "9999.00",
    currency: "INR",
    features: [
      "Unlimited invoices",
      "Advanced customer & vendor management",
      "Multiple warehouses",
      "Inventory management",
      "GST compliance",
      "Payment gateway integration",
      "Email notifications",
      "Priority support",
      "10GB storage",
    ],
    limits: {
      maxUsers: 5,
      maxInvoicesPerMonth: -1, // Unlimited
      maxCustomers: 500,
      maxWarehouses: 5,
      storageGB: 10,
    },
    isActive: true,
    isPopular: true,
    sortOrder: 2,
  },
  {
    name: "Pro",
    description: "For growing businesses with advanced needs",
    monthlyPrice: "2499.00",
    quarterlyPrice: "6999.00",
    annualPrice: "24999.00",
    currency: "INR",
    features: [
      "Everything in Basic",
      "CRM with lead & deal management",
      "Advanced accounting & journals",
      "Multi-GSTIN support",
      "Recurring invoices",
      "Purchase order management",
      "Financial reports & analytics",
      "API access",
      "24/7 priority support",
      "50GB storage",
    ],
    limits: {
      maxUsers: 20,
      maxInvoicesPerMonth: -1, // Unlimited
      maxCustomers: 2000,
      maxWarehouses: 20,
      storageGB: 50,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 3,
  },
  {
    name: "Enterprise",
    description: "Customized solution for large organizations",
    monthlyPrice: "4999.00",
    quarterlyPrice: "13999.00",
    annualPrice: "49999.00",
    currency: "INR",
    features: [
      "Everything in Pro",
      "Unlimited users",
      "Unlimited storage",
      "Custom integrations",
      "Dedicated account manager",
      "White-label options",
      "Advanced security & compliance",
      "Custom training & onboarding",
      "SLA guarantee",
      "On-premise deployment option",
    ],
    limits: {
      maxUsers: -1, // Unlimited
      maxInvoicesPerMonth: -1, // Unlimited
      maxCustomers: -1, // Unlimited
      maxWarehouses: -1, // Unlimited
      storageGB: -1, // Unlimited
    },
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
];

async function initSubscriptionPlans() {
  try {
    console.log("Initializing subscription plans...\n");

    for (const plan of PLANS) {
      // Check if plan already exists
      const [existingPlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, plan.name));

      if (existingPlan) {
        // Update existing plan
        await db
          .update(subscriptionPlans)
          .set({
            ...plan,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionPlans.id, existingPlan.id));

        console.log(`✓ Updated plan: ${plan.name}`);
      } else {
        // Create new plan
        await db.insert(subscriptionPlans).values(plan);
        console.log(`✓ Created plan: ${plan.name}`);
      }
    }

    console.log("\n✅ Subscription plans initialized successfully!");
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
    throw error;
  }
}

initSubscriptionPlans()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
