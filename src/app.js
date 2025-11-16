import express from "express";
import cors from "cors";
import indexRoutes from "./routes/index.js";
import { authenticate, authorize } from "./middleware/authMiddleware.js";
import { swaggerUi, swaggerSpec } from "./config/swaggerConfig.js";


export const app = express();
app.use(cors());
app.use(express.json());

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//  Health check
app.get("/", (req, res) => res.send("Backend  is running gracefully"));
app.use("/api", indexRoutes);
export default app

