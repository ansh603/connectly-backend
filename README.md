Product - Hombily

Migration -
npx knex migrate:latest
npx knex migrate:make <file_name>
npx knex migrate:up <file_name>
npx knex migrate:down <file_name>

Seeding - 
npx knex seed:run
npx knex seed:run --specific=filename.js


Access the API on browser - 
http://localhost:3000/documentation || https://${host_name}:${port_name}/documentation

## User profile (Bearer token)

- `GET /user/profile` — current user + city + interests + `availability`, `gallery_paths`, `rate`, `is_verified`
- `PATCH /user/profile` — at least one field; optional: `name`, `email`, `country_code`, `phone_number`, `bio`, `rate`, `location`, `city_id`, `age`, `profile_path`, `interest_ids`, `availability`, `gallery_paths` (array of paths)

Requires migration `20260320120000_add_user_profile_fields.js` for `gallery_paths` on `users`.
`selfie_path` / legacy OTP fields are removed by `20260323000000_drop_unused_users_columns.js`.
Availability is stored in `user_availability_slots` (migration `20260322000000_split_availability_drop_users_availability.js`).

## Email verification (users)

- Run migration `20260321120000_add_users_is_verified.js` for `users.is_verified`.
- In backend `.env`: `EMAIL` (sender Gmail), `PASSWORD` (Gmail app password; spaces optional, they are stripped). Legacy: `APP_PASSWORD` works too. Optional: `SMTP_FROM_NAME`, `REGISTRATION_OTP_EXPIRY_HOURS` (1–24, default 1).
- `POST /user/register` — saves the user with `is_verified=false`, emails a 6-digit OTP (default **1 hour** expiry via `REGISTRATION_OTP_EXPIRY_HOURS`).
- `POST /user/verify-email` — `{ email, otp_code }` → sets verified, returns `jwt_token`.
- `POST /user/resend-verification-otp` — `{ email, password }` for **unverified** accounts only.
- `POST /user/login` — if password is correct but email not verified: **403** with `needs_email_verification: true` (no JWT).


