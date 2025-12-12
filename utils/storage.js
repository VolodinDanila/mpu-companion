import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    SETTINGS: 'app_settings',
    SCHEDULE: 'cached_schedule',
    LAST_ROUTE: 'last_route_data',
    REMINDERS: 'app_reminders',
    CUSTOM_LESSONS: 'custom_lessons',
};

export const saveSettings = async (settings) => {
    try {
        await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        console.log('✅ настройки сохранены');
        return true;
    } catch (error) {
        console.error('❌ ошибка сохранения настроек:', error);
        return false;
    }
};

export const loadSettings = async () => {
    try {
        const data = await AsyncStorage.getItem(KEYS.SETTINGS);
        if (data) {
            console.log('✅ настройки загружены');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('❌ ошибка загрузки настроек:', error);
        return null;
    }
};

export const saveScheduleCache = async (schedule) => {
    try {
        const cacheData = {
            schedule,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(KEYS.SCHEDULE, JSON.stringify(cacheData));
        console.log('✅ расписание закэшировано');
        return true;
    } catch (error) {
        console.error('❌ ошибка кэширования расписания:', error);
        return false;
    }
};

export const loadScheduleCache = async (maxAge = 24 * 60 * 60 * 1000) => {
    try {
        const data = await AsyncStorage.getItem(KEYS.SCHEDULE);
        if (!data) return null;

        const cacheData = JSON.parse(data);
        const age = Date.now() - cacheData.timestamp;

        if (age > maxAge) {
            console.log('⚠️ кэш расписания устарел');
            return null;
        }

        console.log('✅ расписание загружено из кэша');
        return cacheData.schedule;
    } catch (error) {
        console.error('❌ ошибка загрузки кэша расписания:', error);
        return null;
    }
};

export const saveRouteData = async (routeData) => {
    try {
        await AsyncStorage.setItem(KEYS.LAST_ROUTE, JSON.stringify(routeData));
        return true;
    } catch (error) {
        console.error('❌ ошибка сохранения маршрута:', error);
        return false;
    }
};

export const loadRouteData = async () => {
    try {
        const data = await AsyncStorage.getItem(KEYS.LAST_ROUTE);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ ошибка загрузки маршрута:', error);
        return null;
    }
};

export const clearScheduleCache = async () => {
    try {
        await AsyncStorage.removeItem(KEYS.SCHEDULE);
        console.log('✅ кэш расписания очищен');
        return true;
    } catch (error) {
        console.error('❌ ошибка очистки кэша расписания:', error);
        return false;
    }
};

export const clearAllData = async () => {
    try {
        await AsyncStorage.clear();
        console.log('✅ все данные очищены');
        return true;
    } catch (error) {
        console.error('❌ ошибка очистки данных:', error);
        return false;
    }
};

export const loadReminders = async () => {
    try {
        const data = await AsyncStorage.getItem(KEYS.REMINDERS);
        if (data) {
            const reminders = JSON.parse(data);
            console.log(`✅ загружено напоминаний: ${reminders.length}`);
            return reminders;
        }
        return [];
    } catch (error) {
        console.error('❌ ошибка загрузки напоминаний:', error);
        return [];
    }
};

export const saveReminders = async (reminders) => {
    try {
        await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
        console.log(`✅ сохранено напоминаний: ${reminders.length}`);
        return true;
    } catch (error) {
        console.error('❌ ошибка сохранения напоминаний:', error);
        return false;
    }
};

export const addReminder = async (reminder) => {
    try {
        const reminders = await loadReminders();
        const newReminder = {
            ...reminder,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        reminders.push(newReminder);
        await saveReminders(reminders);
        console.log('✅ напоминание добавлено:', newReminder.title);
        return newReminder;
    } catch (error) {
        console.error('❌ ошибка добавления напоминания:', error);
        return null;
    }
};

export const updateReminder = async (id, updates) => {
    try {
        const reminders = await loadReminders();
        const index = reminders.findIndex(r => r.id === id);
        if (index !== -1) {
            reminders[index] = {
                ...reminders[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            await saveReminders(reminders);
            console.log('✅ напоминание обновлено:', reminders[index].title);
            return reminders[index];
        }
        return null;
    } catch (error) {
        console.error('❌ ошибка обновления напоминания:', error);
        return null;
    }
};

export const deleteReminder = async (id) => {
    try {
        const reminders = await loadReminders();
        const filtered = reminders.filter(r => r.id !== id);
        await saveReminders(filtered);
        console.log('✅ напоминание удалено');
        return true;
    } catch (error) {
        console.error('❌ ошибка удаления напоминания:', error);
        return false;
    }
};

export const loadCustomLessons = async () => {
    try {
        const data = await AsyncStorage.getItem(KEYS.CUSTOM_LESSONS);
        if (data) {
            const lessons = JSON.parse(data);
            console.log(`✅ загружено пользовательских занятий: ${lessons.length}`);
            return lessons;
        }
        return [];
    } catch (error) {
        console.error('❌ ошибка загрузки пользовательских занятий:', error);
        return [];
    }
};

export const saveCustomLessons = async (lessons) => {
    try {
        await AsyncStorage.setItem(KEYS.CUSTOM_LESSONS, JSON.stringify(lessons));
        console.log(`✅ сохранено пользовательских занятий: ${lessons.length}`);
        return true;
    } catch (error) {
        console.error('❌ ошибка сохранения пользовательских занятий:', error);
        return false;
    }
};

export const addCustomLesson = async (lesson) => {
    try {
        const lessons = await loadCustomLessons();
        const newLesson = {
            ...lesson,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        lessons.push(newLesson);
        await saveCustomLessons(lessons);
        console.log('✅ пользовательское занятие добавлено:', newLesson.subject);
        return newLesson;
    } catch (error) {
        console.error('❌ ошибка добавления занятия:', error);
        return null;
    }
};

export const updateCustomLesson = async (id, updates) => {
    try {
        const lessons = await loadCustomLessons();
        const index = lessons.findIndex(l => l.id === id);
        if (index !== -1) {
            lessons[index] = {
                ...lessons[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            await saveCustomLessons(lessons);
            console.log('✅ занятие обновлено:', lessons[index].subject);
            return lessons[index];
        }
        return null;
    } catch (error) {
        console.error('❌ ошибка обновления занятия:', error);
        return null;
    }
};

export const deleteCustomLesson = async (id) => {
    try {
        const lessons = await loadCustomLessons();
        const filtered = lessons.filter(l => l.id !== id);
        await saveCustomLessons(filtered);
        console.log('✅ занятие удалено');
        return true;
    } catch (error) {
        console.error('❌ ошибка удаления занятия:', error);
        return false;
    }
};