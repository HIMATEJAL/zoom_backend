import { AgentResponse } from "../services/agent.service";

export interface AgentTimecardAttributes {
    id?: number,
    work_session_id: string,
    start_time: Date,
    end_time: Date,
    user_id: string,
    user_name: string,
    user_status: string,
    user_sub_status: string,
    duration?: number,
    ready_duration?: number,
    occupied_duration?: number,
    not_ready_duration?: number,
    work_session_duration?: number,
}

export interface AgentTimecardOutput {
    work_session_id: string,
    start_time: Date,
    user_name: string,
    user_status: string,
    user_sub_status: string,
    duration: number,
}

export interface AgentLoginLogoutOutput {
    work_session_id: string,
    start_time: Date,
    end_time: Date,
    user_name: string,
    duration: number,
}

export interface CountResult {
    total: string;
}

export interface AgentTimecardResponse {
    success: boolean,
    records: AgentTimecardOutput[] | AgentLoginLogoutOutput[],
    totalRecords: number,
    agents?: AgentResponse[],
}