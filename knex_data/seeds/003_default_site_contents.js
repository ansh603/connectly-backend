import { randomUUID } from "node:crypto";

const CONTENTS = [
  {
    key: "about",
    title: "About Dost Now",
    html: `
      <h2>About Dost Now</h2>
      <p>Dost Now is a verified social booking marketplace for real social experiences.</p>
      <p>We keep things safe, structured, and escrow-protected from start to finish.</p>
    `,
  },
  {
    key: "how_it_works",
    title: "How It Works",
    html: `
      <h2>How Dost Now Works</h2>
      <p>Step-by-step guide — booking karna, request accept karna, aur cancel karna — sab kuch yahan hai.</p>
      <ol>
        <li><strong>Explore</strong>: Find verified profiles.</li>
        <li><strong>Book</strong>: Send a booking request.</li>
        <li><strong>Accept/Decline</strong>: Other user responds.</li>
        <li><strong>OTP Confirm</strong>: Meeting confirmed with OTP.</li>
        <li><strong>Escrow Release</strong>: Payment released after confirmation.</li>
      </ol>
    `,
  },
  {
    key: "privacy_policy",
    title: "Privacy Policy",
    html: `
      <h2>Privacy Policy</h2>
      <p>This is a sample privacy policy for development.</p>
      <p>We only collect the minimum required information to provide and improve the service.</p>
    `,
  },
  {
    key: "terms_of_service",
    title: "Terms of Service",
    html: `
      <h2>Terms of Service</h2>
      <p>This is a sample terms of service for development.</p>
      <p>By using the platform, you agree to follow community and safety guidelines.</p>
    `,
  },
  {
    key: "contact_us",
    title: "Contact Us",
    html: `
      <h2>Contact Us</h2>
      <p>Have a question or need help? Reach out using the form below.</p>
      <p>Email: support@dostnow.local</p>
    `,
  },
];

export async function seed(knex) {
  const hasTable = await knex.schema.hasTable("site_contents");
  if (!hasTable) return;

  for (const c of CONTENTS) {
    const existing = await knex("site_contents").where({ key: c.key }).first();
    if (existing) continue;

    await knex("site_contents").insert({
      id: randomUUID(),
      key: c.key,
      title: c.title,
      html_content: c.html,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  }
}

