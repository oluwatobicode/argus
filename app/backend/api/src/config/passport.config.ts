import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { prisma } from "./db.config";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
      try {
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
        if (!user) {
          user = await prisma.user.findUnique({ where: { email: profile.emails?.[0]?.value || "" } });
          if (user) {
            user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id, avatarUrl: profile.photos?.[0]?.value } });
          } else {
            user = await prisma.user.create({
              data: {
                email: profile.emails?.[0]?.value || `${profile.id}@google-oauth.local`,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
                googleId: profile.id,
                emailVerified: true,
              },
            });
          }
        }
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL: "/api/auth/github/callback",
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
      try {
        let user = await prisma.user.findUnique({ where: { githubId: profile.id } });
        if (!user) {
          user = await prisma.user.findUnique({ where: { email: profile.emails?.[0]?.value || "" } });
          if (user) {
            user = await prisma.user.update({ where: { id: user.id }, data: { githubId: profile.id, avatarUrl: profile.photos?.[0]?.value } });
          } else {
            user = await prisma.user.create({
              data: {
                email: profile.emails?.[0]?.value || `${profile.id}@github-oauth.local`,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
                githubId: profile.id,
                emailVerified: true,
              },
            });
          }
        }
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    },
  ),
);

export default passport;
