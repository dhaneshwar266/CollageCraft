import React from 'react';

export default function SnapGuides({ guides = [] }) {
  if (!guides || guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {guides.map((g, idx) => {
        if (g.axis === 'x') {
          return (
            <div
              key={`x-${idx}-${g.position}`}
              className="absolute top-0 bottom-0 -translate-x-1/2 w-[1.5px] bg-[#c25e40] shadow-[0_0_8px_rgba(194,94,64,0.8)]"
              style={{ left: `${g.position}%` }}
            >
              <div className="absolute top-2 left-1.5 px-1.5 py-0.5 rounded bg-[#c25e40] text-white text-[9px] font-bold tracking-tight shadow whitespace-nowrap opacity-90">
                {g.label || `${Math.round(g.position)}%`}
              </div>
            </div>
          );
        }
        if (g.axis === 'y') {
          return (
            <div
              key={`y-${idx}-${g.position}`}
              className="absolute left-0 right-0 -translate-y-1/2 h-[1.5px] bg-[#c25e40] shadow-[0_0_8px_rgba(194,94,64,0.8)]"
              style={{ top: `${g.position}%` }}
            >
              <div className="absolute left-2 top-1.5 px-1.5 py-0.5 rounded bg-[#c25e40] text-white text-[9px] font-bold tracking-tight shadow whitespace-nowrap opacity-90">
                {g.label || `${Math.round(g.position)}%`}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
