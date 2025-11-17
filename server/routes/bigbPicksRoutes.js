import { Router } from "express";
import { getBigbPicksHandler } from "../controllers/bigbPicksController.js";

const router = Router();

router.get("/bigb-picks", getBigbPicksHandler);

export default router;
