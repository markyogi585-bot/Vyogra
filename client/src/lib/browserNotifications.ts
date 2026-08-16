/**
 * Browser Push Notification & Audio Chime Helper for Har Har Mahadev Tours
 */

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("Notification permission error:", err);
    return "denied";
  }
}

export function sendBrowserNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    onClickUrl?: string;
  }
): void {
  if (!isNotificationSupported()) return;

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body: options?.body || "हर हर महादेव टूर्स एंड ट्रेवल्स",
        icon: options?.icon || "https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg",
        badge: options?.badge || "https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg",
        tag: options?.tag || "mahadev-yatra-update",
      });

      if (options?.onClickUrl) {
        notification.onclick = () => {
          window.focus();
          window.location.href = options.onClickUrl!;
        };
      }
    } catch (err) {
      console.warn("Could not display native notification:", err);
    }
  }
}
