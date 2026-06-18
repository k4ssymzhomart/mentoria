/**
 * 16:9 responsive media. A placeholder embed by default; swap in any per-lesson
 * `video_url` with zero structural change. Always titled for accessibility.
 */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
      <iframe
        src={url}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
