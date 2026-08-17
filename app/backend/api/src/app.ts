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
import { errorHandler } from "./middlewares/error.middleware";
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
  organizationsRoutes,
  adminRoutes,
} from "./routes";

const API_PREFIX = "/api/v1";
const app: Application = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request).rawBody = buf;
    },
  }),
);
/*
 * Two CORS policies, split by route:
 *  - /api/v1/ingest — open to EVERY origin. SDK events arrive from arbitrary
 *    customer sites; auth is the DSN public key, not cookies, so `*` is safe
 *    (and `*` is incompatible with credentials by spec anyway).
 *  - everything else — the dashboard only, with session-cookie credentials.
 * The dashboard policy must SKIP ingest: cors() with a string origin always
 * stamps that origin, so running both would overwrite the `*` on the POST.
 */
app.use("/api/v1/ingest", cors());

const dashboardCors = cors({
  origin:
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://www.arguserror.xyz"
      : "http://localhost:5173"),
  credentials: true,
});
app.use((req, res, next) =>
  req.path.startsWith("/api/v1/ingest")
    ? next()
    : dashboardCors(req, res, next),
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
app.use(
  `${API_PREFIX}/projects/:projectId/issues/:issueId/events`,
  eventsRoutes,
);
app.use(`${API_PREFIX}/projects/:projectId/performance`, performanceRoutes);
app.use(`${API_PREFIX}/projects/:projectId/alerts`, alertsRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/usage`, usageRoutes);
app.use(`${API_PREFIX}/organizations`, organizationsRoutes);
app.use(`${API_PREFIX}/ingest`, ingestRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

app.use(errorHandler);

export default app;
