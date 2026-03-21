"use client";

import { useState, ReactNode } from "react";

const colors = {
  primary: "#D4A5A5",
  primaryLight: "#E8C4C4",
  primaryDark: "#B88B8B",
  background: "#FDF8F8",
  surface: "#FFFFFF",
  text: "#3D2929",
  textMuted: "#7D6B6B",
};

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
        className="grid gap-1 mb-0"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
          borderBottom: `3px solid ${colors.primaryDark}`,
        }}
      >
        {tabs.map((tab) => (
          <div key={tab.id}>
            <button
              onClick={() => setActiveTab(tab.id)}
              className="w-full px-4 py-2 font-medium transition-all rounded-t-lg border-2"
              style={{
                backgroundColor: activeTab === tab.id ? colors.primary : colors.surface,
                borderColor: activeTab === tab.id ? colors.primary : colors.primaryLight,
                borderBottom: activeTab === tab.id ? `2px solid ${colors.surface}` : `2px solid ${colors.primaryLight}`,
                marginBottom: activeTab === tab.id ? "-2px" : "0",
                zIndex: activeTab === tab.id ? "10" : "1",
                color: activeTab === tab.id ? "#FFFFFF" : "#7D6B6B",
                fontWeight: activeTab === tab.id ? "600" : "400",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          </div>
        ))}
      </div>

      {/* Tab Content — altura fija para que NO cambie de tamaño entre pestañas */}
      <div
        className="p-4 rounded-b-lg rounded-tr-lg"
        style={{
          backgroundColor: colors.surface,
          border: `3px solid ${colors.primaryLight}`,
          borderTop: "none",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          height: "400px",
          overflowY: "auto",
        }}
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
