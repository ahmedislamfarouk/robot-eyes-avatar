/**
 * useMouseTracking – Eye-tracking hook that makes pupils follow the cursor.
 *
 * The hook attaches a `ref` to the face container element. It listens for
 * `mousemove` / `mouseenter` / `mouseleave` events on that element and
 * derives smooth pupil offsets via a spring-like damping loop.
 *
 * When the mouse leaves the container, pupils smoothly return to centre.
 *
 * Usage:
 *   const { ref, pupilX, pupilY, isHovering } = useMouseTracking();
 *   <div ref={ref}> ... </div>
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMouseTrackingOptions {
  /**
   * Maximum horizontal pupil offset, normalised -1 … 1.
   * Default: 0.45.
   */
  maxOffsetX?: number;
  /**
   * Maximum vertical pupil offset, normalised -1 … 1.
   * Default: 0.45.
   */
  maxOffsetY?: number;
  /**
   * Damping factor (0–1). Lower = smoother / lazier tracking.
   * Default: 0.12.
   */
  damping?: number;
  /**
   * Dead-zone radius (in pixels) at the centre of the face where the
   * pupils stay centred even when the mouse is inside.
   * Default: 10.
   */
  deadZone?: number;
}

export interface MouseTrackingState {
  /** Attach this ref to the face container element. */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Horizontal pupil offset, normalised -1 … 1. */
  pupilX: number;
  /** Vertical pupil offset, normalised -1 … 1. */
  pupilY: number;
  /** True when the mouse is hovering over the face container. */
  isHovering: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MAX_X = 0.45;
const DEFAULT_MAX_Y = 0.45;
const DEFAULT_DAMPING = 0.12;
const DEFAULT_DEAD_ZONE = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMouseTracking(
  options: UseMouseTrackingOptions = {},
): MouseTrackingState {
  const maxX = options.maxOffsetX ?? DEFAULT_MAX_X;
  const maxY = options.maxOffsetY ?? DEFAULT_MAX_Y;
  const damping = options.damping ?? DEFAULT_DAMPING;
  const deadZone = options.deadZone ?? DEFAULT_DEAD_ZONE;

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Target values set by mouse events (not rendered directly).
  const targetRef = useRef({ x: 0, y: 0, hovering: false });

  // Damped values updated by rAF.
  const [pupilX, setPupilX] = useState(0);
  const [pupilY, setPupilY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const rafRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- animation loop (damped spring) ----
  useEffect(() => {
    let currentX = 0;
    let currentY = 0;

    const tick = () => {
      const target = targetRef.current;

      // When not hovering, target is (0, 0) – centre.
      const tx = target.hovering ? target.x : 0;
      const ty = target.hovering ? target.y : 0;

      // Apply damping towards target.
      currentX += (tx - currentX) * damping;
      currentY += (ty - currentY) * damping;

      // Snap to zero when very close (avoids perpetual micro-updates).
      if (!target.hovering && Math.abs(currentX) < 0.001 && Math.abs(currentY) < 0.001) {
        currentX = 0;
        currentY = 0;
      }

      if (mountedRef.current) {
        setPupilX(currentX);
        setPupilY(currentY);
        setIsHovering(target.hovering);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [damping]);

  // ---- mouse event handlers ----
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Apply dead-zone.
      if (dist < deadZone) {
        targetRef.current = { x: 0, y: 0, hovering: true };
        return;
      }

      // Normalise to -1 … 1, clamped by max offset.
      const halfW = rect.width / 2;
      const halfH = rect.height / 2;
      const nx = Math.max(-1, Math.min(1, dx / halfW));
      const ny = Math.max(-1, Math.min(1, dy / halfH));

      targetRef.current = {
        x: nx * maxX,
        y: ny * maxY,
        hovering: true,
      };
    },
    [maxX, maxY, deadZone],
  );

  const handleMouseEnter = useCallback(() => {
    targetRef.current = { ...targetRef.current, hovering: true };
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetRef.current = { ...targetRef.current, hovering: false };
  }, []);

  // ---- attach / detach listeners ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  return {
    ref: containerRef,
    pupilX,
    pupilY,
    isHovering,
  };
}
