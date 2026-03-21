import pg from 'pg';
import mysql2 from 'mysql2';
import config from './env.config.js';

const usePostgres = Boolean(config.DATABASE_URL);

export default usePostgres
  ? {
      url: config.DATABASE_URL,
      dialect: 'postgres',
      dialectModule: pg,
      dialectOptions: {
        ssl: { rejectUnauthorized: false },
      },
      pool: {
        min: 0,
        max: 10,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
      },
    }
  : {
      url: `mysql://${encodeURIComponent(config.DB_USER)}:${encodeURIComponent(config.DB_PASSWORD)}@${config.DB_HOST}/${config.DB_NAME}`,
      host: config.DB_HOST,
      dialect: 'mysql',
      dialectModule: mysql2,
      pool: {
        min: 0,
        max: 10,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
      },
    };
