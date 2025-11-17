import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all clients
router.get('/', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    // Verificar se o usuário é AGENCY
    if (req.userPlan !== 'AGENCY') {
      return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem acessar clientes' });
    }

    const { page, limit } = req.query;

    const where: any = {
      userId: req.userId
    };

    // Paginação
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Contar total de clientes
    const total = await prisma.client.count({ where });

    // Buscar clientes com paginação
    const clients = await prisma.client.findMany({
      where,
      include: {
        links: {
          include: {
            _count: {
              select: { clicks: true }
            }
          }
        },
        campaigns: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });

    // Calculate stats per client
    const clientsWithStats = clients.map(client => {
      const totalClicks = client.links.reduce(
        (sum, link) => sum + link._count.clicks,
        0
      );
      return {
        ...client,
        totalClicks,
        linkCount: client.links.length,
        campaignCount: client.campaigns.length
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    res.json({ 
      clients: clientsWithStats,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
        hasNext: pageNumber < totalPages,
        hasPrev: pageNumber > 1
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client
router.get('/:id', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    // Verificar se o usuário é AGENCY
    if (req.userPlan !== 'AGENCY') {
      return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem acessar clientes' });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        links: {
          include: {
            _count: {
              select: { clicks: true }
            }
          }
        },
        campaigns: {
          include: {
            links: {
              include: {
                _count: {
                  select: { clicks: true }
                }
              }
            }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const totalClicks = client.links.reduce(
      (sum, link) => sum + link._count.clicks,
      0
    );

    res.json({
      client: {
        ...client,
        totalClicks,
        linkCount: client.links.length,
        campaignCount: client.campaigns.length
      }
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('tags').optional().isArray()
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      // Verificar se o usuário é AGENCY
      if (req.userPlan !== 'AGENCY') {
        return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem criar clientes' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, agencyId, tags = [] } = req.body;

      // If user is in an agency, use agency's ID
      let finalAgencyId = agencyId;
      if (req.userPlan === 'AGENCY') {
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          include: { agency: true }
        });
        if (user?.agency) {
          finalAgencyId = user.agency.id;
        }
      }

      const client = await prisma.client.create({
        data: {
          name,
          email: email || null,
          tags: tags || [],
          userId: req.userId!,
          agencyId: finalAgencyId || null
        }
      });

      res.status(201).json({ client });
    } catch (error) {
      console.error('Create client error:', error);
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
);

// Update client
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('tags').optional().isArray()
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      // Verificar se o usuário é AGENCY
      if (req.userPlan !== 'AGENCY') {
        return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem editar clientes' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const client = await prisma.client.findFirst({
        where: {
          id: req.params.id,
          userId: req.userId
        }
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const updated = await prisma.client.update({
        where: { id: req.params.id },
        data: {
          name: req.body.name,
          email: req.body.email,
          tags: req.body.tags !== undefined ? req.body.tags : undefined
        }
      });

      res.json({ client: updated });
    } catch (error) {
      console.error('Update client error:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  }
);

// Delete client
router.delete('/:id', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    // Verificar se o usuário é AGENCY
    if (req.userPlan !== 'AGENCY') {
      return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem excluir clientes' });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;

