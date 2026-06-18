import { ImageResponse } from 'next/og';

export const alt = 'Mentoria Hub — opportunities, courses, and a personal plan in one place';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#fff',
          color: '#111',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: 72,
          width: '100%',
        }}
      >
        <div
          style={{
            borderBottom: '1px solid #d4d4d4',
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: 28,
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 700 }}>Mentoria Hub</div>
          <div style={{ color: '#525252', fontSize: 24 }}>RU · EN · KK</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: 0,
              lineHeight: 1,
              maxWidth: 900,
            }}
          >
            Every opportunity. Every course.
          </div>
          <div style={{ color: '#525252', fontSize: 32, lineHeight: 1.35, maxWidth: 760 }}>
            A trilingual student hub for discovery, learning, recommendations, and a personal roadmap.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Discover', 'Learn', 'Roadmap'].map((item) => (
            <div
              key={item}
              style={{
                border: '1px solid #d4d4d4',
                borderRadius: 8,
                fontSize: 24,
                fontWeight: 600,
                padding: '18px 24px',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
