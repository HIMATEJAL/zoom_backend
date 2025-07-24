import axios from 'axios';
import { AgentTimecard } from '../models/agent-timecard.model';
import { AgentPerformance } from '../models/agent-performance.model';
import { AgentEngagement } from '../models/agent-engagement.model';
import { AgentQueue } from '../models/agent-queue.model';
import { CallLogs } from '../models/call-logs.model';
import { User } from '../models/user.model';
import { Op } from 'sequelize';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Map model names to Sequelize models
const MODEL_MAP: Record<string, any> = {
    AgentTimecard,
    AgentPerformance,
    AgentEngagement,
    AgentQueue,
    CallLogs,
    User,
};

// Map string operators to Sequelize Op
const OP_MAP: Record<string, any> = {
    eq: Op.eq,
    ne: Op.ne,
    gt: Op.gt,
    gte: Op.gte,
    lt: Op.lt,
    lte: Op.lte,
    like: Op.like,
    in: Op.in,
    notIn: Op.notIn,
};

// Only allow these models for reporting
const ALLOWED_MODELS = [
    'AgentTimecard',
    'AgentPerformance',
    'AgentEngagement',
    'AgentQueue',
    'CallLogs',
];

// Database schema information for GPT
const DATABASE_SCHEMA = `
Available Models and Columns (USE ONLY THESE MODELS):

1. AgentTimecard (agentTimecard table) - For agent login/logout and status data:
   - id (INTEGER, primary key)
   - work_session_id (STRING, required)
   - start_time (DATE, required)
   - end_time (DATE, required)
   - user_id (STRING, required)
   - user_name (STRING, required)
   - user_status (STRING, required)
   - user_sub_status (STRING, required)
   - duration (INTEGER, required) - in milliseconds

2. AgentPerformance (agentPerformance table) - For agent call handling performance:
   - id (INTEGER, primary key)
   - engagement_id (STRING, unique)
   - start_time (DATE)
   - end_time (DATE)
   - direction (STRING)
   - user_id (STRING)
   - user_name (STRING)
   - channel (STRING)
   - channel_source (STRING)
   - queue_id (STRING)
   - queue_name (STRING)
   - team_id (STRING)
   - team_name (STRING)
   - handled_count (INTEGER)
   - handle_duration (INTEGER) - in milliseconds
   - direct_transfer_count (INTEGER)
   - warm_transfer_initiated_count (INTEGER)
   - warm_transfer_completed_count (INTEGER)
   - transfer_initiated_count (INTEGER)
   - transfer_completed_count (INTEGER)
   - warm_conference_count (INTEGER)
   - agent_offered_count (INTEGER)
   - agent_refused_count (INTEGER)
   - agent_missed_count (INTEGER)
   - ring_disconnect_count (INTEGER)
   - agent_declined_count (INTEGER)
   - agent_message_sent_count (INTEGER)
   - hold_count (INTEGER)
   - conversation_duration (INTEGER) - in milliseconds
   - conference_duration (INTEGER) - in milliseconds
   - conference_count (INTEGER)
   - hold_duration (INTEGER) - in milliseconds
   - wrap_up_duration (INTEGER) - in milliseconds
   - outbound_handled_count (INTEGER)
   - outbound_handle_duration (INTEGER) - in milliseconds
   - warm_conference_duraton (INTEGER) - in milliseconds
   - warm_transfer_duration (INTEGER) - in milliseconds
   - ring_duration (INTEGER) - in milliseconds
   - agent_first_response_duration (INTEGER) - in milliseconds
   - dial_duration (INTEGER) - in milliseconds
   - inbound_conversation_duration (INTEGER) - in milliseconds
   - inbound_handle_duration (INTEGER) - in milliseconds
   - inbound_handled_count (INTEGER)
   - outbound_conversation_duration (INTEGER) - in milliseconds
   NOTE: AgentPerformance does NOT have transfer_count or voice_mail fields!

3. AgentEngagement (agentEngagement table) - For individual call engagements:
   - id (INTEGER, primary key)
   - engagement_id (STRING, unique)
   - direction (STRING)
   - start_time (DATE)
   - end_time (DATE)
   - enter_channel (STRING)
   - enter_channel_source (STRING)
   - channel (STRING)
   - channel_source (STRING)
   - consumer_name (STRING)
   - consumer_email (STRING)
   - dnis (STRING)
   - ani (STRING)
   - queue_id (STRING)
   - queue_name (STRING)
   - user_id (STRING)
   - user_name (STRING)
   - duration (INTEGER) - in milliseconds
   - handle_duration (INTEGER) - in milliseconds
   - conversation_duration (INTEGER) - in milliseconds
   - hold_count (INTEGER)
   - hold_duration (INTEGER) - in milliseconds
   - warm_transfer_initiated_count (INTEGER)
   - warm_transfer_completed_count (INTEGER)
   - direct_transfer_count (INTEGER)
   - transfer_initiated_count (INTEGER)
   - transfer_completed_count (INTEGER)
   - warm_conference_count (INTEGER)
   - conference_count (INTEGER)
   - abandoned_count (INTEGER)

4. AgentQueue (agentQueue table) - For queue-related call data:
   - id (INTEGER, primary key)
   - start_time (STRING)
   - end_time (STRING)
   - duration (INTEGER) - in milliseconds
   - engagement_id (STRING, unique, required)
   - direction (STRING)
   - channel (STRING)
   - channel_source (STRING)
   - consumer_id (STRING)
   - consumer_display_name (STRING)
   - consumer_number (STRING)
   - flow_id (STRING)
   - flow_name (STRING)
   - cc_queue_id (STRING)
   - queue_name (STRING)
   - user_id (STRING)
   - display_name (STRING)
   - queue_wait_type (STRING)
   - talk_duration (INTEGER) - in milliseconds
   - flow_duration (INTEGER) - in milliseconds
   - waiting_duration (INTEGER) - in milliseconds
   - handling_duration (INTEGER) - in milliseconds
   - wrap_up_duration (INTEGER) - in milliseconds
   - transfer_count (INTEGER)
   - voice_mail (INTEGER)
   NOTE: Only AgentQueue has transfer_count and voice_mail fields!

5. CallLogs (callLog table) - For basic call log information:
   - id (INTEGER, primary key)
   - direction (STRING)
   - international (BOOLEAN)
   - call_path_id (STRING)
   - call_id (STRING)
   - caller_did_number (STRING)
   - connect_type (STRING)
   - call_type (STRING)
   - hide_caller_id (BOOLEAN)
   - caller_name (STRING)
   - callee_did_number (STRING)
   - caller_number_type (STRING)
   - caller_country_iso_code (STRING)
   - caller_country_code (STRING)
   - callee_ext_id (STRING)
   - callee_name (STRING)
   - callee_email (STRING)
   - callee_ext_number (STRING)
   - callee_ext_type (STRING)
   - callee_number_type (STRING)
   - callee_country_iso_code (STRING)
   - callee_country_code (STRING)
   - end_to_end (BOOLEAN)
   - site_id (STRING)
   - site_name (STRING)
   - duration (INTEGER) - in milliseconds
   - call_result (STRING)
   - start_time (STRING)
   - end_time (STRING)
   - recording_status (STRING)

IMPORTANT RULES:
- ONLY use these 5 models: AgentTimecard, AgentPerformance, AgentEngagement, AgentQueue, CallLogs
- DO NOT use User, ZoomUser, Role, or any other models
- For agent-specific queries about calls handled, use AgentPerformance
- For agent status/login queries, use AgentTimecard
- For individual call details, use AgentEngagement
- For queue statistics, use AgentQueue
- For basic call logs, use CallLogs
- All duration fields are in milliseconds
- Use exact column names as listed above
- Fields like transfer_count and voice_mail are specific to AgentQueue and should not be mixed with AgentPerformance.
- GROUP BY rules: Use GROUP BY only when comparing multiple agents/entities. Do NOT use GROUP BY for specific agent queries (e.g., "Melissa's data")
- When selecting non-aggregated columns (e.g., user_name) together with aggregated columns (e.g., SUM, MAX), ALL non-aggregated columns MUST be listed in the GROUP BY clause
- When filtering by specific agent name, use WHERE clause only, no GROUP BY needed

Available operators for filters: Op.gte, Op.lte, Op.eq, Op.in, Op.ne, Op.gt, Op.lt, Op.like, Op.notIn
Date format: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
`;

