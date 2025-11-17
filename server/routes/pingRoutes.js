import { Router } from "express";
import { healthcheckController } from "../controllers/healthController.js";

const router = Router();

router.get("/ping", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.get("/health", healthcheckController);

export default router;
