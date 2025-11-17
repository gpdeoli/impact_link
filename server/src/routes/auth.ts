import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('plan').optional().isIn(['SOLO', 'AGENCY'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, plan = 'SOLO', agencyId } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          plan: plan as 'SOLO' | 'AGENCY',
          agencyId: agencyId || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      });

      // Create agency if plan is AGENCY
      if (plan === 'AGENCY') {
        await prisma.agency.create({
          data: {
            name: `${name}'s Agency`,
            ownerId: user.id
          }
        });
      }

      // Generate JWT
      const token = generateToken(user.id, user.plan);

      res.status(201).json({
        user,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = generateToken(user.id, user.plan);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        agencyId: true,
        createdAt: true,
        agency: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

function generateToken(userId: string, plan: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, plan },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export default router;

