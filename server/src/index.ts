import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth';
import linkRoutes from './routes/links';
import analyticsRoutes from './routes/analytics';
import campaignRoutes from './routes/campaigns';
import clientRoutes from './routes/clients';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);

// Link redirect handler (must be after other routes)
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const link = await prisma.link.findUnique({
      where: { shortCode },
      include: { user: true }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (!link.isActive) {
      return res.status(410).json({ error: 'Link is inactive' });
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    // Track the click
    const trackingData = extractTrackingData(req);
    
    await prisma.click.create({
      data: {
        linkId: link.id,
        userId: link.userId,
        ...trackingData
      }
    });

    // Redirect to original URL
    res.redirect(link.originalUrl);
  } catch (error) {
    console.error('Error redirecting link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to extract tracking data from request
function extractTrackingData(req: express.Request) {
  const userAgent = req.get('user-agent') || '';
  const referrer = req.get('referer') || req.get('referrer') || null;
  const ip = req.ip || req.socket.remoteAddress || null;

  // Parse user agent (simplified - in production, use ua-parser-js)
  const device = userAgent.includes('Mobile') ? 'mobile' : 
                 userAgent.includes('Tablet') ? 'tablet' : 'desktop';
  
  const browser = extractBrowser(userAgent);
  const os = extractOS(userAgent);

  return {
    referrer,
    userAgent,
    device,
    browser,
    os,
    ip
  };
}

function extractBrowser(ua: string): string {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function extractOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

