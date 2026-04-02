import { Router } from "express";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const authRouter = Router();
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [hashedPwd, salt] = hash.split(".");
  if (!hashedPwd || !salt) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashedPwdBuf = Buffer.from(hashedPwd, "hex");
  return timingSafeEqual(buf, hashedPwdBuf);
}

authRouter.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.authenticated = true;
  req.session.username = username;
  return res.json({ ok: true, username });
});

authRouter.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

authRouter.get("/auth/me", (req, res) => {
  if (req.session.authenticated) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  return res.json({ authenticated: false });
});

export default authRouter;
