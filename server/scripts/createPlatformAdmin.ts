import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hugenetwork7@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ADMIN_PASSWORD_PLACEHOLDER"; // Change this!
const ADMIN_NAME = process.env.ADMIN_NAME || "Platform Admin";

async function createOrUpdatePlatformAdmin() {
  try {
    console.log("Creating/updating platform admin...");
    console.log("Admin email:", ADMIN_EMAIL);

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL));

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (existingUser) {
      // Update existing user to platform_admin
      await db
        .update(users)
        .set({
          role: "platform_admin",
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      console.log("✓ Existing user updated to platform admin");
      console.log("User ID:", existingUser.id);
    } else {
      // Create new platform admin user
      const [newUser] = await db
        .insert(users)
        .values({
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: ADMIN_NAME,
          role: "platform_admin",
        })
        .returning();

      console.log("✓ New platform admin user created");
      console.log("User ID:", newUser.id);
    }

    console.log("\nPlatform admin is ready!");
    console.log("Email:", ADMIN_EMAIL);
    console.log("\nYou can now login at /admin/login");
  } catch (error) {
    console.error("Error creating platform admin:", error);
    throw error;
  }
}

createOrUpdatePlatformAdmin()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
