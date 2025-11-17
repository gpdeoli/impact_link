import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateShortCode } from '../utils/shortCode';

const router = express.Router();
const prisma = new PrismaClient();

// Get all links for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { clientId, campaignId, linkType, tag } = req.query;

    const where: any = {
      userId: req.userId
    };

    if (clientId) where.clientId = clientId as string;
    if (campaignId) where.campaignId = campaignId as string;
    if (linkType) where.linkType = linkType;
    if (tag) where.tags = { has: tag as string };

    const links = await prisma.link.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true }
        },
        campaign: {
          select: { id: true, name: true }
        },
        _count: {
          select: { clicks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ links });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Get single link
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const link = await prisma.link.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        client: true,
        campaign: true,
        _count: {
          select: { clicks: true }
        }
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link });
  } catch (error) {
    console.error('Get link error:', error);
    res.status(500).json({ error: 'Failed to fetch link' });
  }
});

// Create link
router.post(
  '/',
  authenticate,
  [
    body('originalUrl').isURL(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('linkType').optional().isIn(['BIO', 'STORY', 'DIRECT', 'CAMPANHA', 'PRODUTO', 'OTHER']),
    body('tags').optional().isArray(),
    body('clientId').optional().isString(),
    body('campaignId').optional().isString(),
    body('expiresAt').optional().isISO8601()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        originalUrl,
        title,
        description,
        linkType = 'OTHER',
        tags = [],
        clientId,
        campaignId,
        expiresAt,
        shortCode: customShortCode
      } = req.body;

      // Validate client and campaign belong to user
      if (clientId) {
        const client = await prisma.client.findFirst({
          where: { id: clientId, userId: req.userId }
        });
        if (!client) {
          return res.status(404).json({ error: 'Client not found' });
        }
      }

      if (campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: { id: campaignId, userId: req.userId }
        });
        if (!campaign) {
          return res.status(404).json({ error: 'Campaign not found' });
        }
      }

      // Generate short code
      let shortCode = customShortCode;
      if (!shortCode) {
        shortCode = await generateShortCode(prisma);
      } else {
        // Check if custom code is available
        const existing = await prisma.link.findUnique({
          where: { shortCode }
        });
        if (existing) {
          return res.status(400).json({ error: 'Short code already in use' });
        }
      }

      const link = await prisma.link.create({
        data: {
          shortCode,
          originalUrl,
          title,
          description,
          linkType,
          tags,
          userId: req.userId!,
          clientId: clientId || null,
          campaignId: campaignId || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        },
        include: {
          client: true,
          campaign: true
        }
      });

      const linkDomain = process.env.LINK_DOMAIN || 'localhost:3001';
      const fullShortUrl = `https://${linkDomain}/${link.shortCode}`;

      res.status(201).json({
        link: {
          ...link,
          shortUrl: fullShortUrl
        }
      });
    } catch (error) {
      console.error('Create link error:', error);
      res.status(500).json({ error: 'Failed to create link' });
    }
  }
);

// Update link
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('linkType').optional().isIn(['BIO', 'STORY', 'DIRECT', 'CAMPANHA', 'PRODUTO', 'OTHER']),
    body('tags').optional().isArray(),
    body('isActive').optional().isBoolean(),
    body('expiresAt').optional().isISO8601()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const link = await prisma.link.findFirst({
        where: {
          id: req.params.id,
          userId: req.userId
        }
      });

      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      const updated = await prisma.link.update({
        where: { id: req.params.id },
        data: {
          title: req.body.title,
          description: req.body.description,
          linkType: req.body.linkType,
          tags: req.body.tags,
          isActive: req.body.isActive,
          expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
        },
        include: {
          client: true,
          campaign: true
        }
      });

      res.json({ link: updated });
    } catch (error) {
      console.error('Update link error:', error);
      res.status(500).json({ error: 'Failed to update link' });
    }
  }
);

// Delete link
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const link = await prisma.link.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await prisma.link.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;

