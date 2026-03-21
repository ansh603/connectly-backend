import config from "./src/common/config/env.config.js";

const usePostgres = Boolean(config.DATABASE_URL);

export default {
  development: {
    client: usePostgres ? "pg" : "mysql2",
    connection: usePostgres
      ? config.DATABASE_URL
      : {
          host: config.DB_HOST,
          user: config.DB_USER,
          password: config.DB_PASSWORD,
          database: config.DB_NAME,
          port: config.DB_PORT,
        },
    migrations: {
      directory: "./knex_data/migrations",
    },
    seeds: {
      directory: "./knex_data/seeds",
    },
  },
};
