"use client";

import { useState, ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: ReactNode;
}

export function Tabs({ tabs, defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <div>
      {/* Tab Headers - Grid con columnas IGUALES */}
      <div
        className="grid gap-1 mb-0 border-b-4 border-ring"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-4 py-2 font-medium transition-all rounded-t-lg border-2 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary z-10 -mb-[2px]"
                    : "bg-card text-muted-foreground border-border z-0 mb-0"
                }`}
                style={{
                  borderBottom: isActive ? "2px solid var(--color-card, #FFFFFF)" : "2px solid var(--color-border, #E8C4C4)",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Tab Content — altura fija para que NO cambie de tamaño entre pestañas */}
      <div
        className="p-4 rounded-b-lg rounded-tr-lg bg-card border-[3px] border-border border-t-0 shadow-md overflow-y-auto"
        style={{ height: "400px" }}
      >
        {childrenArray.find((child) => (child as any).props?.tabId === activeTab)}
      </div>
    </div>
  );
}

interface TabPanelProps {
  tabId: string;
  children: ReactNode;
}

export function TabPanel({ tabId, children }: TabPanelProps) {
  return (
    <div data-tab={tabId}>
      {children}
    </div>
  );
}
