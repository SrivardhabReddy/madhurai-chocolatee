import { Router } from 'express';
import { query } from '../../db/index.js';

const router = Router();

/**
 * Public Endpoint: Record Storefront Page Visit
 * POST /api/analytics/visit
 * Body: { visitor_id, session_id, page_path, page_title, referrer, device_type }
 */
router.post('/visit', async (req, res) => {
  try {
    const {
      visitor_id,
      session_id,
      page_path = '/',
      page_title = 'Madhurai Chocolates',
      referrer = '',
      device_type
    } = req.body || {};

    const cleanVisitorId = String(visitor_id || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`).trim().substring(0, 100);
    const cleanSessionId = session_id ? String(session_id).trim().substring(0, 100) : null;
    const cleanPath = String(page_path || '/').trim().substring(0, 255);
    const cleanTitle = page_title ? String(page_title).trim().substring(0, 255) : null;
    const cleanReferrer = referrer ? String(referrer).trim().substring(0, 500) : null;

    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry/i.test(userAgent);
    const resolvedDevice = (device_type && ['MOBILE', 'DESKTOP', 'TABLET'].includes(String(device_type).toUpperCase()))
      ? String(device_type).toUpperCase()
      : (isMobile ? 'MOBILE' : 'DESKTOP');

    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0] : (req.socket.remoteAddress || '')).trim().substring(0, 60);
    const visitId = `visit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await query(
      `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, referrer, user_agent, device_type, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [visitId, cleanVisitorId, cleanSessionId, cleanPath, cleanTitle, cleanReferrer, userAgent.substring(0, 300), resolvedDevice, ipAddress]
    );

    return res.status(200).json({ success: true, visitId });
  } catch (err) {
    // Non-blocking fail gracefully
    return res.status(200).json({ success: false, message: 'Visit processed' });
  }
});

export default router;
