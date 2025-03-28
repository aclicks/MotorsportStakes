import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // Verificação se a senha armazenada está no formato correto
  if (!stored || !stored.includes('.')) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const cookieMaxAge = 1000 * 60 * 60 * 24 * 7; // 1 week
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "motorsport-stakes-secret",
    resave: false,
    saveUninitialized: false, // Only save if we have data
    store: storage.sessionStore,
    rolling: true, // Reset cookie expiration on every response
    cookie: {
      secure: !isDevelopment, // Only use secure in production
      httpOnly: true, // Prevent client-side JS from reading cookie
      maxAge: cookieMaxAge,
      sameSite: "lax" // Good balance between security and usability
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/api/auth/google/callback",
        proxy: true,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Try to find user with Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (!user) {
            // Try to find user with the email from Google
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await storage.getUserByEmail(email);
            }
            
            if (user) {
              // Update existing user with Google ID
              user = await storage.updateUser(user.id, { googleId: profile.id });
            } else {
              // Create new user
              const randomPassword = randomBytes(16).toString("hex");
              user = await storage.createUser({
                username: profile.displayName.replace(/\s+/g, "_").toLowerCase() || `google_${profile.id}`,
                email: email || "",
                password: await hashPassword(randomPassword),
                googleId: profile.id,
              });
              
              // Criar dois times para o usuário do Google
              try {
                // Time 1 com 1000 créditos iniciais
                await storage.createUserTeam({
                  userId: user.id,
                  name: "Equipe Principal",
                  initialCredits: 1000,
                  currentCredits: 1000,
                  driver1Id: null,
                  driver2Id: null,
                  engineId: null,
                  teamId: null
                });
                
                // Time 2 com 700 créditos iniciais
                await storage.createUserTeam({
                  userId: user.id,
                  name: "Equipe Secundária",
                  initialCredits: 700,
                  currentCredits: 700,
                  driver1Id: null,
                  driver2Id: null,
                  engineId: null,
                  teamId: null
                });
              } catch (teamError: any) {
                console.error("Erro ao criar times para o usuário Google:", teamError);
                // Continuamos mesmo se falhar a criação dos times
              }
            }
          }
          
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // User not found in database, handle gracefully by clearing session
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      // Return false instead of the error to prevent crashes
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // Criar dois times para o usuário
      try {
        // Time 1 com 1000 créditos iniciais
        await storage.createUserTeam({
          userId: user.id,
          name: "Equipe Principal",
          initialCredits: 1000,
          currentCredits: 1000,
          driver1Id: null,
          driver2Id: null,
          engineId: null,
          teamId: null
        });
        
        // Time 2 com 700 créditos iniciais
        await storage.createUserTeam({
          userId: user.id,
          name: "Equipe Secundária",
          initialCredits: 700,
          currentCredits: 700,
          driver1Id: null,
          driver2Id: null,
          engineId: null,
          teamId: null
        });
      } catch (teamError: any) {
        console.error("Erro ao criar times para o usuário:", teamError);
        // Continuamos mesmo se falhar a criação dos times
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err: any) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });
  
  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google"));
  
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/auth",
    })
  );
}