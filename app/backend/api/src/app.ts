import express, { type Application, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";
import { sessionMiddleware } from "./config/session.config";
import "./config/passport.config";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "success", message: "Welcome to argus API" });
});

app.use("/api/auth", authRoutes);

export default app;
