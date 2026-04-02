import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const defectsTable = pgTable("defects", {
  id: serial("id").primaryKey(),
  defectId: text("defect_id").notNull().unique(),
  description: text("description").notNull(),
  status: text("status").notNull().default("reported"),
  environment: text("environment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDefectSchema = createInsertSchema(defectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDefect = z.infer<typeof insertDefectSchema>;
export type Defect = typeof defectsTable.$inferSelect;

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  defectId: integer("defect_id").notNull().references(() => defectsTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;

export const attachmentsTable = pgTable("attachments", {
  id: serial("id").primaryKey(),
  defectId: integer("defect_id").notNull().references(() => defectsTable.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachmentsTable).omit({ id: true, createdAt: true });
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachmentsTable.$inferSelect;
