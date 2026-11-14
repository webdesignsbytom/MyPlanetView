import { onCLS, onLCP, onINP, onTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // if (import.meta.env.DEV) {
  //   console.log('[Vitals]', metric.name, metric.value, metric)
  // }
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
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
