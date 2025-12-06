import { Platform, Alert } from 'react-native';

let PushNotification: any = null;
try {
  PushNotification = require('react-native-push-notification');
} catch (e) {
  console.log('Push notification module not available');
}

class NotificationService {
  constructor() {
    this.configure();
  }

  configure() {
    if (!PushNotification) return;
    
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('Notification:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    PushNotification.createChannel(
      {
        channelId: 'pokemon-nearby',
        channelName: 'Pokemon Nearby',
        channelDescription: 'Notifications for nearby Pokemon',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  showPokemonNearbyNotification(pokemonName: string, distance?: number) {
    if (!PushNotification) {
      Alert.alert('Pokemon Nearby!', `A wild ${pokemonName} has appeared nearby!`);
      return;
    }
    PushNotification.localNotification({
      channelId: 'pokemon-nearby',
      title: 'Pokemon Nearby!',
      message: distance 
        ? `A wild ${pokemonName} is ${distance}m away!`
        : `A wild ${pokemonName} has appeared nearby!`,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
    });
  }

  showDailyReminderNotification() {
    if (!PushNotification) return;
    PushNotification.localNotification({
      channelId: 'pokemon-nearby',
      title: 'Daily Pokemon Hunt',
      message: "Don't forget to hunt for Pokemon today!",
      playSound: true,
      soundName: 'default',
    });
  }

  scheduleDailyReminder() {
    if (!PushNotification) return;
    PushNotification.localNotificationSchedule({
      channelId: 'pokemon-nearby',
      title: 'Daily Pokemon Hunt',
      message: "Time to catch some Pokemon!",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      repeatType: 'day',
      playSound: true,
      soundName: 'default',
    });
  }

  showCaptureSuccessNotification(pokemonName: string) {
    if (!PushNotification) return;
    PushNotification.localNotification({
      channelId: 'pokemon-nearby',
      title: 'Pokemon Captured!',
      message: `${pokemonName} has been added to your Pokedex!`,
      playSound: true,
      soundName: 'default',
    });
  }

  cancelAllNotifications() {
    if (!PushNotification) return;
    PushNotification.cancelAllLocalNotifications();
  }
}

export const notificationService = new NotificationService();