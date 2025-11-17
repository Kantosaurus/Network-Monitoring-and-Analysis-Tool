import { useState, useEffect, useRef } from "react";
import {
  IconNetwork,
  IconGlobe,
  IconSparkles,
  IconMenu2,
} from "@tabler/icons-react";
import anime from 'animejs';
import { cn } from "@/lib/utils";
import { PacketCapture } from "@/components/PacketCapture/PacketCapture";
import { HTTPProxy } from "@/components/HTTPProxy/HTTPProxy";
import { Esper } from "@/components/Esper/Esper";
import { TitleBar } from "@/components/TitleBar/TitleBar";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

export default function App() {
  console.log("App component rendering...");

  const [activeView, setActiveView] = useState<"capture" | "proxy" | "esper">("capture");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const links = [
    {
      label: "Packet Capture",
      value: "capture" as const,
      icon: <IconNetwork size={20} />,
      description: "Wireshark-powered network analysis",
    },
    {
      label: "HTTP Proxy",
      value: "proxy" as const,
      icon: <IconGlobe size={20} />,
      description: "Burp Suite-inspired traffic interception",
    },
    {
      label: "Esper",
      value: "esper" as const,
      icon: <IconSparkles size={20} />,
      description: "AI-powered network intelligence",
    },
  ];

  // Animate content on view change
  useEffect(() => {
    if (contentRef.current) {
      anime({
        targets: contentRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 500,
        easing: "easeOutCubic",
      });
    }
  }, [activeView]);

  const handleNavClick = (value: "capture" | "proxy" | "esper") => {
    // Animate button press
    const button = document.querySelector(`[data-nav="${value}"]`);
    if (button) {
      anime({
        targets: button,
        scale: [1, 0.96, 1],
        duration: 200,
        easing: "easeInOutQuad",
      });
    }
    setActiveView(value);
  };

  const getPageTitle = () => {
    switch (activeView) {
      case "capture":
        return "Packet Capture";
      case "proxy":
        return "HTTP Proxy";
      case "esper":
        return "Esper";
    }
  };

  const getPageDescription = () => {
    switch (activeView) {
      case "capture":
        return "Monitor and analyze network packets in real-time";
      case "proxy":
        return "Intercept and modify HTTP/HTTPS traffic";
      case "esper":
        return "AI-powered network intelligence and automation";
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f7]">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden p-5 gap-5">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate>
          <SidebarBody className="apple-sidebar rounded-2xl overflow-hidden shadow-sm">
            <div className="flex flex-col h-full p-5">
              {/* Header */}
              <div className={sidebarOpen ? "flex items-center justify-between mb-8" : "flex flex-col items-center gap-4 mb-8"}>
                {sidebarOpen ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <IconNetwork className="text-white" size={24} />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-black tracking-tight">
                        NMAT
                      </h1>
                      <p className="text-xs text-black font-mono opacity-60">
                        Network Analysis
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <IconNetwork className="text-white" size={24} />
                    </div>
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="apple-button rounded-lg p-2 text-black"
                    >
                      <IconMenu2 size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Navigation */}
              <div className="flex-1 space-y-1.5">
                {links.map((link) => {
                  const isActive = activeView === link.value;
                  return (
                    <button
                      key={link.value}
                      onClick={() => handleNavClick(link.value)}
                      data-nav={link.value}
                      className={cn(
                        "w-full rounded-xl transition-all duration-200 font-medium text-sm cursor-pointer flex items-center",
                        sidebarOpen ? "px-4 py-3 gap-3" : "px-2 py-3 justify-center",
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-black hover:bg-gray-100"
                      )}
                    >
                      {link.icon}
                      {sidebarOpen && <span>{link.label}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              {sidebarOpen && (
                <div className="mt-auto pt-5 border-t border-gray-200">
                  <div className="text-xs text-black text-center font-mono opacity-60">
                    v2.0.0
                  </div>
                </div>
              )}
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Header */}
          <div className="mb-5">
            <h2 className="text-3xl font-bold text-black tracking-tight mb-1">
              {getPageTitle()}
            </h2>
            <p className="text-sm text-black font-mono opacity-70">
              {getPageDescription()}
            </p>
          </div>

          {/* Content Container */}
          <div
            ref={contentRef}
            className="flex-1 apple-card rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="h-full flex flex-col p-6">
              {activeView === "capture" && <PacketCapture />}
              {activeView === "proxy" && <HTTPProxy />}
              {activeView === "esper" && <Esper />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
