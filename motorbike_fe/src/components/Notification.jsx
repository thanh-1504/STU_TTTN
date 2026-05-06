import { useState } from "react";

/**
 * Simple Toast/Notification Component
 * Usage: const {notify} = useNotification()
 *        notify.success("Message")
 *        notify.error("Error message")
 *        notify.info("Info")
 */
export function useNotification() {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const notify = {
    success: (message, duration = 3000) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, message, type: "success" }]);
      setTimeout(() => removeNotification(id), duration);
    },
    error: (message, duration = 4000) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, message, type: "error" }]);
      setTimeout(() => removeNotification(id), duration);
    },
    info: (message, duration = 3000) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, message, type: "info" }]);
      setTimeout(() => removeNotification(id), duration);
    },
    warning: (message, duration = 3000) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, message, type: "warning" }]);
      setTimeout(() => removeNotification(id), duration);
    },
  };

  return { notify, notifications, removeNotification, NotificationContainer };
}

export function NotificationContainer({ notifications, removeNotification }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-4 rounded-lg shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-right-full ${
            notif.type === "success"
              ? "bg-green-100 border border-green-300 text-green-700"
              : notif.type === "error"
                ? "bg-red-100 border border-red-300 text-red-700"
                : notif.type === "warning"
                  ? "bg-yellow-100 border border-yellow-300 text-yellow-700"
                  : "bg-blue-100 border border-blue-300 text-blue-700"
          }`}
        >
          <div className="text-xl pt-1">
            {notif.type === "success" && "✅"}
            {notif.type === "error" && "❌"}
            {notif.type === "warning" && "⚠️"}
            {notif.type === "info" && "ℹ️"}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{notif.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notif.id)}
            className="text-lg opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
