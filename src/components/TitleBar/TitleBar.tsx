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
      className="flex items-center justify-between h-10 px-4 select-none glass dark:glass-dark"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-sm" />
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Network Monitor
        </span>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          data-titlebar="minimize"
          onClick={handleMinimize}
          className="h-7 w-10 flex items-center justify-center rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 text-gray-900 dark:text-white"
          aria-label="Minimize"
        >
          <IconMinus size={16} />
        </button>
        <button
          data-titlebar="maximize"
          onClick={handleMaximize}
          className="h-7 w-10 flex items-center justify-center rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 text-gray-900 dark:text-white"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          <IconMaximize size={14} />
        </button>
        <button
          data-titlebar="close"
          onClick={handleClose}
          className="h-7 w-10 flex items-center justify-center rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 text-gray-900 dark:text-white"
          aria-label="Close"
        >
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
};
