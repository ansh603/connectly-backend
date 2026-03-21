import dotenv from 'dotenv';

dotenv.config();

const config = {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
    PORT: process.env.PORT || 3000,
    /** PostgreSQL connection string (e.g. Neon). Takes precedence over DB_* when set. */
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL: process.env.EMAIL,
    MAIL_PASSWORD: process.env.APP_PASSWORD || "",
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "Dost Now",
    REGISTRATION_OTP_EXPIRY_HOURS: Math.min(
        24,
        Math.max(1, Number(process.env.REGISTRATION_OTP_EXPIRY_HOURS) || 1)
    ),
    ROUTE_PREFIX: process.env.ROUTE_PREFIX
}

export default config;