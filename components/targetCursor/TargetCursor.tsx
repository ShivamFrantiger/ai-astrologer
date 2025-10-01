import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { gsap } from "gsap";

export interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = ".cursor-target",
  spinDuration = 2,
  hideDefaultCursor = true,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
  const spinTl = useRef<gsap.core.Timeline | null>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const constants = useMemo(
    () => ({
      borderWidth: 3,
      cornerSize: 12,
      parallaxStrength: 0.00005,
      moveEase: "power3.out",
      cornerEase: "power2.out",
    }),
    []
  );

  /** Smooth cursor follow */
  const moveCursor = useCallback(
    (x: number, y: number) => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, {
        x,
        y,
        duration: 0.1,
        ease: constants.moveEase,
      });
    },
    [constants.moveEase]
  );

  /** Spin animation */
  const createSpinTimeline = useCallback(() => {
    if (spinTl.current) spinTl.current.kill();
    spinTl.current = gsap
      .timeline({ repeat: -1 })
      .to(cursorRef.current, {
        rotation: "+=360",
        duration: spinDuration,
        ease: "none",
      });
  }, [spinDuration]);

  /** Reset corners back to neutral */
  const resetCorners = useCallback(() => {
    if (!cornersRef.current) return;
    const { cornerSize } = constants;

    const positions = [
      { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
      { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
      { x: cornerSize * 0.5, y: cornerSize * 0.5 },
      { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
    ];

    gsap.to(Array.from(cornersRef.current), {
      x: (i) => positions[i].x,
      y: (i) => positions[i].y,
      duration: 0.3,
      ease: "power3.out",
    });
  }, [constants]);

  useEffect(() => {
    if (!cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) document.body.style.cursor = "none";

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll<HTMLDivElement>(
      ".target-cursor-corner"
    );

    let activeTarget: Element | null = null;
    let cleanupTarget: (() => void) | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    createSpinTimeline();

    /** Mouse move */
    const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);
    window.addEventListener("mousemove", moveHandler as EventListener);

    /** Click shrink effect */
    const mouseDownHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.2 });
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
    };
    const mouseUpHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.2 });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
    };
    window.addEventListener("mousedown", mouseDownHandler as EventListener);
    window.addEventListener("mouseup", mouseUpHandler as EventListener);

    /** Enter handler */
    const enterHandler = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest(targetSelector);
      if (!target || !cornersRef.current) return;
      if (activeTarget === target) return;

      // Clean previous target
      if (cleanupTarget) cleanupTarget();
      if (resumeTimeout) clearTimeout(resumeTimeout);

      activeTarget = target;
      spinTl.current?.pause();
      gsap.set(cursorRef.current, { rotation: 0 });

      const updateCorners = (mouseX?: number, mouseY?: number) => {
        if (!cursorRef.current || !cornersRef.current) return;
        const rect = target.getBoundingClientRect();
        const cursorRect = cursorRef.current.getBoundingClientRect();

        const cursorCenterX = cursorRect.left + cursorRect.width / 2;
        const cursorCenterY = cursorRect.top + cursorRect.height / 2;

        const { borderWidth, cornerSize, parallaxStrength } = constants;
        const offsets = [
          {
            x: rect.left - cursorCenterX - borderWidth,
            y: rect.top - cursorCenterY - borderWidth,
          },
          {
            x: rect.right - cursorCenterX + borderWidth - cornerSize,
            y: rect.top - cursorCenterY - borderWidth,
          },
          {
            x: rect.right - cursorCenterX + borderWidth - cornerSize,
            y: rect.bottom - cursorCenterY + borderWidth - cornerSize,
          },
          {
            x: rect.left - cursorCenterX - borderWidth,
            y: rect.bottom - cursorCenterY + borderWidth - cornerSize,
          },
        ];

        // Parallax effect
        if (mouseX !== undefined && mouseY !== undefined) {
          const targetCenterX = rect.left + rect.width / 2;
          const targetCenterY = rect.top + rect.height / 2;
          const mouseOffsetX = (mouseX - targetCenterX) * parallaxStrength;
          const mouseOffsetY = (mouseY - targetCenterY) * parallaxStrength;

          offsets.forEach((o) => {
            o.x += mouseOffsetX;
            o.y += mouseOffsetY;
          });
        }

        gsap.to(Array.from(cornersRef.current), {
          x: (i) => offsets[i].x,
          y: (i) => offsets[i].y,
          duration: 0.2,
          ease: constants.cornerEase,
        });
      };

      const moveListener = (ev: MouseEvent) =>
        updateCorners(ev.clientX, ev.clientY);

      target.addEventListener("mousemove", moveListener as EventListener);

      cleanupTarget = () => {
        activeTarget = null;
        resetCorners();

        target.removeEventListener("mousemove", moveListener as EventListener);

        // Resume spin after small delay
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current) {
            createSpinTimeline();
          }
          resumeTimeout = null;
        }, 100);
      };

      target.addEventListener("mouseleave", cleanupTarget as EventListener);
      updateCorners();
    };

    window.addEventListener("mouseover", enterHandler as EventListener);

    /** Cleanup */
    return () => {
      window.removeEventListener("mousemove", moveHandler as EventListener);
      window.removeEventListener("mouseover", enterHandler as EventListener);
      window.removeEventListener("mousedown", mouseDownHandler as EventListener);
      window.removeEventListener("mouseup", mouseUpHandler as EventListener);

      spinTl.current?.kill();
      document.body.style.cursor = originalCursor;
    };
  }, [
    targetSelector,
    spinDuration,
    moveCursor,
    constants,
    createSpinTimeline,
    resetCorners,
    hideDefaultCursor,
  ]);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-0 h-0 pointer-events-none z-[9999] mix-blend-difference"
    >
      <div
        ref={dotRef}
        className="absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
      />
      {/* Corners */}
      {["tl", "tr", "br", "bl"].map((pos, i) => (
        <div
          key={pos}
          className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-white"
          style={{
            transform:
              i === 0
                ? "translate(-150%, -150%)"
                : i === 1
                ? "translate(50%, -150%)"
                : i === 2
                ? "translate(50%, 50%)"
                : "translate(-150%, 50%)",
            borderRight: i === 0 || i === 3 ? "0" : undefined,
            borderBottom: i === 0 || i === 1 ? "0" : undefined,
            borderLeft: i === 1 || i === 2 ? "0" : undefined,
            borderTop: i === 2 || i === 3 ? "0" : undefined,
          }}
        />
      ))}
    </div>
  );
};

export default TargetCursor;