function buildWhere(filters: any) {
    const where: any = {};
    for (const key in filters) {
        const value = filters[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Operator object, e.g., { gte: '2024-06-07' }
            for (const op in value) {
                if (OP_MAP[op]) {
                    where[key] = { [OP_MAP[op]]: value[op] };
                }
            }
        } else {
            where[key] = value;
        }
    }
    return where;
}

function convertSequelizeOptions(options: any, model: any): any {
    if (!options) return {};
    
    const converted = JSON.parse(JSON.stringify(options));
    
    // Convert operators in where clause
    if (converted.where) {
        converted.where = convertOperators(converted.where);
    }
    
    // Convert functions in attributes
    if (converted.attributes && Array.isArray(converted.attributes)) {
        converted.attributes = converted.attributes.map((attr: any) => {
            if (Array.isArray(attr) && typeof attr[0] === 'string' && attr[0].includes('sequelize.fn')) {
                // Convert "sequelize.fn('SUM', sequelize.col('field'))" to actual fn call
                const funcMatch = attr[0].match(/sequelize\.fn\('(\w+)',\s*sequelize\.col\('(\w+)'\)\)/);
                if (funcMatch) {
                    return [model.sequelize.fn(funcMatch[1], model.sequelize.col(funcMatch[2])), attr[1]];
                }
            }
            return attr;
        });
    }
    
    // Convert functions in order clause
    if (converted.order && Array.isArray(converted.order)) {
        converted.order = converted.order.map((orderItem: any) => {
            if (Array.isArray(orderItem)) {
                const [field, direction] = orderItem;
                if (typeof field === 'string' && field.includes('sequelize.fn')) {
                    // Convert sequelize.fn in order clause
                    const funcMatch = field.match(/sequelize\.fn\('(\w+)',\s*sequelize\.col\('(\w+)'\)\)/);
                    if (funcMatch) {
                        return [model.sequelize.fn(funcMatch[1], model.sequelize.col(funcMatch[2])), direction];
                    }
                }
                return orderItem;
            }
            return orderItem;
        });
    }
    
    return converted;
}

