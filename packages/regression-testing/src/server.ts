import { start } from "./index";

const PORT = parseInt(process.env.PORT || "9877", 10);

try {
  await start(PORT);
  console.log(`Regression server listening on http://localhost:${PORT}`);
} catch (err) {
  console.error("Failed to start regression server:", err);
  process.exit(1);
}
