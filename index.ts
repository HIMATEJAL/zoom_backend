import dotenv from 'dotenv';
import cron from 'node-cron';
dotenv.config();

import app from './app';
import initializeSequelize from './config/db';
import initModels from './models';
import { runAutoUpdates } from './utils/autoUpdate';
import { createAdminUser } from './utils/createAdmin';

const PORT = process.env.PORT || 9847;

const startServer = async () => {
  try {
    const sequelize = await initializeSequelize();
    await initModels(sequelize);
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await createAdminUser();

    cron.schedule('0 0 * * *', async () => {
      try {
        await runAutoUpdates();
      } catch (error) {
        console.error('Zoom auto-update task failed:', error);
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running at PORT: ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();