import type { Invoice, InvoiceItem, Customer, Organization } from "../../shared/schema";
import puppeteer from "puppeteer";

interface InvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer;
  organization: Organization;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { invoice, items, customer, organization } = data;
  
  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const taxAmount = items.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0);
  const total = subtotal + taxAmount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info h1 { color: #2563eb; font-size: 28px; margin-bottom: 8px; }
    .company-info p { font-size: 14px; color: #666; line-height: 1.6; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 24px; margin-bottom: 8px; }
    .invoice-info p { font-size: 14px; color: #666; }
    .addresses { display: flex; gap: 40px; margin-bottom: 40px; }
    .address-block { flex: 1; }
    .address-block h3 { font-size: 14px; color: #888; margin-bottom: 8px; text-transform: uppercase; }
    .address-block p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead { background: #f3f4f6; }
    th { text-align: left; padding: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #666; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 12px; }
    .totals-row.total { background: #f3f4f6; font-weight: 600; font-size: 18px; margin-top: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #888; font-size: 12px; }
    .notes { margin-top: 30px; padding: 20px; background: #f9fafb; border-left: 4px solid #2563eb; }
    .notes h3 { font-size: 14px; margin-bottom: 8px; }
    .notes p { font-size: 14px; color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${organization.name}</h1>
      <p>${organization.address || ''}</p>
      <p>GSTIN: ${organization.gstin || 'N/A'}</p>
      <p>Email: ${organization.email || ''}</p>
      <p>Phone: ${organization.phone || ''}</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>${invoice.invoiceNumber}</strong></p>
      <p>Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
      ${invoice.dueDate ? `<p>Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Bill To</h3>
      <p><strong>${customer.name}</strong></p>
      <p>${customer.billingAddress || ''}</p>
      ${customer.gstin ? `<p>GSTIN: ${customer.gstin}</p>` : ''}
      <p>${customer.email || ''}</p>
      <p>${customer.phone || ''}</p>
    </div>
    ${customer.shippingAddress ? `
    <div class="address-block">
      <h3>Ship To</h3>
      <p>${customer.shippingAddress}</p>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>HSN/SAC</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Tax</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.hsnCode || '-'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${Number(item.rate).toFixed(2)}</td>
          <td class="text-right">${item.taxRate || 0}%</td>
          <td class="text-right">₹${Number(item.amount).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Tax:</span>
      <span>₹${taxAmount.toFixed(2)}</span>
    </div>
    <div class="totals-row total">
      <span>Total:</span>
      <span>₹${total.toFixed(2)}</span>
    </div>
  </div>

  ${invoice.notes ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${invoice.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `.trim();
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
