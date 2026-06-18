export type AssistantRefMarkerKind = 'course' | 'opportunity';

const MARKER_RE = /\[(course|opp|opportunity):([^\]\s]+)\]/gi;

export function stripAssistantArtifacts(content: string): string {
  let clean = content.trim();
  clean = clean.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '');
  clean = clean.replace(/\n?```\s*$/, '');
  clean = clean
    .split('\n')
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n');
  return clean.trim();
}

export function hideTrailingPartialMarker(content: string): string {
  const lastOpen = content.lastIndexOf('[');
  const lastClose = content.lastIndexOf(']');
  if (lastOpen > lastClose && /^\[(course|opp|opportunity):/i.test(content.slice(lastOpen))) {
    return content.slice(0, lastOpen);
  }
  return content;
}

export function normalizeMarkerKind(kind: string): AssistantRefMarkerKind {
  return kind.toLowerCase() === 'course' ? 'course' : 'opportunity';
}

export function parseAssistantRefMarker(part: string) {
  const match = /^\[(course|opp|opportunity):([^\]\s]+)\]$/i.exec(part.trim());
  if (!match) return null;
  return {
    kind: normalizeMarkerKind(match[1]),
    value: match[2],
  };
}

export function stripCatalogMarkers(content: string): string {
  return content
    .replace(MARKER_RE, '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function shortenMarkerValue(value: string): string {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}
