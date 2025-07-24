import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { AgentQueueResponse } from "../types/agent-queue.types";
import { fetchFlowData, refreshVDNRecords } from "../services/agent-vdn.service";

const handleAgentVDN = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction, refresh: boolean) => {
    try {
        const user = req.user;
        const { from, to, count, page, intervalMinutes, flows } = req.body;

        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }
        if (!from || !to) {
            return next(Object.assign(new Error("Date is required"), { status: 400 }));
        }

        if (refresh) {
            await refreshVDNRecords(user, from, to);
        }
        const data = await fetchFlowData(user, from, to, count, page, intervalMinutes, flows);

        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

export const fetchVDNController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('fetchDailyVDNController');
    await handleAgentVDN(req, res, next, false);
}

export const refreshVDNController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('refreshVDNController');
    await handleAgentVDN(req, res, next, true);
}

// export const getFlowIntervalController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
//     console.log('getFlowIntervalController');

//     try {
//         const user = req.user;
//         const { from, to, interval, count, page, nextPageToken, flowId, flowName } = req.body;

//         if (!user) {
//             return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
//         }

//         if (!from || !to || !interval) {
//             return next(Object.assign(new Error("from, to, and interval are required"), { status: 400 }));
//         }

//         if (!["15", "30", "60", "1440"].includes(interval as string)) {
//             return next(Object.assign(new Error("Interval must be 15min, 30min, or 1hr"), { status: 400 }));
//         }

//         const result = await getFlowIntervalReport(user, from, to, count, page, interval, nextPageToken, flowId, flowName);

//         res.status(200).json(result);
//     } catch (err) {
//         next(err);
//     }
// };

// export const refreshFlowController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
//     console.log('refreshFlowController');
    
//     try {
//         const user = req.user;
//         const { from, to, interval, count, page } = req.body;

//         if (!user) {
//             return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
//         }

//         if (!from || !to || !interval) {
//             return next(Object.assign(new Error("from, to, and interval are required"), { status: 400 }));
//         }

//         if (!["15", "30", "60", "1440"].includes(interval as string)) {
//             return next(Object.assign(new Error("Interval must be 15min, 30min, or 1hr"), { status: 400 }));
//         }

//         const result = await refreshAgentQueueData(user, from, to, count, page, interval);

//         res.status(200).json(result);
//     } catch (err) {
//         next(err)
//     }
// }