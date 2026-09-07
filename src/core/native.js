import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NativeBridge {
    static isNative() {
        return Capacitor.isNativePlatform();
    }

    static async getCurrentPosition() {
        if (this.isNative()) {
            const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
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
        if (this.isNative()) {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri
            });
            return image.webPath;
        } else {
            console.warn("Kamera natywna dostępna tylko w aplikacji mobilnej Capacitor.");
            return null;
        }
    }

    static async scheduleNotification(title, body) {
        if (this.isNative()) {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title,
                        body: body,
                        id: new Date().getTime(),
                        schedule: { at: new Date(new Date().getTime() + 1000) },
                        sound: null,
                        attachments: [],
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    }
}
