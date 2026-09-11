const fs = require("fs");
const path = require("path");

// Load .env if present
try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch {}

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
if (fs.existsSync(schemaPath)) {
  const content = fs.readFileSync(schemaPath, "utf8");
  const dbUrl = process.env.DATABASE_URL || "";
  const isPostgres =
    dbUrl.startsWith("postgresql:") || dbUrl.startsWith("postgres:");
  const targetProvider = isPostgres ? "postgresql" : "sqlite";

  const updated = content.replace(
    /provider\s*=\s*"(sqlite|postgresql)"/,
    `provider = "${targetProvider}"`
  );

  if (content !== updated) {
    fs.writeFileSync(schemaPath, updated, "utf8");
    console.log(
      `[sync-prisma-provider] Switched Prisma provider to "${targetProvider}"`
    );
  }
}
