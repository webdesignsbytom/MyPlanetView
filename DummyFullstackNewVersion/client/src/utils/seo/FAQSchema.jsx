export default function FAQSchema({ items = [] }) {
  if (!items.length) return null;
  const data = {
    "@context":"https://schema.org",
    "@type":"FAQPage",
    "mainEntity": items.map(({q,a}) => ({
      "@type":"Question","name":q,
      "acceptedAnswer":{"@type":"Answer","text":a}
    }))
  };
  return (
    <script type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  );
}
