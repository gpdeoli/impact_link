import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, clientId, campaignId, linkId } = req.query;

    const where: any = {
      userId: req.userId
    };

    // Apenas permitir filtro por cliente se o usuário for AGENCY
    if (clientId) {
      if (req.userPlan !== 'AGENCY') {
        return res.status(403).json({ error: 'Apenas contas do tipo AGENCY podem filtrar por cliente' });
      }
      where.clientId = clientId as string;
    }
    if (campaignId) where.campaignId = campaignId as string;
    if (linkId) where.id = linkId as string;

    // Get date range
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all links
    const links = await prisma.link.findMany({
      where,
      include: {
        clicks: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        client: {
          select: { id: true, name: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      }
    });

    // Calculate metrics
    const totalClicks = links.reduce((sum, link) => sum + link.clicks.length, 0);
    const totalLinks = links.length;
    const activeLinks = links.filter(link => link.isActive).length;

    // Get clicks by link type
    const clicksByType = links.reduce((acc, link) => {
      const type = link.linkType;
      const count = link.clicks.length;
      acc[type] = (acc[type] || 0) + count;
      return acc;
    }, {} as Record<string, number>);

    // Get top links
    const topLinks = links
      .map(link => ({
        id: link.id,
        shortCode: link.shortCode,
        title: link.title || link.originalUrl,
        clicks: link.clicks.length,
        linkType: link.linkType,
        client: link.client?.name,
        campaign: link.campaign?.name
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Build where clause for clicks (filter by link's clientId, campaignId, or linkId)
    const clickWhere: any = {
      userId: req.userId,
      createdAt: {
        gte: start,
        lte: end
      }
    };

    // If filtering by linkId, filter directly
    if (linkId) {
      clickWhere.linkId = linkId as string;
    } 
    // If filtering by clientId or campaignId, filter clicks through links
    else if (clientId || campaignId) {
      const linkWhere: any = {
        userId: req.userId
      };
      if (clientId) linkWhere.clientId = clientId as string;
      if (campaignId) linkWhere.campaignId = campaignId as string;
      
      const filteredLinks = await prisma.link.findMany({
        where: linkWhere,
        select: { id: true }
      });
      
      if (filteredLinks.length > 0) {
        clickWhere.linkId = {
          in: filteredLinks.map(link => link.id)
        };
      } else {
        // Se não há links que correspondem aos filtros, retornar dados vazios
        clickWhere.linkId = {
          in: []
        };
      }
    }

    // Get clicks over time (daily)
    const clicksOverTime = await prisma.click.findMany({
      where: clickWhere,
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by day
    const dailyClicks = clicksOverTime.reduce((acc, click) => {
      const date = click.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get clicks by device
    const clicksByDevice = await prisma.click.groupBy({
      by: ['device'],
      where: clickWhere,
      _count: true
    });

    // Get clicks by referrer (top sources)
    const clicksByReferrer = await prisma.click.groupBy({
      by: ['referrer'],
      where: {
        ...clickWhere,
        referrer: {
          not: null
        }
      },
      _count: true,
      orderBy: {
        _count: {
          referrer: 'desc'
        }
      },
      take: 10
    });

    // Get clicks by country for heatmap
    const clicksByCountry = await prisma.click.groupBy({
      by: ['country'],
      where: {
        ...clickWhere,
        country: {
          not: null
        }
      },
      _count: true
    });

    // Calculate insights
    const previousPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    
    // Build where clause for previous period (same filters as current period)
    const previousPeriodClickWhere: any = {
      userId: req.userId,
      createdAt: {
        gte: previousPeriodStart,
        lt: start
      }
    };
    
    // Apply same filters to previous period
    if (linkId) {
      previousPeriodClickWhere.linkId = linkId as string;
    } else if (clientId || campaignId) {
      const linkWhere: any = {
        userId: req.userId
      };
      if (clientId) linkWhere.clientId = clientId as string;
      if (campaignId) linkWhere.campaignId = campaignId as string;
      
      const filteredLinks = await prisma.link.findMany({
        where: linkWhere,
        select: { id: true }
      });
      
      if (filteredLinks.length > 0) {
        previousPeriodClickWhere.linkId = {
          in: filteredLinks.map(link => link.id)
        };
      } else {
        previousPeriodClickWhere.linkId = {
          in: []
        };
      }
    }
    
    const previousPeriodClicks = await prisma.click.count({
      where: previousPeriodClickWhere
    });

    const clickGrowth = previousPeriodClicks > 0
      ? ((totalClicks - previousPeriodClicks) / previousPeriodClicks) * 100
      : 0;

    const insights = [];
    if (clickGrowth > 0) {
      insights.push({
        type: 'growth',
        message: `Tráfego aumentou ${clickGrowth.toFixed(1)}% em relação ao período anterior`
      });
    }

    // Find top performing link type
    const topType = Object.entries(clicksByType).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
      const typeLabels: Record<string, string> = {
        BIO: 'links de bio',
        STORY: 'stories',
        DIRECT: 'mensagens diretas',
        CAMPANHA: 'campanhas',
        PRODUTO: 'produtos',
        OTHER: 'outros links'
      };
      insights.push({
        type: 'top_performer',
        message: `${typeLabels[topType[0]] || topType[0]} geraram ${topType[1]} cliques`
      });
    }

    const responseData = {
      overview: {
        totalClicks,
        totalLinks,
        activeLinks,
        clickGrowth: clickGrowth.toFixed(1)
      },
      clicksByType: clicksByType || {},
      clicksByDevice: clicksByDevice.map(item => ({
        device: item.device || 'Unknown',
        count: item._count
      })),
      topReferrers: clicksByReferrer.map(item => ({
        referrer: item.referrer || 'Direct',
        count: item._count
      })),
      clicksByCountry: clicksByCountry.reduce((acc, item) => {
        if (item.country) {
          acc[item.country] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      topLinks: topLinks || [],
      dailyClicks: dailyClicks || {},
      insights: insights || []
    };

    // Debug log
    console.log('Analytics response data:', {
      dailyClicks: Object.keys(responseData.dailyClicks).length,
      clicksByDevice: responseData.clicksByDevice.length,
      topReferrers: responseData.topReferrers.length,
      clicksByCountry: Object.keys(responseData.clicksByCountry).length
    });

    res.json(responseData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get link analytics
router.get('/links/:linkId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { linkId } = req.params;
    const { startDate, endDate } = req.query;

    const link = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId: req.userId
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const clicks = await prisma.click.findMany({
      where: {
        linkId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by day
    const dailyClicks = clicks.reduce((acc, click) => {
      const date = click.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by device
    const byDevice = clicks.reduce((acc, click) => {
      const device = click.device || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by referrer
    const byReferrer = clicks.reduce((acc, click) => {
      const referrer = click.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      link: {
        id: link.id,
        shortCode: link.shortCode,
        title: link.title,
        originalUrl: link.originalUrl
      },
      totalClicks: clicks.length,
      dailyClicks,
      byDevice,
      byReferrer,
      clicks: clicks.slice(0, 100) // Last 100 clicks
    });
  } catch (error) {
    console.error('Link analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch link analytics' });
  }
});

export default router;

