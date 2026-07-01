import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";
import { sessionMiddleware } from "./config/session.config";
import "./config/passport.config";
import {
  authRoutes,
  projectsRoutes,
  issuesRoutes,
  eventsRoutes,
  performanceRoutes,
  alertsRoutes,
  billingRoutes,
  usageRoutes,
  ingestRoutes,
} from "./routes";

const API_PREFIX = "/api/v1";
const app: Application = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "success", message: "Welcome to argus API" });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/projects`, projectsRoutes);
app.use(`${API_PREFIX}/projects/:projectId/issues`, issuesRoutes);
app.use(`${API_PREFIX}/projects/:projectId/issues/:issueId/events`, eventsRoutes);
app.use(`${API_PREFIX}/projects/:projectId/performance`, performanceRoutes);
app.use(`${API_PREFIX}/projects/:projectId/alerts`, alertsRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/usage`, usageRoutes);
app.use(`${API_PREFIX}/ingest`, ingestRoutes);

export default app;
