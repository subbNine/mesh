export const createEmptyScratchpadContent = (): Record<string, unknown> => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

export function normalizeScratchpadContent(content: Record<string, unknown> | null | undefined) {
  if (content && typeof content === 'object' && 'type' in content) {
    return content;
  }

  return createEmptyScratchpadContent();
}

export function extractScratchpadText(content: Record<string, unknown> | null | undefined) {
  const segments: string[] = [];

  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      segments.push(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      if (typeof record.text === 'string') {
        segments.push(record.text);
      }

      if ('content' in record) {
        walk(record.content);
      }
    }
  };

  walk(normalizeScratchpadContent(content));

  return segments.join(' ').replace(/\s+/g, ' ').trim();
}