function convertOperators(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const converted: any = {};
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const convertedValue: any = {};
            for (const opKey in value) {
                if (opKey.startsWith('Op.') && OP_MAP[opKey.substring(3)]) {
                    convertedValue[OP_MAP[opKey.substring(3)]] = value[opKey];
                } else {
                    convertedValue[opKey] = value[opKey];
                }
            }
            converted[key] = convertedValue;
        } else {
            converted[key] = value;
        }
    }
    return converted;
}

export const processNLReport = async (query: string) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not set in environment variables.');
    }

    // Get current date for relative date calculations - using UTC to avoid timezone issues
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Fix month calculation using UTC to avoid timezone issues
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed: Jan=0, Jul=6
    const thisMonthStartDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    const nextMonthStartDate = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
    const thisMonthStart = thisMonthStartDate.toISOString().split('T')[0];
    const nextMonthStart = nextMonthStartDate.toISOString().split('T')[0];

    console.log('📅 DATE CONTEXT:', {
        today,
        tomorrow,
        yesterday,
        lastWeekStart,
        thisMonthStart,
        nextMonthStart,
        currentMonth,
        currentYear,
        debugThisMonth: thisMonthStartDate,
        debugNextMonth: nextMonthStartDate,
        nowUTC: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Prompt GPT to output a structured query plan with full schema information
    const prompt = `You are an assistant for a call center reporting system. Given a user request, output a JSON object with keys: 
- model: the database model name (MUST be one of: AgentTimecard, AgentPerformance, AgentEngagement, AgentQueue, CallLogs)
- method: either "findOne" or "findAll" 
- options: the Sequelize options object (where, attributes, group, order, etc.)

🚨 CRITICAL RESTRICTION: You can ONLY use these 5 models:
1. AgentTimecard
2. AgentPerformance  
3. AgentEngagement
4. AgentQueue
5. CallLogs

DO NOT use: User, Agent, ZoomUser, Role, Team, or ANY other model names!

CURRENT DATE CONTEXT:
- Today is: ${today}
- Tomorrow is: ${tomorrow}
- Yesterday was: ${yesterday}
- Last week started: ${lastWeekStart}
- This month started: ${thisMonthStart}
- Next month starts: ${nextMonthStart}
- For "today" queries: use start_time >= "${today}" AND start_time < "${tomorrow}"
- For "yesterday" queries: use start_time >= "${yesterday}" AND start_time < "${today}"
- For "this month" queries: use start_time >= "${thisMonthStart}" AND start_time < "${nextMonthStart}"
- Use these dates when user asks for "today", "yesterday", "last week", "this month", etc.

IMPORTANT: Use proper Sequelize syntax, not raw SQL:
- For operators: Use "Op.gte", "Op.lte", "Op.eq", "Op.in", etc. (literal strings)
- For functions: Use ["sequelize.fn('FUNCTION_NAME', sequelize.col('column_name'))", "alias"]
- For dates: Use YYYY-MM-DD format
- Never use raw SQL with parentheses in attributes

${DATABASE_SCHEMA}

Examples:

User request: Show me all agents who are active today
{
  "model": "AgentTimecard",
  "method": "findAll",
  "options": {
    "where": {
      "user_status": "active",
      "start_time": {"Op.gte": "${today}"},
      "end_time": {"Op.lt": "${tomorrow}"}
    },
    "attributes": ["user_id", "user_name", "start_time", "user_status"]
  }
}

User request: How many calls were handled by Melissa today
{
  "model": "AgentPerformance", 
  "method": "findOne",
  "options": {
    "where": {
      "user_name": "Melissa",
      "start_time": {"Op.gte": "${today}"},
      "end_time": {"Op.lt": "${tomorrow}"}
    },
    "attributes": [["sequelize.fn('SUM', sequelize.col('handled_count'))", "total_handled_count"]],
    "raw": true
  }
}

User request: What was top handle duration for Melissa today
{
  "model": "AgentPerformance",
  "method": "findOne",
  "options": {
    "where": {
      "user_name": "Melissa",
      "start_time": {"Op.gte": "${today}"},
      "end_time": {"Op.lt": "${tomorrow}"}
    },
    "attributes": [["sequelize.fn('MAX', sequelize.col('handle_duration'))", "top_handle_duration"]],
    "raw": true
  }
}

User request: How many calls were handled by Melissa last week
{
  "model": "AgentPerformance", 
  "method": "findOne",
  "options": {
    "where": {
      "user_name": "Melissa",
      "start_time": {"Op.gte": "${lastWeekStart}"},
      "end_time": {"Op.lte": "${today}"}
    },
    "attributes": [["sequelize.fn('SUM', sequelize.col('handled_count'))", "total_handled_count"]],
    "raw": true
  }
}

User request: Show agent performance for today
{
  "model": "AgentPerformance",
  "method": "findAll", 
  "options": {
    "where": {
      "start_time": {"Op.gte": "${today}"},
      "end_time": {"Op.lt": "${tomorrow}"}
    },
    "attributes": ["user_name", "handled_count", "handle_duration", "queue_name", "direction"]
  }
}

User request: Get total call report summary for ServiceSG this month
{
  "model": "AgentQueue",
  "method": "findOne",
  "options": {
    "where": {
      "queue_name": "ServiceSG",
      "start_time": {"Op.gte": "${thisMonthStart}"},
      "end_time": {"Op.lt": "${nextMonthStart}"}
    },
    "attributes": [
      ["sequelize.fn('COUNT', sequelize.col('id'))", "total_calls"],
      ["sequelize.fn('SUM', sequelize.col('talk_duration'))", "total_talk_duration"],
      ["sequelize.fn('SUM', sequelize.col('flow_duration'))", "total_flow_duration"],
      ["sequelize.fn('SUM', sequelize.col('waiting_duration'))", "total_waiting_duration"],
      ["sequelize.fn('SUM', sequelize.col('handling_duration'))", "total_handling_duration"],
      ["sequelize.fn('SUM', sequelize.col('wrap_up_duration'))", "total_wrap_up_duration"],
      ["sequelize.fn('SUM', sequelize.col('transfer_count'))", "total_transfer_count"],
      ["sequelize.fn('SUM', sequelize.col('voice_mail'))", "total_voice_mail_count"]
    ],
    "raw": true
  }
}

User request: Which agent handled more calls this month
{
  "model": "AgentPerformance",
  "method": "findOne",
  "options": {
    "where": {
      "start_time": {"Op.gte": "${thisMonthStart}"},
      "end_time": {"Op.lt": "${nextMonthStart}"}
    },
    "attributes": [
      "user_name",
      ["sequelize.fn('SUM', sequelize.col('handled_count'))", "total_handled_count"]
    ],
    "group": ["user_name"],
    "order": [["sequelize.fn('SUM', sequelize.col('handled_count'))", "DESC"]],
    "raw": true
  }
}

User request: Which agent handled more calls this month and total call duration
{
  "model": "AgentPerformance",
  "method": "findOne",
  "options": {
    "where": {
      "start_time": {"Op.gte": "${thisMonthStart}"},
      "end_time": {"Op.lt": "${nextMonthStart}"}
    },
    "attributes": [
      "user_name",
      ["sequelize.fn('SUM', sequelize.col('handled_count'))", "total_handled_count"],
      ["sequelize.fn('SUM', sequelize.col('handle_duration'))", "total_call_duration"]
    ],
    "group": ["user_name"],
    "order": [["sequelize.fn('SUM', sequelize.col('handled_count'))", "DESC"]],
    "raw": true
  }
}

User request: Which agent has top conversation duration this month
{
  "model": "AgentPerformance",
  "method": "findOne",
  "options": {
    "where": {
      "start_time": {"Op.gte": "${thisMonthStart}"},
      "end_time": {"Op.lt": "${nextMonthStart}"}
    },
    "attributes": [
      "user_name",
      ["sequelize.fn('SUM', sequelize.col('conversation_duration'))", "total_conversation_duration"]
    ],
    "group": ["user_name"],
    "order": [["sequelize.fn('SUM', sequelize.col('conversation_duration'))", "DESC"]],
    "raw": true
  }
}

User request: Which agent has top conversation duration for a call this month
{
  "model": "AgentPerformance",
  "method": "findOne",
  "options": {
    "where": {
      "start_time": {"Op.gte": "${thisMonthStart}"},
      "end_time": {"Op.lt": "${nextMonthStart}"}
    },
    "attributes": ["user_name", "conversation_duration"],
    "order": [["conversation_duration", "DESC"]],
    "raw": true
  }
}

🚨 REMINDER: ONLY use AgentTimecard, AgentPerformance, AgentEngagement, AgentQueue, or CallLogs models!

User request: ${query}`;

    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'You help parse reporting queries for a call center database.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const gptContent = response.data.choices[0].message.content;
        let plan;
        try {
            plan = JSON.parse(gptContent);
            console.log('✅ GPT PLAN PARSED SUCCESSFULLY:', {
                model: plan.model,
                method: plan.method,
                hasWhere: !!plan.options?.where,
                hasAttributes: !!plan.options?.attributes,
                originalQuery: query
            });
        } catch (e: any) {
            console.log('❌ GPT JSON PARSE ERROR:', {
                rawContent: gptContent,
                parseError: e.message,
                originalQuery: query
            });
            plan = { raw: gptContent, error: 'Failed to parse GPT response as JSON' };
        }

        // If GPT didn't return a valid plan structure, return error
        if (!plan.model || !plan.method || !plan.options) {
            console.log('❌ INVALID GPT PLAN STRUCTURE:', {
                plan,
                originalQuery: query
            });
            return { error: 'GPT returned invalid plan structure. Please try rephrasing your question.' };
        }

        // ENFORCE: Only allow find (read) operations and only on allowed models
        if (!plan.model || !ALLOWED_MODELS.includes(plan.model)) {
            console.log('❌ FORBIDDEN MODEL ATTEMPTED:', {
                requestedModel: plan.model,
                allowedModels: ALLOWED_MODELS,
                fullPlan: plan,
                originalQuery: query
            });
            return { error: `Only reporting models (${ALLOWED_MODELS.join(', ')}) are supported. Requested: ${plan.model}` };
        }
        if (plan.operation && plan.operation !== 'find') {
            return { error: 'Only find (read) operations are supported.' };
        }

        // Securely map model name to Sequelize model
        let data = null;
        if (plan.model && MODEL_MAP[plan.model]) {
            const model = MODEL_MAP[plan.model];
            
            // Execute the exact plan as returned by GPT - no backend construction or conditions
            try {
                // Convert GPT's string-based options to actual Sequelize objects
                const convertedOptions = convertSequelizeOptions(plan.options, model);
                
                // Direct execution based on GPT's plan
                if (plan.method === 'findOne') {
                 
                    data = await model.findOne(convertedOptions);
                } else {
                    console.log('convertedOptions', convertedOptions);
                    // Default to findAll
                    data = await model.findAll(convertedOptions);
                }
            } catch (error: any) {
                return { error: `Query execution failed: ${error.message}` };
            }
        }

        return {
            query,
            plan,
            data,
        };
    } catch (err: any) {
        throw new Error(err.response?.data?.error?.message || err.message || 'Failed to process NL report');
    }
}; 