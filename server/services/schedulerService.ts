import { db } from '../db';
import { organizations } from '@shared/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { notificationService } from './notificationService';

/**
 * Scheduler Service for automated tasks
 * - Check trial expirations
 * - Send monthly summaries
 * - Send renewal reminders
 */
export class SchedulerService {
  private intervalIds: NodeJS.Timeout[] = [];

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('Starting scheduler service...');

    // Check trial expirations every hour
    this.startTrialExpirationCheck();

    // Check for monthly summaries daily at 9 AM
    this.startMonthlySummaryCheck();

    // Check for subscription renewals daily
    this.startSubscriptionRenewalCheck();

    console.log('Scheduler service started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('Stopping scheduler service...');
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    console.log('Scheduler service stopped');
  }

  /**
   * Check for trial expirations and send warnings
   */
  private startTrialExpirationCheck() {
    // Run immediately
    this.checkTrialExpirations();

    // Then run every hour
    const intervalId = setInterval(() => {
      this.checkTrialExpirations();
    }, 60 * 60 * 1000); // 1 hour

    this.intervalIds.push(intervalId);
  }

  /**
   * Check trial expirations for all organizations
   */
  private async checkTrialExpirations() {
    try {
      const now = new Date();
      
      // Get warning days from env or use defaults (7, 3, 1)
      const warningDays = (process.env.TRIAL_WARNING_DAYS || '7,3,1')
        .split(',')
        .map(d => parseInt(d.trim()));

      // Get all organizations in trial period
      const trialingOrgs = await db
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.subscriptionStatus, 'trialing'),
            eq(organizations.isActive, true),
            sql`${organizations.trialEndsAt} IS NOT NULL`
          )
        );

      for (const org of trialingOrgs) {
        if (!org.trialEndsAt) continue;

        const daysLeft = Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send warning if days left matches warning days
        if (warningDays.includes(daysLeft) && daysLeft > 0) {
          console.log(`Sending trial expiration warning to org ${org.name} (${daysLeft} days left)`);
          await notificationService.sendTrialExpirationWarning(org.id, daysLeft);
        }

        // Expire trial if time has passed
        if (daysLeft <= 0 && org.subscriptionStatus === 'trialing') {
          console.log(`Expiring trial for organization: ${org.name}`);
          await db
            .update(organizations)
            .set({
              subscriptionStatus: 'expired',
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, org.id));
        }
      }
    } catch (error) {
      console.error('Error checking trial expirations:', error);
    }
  }

  /**
   * Start monthly summary check
   */
  private startMonthlySummaryCheck() {
    // Run immediately if it's the first day of the month
    this.checkMonthlySummaries();

    // Then run daily at configured time (default 9 AM)
    const checkTime = this.getNextCheckTime();
    const msUntilNextCheck = checkTime.getTime() - Date.now();

    setTimeout(() => {
      this.checkMonthlySummaries();
      
      // Then run every 24 hours
      const intervalId = setInterval(() => {
        this.checkMonthlySummaries();
      }, 24 * 60 * 60 * 1000); // 24 hours

      this.intervalIds.push(intervalId);
    }, msUntilNextCheck);
  }

  /**
   * Check and send monthly summaries if it's the configured day
   */
  private async checkMonthlySummaries() {
    try {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const configuredDay = parseInt(process.env.MONTHLY_SUMMARY_DAY || '1');

      // Only send on the configured day of the month
      if (dayOfMonth !== configuredDay) {
        return;
      }

      console.log('Sending monthly summaries...');

      // Get previous month and year
      const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      // Get all active organizations
      const activeOrgs = await db
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.isActive, true),
            sql`${organizations.subscriptionStatus} IN ('trialing', 'active')`
          )
        );

      for (const org of activeOrgs) {
        try {
          // Send sales summary if enabled
          if (process.env.ENABLE_MONTHLY_SALES_SUMMARY !== 'false') {
            await notificationService.sendMonthlySalesSummary(org.id, lastMonth, year);
          }

          // Send purchase summary if enabled
          if (process.env.ENABLE_MONTHLY_PURCHASE_SUMMARY !== 'false') {
            await notificationService.sendMonthlyPurchaseSummary(org.id, lastMonth, year);
          }
        } catch (error) {
          console.error(`Error sending monthly summaries for org ${org.id}:`, error);
        }
      }

      console.log(`Monthly summaries sent to ${activeOrgs.length} organization(s)`);
    } catch (error) {
      console.error('Error checking monthly summaries:', error);
    }
  }

  /**
   * Start subscription renewal check
   */
  private startSubscriptionRenewalCheck() {
    // Run immediately
    this.checkSubscriptionRenewals();

    // Then run daily
    const intervalId = setInterval(() => {
      this.checkSubscriptionRenewals();
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.intervalIds.push(intervalId);
  }

  /**
   * Check subscription renewals and send reminders
   */
  private async checkSubscriptionRenewals() {
    try {
      const now = new Date();
      const warningDays = [7, 3, 1]; // Send reminders at 7, 3, and 1 day before expiry

      // Get active subscriptions
      const activeOrgs = await db
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.subscriptionStatus, 'active'),
            eq(organizations.isActive, true)
          )
        );

      for (const org of activeOrgs) {
        // TODO: Add subscription end date to organization or subscription table
        // For now, skip if no trial end date
        if (!org.trialEndsAt) continue;

        const daysUntilExpiry = Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (warningDays.includes(daysUntilExpiry) && daysUntilExpiry > 0) {
          console.log(`Sending subscription renewal reminder to org ${org.name} (${daysUntilExpiry} days left)`);
          await notificationService.sendSubscriptionRenewalReminder(org.id, daysUntilExpiry);
        }
      }
    } catch (error) {
      console.error('Error checking subscription renewals:', error);
    }
  }

  /**
   * Get next check time based on configured time
   */
  private getNextCheckTime(): Date {
    const now = new Date();
    const [hours, minutes] = (process.env.EMAIL_SEND_TIME || '09:00').split(':').map(Number);
    
    const nextCheck = new Date(now);
    nextCheck.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1);
    }

    return nextCheck;
  }
}

export const schedulerService = new SchedulerService();
