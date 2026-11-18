
"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/Card";

type Notification = {
  id: string;
  title: string;
  message: string;
  related_type: "document" | "progress";
  is_read: boolean;
  created_at: string;
};

export default function FypNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/fyp-notifications", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load notifications.");
      }

      setNotifications(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(id: string) {
    try {
      const response = await fetch("/api/fyp-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not mark as read.");
      }

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update notification."
      );
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Group Notifications</h2>
            <p className="text-sm text-gray-500">
              Updates shared by your FYP group members.
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {unreadCount} unread
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">
            Loading notifications...
          </p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500">
            No group notifications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-3 ${
                  notification.is_read
                    ? "border-gray-200 bg-white"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {notification.title}
                      </p>

                      {!notification.is_read && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => void markAsRead(notification.id)}
                      className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Refresh notifications
          </button>
        )}
      </div>
    </Card>
  );
}
