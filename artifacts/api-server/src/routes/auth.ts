import { Router } from "express";

const authRouter = Router();

authRouter.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.APP_USERNAME;
  const validPass = process.env.APP_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(500).json({ error: "Server credentials not configured" });
  }

  if (username === validUser && password === validPass) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ ok: true, username });
  }

  return res.status(401).json({ error: "Invalid credentials" });
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
