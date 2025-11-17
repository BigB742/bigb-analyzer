import { Router } from "express";
import { getPlayerDetails, getPlayerDetailsDebug } from "../controllers/playerDetailsController.js";

const router = Router();

router.get("/qb/:playerId/details", getPlayerDetails);
router.get("/qb/:playerId/debug", getPlayerDetailsDebug);

export default router;
