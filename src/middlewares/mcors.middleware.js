import cors from "cors";

// Middleware para CORS
export const mcors = cors({
  origin: "http://localhost:5000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
