import { Router } from "express";
import { db } from "../db";
import { 
  subscriptionPlans, 
  organizations, 
  paymentTransactions,
  platformSettings 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Get all active subscription plans (public endpoint for signup)
router.get("/plans", async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
    
    res.json(plans);
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Initiate subscription payment
router.post("/initiate", async (req, res) => {
  try {
    const { planId, billingCycle, organizationId, customerName, customerEmail, customerPhone } = req.body;

    if (!planId || !billingCycle || !organizationId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate billing cycle
    if (!["monthly", "quarterly", "annual"].includes(billingCycle)) {
      return res.status(400).json({ message: "Invalid billing cycle" });
    }

    // Verify organization exists
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Get plan details
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId));

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: "Plan not found or inactive" });
    }

    // Calculate amount based on billing cycle
    let amount = 0;
    if (billingCycle === "monthly") {
      amount = Number(plan.monthlyPrice) || 0;
    } else if (billingCycle === "quarterly") {
      amount = Number(plan.quarterlyPrice) || 0;
    } else if (billingCycle === "annual") {
      amount = Number(plan.annualPrice) || 0;
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid billing cycle or amount" });
    }

    // Get PayUmoney configuration from platform settings
    const [payuSetting] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, "payumoney_config"));

    if (!payuSetting || !payuSetting.value) {
      return res.status(500).json({ message: "Payment gateway not configured" });
    }

    const config: any = payuSetting.value;
    
    // Validate PayUmoney configuration
    if (!config.merchantKey || !config.merchantSalt) {
      return res.status(500).json({ message: "Payment gateway configuration is incomplete" });
    }

    const orderId = `SUB_${Date.now()}_${organizationId.substring(0, 8)}`;

    // Create payment transaction record
    const [transaction] = await db
      .insert(paymentTransactions)
      .values({
        orgId: organizationId,
        planId: plan.id,
        amount: amount.toString(),
        currency: "INR",
        status: "pending",
        paymentMethod: "payumoney",
        paymentGatewayId: orderId,
        billingCycle,
      } as any)
      .returning();

    // Generate PayUmoney hash
    const baseUrl = config.mode === "live" 
      ? "https://secure.payu.in/_payment" 
      : "https://sandboxsecure.payu.in/_payment";

    const productInfo = `${plan.id}`;
    const udf1 = billingCycle;
    const udf2 = organizationId;
    
    const hashString = `${config.merchantKey}|${orderId}|${amount}|${productInfo}|${customerName}|${customerEmail}|${udf1}|${udf2}|||||||${config.merchantSalt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const formData = {
      key: config.merchantKey,
      txnid: orderId,
      amount: amount.toFixed(2),
      productinfo: productInfo,
      firstname: customerName || "Customer",
      email: customerEmail || "customer@example.com",
      phone: customerPhone || "",
      udf1: udf1,
      udf2: udf2,
      surl: `${process.env.BASE_URL || "http://localhost:5000"}/api/subscription-payments/callback/success`,
      furl: `${process.env.BASE_URL || "http://localhost:5000"}/api/subscription-payments/callback/failure`,
      hash: hash,
    };

    res.json({
      paymentUrl: baseUrl,
      formData,
      transactionId: transaction.id,
      orderId,
    });
  } catch (error) {
    console.error("Initiate payment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PayUmoney success callback
router.post("/callback/success", async (req, res) => {
  try {
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      mihpayid,
      udf1,
      udf2,
      addedon,
      hash: receivedHash,
    } = req.body;

    // Get PayUmoney configuration
    const [payuSetting] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, "payumoney_config"));

    if (!payuSetting) {
      return res.status(500).send("Payment gateway configuration error");
    }

    const config: any = payuSetting.value;

    // Find transaction first
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.paymentGatewayId, txnid));

    if (!transaction) {
      console.error("Transaction not found:", txnid);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=transaction_not_found`);
    }

    // Verify hash - PayUMoney format: SALT|status|||||||||udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const hashString = `${config.merchantSalt}|${status}|||||||||||${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${config.merchantKey}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    if (hash !== receivedHash) {
      console.error("Payment verification failed - hash mismatch:", { 
        expected: hash, 
        received: receivedHash,
        hashString: hashString.replace(config.merchantSalt, "***").replace(config.merchantKey, "***")
      });
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=verification_failed`);
    }

    if (status !== "success") {
      console.error("Payment status not success:", status);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=payment_failed`);
    }

    // Verify amount matches
    if (parseFloat(amount) !== parseFloat(transaction.amount)) {
      console.error("Amount mismatch:", { expected: transaction.amount, received: amount });
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=amount_mismatch`);
    }

    // Verify billing cycle hasn't been tampered with
    if (udf1 && udf1 !== transaction.billingCycle) {
      console.error("Billing cycle mismatch:", { expected: transaction.billingCycle, received: udf1 });
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=billing_cycle_mismatch`);
    }

    // Verify organization ID matches (defense in depth)
    if (udf2 && udf2 !== transaction.orgId) {
      console.error("Organization ID mismatch:", { expected: transaction.orgId, received: udf2 });
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=organization_mismatch`);
    }

    // Update transaction
    await db
      .update(paymentTransactions)
      .set({
        status: "completed",
        paymentGatewayResponse: { mihpayid, ...req.body },
        paidAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(paymentTransactions.id, transaction.id));

    // Update organization subscription using the billing cycle from udf1
    const subscriptionEndDate = new Date();
    const billingCycle = udf1 || transaction.billingCycle;
    
    if (billingCycle === "monthly") {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    } else if (billingCycle === "quarterly") {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
    } else if (billingCycle === "annual") {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      console.error("Invalid billing cycle:", billingCycle);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=invalid_billing_cycle`);
    }

    // Get the plan name to set on organization
    const [planDetails] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, transaction.planId!));

    await db
      .update(organizations)
      .set({
        subscriptionStatus: "active",
        planId: planDetails?.name?.toLowerCase() || "starter",
        subscriptionStartedAt: new Date(),
        subscriptionEndsAt: subscriptionEndDate,
        updatedAt: new Date(),
      } as any)
      .where(eq(organizations.id, transaction.orgId));

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-success?orderId=${txnid}`);
  } catch (error) {
    console.error("Payment callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=server_error`);
  }
});

// PayUmoney failure callback
router.post("/callback/failure", async (req, res) => {
  try {
    const { txnid, status } = req.body;

    // Update transaction if exists
    if (txnid) {
      const [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.paymentGatewayId, txnid));

      if (transaction) {
        await db
          .update(paymentTransactions)
          .set({
            status: "failed",
            updatedAt: new Date(),
          } as any)
          .where(eq(paymentTransactions.id, transaction.id));
      }
    }

    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?orderId=${txnid}&status=${status}`);
  } catch (error) {
    console.error("Payment failure callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5000"}/subscription/payment-failed?reason=server_error`);
  }
});

export default router;
