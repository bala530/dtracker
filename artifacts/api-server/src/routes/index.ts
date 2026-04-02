import { Router, type IRouter } from "express";
import healthRouter from "./health";
import defectsRouter from "./defects";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(defectsRouter);
router.use(storageRouter);

export default router;
