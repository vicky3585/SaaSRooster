import { Router } from "express";
import { db } from "../db";
import { teams, teamMembers, insertTeamSchema, insertTeamMemberSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const teamsList = await db
      .select()
      .from(teams)
      .where(eq(teams.orgId, req.orgId!))
      .orderBy(teams.createdAt);

    res.json(teamsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [team] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.id, req.params.id), eq(teams.orgId, req.orgId!)));

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));

    res.json({ ...team, members });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertTeamSchema.parse({
      ...req.body,
      orgId: req.orgId,
    });

    const [team] = await db
      .insert(teams)
      .values(validatedData)
      .returning();

    res.status(201).json(team);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:id/members", async (req: AuthRequest, res) => {
  try {
    const [team] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.id, req.params.id), eq(teams.orgId, req.orgId!)));

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const validatedData = insertTeamMemberSchema.parse({
      ...req.body,
      teamId: req.params.id,
    });

    const [member] = await db
      .insert(teamMembers)
      .values(validatedData)
      .returning();

    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id/members/:userId", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, req.params.id),
          eq(teamMembers.userId, req.params.userId)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Team member not found" });
    }

    res.json({ message: "Team member removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingTeam] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.id, req.params.id), eq(teams.orgId, req.orgId!)));

    if (!existingTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    const [updatedTeam] = await db
      .update(teams)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(teams.id, req.params.id))
      .returning();

    res.json(updatedTeam);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(teams)
      .where(and(eq(teams.id, req.params.id), eq(teams.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({ message: "Team deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
