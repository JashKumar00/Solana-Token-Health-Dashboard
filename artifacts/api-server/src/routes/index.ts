import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jupiterRouter from "./jupiter";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jupiterRouter);

export default router;
