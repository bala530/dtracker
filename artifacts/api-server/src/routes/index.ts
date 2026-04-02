import { Router, type IRouter } from "express";
import healthRouter from "./health";
import defectsRouter from "./defects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(defectsRouter);

export default router;
