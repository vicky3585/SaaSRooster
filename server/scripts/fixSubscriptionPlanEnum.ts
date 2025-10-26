import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration script to fix subscription plan enum mismatch
 * This script:
 * 1. Updates the plan enum to match subscription_plans table names
 * 2. Migrates existing organization planId values to the new enum
 */
async function fixSubscriptionPlanEnum() {
  try {
    console.log("Starting subscription plan enum migration...\n");

    // Step 1: Convert column to text temporarily
    console.log("Step 1: Converting plan_id column to text...");
    await db.execute(sql`ALTER TABLE organizations ALTER COLUMN plan_id TYPE text`);
    console.log("✓ Converted plan_id column to text\n");

    // Step 2: Update existing organizations with 'starter' to 'free'
    console.log("Step 2: Updating organizations with planId='starter' to 'free'...");
    const updateStarterResult = await db.execute(sql`
      UPDATE organizations 
      SET plan_id = 'free', updated_at = NOW()
      WHERE plan_id = 'starter'
    `);
    console.log(`✓ Updated ${updateStarterResult.rowCount || 0} organizations from 'starter' to 'free'\n`);

    // Step 3: Update 'professional' to 'pro' (if any exist)
    console.log("Step 3: Updating organizations with planId='professional' to 'pro'...");
    const updateProfessionalResult = await db.execute(sql`
      UPDATE organizations 
      SET plan_id = 'pro', updated_at = NOW()
      WHERE plan_id = 'professional'
    `);
    console.log(`✓ Updated ${updateProfessionalResult.rowCount || 0} organizations from 'professional' to 'pro'\n`);

    // Step 4: Drop and recreate the enum with new values
    console.log("Step 4: Updating plan enum...");
    
    // Drop the old enum
    await db.execute(sql`DROP TYPE IF EXISTS plan CASCADE`);
    console.log("✓ Dropped old plan enum");

    // Create the new enum with correct values
    await db.execute(sql`
      CREATE TYPE plan AS ENUM ('free', 'basic', 'pro', 'enterprise')
    `);
    console.log("✓ Created new plan enum with values: 'free', 'basic', 'pro', 'enterprise'");

    // Convert the column back to the enum type with new default
    await db.execute(sql`
      ALTER TABLE organizations 
      ALTER COLUMN plan_id TYPE plan USING plan_id::plan,
      ALTER COLUMN plan_id SET DEFAULT 'free'::plan
    `);
    console.log("✓ Converted plan_id column back to plan enum type\n");

    // Step 5: Verify the changes
    console.log("Step 5: Verifying changes...");
    const result = await db.execute(sql`
      SELECT plan_id, COUNT(*) as count 
      FROM organizations 
      GROUP BY plan_id
      ORDER BY plan_id
    `);
    
    console.log("\nCurrent distribution of plan_id values:");
    console.table(result.rows);

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
fixSubscriptionPlanEnum()
  .then(() => {
    console.log("\nDone! Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
