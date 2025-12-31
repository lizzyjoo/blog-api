import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db/prisma.js";

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this GitHub ID
        let user = await prisma.user.findUnique({
          where: { githubId: profile.id },
        });

        if (!user) {
          // Check if email already exists
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              // Link GitHub to existing account
              user = await prisma.user.update({
                where: { email },
                data: { githubId: profile.id },
              });
              return done(null, user);
            }
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              githubId: profile.id,
              username: profile.username || `github_${profile.id}`,
              email: email,
              first_name: profile.displayName?.split(" ")[0],
              last_name: profile.displayName?.split(" ").slice(1).join(" "),
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          // Check if email already exists
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              // Link Google to existing account
              user = await prisma.user.update({
                where: { email },
                data: { googleId: profile.id },
              });
              return done(null, user);
            }
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              username: email?.split("@")[0] || `google_${profile.id}`,
              email: email,
              first_name: profile.name?.givenName,
              last_name: profile.name?.familyName,
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
