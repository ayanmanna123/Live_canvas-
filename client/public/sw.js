self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/favicon.svg',
            badge: '/favicon.svg',
            data: data.data,
            vibrate: [100, 50, 100],
            actions: [
                { action: 'open', title: 'Open App' },
                { action: 'close', title: 'Close' }
            ]
        };

        event.waitUntil(
            Promise.all([
                self.registration.showNotification(data.title, options),
                // Play notification sound if possible
                // Note: Playing sound in SW is limited, usually handled by OS but we can try
            ])
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                        break;
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
