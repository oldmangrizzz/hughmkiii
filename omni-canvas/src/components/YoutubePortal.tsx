// omni-canvas/src/components/YoutubePortal.tsx
import React, { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface DragState {
  dragging: boolean;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface PlayerWindow {
  id: Id<'visual_pheromones'>;
  videoId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

const MIN_W = 480;
const MIN_H = 270;
const CASCADE_OFFSET = 30;

/**
 * YoutubePortal — renders floating, draggable YouTube embed panels for every
 * active visual pheromone with content.type === "youtube".
 */
export const YoutubePortal: React.FC = () => {
  const pheromones = useQuery(api.pheromones.getActiveVisual);
  const deletePheromone = useMutation(api.pheromones.deleteVisualPheromone);

  // Per-panel drag offset tracked in component state
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const dragRefs = useRef<Record<string, DragState>>({});

  const youtube = (pheromones ?? []).filter(
    (p: any) => p.content?.type === 'youtube'
  );

  const handleMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      const current = offsets[id] ?? { x: 0, y: 0 };
      dragRefs.current[id] = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: current.x,
        originY: current.y,
      };

      const onMove = (ev: MouseEvent) => {
        const ref = dragRefs.current[id];
        if (!ref?.dragging) return;
        setOffsets((prev) => ({
          ...prev,
          [id]: {
            x: ref.originX + ev.clientX - ref.startX,
            y: ref.originY + ev.clientY - ref.startY,
          },
        }));
      };

      const onUp = () => {
        if (dragRefs.current[id]) dragRefs.current[id].dragging = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [offsets]
  );

  const handleClose = useCallback(
    async (id: Id<'visual_pheromones'>) => {
      await deletePheromone({ id });
    },
    [deletePheromone]
  );

  const windows: PlayerWindow[] = youtube.map((p: any, idx: number) => {
    const rawW = Math.max(MIN_W, p.size.width * window.innerWidth);
    const rawH = Math.max(MIN_H, p.size.height * window.innerHeight);
    const baseX = p.position.x * window.innerWidth + idx * CASCADE_OFFSET;
    const baseY = p.position.y * window.innerHeight + idx * CASCADE_OFFSET;
    return {
      id: p._id as Id<'visual_pheromones'>,
      videoId: p.content.videoId as string,
      title: p.content.title as string,
      x: baseX,
      y: baseY,
      width: rawW,
      height: rawH,
      index: idx,
    };
  });

  if (windows.length === 0) return null;

  return (
    <>
      {windows.map((win) => {
        const drag = offsets[win.id] ?? { x: 0, y: 0 };
        return (
          <div
            key={win.id}
            style={{
              position: 'fixed',
              left: win.x + drag.x,
              top: win.y + drag.y,
              width: win.width,
              height: win.height + 40, // title bar
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Title bar — drag handle */}
            <div
              onMouseDown={(e) => handleMouseDown(win.id, e)}
              style={{
                height: 40,
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                background: 'rgba(0,102,255,0.15)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 'calc(100% - 36px)',
                }}
              >
                <span style={{ color: '#0066ff', marginRight: 8 }}>▶</span>
                {win.title}
              </span>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleClose(win.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 18,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '0 2px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                aria-label="Close YouTube portal"
              >
                ×
              </button>
            </div>

            {/* YouTube embed */}
            <iframe
              src={`https://www.youtube.com/embed/${win.videoId}?autoplay=1&rel=0&modestbranding=1`}
              style={{
                flex: 1,
                width: '100%',
                border: 'none',
                display: 'block',
                background: '#000',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={win.title}
            />
          </div>
        );
      })}
    </>
  );
};
