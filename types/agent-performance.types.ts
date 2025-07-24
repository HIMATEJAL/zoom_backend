import { Team } from "../models/team.model";
import { AgentResponse } from "../services/agent.service";

export interface AgentPerformanceAttributes {
    id?: number,
    engagement_id: string,
    start_time: Date;
    end_time: Date;
    direction: string,
    user_id: string,
    user_name: string,
    channel: string,
    channel_source: string,
    queue_id: string,
    queue_name: string,
    team_id: string,
    team_name: string,
    handled_count: number,
    handle_duration: number,
    direct_transfer_count: number,
    warm_transfer_initiated_count: number,
    warm_transfer_completed_count: number,
    transfer_initiated_count: number,
    transfer_completed_count: number,
    warm_conference_count: number,
    agent_offered_count: number,
    agent_refused_count: number,
    agent_missed_count: number,
    ring_disconnect_count: number,
    agent_declined_count: number,
    agent_message_sent_count: number,
    hold_count: number,
    conversation_duration: number,
    conference_duration: number,
    conference_count: number,
    hold_duration: number,
    wrap_up_duration: number,
    outbound_handled_count: number,
    outbound_handle_duration: number,
    warm_conference_duration: number,
    warm_transfer_duration: number,
    ring_duration: number,
    agent_first_response_duration: number,
    dial_duration: number,
    inbound_conversation_duration: number,
    inbound_handle_duration: number,
    inbound_handled_count: number,
    outbound_conversation_duration: number,
}

export interface AgentPerformanceOutput {
    engagement_id: string,
    start_time: Date,
    direction: string,
    user_name: string,
    channel: string,
    queue_name: string,
    transfer_initiated_count: number,
    transfer_completed_count: number,
    hold_count: number,
    conversation_duration: number,
    wrap_up_duration: number,
    ring_duration: number,
    agent_first_response_duration: number,
}

export interface TeamReportSummary {
  team_name: string;
  total_interactions: number;
  avg_handle_duration: number;
  total_hold_count: number;
  avg_wrap_up_duration: number;
  channels: string[];
  directions: string[];
  transfer_initiated: number;
  transfer_completed: number;
  queues: string[];
}

export interface AgentPerformanceResponse {
    success: boolean,
    perfomance?: AgentPerformanceOutput[],
    report?: TeamReportSummary[],
    teams?: string[];
    totalRecords: number,
    agents?: AgentResponse[],
}