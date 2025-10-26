import { Express, Request, Response } from 'express';
import { storage } from './storage';
import session from 'express-session';

// Test utilities - ONLY enabled in test/development environments
export function setupTestUtils(app: Express) {
  // Only enable in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Create authenticated session for testing
  app.post('/api/test/auth/session', async (req: Request, res: Response) => {
    try {
      const { sub, email, name, role } = req.body;

      // Create or update user
      await storage.upsertUser({
        id: sub,
        email: email || `test-${sub}@test.com`,
        name: name || 'Test User',
        profileImageUrl: null,
      });

      // Set role if specified
      if (role === 'admin') {
        await storage.updateUser(sub, { role: 'admin' });
      }

      // Create session - Passport expects just the user ID
      // serializeUser stores user.id, deserializeUser fetches the full user from database
      (req.session as any).passport = {
        user: sub  // Just the user ID, not the full OIDC claims object
      };

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });

      res.json({ success: true, userId: sub });
    } catch (error) {
      console.error('Test auth error:', error);
      res.status(500).json({ error: 'Failed to create test session' });
    }
  });

  // Create clinic (admin-only in production, unrestricted in test)
  app.post('/api/test/clinics', async (req: Request, res: Response) => {
    try {
      const clinic = await storage.createClinic(req.body);
      res.status(201).json(clinic);
    } catch (error) {
      console.error('Test clinic creation error:', error);
      res.status(500).json({ error: 'Failed to create test clinic' });
    }
  });

  // Assign staff to clinic
  app.post('/api/test/assign-staff', async (req: Request, res: Response) => {
    try {
      const { userId, clinicId } = req.body;
      await storage.updateUser(userId, { clinicId });
      res.json({ success: true });
    } catch (error) {
      console.error('Test staff assignment error:', error);
      res.status(500).json({ error: 'Failed to assign staff' });
    }
  });

  // Make user admin
  app.post('/api/test/make-admin', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      await storage.updateUser(userId, { role: 'admin' });
      res.json({ success: true });
    } catch (error) {
      console.error('Test admin assignment error:', error);
      res.status(500).json({ error: 'Failed to make user admin' });
    }
  });
}
