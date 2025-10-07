import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a professional item description based on a product name
 */
export async function generateItemDescription(itemName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a professional business assistant. Generate concise, professional product descriptions for invoices. Keep descriptions under 100 characters and focus on key features.",
        },
        {
          role: "user",
          content: `Generate a professional invoice description for: ${itemName}`,
        },
      ],
      max_completion_tokens: 150,
    });

    return response.choices[0].message.content?.trim() || itemName;
  } catch (error) {
    console.error("AI description generation failed:", error);
    return itemName;
  }
}

/**
 * Suggest HSN/SAC code based on item description
 */
export async function suggestHSNCode(itemDescription: string): Promise<{
  code: string;
  description: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert in Indian GST HSN/SAC codes. Suggest the most appropriate HSN or SAC code for items. Respond with JSON in this format: { 'code': 'string', 'description': 'string' }",
        },
        {
          role: "user",
          content: `Suggest HSN/SAC code for: ${itemDescription}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      code: result.code || "",
      description: result.description || "",
    };
  } catch (error) {
    console.error("AI HSN suggestion failed:", error);
    return { code: "", description: "" };
  }
}

/**
 * Generate invoice insights and recommendations
 */
export async function analyzeInvoice(invoiceData: {
  customer: string;
  items: Array<{ description: string; quantity: number; rate: number; taxRate: number }>;
  subtotal: number;
  total: number;
}): Promise<{
  insights: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst expert. Analyze invoices and provide professional insights, recommendations, and risk assessment. Respond with JSON in this format: { 'insights': ['string'], 'recommendations': ['string'], 'riskLevel': 'low'|'medium'|'high' }",
        },
        {
          role: "user",
          content: `Analyze this invoice:
Customer: ${invoiceData.customer}
Items: ${invoiceData.items.length}
Subtotal: ₹${invoiceData.subtotal}
Total: ₹${invoiceData.total}

Item details: ${JSON.stringify(invoiceData.items)}

Provide insights, recommendations, and assess payment risk level.`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      riskLevel: result.riskLevel || "low",
    };
  } catch (error) {
    console.error("AI invoice analysis failed:", error);
    return {
      insights: [],
      recommendations: [],
      riskLevel: "low",
    };
  }
}

/**
 * Smart tax rate suggestion based on item type
 */
export async function suggestTaxRate(itemDescription: string): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert in Indian GST rates. Suggest the most appropriate GST rate (0, 5, 12, 18, or 28) based on the item. Respond with JSON in this format: { 'taxRate': number, 'reason': 'string' }",
        },
        {
          role: "user",
          content: `Suggest GST rate for: ${itemDescription}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 150,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.taxRate || 18;
  } catch (error) {
    console.error("AI tax rate suggestion failed:", error);
    return 18;
  }
}
