import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { fetchAgentPerformance, generateGroupSummary, refreshAgentPerformance } from "../services/agent-perfomance.service";
import { AgentPerformanceResponse } from "../types/agent-performance.types";
import { fetchAgents } from "../services/agent.service";
import { fetchAgentLoginReport, fetchTimeCard, refreshTimeCard } from "../services/agent-timecard.service";
import { AgentTimecardResponse } from "../types/agent-timecard.types";
import { fetchAgentEngagement, refreshAgentEngagement } from "../services/agent-engagement.service";
import { AgentEngagementResponse } from "../types/agent-engagement.types";
import { fetchTeams } from "../services/team.service";

const handleAgentPerformance = async (req: AuthenticatedRequest, res: Response<AgentPerformanceResponse>, next: NextFunction, refresh: boolean) => {
    try {
        const user = req.user;
        const { from, to, page, count, format, agents, channels } = req.body;

        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }
        if (!from || !to) {
            return next(Object.assign(new Error("Date is required"), { status: 400 }));
        }

        if (refresh) {
            await refreshAgentPerformance(user, from, to);
        }
        const data = await fetchAgentPerformance(user, from, to, page, count, format, agents, channels);
        const users = await fetchAgents(user);

        res.status(200).json({ ...data, agents: users });
    } catch (err) {
        next(err);
    }
};

export const AgentPerfomanceController = async (req: AuthenticatedRequest, res: Response<AgentPerformanceResponse>, next: NextFunction) => {
    console.log('AgentPerfomanceController');
    await handleAgentPerformance(req, res, next, false);
};

export const AgentPerfomanceRefreshController = async (req: AuthenticatedRequest, res: Response<AgentPerformanceResponse>, next: NextFunction) => {
    console.log('AgentPerfomanceRefreshController');
    await handleAgentPerformance(req, res, next, true);
};

const handleAgentTimecard = async (req: AuthenticatedRequest, res: Response<AgentTimecardResponse>, next: NextFunction, refresh: boolean) => {
    try {
        const user = req.user;
        const { from, to, page, count, format, status, agents } = req.body;

        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }
        if (!from || !to) {
            return next(Object.assign(new Error("Date is required"), { status: 400 }));
        }

        if (refresh) {
            await refreshTimeCard(user, from, to);
        }
        const data = await fetchTimeCard(user, from, to, page, count, format, status, agents);
        const users = await fetchAgents(user);

        res.status(200).json({ ...data, agents: users });
    } catch (err) {
        next(err);
    }
};

export const AgentTimecardController = async (req: AuthenticatedRequest, res: Response<AgentTimecardResponse>, next: NextFunction) => {
    console.log('AgentTimecardController');
    await handleAgentTimecard(req, res, next, false);
};

export const AgentTimecardRefreshController = async (req: AuthenticatedRequest, res: Response<AgentTimecardResponse>, next: NextFunction) => {
    console.log('AgentTimecardRefreshController');
    await handleAgentTimecard(req, res, next, true);
};

const handleAgentLoginLogout = async (req: AuthenticatedRequest, res: Response<AgentTimecardResponse>, next: NextFunction, refresh: boolean) => {
    try {
        const user = req.user;
        const { from, to, page, count, format, status, agents } = req.body;

        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }
        if (!from || !to) {
            return next(Object.assign(new Error("Date is required"), { status: 400 }));
        }

        if (refresh) {
            await refreshTimeCard(user, from, to);
        }
        const data = await fetchAgentLoginReport(user, from, to, page, count, format, agents);
        const users = await fetchAgents(user);

        res.status(200).json({ ...data, agents: users });
    } catch (err) {
        next(err);
    }
};

export const AgentLoginLogoutController = async (req: AuthenticatedRequest, res: Response<AgentTimecardResponse>, next: NextFunction) => {
    console.log('AgentLoginLogoutController');
    await handleAgentLoginLogout(req, res, next, false);
};

export const AgentLoginLogoutRefreshController = async (req: AuthenticatedRequest, res: Response<AgentTimecardResponse>, next: NextFunction) => {
    console.log('AgentTimecardRefreshController');
    await handleAgentLoginLogout(req, res, next, true);
};

const handleAgentEngagement = async (req: AuthenticatedRequest, res: Response<AgentEngagementResponse>, next: NextFunction, refresh: boolean) => {
    try {
        const user = req.user;
        const { from, to, page, count, format, channels, agents } = req.body;

        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }
        if (!from || !to) {
            return next(Object.assign(new Error("Date is required"), { status: 400 }));
        }

        if (refresh) {
            await refreshAgentEngagement(user, from, to);
        }
        const data = await fetchAgentEngagement(user, from, to, page, count, format, channels, agents);
        const users = await fetchAgents(user);

        res.status(200).json({ ...data, agents: users });
    } catch (err) {
        next(err);
    }
};

export const AgentEngagementController = async (req: AuthenticatedRequest, res: Response<AgentEngagementResponse>, next: NextFunction) => {
    console.log('AgentEngagementController');
    await handleAgentEngagement(req, res, next, false);
};

export const AgentEngagementRefreshController = async (req: AuthenticatedRequest, res: Response<AgentEngagementResponse>, next: NextFunction) => {
    console.log('AgentEngagementRefreshController');
    await handleAgentEngagement(req, res, next, true);
};

const handleGroupSummary = async (req: AuthenticatedRequest, res: Response<AgentPerformanceResponse>, next: NextFunction, refresh: boolean) => {
    try {
        const user = req.user;
        const { from, to, channels, teams, page, count } = req.body;

        if (!user) {
            return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
        }
        if (!from || !to) {
            return next(Object.assign(new Error("Date is required"), { status: 400 }));
        }

        if (refresh) {
            await refreshAgentPerformance(user, from, to);
        }
        const data = await generateGroupSummary(user, from, to, channels, teams, page, count);
        const teamData = await fetchTeams();

        res.status(200).json({ ...data, teams: teamData });
    } catch (err) {
        next(err);
    }
};

export const GroupSummaryController = async (req: AuthenticatedRequest, res: Response<AgentPerformanceResponse>, next: NextFunction) => {
    console.log('GroupSummaryController');
    await handleGroupSummary(req, res, next, false);
};

export const GroupSummaryRefreshController = async (req: AuthenticatedRequest, res: Response<AgentPerformanceResponse>, next: NextFunction) => {
    console.log('GroupSummaryRefreshController');
    await handleGroupSummary(req, res, next, true);
};