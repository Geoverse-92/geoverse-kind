export class NativeBridge {
    static isNative() {
        return window.Capacitor && window.Capacitor.isNativePlatform();
    }

    static async getCurrentPosition() {
        if (this.isNative() && window.Capacitor.Plugins.Geolocation) {
            const coordinates = await window.Capacitor.Plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            return {
                lat: coordinates.coords.latitude,
                lng: coordinates.coords.longitude
            };
        } else {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) return reject("Brak wsparcia dla GPS");
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    err => reject(err),
                    { enableHighAccuracy: true }
                );
            });
        }
    }

    static async takePicture() {
        if (this.isNative() && window.Capacitor.Plugins.Camera) {
            const image = await window.Capacitor.Plugins.Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: 'uri'
            });
            return image.webPath;
        } else {
            console.warn("Kamera natywna dostępna tylko w aplikacji mobilnej.");
            return null;
        }
    }

    static async scheduleNotification(title, body) {
        if (this.isNative() && window.Capacitor.Plugins.LocalNotifications) {
            await window.Capacitor.Plugins.LocalNotifications.schedule({
                notifications: [{
                    title: title,
                    body: body,
                    id: new Date().getTime(),
                    schedule: { at: new Date(new Date().getTime() + 1000) }
                }]
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    }
}
