// Service worker for web push notifications.
// On iOS Safari, this only works when the app is installed as a PWA.
self.addEventListener("push", (event) => {
  let data = { title: "العمران", body: "", link: "/admin", icon: "/icon-192.png" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "alomran-notification",
    requireInteraction: data.requireInteraction || false,
    data: { link: data.link || "/admin" },
    dir: "rtl",
    lang: "ar",
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/admin";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if (client.url.includes(link) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const subscription = await self.registration.pushManager.subscribe(
        event.oldSubscription.options,
      );
      const res = await fetch("/api/push/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription?.endpoint,
          newEndpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
        }),
      });
      if (!res.ok) console.error("Failed to resubscribe", await res.text());
    })(),
  );
});
