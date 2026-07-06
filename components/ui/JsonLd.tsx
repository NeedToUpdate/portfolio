interface JsonLdProps {
  data: Record<string, unknown>;
}

/** Renders a JSON-LD structured data block. */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
