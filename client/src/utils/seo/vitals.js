import { onCLS, onLCP, onINP, onTTFB } from 'web-vitals'
import { analyticsActive } from '@/utils/analytics/initGA'

// Loaded by initGA.js once GA runs (after consent), and reported through it; the event
// carries the redacted page_location that initGA.js sets. Nothing is reported once consent
// is withdrawn, or from a page with a secret in its address (share, invite, reset and
// verify links), where GA is paused anyway.
function sendToAnalytics(metric) {
  if (!analyticsActive()) return
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'web_vital', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value * (metric.name === 'CLS' ? 1000 : 1)),
      metric_id: metric.id,
      metric_value: metric.value,
    })
  }
}

onLCP(sendToAnalytics)
onCLS(sendToAnalytics)
onINP(sendToAnalytics)
onTTFB(sendToAnalytics)
