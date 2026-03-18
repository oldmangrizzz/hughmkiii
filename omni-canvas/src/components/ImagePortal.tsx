// omni-canvas/src/components/ImagePortal.tsx
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

type LoadStatus = 'loading' | 'loaded' | 'error';

const MIN_PANEL_W = 400;
const CASCADE_OFFSET = 30;
const MAX_PROMPT_LEN = 100;

/**
 * ImagePortal — renders floating, draggable image panels for every active visual
 * pheromone with content.type === "image". Supports base64 and http URLs.
 */
export const ImagePortal: React.FC = () => {
  const pheromones = useQuery(api.pheromones.getActiveVisual);
  const deletePheromone = useMutation(api.pheromones.deleteVisualPheromone);
  const sendMessage = useMutation(api.messages.send);

  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [loadStatus, setLoadStatus] = useState<Record<string, LoadStatus>>({});
  const dragRefs = useRef<Record<string, DragState>>({});

  const imagePheromones = (pheromones ?? []).filter(
    (p: any) => p.content?.type === 'image'
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

  const handleRetry = useCallback(
    async (prompt: string, id: Id<'visual_pheromones'>) => {
      // Close the failed pheromone and re-emit as a user message so HUGH regenerates
      await deletePheromone({ id });
      await sendMessage({ content: `Generate image: ${prompt}`, role: 'user' });
    },
    [deletePheromone, sendMessage]
  );

  const setStatus = useCallback((id: string, status: LoadStatus) => {
    setLoadStatus((prev) => ({ ...prev, [id]: status }));
  }, []);

  if (imagePheromones.length === 0) return null;

  return (
    <>
      {imagePheromones.map((p: any, idx: number) => {
        const id = p._id as Id<'visual_pheromones'>;
        const idStr = id as string;
        const url: string = p.content.url;
        const prompt: string = p.content.prompt;
        const drag = offsets[idStr] ?? { x: 0, y: 0 };
        const status: LoadStatus = loadStatus[idStr] ?? 'loading';

        const panelW = Math.max(MIN_PANEL_W, p.size.width * window.innerWidth);
        const baseX = p.position.x * window.innerWidth + idx * CASCADE_OFFSET;
        const baseY = p.position.y * window.innerHeight + idx * CASCADE_OFFSET;

        const truncatedPrompt =
          prompt.length > MAX_PROMPT_LEN
            ? prompt.slice(0, MAX_PROMPT_LEN) + '…'
            : prompt;

        return (
          <div
            key={idStr}
            style={{
              position: 'fixed',
              left: baseX + drag.x,
              top: baseY + drag.y,
              width: panelW,
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
            {/* Title bar */}
            <div
              onMouseDown={(e) => handleMouseDown(idStr, e)}
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
                  color: '#0066ff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}
              >
                IMAGE PORTAL
              </span>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleClose(id)}
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
                }}
                aria-label="Close image portal"
              >
                ×
              </button>
            </div>

            {/* Image area */}
            <div style={{ position: 'relative', width: '100%', minHeight: 200 }}>
              {/* Shimmer placeholder while loading */}
              {status === 'loading' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                    minHeight: 200,
                  }}
                />
              )}

              {status === 'error' ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    gap: 12,
                    padding: 20,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: '1px' }}>
                    IMAGE GENERATION FAILED
                  </span>
                  <button
                    onClick={() => handleRetry(prompt, id)}
                    style={{
                      background: '#0066ff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 16px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      fontSize: 12,
                    }}
                  >
                    RETRY
                  </button>
                </div>
              ) : (
                <img
                  src={url}
                  alt={prompt}
                  onLoad={() => setStatus(idStr, 'loaded')}
                  onError={() => setStatus(idStr, 'error')}
                  style={{
                    width: '100%',
                    display: 'block',
                    objectFit: 'contain',
                    opacity: status === 'loaded' ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  }}
                />
              )}
            </div>

            {/* Prompt caption */}
            {status !== 'error' && (
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.5px',
                  fontStyle: 'italic',
                }}
              >
                {truncatedPrompt}
              </div>
            )}
          </div>
        );
      })}

      {/* Shimmer keyframes injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </>
  );
};
