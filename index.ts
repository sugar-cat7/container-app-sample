import { Hono } from "hono";
import { Pool } from "pg";
import fs from "fs";
const app = new Hono();

const sslConfig = Bun.env.AZURE_POSTGRESQL_SSL
  ? {
      ca: fs.readFileSync("./DigiCertGlobalRootCA.crt.pem"),
    }
  : false;

const pool = new Pool({
  user: Bun.env.AZURE_POSTGRESQL_USER,
  host: Bun.env.AZURE_POSTGRESQL_HOST,
  database: Bun.env.AZURE_POSTGRESQL_DATABASE,
  password: Bun.env.AZURE_POSTGRESQL_PASSWORD,
  port: parseInt(Bun.env.AZURE_POSTGRESQL_PORT!, 10),
  ssl: sslConfig,
});

app.get("/", async (c) => {
  try {
    console.log("Connecting to database");
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT current_user;");
      const currentUser = result.rows.at(0).current_user;
      return c.json({ message: `Hello, ${currentUser}` }, 200);
    } finally {
      client.release();
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      return c.json({ error: err.message }, 500);
    }
    console.error("An unknown error occurred");
    return c.json({ error: "An unknown error occurred" }, 500);
  }
});

export default app;
