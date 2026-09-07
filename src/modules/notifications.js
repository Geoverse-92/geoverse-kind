export class PushManager {
    static async requestPermission() {
        if (!('Notification' in window)) return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    static sendLocalNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/assets/icon-192.png'
            });
        }
    }
}
