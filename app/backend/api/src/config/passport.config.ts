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

//  Google Strategy 

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // 1. Try to find an existing GOOGLE Account for this profile id
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "GOOGLE",
              providerAccountId: profile.id,
            },
          },
          include: { user: true },
        });

        if (existingAccount) {
          // Refresh tokens and return the linked user
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: { accessToken, refreshToken },
          });
          return done(null, existingAccount.user);
        }

        // 2. No Google account yet — check if user exists by email (account linking)
        const existingUser = email
          ? await prisma.user.findUnique({ where: { email } })
          : null;

        if (existingUser) {
          // Link Google account to the existing user
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              provider: "GOOGLE",
              providerAccountId: profile.id,
              accessToken,
              refreshToken,
            },
          });
          return done(null, existingUser);
        }

        // 3. Brand new user — create User + Account together
        const newUser = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            emailVerified: true,
            accounts: {
              create: {
                provider: "GOOGLE",
                providerAccountId: profile.id,
                accessToken,
                refreshToken,
              },
            },
          },
        });

        return done(null, newUser);
      } catch (err) {
        done(err as Error);
      }
    },
  ),
);

//  GitHub Strategy 

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL: "/api/auth/github/callback",
    },
    async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
      try {
        const email = profile.emails?.[0]?.value;

        // 1. Try to find an existing GITHUB Account for this profile id
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "GITHUB",
              providerAccountId: profile.id,
            },
          },
          include: { user: true },
        });

        if (existingAccount) {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: { accessToken, refreshToken },
          });
          return done(null, existingAccount.user);
        }

        // 2. No GitHub account yet — check if user exists by email (account linking)
        const existingUser = email
          ? await prisma.user.findUnique({ where: { email } })
          : null;

        if (existingUser) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              provider: "GITHUB",
              providerAccountId: profile.id,
              accessToken,
              refreshToken,
            },
          });
          return done(null, existingUser);
        }

        // 3. Brand new user — create User + Account together
        const newUser = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            emailVerified: true,
            accounts: {
              create: {
                provider: "GITHUB",
                providerAccountId: profile.id,
                accessToken,
                refreshToken,
              },
            },
          },
        });

        return done(null, newUser);
      } catch (err) {
        done(err as Error);
      }
    },
  ),
);

export default passport;
