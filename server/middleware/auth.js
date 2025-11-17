import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.warn("[auth middleware] JWT_SECRET not set. Tokens will fail to verify.");
}

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      isPremium: Boolean(payload.isPremium),
    };
    next();
  } catch (error) {
    console.error("[requireAuth] Token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
