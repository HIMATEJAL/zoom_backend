import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { DashboardController } from "../controllers/dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.post('/', authenticate, DashboardController);

export default dashboardRouter;