import { Platform, Alert, PermissionsAndroid } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

let PushNotification: any = null;
try {
  PushNotification = require('react-native-push-notification');
  PushNotification.configure({
    onRegister: function (token: any) {
      console.log('TOKEN:', token);
    },
    onNotification: function (notification: any) {
      console.log('NOTIFICATION:', notification);
      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });
} catch (e) {
  console.log('Push notification module not available');
}

class NotificationService {
  constructor() {
    this.configure();
  }

  configure() {
    if (!PushNotification) return;

    if (Platform.OS === 'android') {
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
  }

  async requestPermissions() {
    if (!PushNotification) return false;
    
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('Android notification permission:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const permissions = await PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        });
        console.log('iOS notification permissions:', permissions);
        return permissions.alert || permissions.badge || permissions.sound;
      }
    } catch (error) {
      console.log('Permission request error:', error);
      return false;
    }
  }

  showPokemonNearbyNotification(pokemonName: string, distance?: number) {
    console.log(`Showing notification for ${pokemonName} at ${distance}m`);
    
    const message = distance 
      ? `A wild ${pokemonName} is ${distance}m away!`
      : `A wild ${pokemonName} has appeared nearby!`;
    
    if (!PushNotification) {
      console.log('PushNotification not available, using Alert');
      Alert.alert('Pokemon Nearby! 🔔', message);
      return;
    }
    
    if (Platform.OS === 'ios') {
      console.log('Sending iOS notification:', message);
      PushNotificationIOS.addNotificationRequest({
        id: `pokemon-${Date.now()}`,
        title: 'Pokemon Nearby!',
        body: message,
        sound: 'default',
        badge: 1,
        userInfo: { pokemonName },
      }).then(() => {
        console.log('iOS notification sent successfully');
      }).catch((error) => {
        console.log('iOS notification error:', error);
        Alert.alert('Pokemon Nearby! 🔔', message);
      });
    } else {
      PushNotification.localNotification({
        channelId: 'pokemon-nearby',
        title: 'Pokemon Nearby!',
        message: message,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        vibrate: true,
        vibration: 300,
      });
    }
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