/**
 * The lesson reading body, rendered from the locale's JSONB. Blank-line-separated
 * blocks become paragraphs at a comfortable reading measure; single newlines are
 * preserved within a block. (Authoring richer structure is a Phase 6 concern.)
 */
export function LessonBody({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return null;
  return (
    <div className="max-w-prose space-y-4 text-[0.95rem] leading-relaxed">
      {blocks.map((b, i) => (
        <p key={i} className="whitespace-pre-line">
          {b}
        </p>
      ))}
    </div>
  );
}
