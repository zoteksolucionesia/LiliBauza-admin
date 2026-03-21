"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-500",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: "text-green-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-500",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      text: "text-red-800",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      text: "text-blue-800",
    },
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${styles[type].bg} ${styles[type].border} animate-slide-in`}
    >
      {styles[type].icon}
      <span className={`font-medium ${styles[type].text}`}>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" style={{ color: styles[type].text }} />
      </button>
    </div>
  );
}

interface NotificationManagerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info";
  }>;
  onRemove: (id: string) => void;
}

export function NotificationManager({ notifications, onRemove }: NotificationManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notif, index) => (
        <Notification
          key={`${notif.id}-${index}`}
          message={notif.message}
          type={notif.type}
          onClose={() => onRemove(notif.id)}
        />
      ))}
    </div>
  );
}
