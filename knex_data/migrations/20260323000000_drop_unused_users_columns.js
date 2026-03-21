export async function up(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) return;

  const maybeDrop = async (column) => {
    const exists = await knex.schema.hasColumn("users", column);
    if (!exists) return;
    await knex.schema.alterTable("users", (table) => {
      table.dropColumn(column);
    });
  };

  // Legacy/unused columns after refactors:
  // - OTP fields moved to `registration_otps`
  // - Availability moved to `user_availability_slots`
  // - Interests moved to `user_interests`
  // - Selfie removed from verification flow
  await Promise.all([
    maybeDrop("otp"),
    maybeDrop("expiry_time"),
    maybeDrop("is_completed"),
    maybeDrop("status"),
    maybeDrop("interests"),
    maybeDrop("selfie_path"),
  ]);
}

export async function down(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) return;

  const maybeAdd = async (column, callback) => {
    const exists = await knex.schema.hasColumn("users", column);
    if (exists) return;
    await knex.schema.alterTable("users", callback);
  };

  await maybeAdd("otp", (table) => {
    table.string("otp", 20).nullable();
  });

  await maybeAdd("expiry_time", (table) => {
    table.string("expiry_time", 255).nullable();
  });

  await maybeAdd("is_completed", (table) => {
    table.boolean("is_completed").notNullable().defaultTo(false);
  });

  await maybeAdd("status", (table) => {
    table.enu("status", ["active", "inactive", "deleted"]).nullable().defaultTo("active");
  });

  await maybeAdd("interests", (table) => {
    table.text("interests").nullable();
  });

  await maybeAdd("selfie_path", (table) => {
    table.string("selfie_path", 255).nullable();
  });
}

