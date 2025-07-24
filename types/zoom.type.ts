import { ZoomUser } from "../models/zoom.model";

export interface CallLogEntry {
  id?: string;
  userId?: string;
  direction?: string;
  international?: boolean;
  call_path_id?: string;
  call_id?: string;
  connect_type?: string;
  call_type?: string;
  hide_caller_id?: boolean;
  caller_did_number?: string;
  caller_name?: string;
  callee_did_number?: string;
  callee_name?: string;
  duration?: number;
  call_result?: string;
  start_time?: string;
  end_time?: string;
  caller_number_type?: string;
  caller_country_iso_code?: string;
  caller_country_code?: string;
  callee_ext_id?: string;
  callee_email?: string;
  callee_ext_number?: string;
  callee_ext_type?: string;
  callee_number_type?: string;
  callee_country_iso_code?: string;
  callee_country_code?: string;
  end_to_end?: boolean;
  site_id?: string;
  site_name?: string;
  recording_status?: string;
}

export interface CallLogResponse {
  success: boolean;
  data: CallLogEntry[] | ZoomUser;
}

export interface ReportResponse {
  success: boolean;
  data: PerformanceAttributes[] | TimecardAttributes[] | AgentEngagementAttributes[] | any
}

export interface AgentLoginReport {
  user_name: string;
  work_session_id: string;
  login_time: string;
  logout_time: string;
  duration?: number;
}

export interface PerformanceAttributes {
  engagement_id?: string;
  start_time?: string;
  queue_name?: string;
  channel?: string;
  direction?: string;
  user_name?: string;
  conversation_duration?: number;
  transfer_initiated_count?: number;
  transfer_completed_count?: number;
  hold_count?: number;
  agent_offered_count?: number;
}

export interface TimecardAttributes {
  id?: number;
  work_session_id?: string;
  start_time?: string;
  end_time?: string;
  user_id?: string;
  user_name?: string;
  user_status?: string;
  user_sub_status?: string;
  team_id?: string;
  team_name?: string;
  not_ready_duration?: number;
  ready_duration?: number;
  occupied_duration?: number;
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

export interface AgentEngagementAttributes {
  id?: string;
  engagement_id: string;
  direction: string;
  start_time: string;
  channel: string;
  consumer: string;
  dnis: string;
  ani: string;
  queue_name: string;
  user_name: string;
  duration: number;
  hold_count: number;
  warm_transfer_initiated_count: number;
  warm_transfer_completed_count: number;
  direct_transfer_count: number;
  transfer_initiated_count: number;
  transfer_completed_count: number;
  warm_conference_count: number;
  conference_count: number;
  abandoned_count: number;
}