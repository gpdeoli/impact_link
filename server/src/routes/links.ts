import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateShortCode } from '../utils/shortCode';

const router = express.Router();
const prisma = new PrismaClient();

// Get all links for user
router.get('/', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { clientId, campaignId, linkType, tag, page, limit } = req.query;

    const where: any = {
      userId: req.userId
    };

    if (clientId) where.clientId = clientId as string;
    if (campaignId) where.campaignId = campaignId as string;
    if (linkType) where.linkType = linkType;
    if (tag) where.tags = { has: tag as string };

    // Paginação
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Contar total de links
    const total = await prisma.link.count({ where });

    // Buscar links com paginação
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });

    const totalPages = Math.ceil(total / pageSize);

    res.json({ 
      links,
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
    body('originalUrl')
      .isURL({ require_protocol: true, require_valid_protocol: true })
      .withMessage('URL deve ser válida e incluir protocolo (http:// ou https://)'),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('linkType').optional().isIn(['BIO', 'STORY', 'DIRECT', 'CAMPANHA', 'PRODUTO', 'OTHER']),
    body('tags').optional().isArray(),
    body('clientId').optional().isString(),
    body('campaignId').optional().isString(),
    body('expiresAt').optional().isISO8601()
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ 
          error: 'Erro de validação',
          errors: errors.array() 
        });
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

      console.log('Creating link with data:', {
        originalUrl,
        title,
        linkType,
        userId: req.userId
      });

            // Validate client and campaign belong to user
            if (clientId) {
              // Verificar se o usuário é AGENCY
              if (req.userPlan !== 'AGENCY') {
                return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem associar clientes a links' });
              }
              
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

      // Preparar dados para criação - tratar campos opcionais
      const linkData: any = {
        shortCode,
        originalUrl,
        linkType,
        tags: tags || [],
        userId: req.userId!,
        clientId: clientId || null,
        campaignId: campaignId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };

      // Adicionar campos opcionais apenas se não estiverem vazios
      if (title && title.trim()) {
        linkData.title = title.trim();
      }
      if (description && description.trim()) {
        linkData.description = description.trim();
      }

      console.log('Link data to create:', linkData);

      const link = await prisma.link.create({
        data: linkData,
        include: {
          client: true,
          campaign: true
        }
      });

      const linkDomain = process.env.NEXT_PUBLIC_API_URL || 'htpp://localhost:3001';
      const fullShortUrl = `${linkDomain}/${link.shortCode}`;

      res.status(201).json({
        link: {
          ...link,
          shortUrl: fullShortUrl
        }
      });
    } catch (error: any) {
      console.error('Create link error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      
      // Retornar mensagem de erro mais específica
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: 'Já existe um link com este código curto' 
        });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to create link',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
  async (req: AuthRequest, res: express.Response) => {
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

      // Verificar se está tentando associar cliente e se é AGENCY
      if (req.body.clientId !== undefined) {
        if (req.body.clientId) {
          // Verificar se o usuário é AGENCY
          if (req.userPlan !== 'AGENCY') {
            return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem associar clientes a links' });
          }
          
          const client = await prisma.client.findFirst({
            where: { id: req.body.clientId, userId: req.userId }
          });
          if (!client) {
            return res.status(404).json({ error: 'Client not found' });
          }
        }
      }

      const updateData: any = {
        title: req.body.title,
        description: req.body.description,
        linkType: req.body.linkType,
        tags: req.body.tags,
        isActive: req.body.isActive,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
      };

      // Apenas atualizar clientId se fornecido e usuário for AGENCY
      if (req.body.clientId !== undefined) {
        updateData.clientId = req.body.clientId || null;
      }

      const updated = await prisma.link.update({
        where: { id: req.params.id },
        data: updateData,
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
router.delete('/:id', authenticate, async (req: AuthRequest, res: express.Response) => {
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

    // Deletar todos os cliques associados ao link primeiro
    await prisma.click.deleteMany({
      where: { linkId: req.params.id }
    });

    // Agora deletar o link
    await prisma.link.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Link deleted successfully' });
  } catch (error: any) {
    console.error('Delete link error:', error);
    
    // Se for erro de constraint, dar mensagem mais específica
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Não foi possível excluir o link. Tente novamente.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;

