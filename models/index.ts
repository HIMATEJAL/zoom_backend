import { Sequelize } from 'sequelize';
import { initUserModel, User } from './user.model';
import { initRoleModel, Role } from './role.model';
import { initZoomUserModel, ZoomUser } from './zoom.model';
import { CallLogs, initCallLogModel } from './call-logs.model';
import { initAgentPerformanceModel } from './agent-performance.model';
import { initAgentTimecardModel } from './agent-timecard.model';
import { initTeamModel } from './team.model';
import { initAgentEngagementModel } from './agent-engagement.model';
import { initAgentQueueModel } from './agent-queue.model';
import { initAgentModel } from './agent.model';

const initModels = (sequelize: Sequelize) => {
    initRoleModel(sequelize);
    initUserModel(sequelize);
    initZoomUserModel(sequelize);
    initCallLogModel(sequelize);
    initAgentPerformanceModel(sequelize);
    initAgentTimecardModel(sequelize);
    initTeamModel(sequelize);
    initAgentEngagementModel(sequelize);
    initAgentQueueModel(sequelize);
    initAgentModel(sequelize);

    Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
    User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

    ZoomUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(ZoomUser, { foreignKey: 'userId', as: 'zoomUser' });

    CallLogs.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(CallLogs, { foreignKey: 'userId', as: 'callLogs' });
};

export default initModels;
