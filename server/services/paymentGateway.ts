import { db } from "../db";
import { paymentGatewayConfigs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentInitResponse {
  orderId: string;
  paymentUrl?: string;
  paymentKey?: string;
  gatewayOrderId?: string;
  formData?: Record<string, any>;
  method: string; // redirect, inline, form
}

export interface PaymentVerification {
  success: boolean;
  orderId: string;
  paymentId: string;
  amount: number;
  signature?: string;
}

export class PaymentGatewayService {
  /**
   * Get active payment gateway for an organization
   */
  async getActiveGateway(orgId: string, gatewayName?: string) {
    const conditions = [
      eq(paymentGatewayConfigs.orgId, orgId),
      eq(paymentGatewayConfigs.isActive, true)
    ];

    if (gatewayName) {
      conditions.push(eq(paymentGatewayConfigs.gatewayName, gatewayName));
    } else {
      conditions.push(eq(paymentGatewayConfigs.isDefault, true));
    }

    const [config] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(and(...conditions));

    return config;
  }

  /**
   * Initialize a payment with the configured gateway
   */
  async initiatePayment(
    orgId: string,
    order: PaymentOrder,
    gatewayName?: string
  ): Promise<PaymentInitResponse> {
    const gateway = await this.getActiveGateway(orgId, gatewayName);

    if (!gateway) {
      throw new Error("No active payment gateway configured");
    }

    switch (gateway.gatewayName) {
      case "razorpay":
        return this.initiateRazorpay(gateway, order);
      case "stripe":
        return this.initiateStripe(gateway, order);
      case "payumoney":
        return this.initiatePayUMoney(gateway, order);
      case "paytm":
        return this.initiatePaytm(gateway, order);
      case "ccavenue":
        return this.initiateCCAvenue(gateway, order);
      default:
        throw new Error(`Unsupported gateway: ${gateway.gatewayName}`);
    }
  }

  /**
   * Verify payment with the configured gateway
   */
  async verifyPayment(
    orgId: string,
    paymentData: Record<string, any>,
    gatewayName?: string
  ): Promise<PaymentVerification> {
    const gateway = await this.getActiveGateway(orgId, gatewayName);

    if (!gateway) {
      throw new Error("No active payment gateway configured");
    }

    switch (gateway.gatewayName) {
      case "razorpay":
        return this.verifyRazorpay(gateway, paymentData);
      case "stripe":
        return this.verifyStripe(gateway, paymentData);
      case "payumoney":
        return this.verifyPayUMoney(gateway, paymentData);
      case "paytm":
        return this.verifyPaytm(gateway, paymentData);
      case "ccavenue":
        return this.verifyCCAvenue(gateway, paymentData);
      default:
        throw new Error(`Unsupported gateway: ${gateway.gatewayName}`);
    }
  }

  // Razorpay Integration
  private async initiateRazorpay(gateway: any, order: PaymentOrder): Promise<PaymentInitResponse> {
    const config = gateway.config;
    
    // In production, you would use the actual Razorpay SDK
    // For now, returning a mock response
    const gatewayOrderId = `order_${Date.now()}`;

    return {
      orderId: order.orderId,
      gatewayOrderId,
      paymentKey: config.keyId,
      method: "inline", // Razorpay uses inline checkout
    };
  }

  private async verifyRazorpay(gateway: any, paymentData: Record<string, any>): Promise<PaymentVerification> {
    const config = gateway.config;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.keySecret)
      .update(text)
      .digest("hex");

    const success = expectedSignature === razorpay_signature;

    return {
      success,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: 0, // Would be fetched from order
      signature: razorpay_signature,
    };
  }

  // Stripe Integration
  private async initiateStripe(gateway: any, order: PaymentOrder): Promise<PaymentInitResponse> {
    // In production, you would use the actual Stripe SDK
    // const stripe = new Stripe(gateway.config.secretKey);
    // const session = await stripe.checkout.sessions.create({...});

    return {
      orderId: order.orderId,
      paymentUrl: `https://checkout.stripe.com/session_${Date.now()}`,
      method: "redirect",
    };
  }

  private async verifyStripe(gateway: any, paymentData: Record<string, any>): Promise<PaymentVerification> {
    // In production, verify using Stripe SDK
    return {
      success: true,
      orderId: paymentData.orderId || "",
      paymentId: paymentData.paymentIntentId || "",
      amount: paymentData.amount || 0,
    };
  }

  // PayUMoney Integration
  private async initiatePayUMoney(gateway: any, order: PaymentOrder): Promise<PaymentInitResponse> {
    const config = gateway.config;
    const baseUrl = gateway.mode === "live" 
      ? "https://secure.payu.in/_payment" 
      : "https://sandboxsecure.payu.in/_payment";

    // Generate hash
    const hashString = `${config.merchantKey}|${order.orderId}|${order.amount}|${order.description}|${order.customerName}|${order.customerEmail}|||||||||||${config.merchantSalt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const formData = {
      key: config.merchantKey,
      txnid: order.orderId,
      amount: order.amount.toString(),
      productinfo: order.description || "Payment",
      firstname: order.customerName || "Customer",
      email: order.customerEmail || "customer@example.com",
      phone: order.customerPhone || "",
      surl: `${process.env.BASE_URL}/api/payment-gateways/callback/payumoney/success`,
      furl: `${process.env.BASE_URL}/api/payment-gateways/callback/payumoney/failure`,
      hash: hash,
    };

    return {
      orderId: order.orderId,
      paymentUrl: baseUrl,
      formData,
      method: "form", // PayUMoney requires form POST
    };
  }

  private async verifyPayUMoney(gateway: any, paymentData: Record<string, any>): Promise<PaymentVerification> {
    const config = gateway.config;
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      mihpayid,
      hash: receivedHash,
    } = paymentData;

    // Verify hash
    const hashString = `${config.merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${config.merchantKey}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const success = hash === receivedHash && status === "success";

    return {
      success,
      orderId: txnid,
      paymentId: mihpayid,
      amount: parseFloat(amount),
    };
  }

  // Paytm Integration
  private async initiatePaytm(gateway: any, order: PaymentOrder): Promise<PaymentInitResponse> {
    const config = gateway.config;
    
    // In production, you would use the actual Paytm SDK
    // Generate checksum and create transaction token

    return {
      orderId: order.orderId,
      paymentUrl: gateway.mode === "live"
        ? "https://securegw.paytm.in/theia/processTransaction"
        : "https://securegw-stage.paytm.in/theia/processTransaction",
      formData: {
        MID: config.merchantId,
        ORDER_ID: order.orderId,
        TXN_AMOUNT: order.amount.toString(),
        CUST_ID: order.customerEmail || "CUST001",
        INDUSTRY_TYPE_ID: "Retail",
        WEBSITE: "DEFAULT",
        CHANNEL_ID: "WEB",
        CALLBACK_URL: `${process.env.BASE_URL}/api/payment-gateways/callback/paytm`,
      },
      method: "form",
    };
  }

  private async verifyPaytm(gateway: any, paymentData: Record<string, any>): Promise<PaymentVerification> {
    // In production, verify using Paytm SDK
    const success = paymentData.STATUS === "TXN_SUCCESS";

    return {
      success,
      orderId: paymentData.ORDERID,
      paymentId: paymentData.TXNID,
      amount: parseFloat(paymentData.TXNAMOUNT || "0"),
    };
  }

  // CCAvenue Integration
  private async initiateCCAvenue(gateway: any, order: PaymentOrder): Promise<PaymentInitResponse> {
    const config = gateway.config;

    // In production, encrypt data using working key
    const encryptedData = this.encryptCCAvenue(
      {
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        billing_name: order.customerName,
        billing_email: order.customerEmail,
        billing_tel: order.customerPhone,
        redirect_url: `${process.env.BASE_URL}/api/payment-gateways/callback/ccavenue`,
        cancel_url: `${process.env.BASE_URL}/api/payment-gateways/callback/ccavenue/cancel`,
      },
      config.workingKey
    );

    return {
      orderId: order.orderId,
      paymentUrl: gateway.mode === "live"
        ? "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
        : "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction",
      formData: {
        encRequest: encryptedData,
        access_code: config.accessCode,
      },
      method: "form",
    };
  }

  private async verifyCCAvenue(gateway: any, paymentData: Record<string, any>): Promise<PaymentVerification> {
    const config = gateway.config;
    
    // In production, decrypt and verify using working key
    const decryptedData = this.decryptCCAvenue(paymentData.encResp, config.workingKey);
    
    // Parse decrypted data
    const params = new URLSearchParams(decryptedData);
    const success = params.get("order_status") === "Success";

    return {
      success,
      orderId: params.get("order_id") || "",
      paymentId: params.get("tracking_id") || "",
      amount: parseFloat(params.get("amount") || "0"),
    };
  }

  // Helper methods for CCAvenue encryption/decryption
  private encryptCCAvenue(data: Record<string, any>, workingKey: string): string {
    // Simplified version - in production, use actual CCAvenue encryption
    const dataString = Object.entries(data)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    
    const cipher = crypto.createCipheriv("aes-128-cbc", workingKey.substring(0, 16), workingKey.substring(0, 16));
    let encrypted = cipher.update(dataString, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  private decryptCCAvenue(encryptedData: string, workingKey: string): string {
    // Simplified version - in production, use actual CCAvenue decryption
    const decipher = crypto.createDecipheriv("aes-128-cbc", workingKey.substring(0, 16), workingKey.substring(0, 16));
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

export const paymentGatewayService = new PaymentGatewayService();
