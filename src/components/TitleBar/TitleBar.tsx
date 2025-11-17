import { useState, useEffect, useRef } from 'react';
import { IconMinus, IconMaximize, IconX } from '@tabler/icons-react';
import anime from 'animejs';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const titleBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.api) {
        const maximized = await window.api.windowIsMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();

    // Animate title bar on mount
    if (titleBarRef.current) {
        anime({
        targets: titleBarRef.current,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad',
      });
    }
  }, []);

  const handleMinimize = async () => {
    const button = document.querySelector('[data-titlebar="minimize"]');
    if (button) {
      anime({
        targets: button,
        scale: [1, 0.9, 1],
        duration: 200,
        easing: 'easeInOutQuad',
      });
    }
    if (window.api) {
      await window.api.windowMinimize();
    }
  };

  const handleMaximize = async () => {
    const button = document.querySelector('[data-titlebar="maximize"]');
    if (button) {
      anime({
        targets: button,
        scale: [1, 0.9, 1],
        duration: 200,
        easing: 'easeInOutQuad',
      });
    }
    if (window.api) {
      const maximized = await window.api.windowMaximize();
      setIsMaximized(maximized);
    }
  };

  const handleClose = async () => {
    const button = document.querySelector('[data-titlebar="close"]');
    if (button) {
      anime({
        targets: button,
        scale: [1, 0.9, 1],
        duration: 200,
        easing: 'easeInOutQuad',
      });
    }
    if (window.api) {
      await window.api.windowClose();
    }
  };

  return (
    <div
      ref={titleBarRef}
      className="flex items-center justify-between h-12 px-5 select-none bg-white/80 backdrop-blur-xl border-b border-gray-200"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
          <div className="h-2.5 w-2.5 bg-white rounded-sm" />
        </div>
        <span className="text-sm font-semibold text-black font-mono tracking-tight">
          NMAT
        </span>
      </div>

      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          data-titlebar="minimize"
          onClick={handleMinimize}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all duration-150 text-black"
          aria-label="Minimize"
        >
          <IconMinus size={14} />
        </button>
        <button
          data-titlebar="maximize"
          onClick={handleMaximize}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all duration-150 text-black"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          <IconMaximize size={12} />
        </button>
        <button
          data-titlebar="close"
          onClick={handleClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500 hover:text-white transition-all duration-150 text-gray-700"
          aria-label="Close"
        >
          <IconX size={14} />
        </button>
      </div>
    </div>
  );
};
