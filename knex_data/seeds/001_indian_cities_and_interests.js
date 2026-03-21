import { randomUUID } from "node:crypto";

/** Major Indian cities (unique names for `cities.name` unique constraint). */
const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Amritsar",
  "Navi Mumbai",
  "Prayagraj",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Chandigarh",
  "Guwahati",
  "Mysuru",
  "Tiruchirappalli",
  "Bhubaneswar",
  "Kochi",
  "Dehradun",
  "Noida",
  "Jamshedpur",
  "Mangaluru",
  "Udaipur",
  "Gurgaon",
];

/** Matches frontend `INTERESTS` in dostnow-website + common extras. */
const INTEREST_NAMES = [
  "Coffee",
  "Cricket",
  "Movies",
  "Clubbing",
  "Networking",
  "Birthday Events",
  "Wedding Functions",
  "Travel",
  "Gym",
  "Gaming",
  "Seminar",
  "Festival Celebrations",
  "Music",
  "Food & Dining",
  "Photography",
  "Yoga & Wellness",
  "Startup & Tech",
];

async function insertIfMissing(knex, table, name) {
  const existing = await knex(table).where({ name }).first();
  if (existing) return;

  // Keep inserts compatible with older schemas (icon_path added later).
  const hasIconPath = await knex.schema.hasColumn(table, "icon_path");
  const baseRow = {
    id: randomUUID(),
    name,
    status: "active",
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  };

  await knex(table).insert({
    ...baseRow,
    ...(hasIconPath ? { icon_path: null } : {}),
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  for (const name of INDIAN_CITIES) {
    await insertIfMissing(knex, "cities", name);
  }
  for (const name of INTEREST_NAMES) {
    await insertIfMissing(knex, "interests", name);
  }
}
