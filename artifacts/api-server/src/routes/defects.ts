import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, defectsTable, commentsTable, attachmentsTable, projectsTable } from "@workspace/db";
import {
  ListDefectsQueryParams,
  ListDefectsResponse,
  CreateDefectBody,
  GetDefectParams,
  GetDefectResponse,
  UpdateDefectParams,
  UpdateDefectBody,
  UpdateDefectResponse,
  DeleteDefectParams,
  ListCommentsParams,
  ListCommentsResponse,
  AddCommentParams,
  AddCommentBody,
  ListAttachmentsParams,
  ListAttachmentsResponse,
  AddAttachmentParams,
  AddAttachmentBody,
  GetDefectStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatDefect(
  row: typeof defectsTable.$inferSelect,
  project?: typeof projectsTable.$inferSelect | null
) {
  return {
    id: row.id,
    defectId: row.defectId,
    description: row.description,
    status: row.status,
    environment: row.environment,
    projectId: row.projectId ?? null,
    projectName: project?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function formatComment(row: typeof commentsTable.$inferSelect) {
  return {
    id: row.id,
    defectId: row.defectId,
    text: row.text,
    author: row.author,
    createdAt: row.createdAt.toISOString(),
  };
}

function formatAttachment(row: typeof attachmentsTable.$inferSelect) {
  return {
    id: row.id,
    defectId: row.defectId,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileSize: row.fileSize ?? undefined,
    mimeType: row.mimeType ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

async function getNextDefectId(): Promise<string> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(defectsTable);
  const count = Number(result[0]?.count ?? 0);
  const num = count + 1;
  return `DEF-${String(num).padStart(3, "0")}`;
}

router.get("/defects/stats/summary", async (req, res): Promise<void> => {
  const all = await db.select({ status: defectsTable.status }).from(defectsTable);
  const total = all.length;
  const reported = all.filter((d) => d.status === "reported").length;
  const readyToRetest = all.filter((d) => d.status === "ready_to_retest").length;
  const closed = all.filter((d) => d.status === "closed").length;
  res.json(GetDefectStatsResponse.parse({ total, reported, readyToRetest, closed }));
});

router.get("/defects", async (req, res): Promise<void> => {
  const params = ListDefectsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.status) {
    conditions.push(eq(defectsTable.status, params.data.status));
  }
  if (params.data.environment) {
    conditions.push(eq(defectsTable.environment, params.data.environment));
  }

  const rows = await db
    .select()
    .from(defectsTable)
    .leftJoin(projectsTable, eq(defectsTable.projectId, projectsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(defectsTable.id);

  res.json(ListDefectsResponse.parse(rows.map((r) => formatDefect(r.defects, r.projects))));
});

router.post("/defects", async (req, res): Promise<void> => {
  const parsed = CreateDefectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const defectId = await getNextDefectId();

  const [defect] = await db
    .insert(defectsTable)
    .values({
      defectId,
      description: parsed.data.description,
      status: parsed.data.status,
      environment: parsed.data.environment,
      projectId: parsed.data.projectId ?? null,
    })
    .returning();

  const [project] = defect.projectId
    ? await db.select().from(projectsTable).where(eq(projectsTable.id, defect.projectId))
    : [null];

  res.status(201).json(GetDefectResponse.parse(formatDefect(defect, project)));
});

router.get("/defects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDefectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(defectsTable)
    .leftJoin(projectsTable, eq(defectsTable.projectId, projectsTable.id))
    .where(eq(defectsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Defect not found" });
    return;
  }

  res.json(GetDefectResponse.parse(formatDefect(row.defects, row.projects)));
});

router.patch("/defects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateDefectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDefectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.environment !== undefined) updateData.environment = parsed.data.environment;
  if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId;

  const [defect] = await db
    .update(defectsTable)
    .set(updateData)
    .where(eq(defectsTable.id, params.data.id))
    .returning();

  if (!defect) {
    res.status(404).json({ error: "Defect not found" });
    return;
  }

  const [project] = defect.projectId
    ? await db.select().from(projectsTable).where(eq(projectsTable.id, defect.projectId))
    : [null];

  res.json(UpdateDefectResponse.parse(formatDefect(defect, project)));
});

router.delete("/defects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDefectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [defect] = await db.delete(defectsTable).where(eq(defectsTable.id, params.data.id)).returning();
  if (!defect) {
    res.status(404).json({ error: "Defect not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/defects/:id/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListCommentsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.defectId, params.data.id))
    .orderBy(commentsTable.createdAt);

  res.json(ListCommentsResponse.parse(comments.map(formatComment)));
});

router.post("/defects/:id/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddCommentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [defect] = await db.select().from(defectsTable).where(eq(defectsTable.id, params.data.id));
  if (!defect) {
    res.status(404).json({ error: "Defect not found" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({
      defectId: params.data.id,
      text: parsed.data.text,
      author: parsed.data.author,
    })
    .returning();

  res.status(201).json(formatComment(comment));
});

router.get("/defects/:id/attachments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListAttachmentsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const attachments = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.defectId, params.data.id))
    .orderBy(attachmentsTable.createdAt);

  res.json(ListAttachmentsResponse.parse(attachments.map(formatAttachment)));
});

router.post("/defects/:id/attachments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddAttachmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddAttachmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [defect] = await db.select().from(defectsTable).where(eq(defectsTable.id, params.data.id));
  if (!defect) {
    res.status(404).json({ error: "Defect not found" });
    return;
  }

  const [attachment] = await db
    .insert(attachmentsTable)
    .values({
      defectId: params.data.id,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      fileSize: parsed.data.fileSize ?? null,
      mimeType: parsed.data.mimeType ?? null,
    })
    .returning();

  res.status(201).json(formatAttachment(attachment));
});

export default router;
