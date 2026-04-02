import { Router, type IRouter } from "express";
import healthRouter from "./health";
import defectsRouter from "./defects";
import storageRouter from "./storage";
import authRouter from "./auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(defectsRouter);
router.use(storageRouter);

export default router;
