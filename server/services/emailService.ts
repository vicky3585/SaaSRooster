import { Resend } from 'resend';
import OpenAI from 'openai';
import type { Invoice, InvoiceItem, Customer, Organization } from "../../shared/schema";
import { generateInvoicePDF } from './pdfGenerator';

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EmailInvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer;
  organization: Organization;
}

export async function generateEmailContent(data: EmailInvoiceData): Promise<{ subject: string; body: string }> {
  const { invoice, customer, organization, items } = data;
  
  const itemsSummary = items.map(item => 
    `${item.description} (Qty: ${item.quantity}, Rate: ₹${item.rate})`
  ).join(', ');

  const prompt = `Generate a professional and friendly email to send an invoice to a customer. 

Context:
- Customer name: ${customer.name}
- Company: ${organization.name}
- Invoice number: ${invoice.invoiceNumber}
- Invoice amount: ₹${invoice.total}
- Due date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
- Items: ${itemsSummary}

Requirements:
1. Write a warm, professional subject line
2. Write a concise email body (3-4 paragraphs max)
3. Include: greeting, invoice details, payment due date, thank you message
4. Keep it professional but friendly
5. Don't use placeholders - use actual names and details

Return ONLY a JSON object with this exact format:
{
  "subject": "Your subject line here",
  "body": "Your email body here with \\n for line breaks"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional business email assistant. Generate clear, concise, and friendly invoice emails." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      subject: response.subject || `Invoice ${invoice.invoiceNumber} from ${organization.name}`,
      body: response.body || `Dear ${customer.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber} for ₹${invoice.total}.\n\nThank you for your business!`
    };
  } catch (error) {
    console.error('Error generating email content with AI:', error);
    // Fallback to simple template
    return {
      subject: `Invoice ${invoice.invoiceNumber} from ${organization.name}`,
      body: `Dear ${customer.name},\n\nPlease find your invoice ${invoice.invoiceNumber} for ₹${invoice.total}.\n\nDue date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}\n\nThank you for your business!\n\nBest regards,\n${organization.name}`
    };
  }
}

export async function sendInvoiceEmail(
  data: EmailInvoiceData,
  invoiceHTML: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { customer, organization, invoice } = data;

  if (!customer.email) {
    return { success: false, error: 'Customer email not found' };
  }

  try {
    const { subject, body } = await generateEmailContent(data);

    // Generate PDF attachment
    console.log('Generating PDF for invoice:', invoice.invoiceNumber);
    const pdfBuffer = await generateInvoicePDF(data);
    console.log('PDF generated, size:', pdfBuffer.length, 'bytes');

    // Using verified domain hugenetwork.in
    const fromEmail = 'invoices@hugenetwork.in';
    const fromName = organization.name || 'Invoice';

    // Only use replyTo if it's from the verified domain
    // If org email is gmail/yahoo/etc, don't set replyTo to avoid Resend validation error
    const isVerifiedDomain = organization.email?.endsWith('@hugenetwork.in');
    
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: customer.email,
      subject: subject,
      html: body.replace(/\n/g, '<br>'),
      replyTo: (isVerifiedDomain && organization.email) ? organization.email : undefined,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        }
      ],
    });

    if (result.error) {
      console.error("Resend API error:", JSON.stringify(result.error, null, 2));
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}
