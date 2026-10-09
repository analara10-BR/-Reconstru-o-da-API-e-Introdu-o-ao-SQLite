import "dotenv/config";
import { app, db } from "./app.js";

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Biblioteca Aurora disponível em http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
