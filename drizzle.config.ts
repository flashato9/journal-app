import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./services/database/schema/*.ts",
  out: "./services/database/migrations",
});
