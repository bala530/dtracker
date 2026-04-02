import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { db, usersTable, projectsTable } from "./index";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("Seeding database...");

  // Seed default project
  const existingProject = await db.select().from(projectsTable).limit(1);
  if (existingProject.length === 0) {
    await db.insert(projectsTable).values({ name: "Blending", isDefault: true });
    console.log("Created default project: Blending");
  }

  // Seed default user
  const username = process.env.APP_USERNAME || "blending";
  const password = process.env.APP_PASSWORD || "dallas2026";

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!existing) {
    const passwordHash = await hashPassword(password);
    await db.insert(usersTable).values({ username, passwordHash });
    console.log(`Created user: ${username}`);
  } else {
    console.log(`User already exists: ${username}`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
