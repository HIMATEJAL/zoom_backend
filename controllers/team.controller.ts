import { NextFunction, Request, Response } from "express";
import { editTeam, removeTeam, saveTeam, UserData } from "../services/team.service";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Team } from "../models/team.model";

export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
    console.log('createTeam');
    try {
        const { team_name, team_members } = req.body;

        if (!team_name || !team_members) {
            return next(Object.assign(new Error('Missing required fields'), { status: 400 }));
        }

        const result = await saveTeam(team_name, team_members);

        res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const fetchTeams = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('fetchTeams');
    try {

        const user = req.user;
        const userdata = req.body;

        if(!user){
            return next(Object.assign(new Error('User payload error'), { status: 409 }));
        }

        const response = await UserData(user);
        const teamdata = await Team.findAll();

        const result = {
            users: response,
            teams: teamdata
        }

        res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { team_name, team_members } = req.body;

        if (!team_name && !team_members) {
            return next(Object.assign(new Error('Missing required fields'), { status: 400 }));
        }

        const result = await editTeam(Number(id), team_name, team_members);

        res.status(200).json({ success: true, data: result });

    } catch (err) {
        next(err);
    }
};

export const deleteTeam = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.body;

        if (!id || isNaN(Number(id))) {
            return next(Object.assign(new Error("Valid team ID is required"), { status: 400 }));
        }

        await removeTeam(Number(id));

        res.status(200).json({ success: true, data: "Team deleted successfully" });

    } catch (err) {
        next(err);
    }
};