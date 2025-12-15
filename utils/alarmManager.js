import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALARM_KEY = 'scheduled_alarm';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('⚠️ нет разрешения на уведомления');
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'уведомления',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: true,
        });
    }

    return true;
};

export const scheduleAlarm = async (alarmData) => {
    try {
        await cancelAlarm();

        if (!alarmData || !alarmData.time) {
            console.log('⚠️ нет данных для будильника');
            return null;
        }

        const now = new Date();
        const alarmTime = alarmData.time;

        if (alarmTime <= now) {
            console.log('⚠️ время будильника в прошлом');
            return null;
        }

        const secondsUntilAlarm = Math.floor((alarmTime - now) / 1000);

        console.log('📅 установка будильника:');
        console.log('  будильник:', alarmTime.toLocaleString('ru-RU'));
        console.log('  через секунд:', secondsUntilAlarm);
        console.log('  через минут:', Math.floor(secondsUntilAlarm / 60));

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ пора вставать',
                body: `${alarmData.nextClass.subject}\n${alarmData.nextClass.time} • ${alarmData.nextClass.room || 'аудитория не указана'}`,
                sound: true,
                priority: 'high',
            },
            trigger: {
                seconds: secondsUntilAlarm,
            },
        });

        await AsyncStorage.setItem(ALARM_KEY, JSON.stringify({
            notificationId,
            alarmData: {
                ...alarmData,
                time: alarmData.time.toISOString(),
            },
            scheduledAt: new Date().toISOString(),
        }));

        console.log(`✅ будильник установлен, id: ${notificationId}`);
        return notificationId;

    } catch (error) {
        console.error('❌ ошибка установки будильника:', error);
        return null;
    }
};

export const cancelAlarm = async () => {
    try {
        const stored = await AsyncStorage.getItem(ALARM_KEY);
        if (stored) {
            const { notificationId } = JSON.parse(stored);
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            await AsyncStorage.removeItem(ALARM_KEY);
            console.log('✅ будильник отменён');
        }
    } catch (error) {
        console.error('❌ ошибка отмены будильника:', error);
    }
};

export const getScheduledAlarm = async () => {
    try {
        const stored = await AsyncStorage.getItem(ALARM_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const exists = scheduled.find(n => n.identifier === data.notificationId);

            if (exists) {
                return data.alarmData;
            } else {
                await AsyncStorage.removeItem(ALARM_KEY);
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error('❌ ошибка получения будильника:', error);
        return null;
    }
};