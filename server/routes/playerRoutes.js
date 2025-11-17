import { Router } from "express";
import {
  listPlayers,
  createOrUpdatePlayer,
  deletePlayer,
  summarizePositions,
  summarizeTeams,
} from "../controllers/playersController.js";

const router = Router();

router.get("/", listPlayers);
router.get("/summary/positions", summarizePositions);
router.get("/summary/teams", summarizeTeams);

router.post("/", createOrUpdatePlayer);

router.delete("/:id", deletePlayer);

export default router;
