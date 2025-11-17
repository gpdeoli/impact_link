import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all campaigns
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { clientId } = req.query;

    const where: any = {
      userId: req.userId
    };

    if (clientId) where.clientId = clientId as string;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true }
        },
        links: {
          include: {
            _count: {
              select: { clicks: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total clicks per campaign
    const campaignsWithStats = campaigns.map(campaign => {
      const totalClicks = campaign.links.reduce(
        (sum, link) => sum + link._count.clicks,
        0
      );
      return {
        ...campaign,
        totalClicks,
        linkCount: campaign.links.length
      };
    });

    res.json({ campaigns: campaignsWithStats });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        client: true,
        links: {
          include: {
            _count: {
              select: { clicks: true }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const totalClicks = campaign.links.reduce(
      (sum, link) => sum + link._count.clicks,
      0
    );

    res.json({
      campaign: {
        ...campaign,
        totalClicks,
        linkCount: campaign.links.length
      }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('clientId').optional().isString()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, startDate, endDate, clientId } = req.body;

      // Validate client belongs to user
      if (clientId) {
        const client = await prisma.client.findFirst({
          where: { id: clientId, userId: req.userId }
        });
        if (!client) {
          return res.status(404).json({ error: 'Client not found' });
        }
      }

      const campaign = await prisma.campaign.create({
        data: {
          name,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          userId: req.userId!,
          clientId: clientId || null
        },
        include: {
          client: true
        }
      });

      res.status(201).json({ campaign });
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// Update campaign
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const campaign = await prisma.campaign.findFirst({
        where: {
          id: req.params.id,
          userId: req.userId
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const updated = await prisma.campaign.update({
        where: { id: req.params.id },
        data: {
          name: req.body.name,
          description: req.body.description,
          startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
          endDate: req.body.endDate ? new Date(req.body.endDate) : null
        },
        include: {
          client: true
        }
      });

      res.json({ campaign: updated });
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
);

// Delete campaign
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await prisma.campaign.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;

