import { Sequelize } from 'sequelize';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// const DatabaseExists = async () => {
//     const client = new Client({
//         user: process.env.DB_USER,
//         host: process.env.DB_HOST,
//         password: process.env.DB_PASSWORD,
//         port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
//         database: 'postgres',
//     });

//     try {
//         await client.connect();
//         const dbName = process.env.DB_NAME;

//         const res = await client.query(
//             `SELECT 1 FROM pg_database WHERE datname = $1`,
//             [dbName]
//         );
//         if (res.rowCount === 0) {

//             await client.query(`CREATE DATABASE ${dbName};`);
//             console.log(`Database ${dbName} created successfully`);
//         } else {
//             console.log(`Database ${dbName} already exists`);
//         }
//     } catch (err) {
//         console.error('Error ensuring database exists:', err);
//         throw err;
//     } finally {
//         await client.end();
//     }
// };

const initializeSequelize = async () => {
    // await DatabaseExists();

    const sequelize = new Sequelize(
        process.env.DB_NAME as string,
        process.env.DB_USER as string,
        process.env.DB_PASSWORD as string,
        {
            host: process.env.DB_HOST,
            dialect: 'postgres',
            logging: false,
        }
    )

    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully');
    } catch (err) {
        console.error('Failed to connect to database:', err);
        throw err;
    }

    return sequelize;
};

export default initializeSequelize;