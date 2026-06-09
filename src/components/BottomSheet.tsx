'use client';

import { useRef } from 'react';

interface BottomSheetProps {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  peek: number;
  children: React.ReactNode;
}

// Mobile bottom sheet: drag/tap the grabber to toggle peek <-> expanded (90%).
export default function BottomSheet({ expanded, setExpanded, peek, children }: BottomSheetProps) {
  const startY = useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    const move = (ev: PointerEvent) => {
      if (startY.current === null) return;
      const dy = ev.clientY - startY.current;
      if (dy < -36) {
        setExpanded(true);
        cleanup();
      } else if (dy > 36) {
        setExpanded(false);
        cleanup();
      }
    };
    const cleanup = () => {
      startY.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', cleanup);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', cleanup);
  }

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-[22px] bg-white shadow-[0_-8px_30px_rgba(20,25,35,0.14)]"
      style={{
        height: expanded ? '90%' : peek,
        transition: 'height .32s cubic-bezier(.32,.72,0,1)',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onClick={() => setExpanded(!expanded)}
        className="flex shrink-0 cursor-grab justify-center pt-[9px] pb-[5px] [touch-action:none]"
      >
        <div className="h-[5px] w-[38px] rounded-full bg-slate-300" />
      </div>
      {children}
    </div>
  );
}
