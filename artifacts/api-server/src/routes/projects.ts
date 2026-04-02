import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";

const router: IRouter = Router();

function formatProject(row: typeof projectsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.id);
  res.json(projects.map(formatProject));
});

router.post("/projects", async (req, res): Promise<void> => {
  const { name, isDefault } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Project name is required" });
    return;
  }

  // If this is being set as default, clear existing defaults
  if (isDefault) {
    await db.update(projectsTable).set({ isDefault: false });
  }

  const [project] = await db
    .insert(projectsTable)
    .values({ name: name.trim(), isDefault: !!isDefault })
    .returning();

  res.status(201).json(formatProject(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const { name, isDefault } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (isDefault !== undefined) {
    if (isDefault) {
      await db.update(projectsTable).set({ isDefault: false });
    }
    updateData.isDefault = isDefault;
  }

  const [project] = await db
    .update(projectsTable)
    .set(updateData)
    .where(eq(projectsTable.id, id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(formatProject(project));
});

export default router;
