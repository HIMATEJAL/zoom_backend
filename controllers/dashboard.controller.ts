import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { agentPerformanceData } from "../services/dashboard.service";
import { dashboardResponse } from "../types/dashboard.types";

export const DashboardController = async (req: AuthenticatedRequest, res: Response<dashboardResponse>, next: NextFunction) => {
    console.log('DashboardController');
    
    try {
        const user = req.user;
        const { from, to } = req.body;

        if (!user) {
            return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
        }

        if (!from || !to) {
            return next(Object.assign(new Error('Date missing'), { status: 404 }));
        }
        
        const agentData = await agentPerformanceData(user, from, to);

        res.status(200).json({success: true, data: agentData});
    } catch (err) {
        next(err);
    }
}