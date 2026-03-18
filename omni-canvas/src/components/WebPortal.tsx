// omni-canvas/src/components/WebPortal.tsx
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

const MIN_W = 600;
const MIN_H = 450;
const CASCADE_OFFSET = 30;

/**
 * WebPortal — renders floating, draggable browser-style panels for every active
 * visual pheromone with content.type === "webpage". Displays HUGH's extracted
 * summary text; includes an "Open in Browser" escape hatch.
 */
export const WebPortal: React.FC = () => {
  const pheromones = useQuery(api.pheromones.getActiveVisual);
  const deletePheromone = useMutation(api.pheromones.deleteVisualPheromone);

  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const dragRefs = useRef<Record<string, DragState>>({});

  const webPheromones = (pheromones ?? []).filter(
    (p: any) => p.content?.type === 'webpage'
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

  if (webPheromones.length === 0) return null;

  return (
    <>
      {webPheromones.map((p: any, idx: number) => {
        const id = p._id as Id<'visual_pheromones'>;
        const idStr = id as string;
        const url: string = p.content.url;
        const title: string = p.content.title;
        const summary: string = p.content.summary;
        const drag = offsets[idStr] ?? { x: 0, y: 0 };

        const panelW = Math.max(MIN_W, p.size.width * window.innerWidth);
        const panelH = Math.max(MIN_H, p.size.height * window.innerHeight);
        const baseX = p.position.x * window.innerWidth + idx * CASCADE_OFFSET;
        const baseY = p.position.y * window.innerHeight + idx * CASCADE_OFFSET;

        return (
          <div
            key={idStr}
            style={{
              position: 'fixed',
              left: baseX + drag.x,
              top: baseY + drag.y,
              width: panelW,
              height: panelH,
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
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: '#0066ff',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 'calc(100% - 36px)',
                }}
              >
                WEB PORTAL
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
                  flexShrink: 0,
                }}
                aria-label="Close web portal"
              >
                ×
              </button>
            </div>

            {/* URL bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                flexShrink: 0,
              }}
            >
              {/* Favicon placeholder dot */}
              <span style={{ color: '#0066ff', fontSize: 10, flexShrink: 0 }}>●</span>

              {/* URL pill */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                  letterSpacing: '0.3px',
                }}
                title={url}
              >
                {url}
              </div>

              {/* Open in browser */}
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                style={{
                  background: '#0066ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                OPEN
              </button>
            </div>

            {/* Page title */}
            {title && (
              <div
                style={{
                  padding: '8px 12px 4px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {title}
              </div>
            )}

            {/* Summary content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: '#fff',
                  fontFamily: '"Courier New", Courier, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                  opacity: 0.9,
                }}
              >
                {summary}
              </pre>
            </div>
          </div>
        );
      })}
    </>
  );
};
