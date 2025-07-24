import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { AgentQueueResponse, QueueRequestBody, IntervalQueueRequestBody, AbandonedCallsRequestBody, AgentAbandonedReportRequestBody } from "../types/agent-queue.types";
import { fetchAgentQueueData, generateAgentQueue, generateAgentQueueReport, generateAbandonedCalls, generateAgentAbandonedReport } from "../services/agent-queue.service";
import { AuthenticatedPayload } from "../types/user.type";

// Centralized handler for queue operations
const handleQueueOperation = async <T>(
    req: AuthenticatedRequest,
    res: Response<AgentQueueResponse<T>>,
    next: NextFunction,
    operation: (user: AuthenticatedPayload, body: any) => Promise<AgentQueueResponse<T>>,
    refresh: boolean = false
) => {
    try {
        const user = req.user;
        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }

        const body = req.body;
        if (!body.from || !body.to) {
            return next(Object.assign(new Error("Date range is required"), { status: 400 }));
        }

        if (refresh) {
            await fetchAgentQueueData(user, body.from, body.to);
        }

        const data = await operation(user, body);
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

// Fetch Agent Queue
export const fetchAgentQueueController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('fetchAgentQueueController');
    await handleQueueOperation(req, res, next, (user, body: QueueRequestBody) =>
        generateAgentQueue(user, body.from, body.to, body.page, body.count, body.queues, body.agents), false);
};

// Refresh Agent Queue
export const refreshAgentQueueController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('refreshAgentQueueController');
    await handleQueueOperation(req, res, next, (user, body: QueueRequestBody) =>
        generateAgentQueue(user, body.from, body.to, body.page, body.count, body.queues, body.agents), true);
};

// Get Daily Queue
export const getDailyQueueController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('getDailyQueueController');
    await handleQueueOperation(req, res, next, (user, body: QueueRequestBody) =>
        generateAgentQueueReport(user, body.from, body.to, body.count, body.page, 'daily', undefined, body.queueId), false);
};

// Refresh Daily Queue
export const refreshDailyQueueController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('refreshDailyQueueController');
    await handleQueueOperation(req, res, next, (user, body: QueueRequestBody) =>
        generateAgentQueueReport(user, body.from, body.to, body.count, body.page, 'daily', undefined, body.queueId), true);
};

// Get Interval Queue
export const getIntervalQueueController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('getIntervalQueueController');
    const { interval } = req.body as IntervalQueueRequestBody;
    if (!interval || !["15", "30", "60"].includes(interval)) {
        return next(Object.assign(new Error("Interval must be 15, 30, or 60 minutes"), { status: 400 }));
    }
    await handleQueueOperation(req, res, next, (user, body: IntervalQueueRequestBody) =>
        generateAgentQueueReport(user, body.from, body.to, body.count, body.page, 'interval', body.interval, body.queueId), false);
};

// Refresh Interval Queue
export const refreshIntervalQueueController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('refreshIntervalQueueController');
    const { interval } = req.body as IntervalQueueRequestBody;
    if (!interval || !["15", "30", "60"].includes(interval)) {
        return next(Object.assign(new Error("Interval must be 15, 30, or 60 minutes"), { status: 400 }));
    }
    await handleQueueOperation(req, res, next, (user, body: IntervalQueueRequestBody) =>
        generateAgentQueueReport(user, body.from, body.to, body.count, body.page, 'interval', body.interval, body.queueId), true);
};

// Get Abandoned Calls
export const abandonedCallsController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('abandonedCallsController');
    await handleQueueOperation(req, res, next, (user, body: AbandonedCallsRequestBody) =>
        generateAbandonedCalls(user, body.from, body.to, body.count, body.page, body.queues, body.agents), false);
};

// Refresh Abandoned Calls
export const refreshAbandonedCallsController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('refreshAbandonedCallsController');
    await handleQueueOperation(req, res, next, (user, body: AbandonedCallsRequestBody) =>
        generateAbandonedCalls(user, body.from, body.to, body.count, body.page, body.queues, body.agents), true);
};

// Get Agent Abandoned Report
export const agentAbandonedReportController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('agentAbandonedReportController');
    await handleQueueOperation(req, res, next, (user, body: AgentAbandonedReportRequestBody) =>
        generateAgentAbandonedReport(user, body.from, body.to, body.count, body.page, body.queues, body.directions), false);
};

// Refresh Agent Abandoned Report
export const refreshAgentAbandonedReportController = async (req: AuthenticatedRequest, res: Response<AgentQueueResponse>, next: NextFunction) => {
    console.log('refreshAgentAbandonedReportController');
    await handleQueueOperation(req, res, next, (user, body: AgentAbandonedReportRequestBody) =>
        generateAgentAbandonedReport(user, body.from, body.to, body.count, body.page, body.queues, body.directions), true);
};