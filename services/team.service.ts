import commonAPI from "../config/commonAPI";
import { Team } from "../models/team.model"
import { AuthenticatedPayload } from "../types/user.type";
import { getAccessToken } from "../utils/accessToken";

export const saveTeam = async (team_name: string, team_members: string[]): Promise<Team> => {
    try {
        const result = await Team.create({ team_name, team_members });
        return result;
    } catch (err) {
        throw err;
    }
};

export const UserData = async (user: AuthenticatedPayload) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        const result = await commonAPI("GET", '/contact_center/users', {}, {}, token);

        return result.users?.map((user: any) => ({
            user_id: user.user_id,
            name: user.display_name
        }));
    } catch (err) {
        throw err
    }
}

export const editTeam = async (id: number, team_name?: string, team_members?: string[]): Promise<Team> => {
    try {
        const team = await Team.findByPk(id);
        if (!team) {
            throw new Error("Team not found");
        }

        const updates: Partial<Team> = {};
        if (team_name !== undefined) {
            updates.team_name = team_name;
        }
        if (team_members !== undefined) {
            updates.team_members = team_members;
        }

        await team.update(updates);
        return team;
    } catch (err) {
        throw err;
    }
};

export const removeTeam = async (id: number): Promise<void> => {
    try {
        const team = await Team.findByPk(id);
        if (!team) {
            throw new Error("Team not found");
        }

        await team.destroy();
    } catch (err) {
        throw err;
    }
};

export const fetchTeams = async () => {
    try {
        const teams = await Team.findAll({
            attributes: [
                'team_name',
            ]
        });
        return teams.map(team=> team.team_name);
    } catch (err) {
        throw err;
    }
};