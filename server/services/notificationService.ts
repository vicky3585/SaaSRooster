import { Resend } from 'resend';
import { db } from '../db';
import { organizations, invoices, purchaseInvoices, users, memberships } from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'invoices@hugenetwork.in';
const FROM_NAME = process.env.FROM_NAME || 'Flying Venture System';

interface MonthlySalesSummary {
  totalSales: number;
  totalInvoices: number;
  paidAmount: number;
  pendingAmount: number;
  topCustomers: Array<{
    name: string;
    amount: number;
  }>;
}

interface MonthlyPurchaseSummary {
  totalPurchases: number;
  totalInvoices: number;
  paidAmount: number;
  pendingAmount: number;
  topVendors: Array<{
    name: string;
    amount: number;
  }>;
}

export class NotificationService {
  /**
   * Send monthly sales summary to organization admins
   */
  async sendMonthlySalesSummary(orgId: string, month: number, year: number): Promise<void> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
      
      if (!org || !org.isActive) {
        console.log(`Organization ${orgId} is not active, skipping notification`);
        return;
      }

      // Get sales summary
      const summary = await this.calculateMonthlySalesSummary(orgId, month, year);

      // Get organization admins
      const orgAdmins = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(
            eq(memberships.orgId, orgId),
            sql`${memberships.role} IN ('owner', 'admin')`
          )
        );

      if (orgAdmins.length === 0) {
        console.log(`No admins found for organization ${orgId}`);
        return;
      }

      // Generate email HTML
      const emailHtml = this.generateSalesSummaryEmail(org.name, summary, month, year);

      // Send email to all admins
      for (const admin of orgAdmins) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: admin.email,
          subject: `Monthly Sales Summary - ${this.getMonthName(month)} ${year} | ${org.name}`,
          html: emailHtml,
        });
      }

      console.log(`Monthly sales summary sent to ${orgAdmins.length} admin(s) for organization ${orgId}`);
    } catch (error) {
      console.error(`Error sending monthly sales summary for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Send monthly purchase summary to organization admins
   */
  async sendMonthlyPurchaseSummary(orgId: string, month: number, year: number): Promise<void> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
      
      if (!org || !org.isActive) {
        console.log(`Organization ${orgId} is not active, skipping notification`);
        return;
      }

      // Get purchase summary
      const summary = await this.calculateMonthlyPurchaseSummary(orgId, month, year);

      // Get organization admins
      const orgAdmins = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(
            eq(memberships.orgId, orgId),
            sql`${memberships.role} IN ('owner', 'admin', 'accountant')`
          )
        );

      if (orgAdmins.length === 0) {
        console.log(`No admins found for organization ${orgId}`);
        return;
      }

      // Generate email HTML
      const emailHtml = this.generatePurchaseSummaryEmail(org.name, summary, month, year);

      // Send email to all admins
      for (const admin of orgAdmins) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: admin.email,
          subject: `Monthly Purchase Summary - ${this.getMonthName(month)} ${year} | ${org.name}`,
          html: emailHtml,
        });
      }

      console.log(`Monthly purchase summary sent to ${orgAdmins.length} admin(s) for organization ${orgId}`);
    } catch (error) {
      console.error(`Error sending monthly purchase summary for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Send trial expiration warning
   */
  async sendTrialExpirationWarning(orgId: string, daysLeft: number): Promise<void> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
      
      if (!org || !org.isActive || !org.trialEndsAt) {
        return;
      }

      // Get organization admins/owners
      const orgAdmins = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(
            eq(memberships.orgId, orgId),
            sql`${memberships.role} IN ('owner', 'admin')`
          )
        );

      if (orgAdmins.length === 0) {
        return;
      }

      // Generate email HTML
      const emailHtml = this.generateTrialExpirationEmail(org.name, daysLeft, org.trialEndsAt);

      // Send email to all admins
      for (const admin of orgAdmins) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: admin.email,
          subject: `Trial Ending Soon - ${daysLeft} Day${daysLeft > 1 ? 's' : ''} Left | ${org.name}`,
          html: emailHtml,
        });
      }

      console.log(`Trial expiration warning sent to ${orgAdmins.length} admin(s) for organization ${orgId}`);
    } catch (error) {
      console.error(`Error sending trial expiration warning for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Send subscription renewal reminder
   */
  async sendSubscriptionRenewalReminder(orgId: string, daysUntilExpiry: number): Promise<void> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
      
      if (!org || !org.isActive) {
        return;
      }

      const orgAdmins = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(
            eq(memberships.orgId, orgId),
            sql`${memberships.role} IN ('owner', 'admin')`
          )
        );

      if (orgAdmins.length === 0) {
        return;
      }

      const emailHtml = this.generateSubscriptionRenewalEmail(org.name, daysUntilExpiry);

      for (const admin of orgAdmins) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: admin.email,
          subject: `Subscription Renewal Reminder - ${daysUntilExpiry} Days Left | ${org.name}`,
          html: emailHtml,
        });
      }

      console.log(`Subscription renewal reminder sent to ${orgAdmins.length} admin(s) for organization ${orgId}`);
    } catch (error) {
      console.error(`Error sending subscription renewal reminder for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate monthly sales summary
   */
  private async calculateMonthlySalesSummary(orgId: string, month: number, year: number): Promise<MonthlySalesSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get invoices for the month
    const monthlyInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          gte(invoices.invoiceDate, startDate),
          lte(invoices.invoiceDate, endDate)
        )
      );

    const totalSales = monthlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const paidAmount = monthlyInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const pendingAmount = totalSales - paidAmount;

    return {
      totalSales,
      totalInvoices: monthlyInvoices.length,
      paidAmount,
      pendingAmount,
      topCustomers: [], // TODO: Implement top customers calculation
    };
  }

  /**
   * Calculate monthly purchase summary
   */
  private async calculateMonthlyPurchaseSummary(orgId: string, month: number, year: number): Promise<MonthlyPurchaseSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get purchase invoices for the month
    const monthlyPurchases = await db
      .select()
      .from(purchaseInvoices)
      .where(
        and(
          eq(purchaseInvoices.orgId, orgId),
          gte(purchaseInvoices.invoiceDate, startDate),
          lte(purchaseInvoices.invoiceDate, endDate)
        )
      );

    const totalPurchases = monthlyPurchases.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const paidAmount = monthlyPurchases
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const pendingAmount = totalPurchases - paidAmount;

    return {
      totalPurchases,
      totalInvoices: monthlyPurchases.length,
      paidAmount,
      pendingAmount,
      topVendors: [], // TODO: Implement top vendors calculation
    };
  }

  /**
   * Generate sales summary email HTML
   */
  private generateSalesSummaryEmail(orgName: string, summary: MonthlySalesSummary, month: number, year: number): string {
    const monthName = this.getMonthName(month);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 40px 30px; }
    .summary-box { background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; }
    .metric { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e9ecef; }
    .metric:last-child { border-bottom: none; }
    .metric-label { font-weight: 600; color: #6c757d; }
    .metric-value { font-weight: 700; font-size: 18px; color: #28a745; }
    .metric-value.pending { color: #ffc107; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #5568d3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Monthly Sales Summary</h1>
      <p>${monthName} ${year} | ${orgName}</p>
    </div>
    <div class="content">
      <p>Dear Admin,</p>
      <p>Here's your sales performance summary for ${monthName} ${year}:</p>
      
      <div class="summary-box">
        <div class="metric">
          <span class="metric-label">Total Sales</span>
          <span class="metric-value">₹${this.formatCurrency(summary.totalSales)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Invoices</span>
          <span class="metric-value">${summary.totalInvoices}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Paid Amount</span>
          <span class="metric-value">₹${this.formatCurrency(summary.paidAmount)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Pending Amount</span>
          <span class="metric-value pending">₹${this.formatCurrency(summary.pendingAmount)}</span>
        </div>
      </div>
      
      <p>Keep up the great work! 🎉</p>
      
      <center>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard" class="button">View Detailed Reports</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>Flying Venture System</strong> | Bizverse SaaS</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate purchase summary email HTML
   */
  private generatePurchaseSummaryEmail(orgName: string, summary: MonthlyPurchaseSummary, month: number, year: number): string {
    const monthName = this.getMonthName(month);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 40px 30px; }
    .summary-box { background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; }
    .metric { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e9ecef; }
    .metric:last-child { border-bottom: none; }
    .metric-label { font-weight: 600; color: #6c757d; }
    .metric-value { font-weight: 700; font-size: 18px; color: #dc3545; }
    .metric-value.pending { color: #ffc107; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .button { display: inline-block; background: #f5576c; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #e04556; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Monthly Purchase Summary</h1>
      <p>${monthName} ${year} | ${orgName}</p>
    </div>
    <div class="content">
      <p>Dear Admin,</p>
      <p>Here's your purchase summary for ${monthName} ${year}:</p>
      
      <div class="summary-box">
        <div class="metric">
          <span class="metric-label">Total Purchases</span>
          <span class="metric-value">₹${this.formatCurrency(summary.totalPurchases)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Invoices</span>
          <span class="metric-value">${summary.totalInvoices}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Paid Amount</span>
          <span class="metric-value">₹${this.formatCurrency(summary.paidAmount)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Pending Amount</span>
          <span class="metric-value pending">₹${this.formatCurrency(summary.pendingAmount)}</span>
        </div>
      </div>
      
      <center>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard" class="button">View Detailed Reports</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>Flying Venture System</strong> | Bizverse SaaS</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate trial expiration warning email HTML
   */
  private generateTrialExpirationEmail(orgName: string, daysLeft: number, trialEndsAt: Date): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }
    .header .days-left { font-size: 48px; font-weight: 700; margin: 20px 0; }
    .content { padding: 40px 30px; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 700; font-size: 16px; }
    .button:hover { background: #218838; }
    .features { margin: 30px 0; }
    .feature { padding: 10px 0; }
    .feature:before { content: "✓"; color: #28a745; font-weight: 700; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Trial Ending Soon</h1>
      <div class="days-left">${daysLeft}</div>
      <p>Day${daysLeft > 1 ? 's' : ''} Remaining</p>
    </div>
    <div class="content">
      <p>Dear ${orgName} Admin,</p>
      <p>Your free trial will expire on <strong>${trialEndsAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
      
      <div class="warning-box">
        <strong>⚠️ Important:</strong> To continue using Bizverse SaaS without interruption, please upgrade to a paid plan before your trial ends.
      </div>
      
      <p><strong>Why upgrade?</strong></p>
      <div class="features">
        <div class="feature">Unlimited invoicing and billing</div>
        <div class="feature">Advanced inventory management</div>
        <div class="feature">CRM and lead tracking</div>
        <div class="feature">Financial accounting reports</div>
        <div class="feature">Multi-user access with roles</div>
        <div class="feature">Priority customer support</div>
      </div>
      
      <center>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/subscription/upgrade" class="button">Upgrade Now →</a>
      </center>
      
      <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@flyingventure.com'}">${process.env.SUPPORT_EMAIL || 'support@flyingventure.com'}</a></p>
    </div>
    <div class="footer">
      <p><strong>Flying Venture System</strong> | Bizverse SaaS</p>
      <p>This is an automated reminder. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate subscription renewal reminder email HTML
   */
  private generateSubscriptionRenewalEmail(orgName: string, daysUntilExpiry: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 700; }
    .button:hover { background: #5568d3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Subscription Renewal</h1>
      <p>${orgName}</p>
    </div>
    <div class="content">
      <p>Dear Admin,</p>
      <p>Your subscription will expire in <strong>${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}</strong>.</p>
      <p>To ensure uninterrupted service, please renew your subscription.</p>
      
      <center>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/subscription/renew" class="button">Renew Subscription</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>Flying Venture System</strong> | Bizverse SaaS</p>
      <p>Need help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@flyingventure.com'}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Helper: Get month name
   */
  private getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  /**
   * Helper: Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export const notificationService = new NotificationService();
