import { useState, useEffect, useRef } from "react";
import {
  IconNetwork,
  IconGlobe,
  IconX,
  IconMenu2,
} from "@tabler/icons-react";
import anime from 'animejs';
import { cn } from "@/lib/utils";
import { PacketCapture } from "@/components/PacketCapture/PacketCapture";
import { HTTPProxy } from "@/components/HTTPProxy/HTTPProxy";
import { TitleBar } from "@/components/TitleBar/TitleBar";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

export default function App() {
  console.log("App component rendering...");

  const [activeView, setActiveView] = useState<"capture" | "proxy">("capture");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const links = [
    {
      label: "Packet Capture",
      value: "capture" as const,
      icon: <IconNetwork size={20} className="transition-transform group-hover:scale-110" />,
      description: "Monitor and analyze network packets",
    },
    {
      label: "HTTP Proxy",
      value: "proxy" as const,
      icon: <IconGlobe size={20} className="transition-transform group-hover:scale-110" />,
      description: "Intercept and modify HTTP traffic",
    },
  ];

  // Sidebar mount animation: handled by Sidebar motion component

  // Animate content on view change
  useEffect(() => {
    if (contentRef.current) {
        anime({
        targets: contentRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        easing: "easeOutQuad",
      });
    }
  }, [activeView]);

  const toggleSidebar = () => {
    // Sidebar motion handles width animation; just toggle the state
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavClick = (value: "capture" | "proxy") => {
    // Animate button press
    const button = document.querySelector(`[data-nav="${value}"]`);
    if (button) {
        anime({
        targets: button,
        scale: [1, 0.95, 1],
        duration: 300,
        easing: "easeInOutQuad",
      });
    }
    setActiveView(value);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <TitleBar />
      <div className="flex flex-1 overflow-hidden p-4 gap-4" style={{ background: 'transparent' }}>
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate>
          <SidebarBody
            className={cn(
              "glass-card dark:glass-card-dark rounded-2xl shadow-glass-lg overflow-hidden transition-all duration-400",
              sidebarOpen ? "" : ""
            )}
          >
            <div className="flex flex-col h-full p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                {sidebarOpen ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <IconNetwork className="text-white" size={24} />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        NMAT
                      </h1>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Network Monitor
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto">
                    <IconNetwork className="text-white" size={24} />
                  </div>
                )}
                {sidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    className="glass-button dark:glass-button-dark rounded-lg p-2 text-gray-700 dark:text-gray-300"
                  >
                    <IconX size={18} />
                  </button>
                )}
              </div>

              {/* Toggle button when closed */}
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="glass-button dark:glass-button-dark rounded-lg p-2 text-gray-700 dark:text-gray-300 mb-8 mx-auto"
                >
                  <IconMenu2 size={20} />
                </button>
              )}

              {/* Navigation */}
              <div className="flex-1 space-y-2">
                {links.map((link) => {
                  const isActive = activeView === link.value;
                  return (
                    <SidebarLink
                      key={link.value}
                      link={{ label: link.label, href: '#', icon: link.icon }}
                      onClick={() => handleNavClick(link.value)}
                      data-nav={link.value}
                      className={cn(
                        "w-full rounded-xl transition-all duration-300 group relative overflow-hidden",
                        sidebarOpen ? "p-4" : "p-3",
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                          : "glass-button dark:glass-button-dark text-gray-700 dark:text-gray-300"
                      )}
                    />
                  );
                })}
              </div>

              {/* Footer */}
              {sidebarOpen && (
                <div className="mt-auto pt-4 border-t border-white/20 dark:border-gray-700/50">
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    v1.0.0
                  </div>
                </div>
              )}
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main Content */}
        <div
          ref={contentRef}
          className="flex-1 glass-card dark:glass-card-dark rounded-2xl shadow-glass-lg overflow-hidden"
        >
          <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {activeView === "capture" ? "Packet Capture" : "HTTP Proxy"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeView === "capture"
                  ? "Monitor and analyze network packets in real-time"
                  : "Intercept and modify HTTP/HTTPS traffic"}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
              {activeView === "capture" ? <PacketCapture /> : <HTTPProxy />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
