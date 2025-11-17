import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';

const router = express.Router();
const prisma = new PrismaClient();

// Generate PDF report
router.get('/pdf', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, clientId, campaignId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      userId: req.userId
    };

    if (clientId) where.clientId = clientId as string;
    if (campaignId) where.campaignId = campaignId as string;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true }
    });

    // Get links and clicks
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
        client: true,
        campaign: true
      }
    });

    const totalClicks = links.reduce((sum, link) => sum + link.clicks.length, 0);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-impacto-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(20).text('Relatório de Impacto', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Período: ${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown();

    if (user) {
      doc.fontSize(10).text(`Gerado por: ${user.name}`, { align: 'center' });
      doc.moveDown(2);
    }

    // Summary
    doc.fontSize(16).text('Resumo', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total de Links: ${links.length}`);
    doc.text(`Total de Cliques: ${totalClicks}`);
    doc.text(`Links Ativos: ${links.filter(l => l.isActive).length}`);
    doc.moveDown(2);

    // Top Links
    doc.fontSize(16).text('Top 10 Links', { underline: true });
    doc.moveDown();

    const topLinks = links
      .map(link => ({
        title: link.title || link.originalUrl.substring(0, 50),
        clicks: link.clicks.length,
        type: link.linkType
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    topLinks.forEach((link, index) => {
      doc.fontSize(10).text(`${index + 1}. ${link.title} - ${link.clicks} cliques (${link.type})`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Generate CSV report
router.get('/csv', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, clientId, campaignId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      userId: req.userId
    };

    if (clientId) where.clientId = clientId as string;
    if (campaignId) where.campaignId = campaignId as string;

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
        client: true,
        campaign: true
      }
    });

    // Generate CSV
    const csvRows = [
      ['Link', 'Título', 'Tipo', 'Cliente', 'Campanha', 'Cliques', 'URL Original'].join(',')
    ];

    links.forEach(link => {
      csvRows.push([
        link.shortCode,
        `"${(link.title || '').replace(/"/g, '""')}"`,
        link.linkType,
        `"${(link.client?.name || '').replace(/"/g, '""')}"`,
        `"${(link.campaign?.name || '').replace(/"/g, '""')}"`,
        link.clicks.length.toString(),
        `"${link.originalUrl.replace(/"/g, '""')}"`
      ].join(','));
    });

    const csv = csvRows.join('\n');
    const csvBuffer = Buffer.from(csv, 'utf-8');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-impacto-${Date.now()}.csv"`);
    res.send(csvBuffer);
  } catch (error) {
    console.error('CSV generation error:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

export default router;

