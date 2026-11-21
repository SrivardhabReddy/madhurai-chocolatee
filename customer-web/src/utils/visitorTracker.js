/**
 * Madhurai Chocolates - Storefront Visitor Tracker
 * Lightweight, privacy-respecting client tracking for admin store analytics
 */

function getVisitorId() {
  try {
    let id = localStorage.getItem('mc_visitor_id');
    if (!id) {
      id = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('mc_visitor_id', id);
    }
    return id;
  } catch (e) {
    return `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem('mc_session_id');
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('mc_session_id', id);
    }
    return id;
  } catch (e) {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

let lastTracked = { path: null, time: 0 };

export function trackPageView(customPath) {
  try {
    // Only track public storefront pages (never admin panel)
    if (typeof window === 'undefined') return;
    if (window.location.pathname.startsWith('/admin')) return;

    const path = customPath || window.location.pathname || '/';
    const now = Date.now();

    // Prevent duplicate events within 3 seconds on the exact same page
    if (lastTracked.path === path && (now - lastTracked.time) < 3000) {
      return;
    }
    lastTracked = { path, time: now };

    // Send SPA pageview to Google Analytics 4 (GA4: G-14EJ4DQB46)
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_path: path,
          page_title: document.title || 'Madhurai Chocolates',
          page_location: (window.location.origin || 'https://madhuraichocolates.in') + path
        });
      }
    } catch (_) {}

    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry/i.test(navigator.userAgent || '');

    const payload = JSON.stringify({
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: path,
      page_title: document.title || 'Madhurai Chocolates',
      referrer: document.referrer || '',
      device_type: isMobile ? 'MOBILE' : 'DESKTOP'
    });

    const endpoint = '/api/analytics/visit';

    // Prefer non-blocking sendBeacon if available, fallback to keepalive fetch
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  } catch (e) {
    // Graceful silent fallback
  }
}
