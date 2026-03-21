export async function up(knex) {
  const hasTable = await knex.schema.hasTable("bookings");
  if (hasTable) return;

  await knex.schema.createTable("bookings", (table) => {
    table.uuid("id").primary();
    table.uuid("booker_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("provider_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.string("status", 20).notNullable().defaultTo("pending");
    // pending | confirmed | completed | cancelled

    table.date("booking_date").notNullable();
    table.string("time_start", 10).notNullable(); // e.g. "06:00"
    table.string("time_end", 10).notNullable();   // e.g. "08:00"
    table.decimal("amount", 18, 2).notNullable();
    table.decimal("duration_hours", 10, 2).notNullable();

    table.string("location", 255).nullable();
    table.text("purpose").nullable();

    table.string("escrow_reference_id", 100).nullable();
    table.string("meeting_otp", 10).nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("bookings", (table) => {
    table.index(["provider_id", "booking_date", "status"]);
    table.index(["booker_id", "status"]);
  });
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable("bookings");
  if (!hasTable) return;
  await knex.schema.dropTable("bookings");
}
