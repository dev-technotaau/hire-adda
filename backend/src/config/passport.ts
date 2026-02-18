import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import logger from './logger';
import { env } from './env';
import { Role } from '@prisma/client';

// JWT Strategy
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, isEmailVerified: true },
      });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Local Strategy (email/password login)
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0].value;

          if (!email) {
            return done(new Error('No email found in Google profile'), false);
          }

          // Support role selection via session state (set during /auth/google initiation)
          const requestedRole = req.query?.state === 'EMPLOYER' ? Role.EMPLOYER : Role.CANDIDATE;

          // Upsert user: Update if exists (link googleId), create if not
          const user = await prisma.user.upsert({
            where: { email: email.toLowerCase() },
            update: {
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: true,
            },
            create: {
              email: email.toLowerCase(),
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              role: requestedRole,
              isEmailVerified: true,
            },
          });

          return done(null, user);
        } catch (error) {
          logger.error('Google Auth Error:', error);
          return done(error as Error, false);
        }
      }
    )
  );
}

// LinkedIn Strategy
if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        callbackURL: env.LINKEDIN_CALLBACK_URL,
        scope: ['r_emailaddress', 'r_liteprofile'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0].value;

          if (!email) {
            return done(new Error('No email found in LinkedIn profile'), false);
          }

          // LinkedIn state is random nonce; role is passed via separate mechanism
          // Default to CANDIDATE for LinkedIn (professional network = job seekers)
          const user = await prisma.user.upsert({
            where: { email: email.toLowerCase() },
            update: {
              linkedinId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: true,
            },
            create: {
              email: email.toLowerCase(),
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              linkedinId: profile.id,
              avatar: profile.photos?.[0]?.value,
              role: Role.CANDIDATE,
              isEmailVerified: true,
            },
          });

          return done(null, user);
        } catch (error) {
          logger.error('LinkedIn Auth Error:', error);
          return done(error, false);
        }
      }
    )
  );
}

export default passport;
