import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

const TIME_MAP = {
  'Morning (8am)': { hour: 8, minute: 0 },
  'Midday (12pm)': { hour: 12, minute: 0 },
  'Evening (6pm)': { hour: 18, minute: 0 },
  'Night (9pm)': { hour: 21, minute: 0 },
};

export const scheduleDailyReminder = async (preferredTime = 'Evening (6pm)') => {
  // Cancel existing reminders first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestPermissions();
  if (!granted) return false;

  const time = TIME_MAP[preferredTime] || TIME_MAP['Evening (6pm)'];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SmartSense',
      body: "Time to log today's expenses. Stay on track! 💰",
      sound: false,
    },
    trigger: {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
    },
  });

  return true;
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
