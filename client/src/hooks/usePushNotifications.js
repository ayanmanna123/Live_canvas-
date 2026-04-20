import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = 'BLLrmpHMsZZIxCNckATvd8OaGEWxwBpA9yENWDXU6qqemjfJJ5VBYgXy5BT42R5hfk2EvZ6ULEPr2NALUjMn34c';

export const usePushNotifications = (socket, roomId, userId, userName) => {
    const [permission, setPermission] = useState(Notification.permission);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeUser = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Handle existing subscription with potentially different VAPID key
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('Unsubscribing from existing push subscription...');
                await existingSubscription.unsubscribe();
            }

            console.log('Creating new push subscription with current VAPID key...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send subscription to backend via socket
            socket.emit('subscribe-push', {
                roomId,
                userId,
                userName,
                subscription
            });

            setIsSubscribed(true);
            console.log('User subscribed to push notifications');
        } catch (error) {
            console.error('Failed to subscribe user:', error);
        }
    }, [socket, roomId, userId, userName]);

    useEffect(() => {
        if (socket && userId && permission === 'granted' && !isSubscribed) {
            subscribeUser();
        }
    }, [socket, userId, permission, isSubscribed, subscribeUser]);

    const requestPermission = async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
            subscribeUser();
        }
        return result;
    };

    return { permission, isSubscribed, requestPermission };
};
