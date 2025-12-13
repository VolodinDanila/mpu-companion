import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    SETTINGS: 'app_settings',
    SCHEDULE: 'cached_schedule',
    LAST_ROUTE: 'last_route_data',
    REMINDERS: 'app_reminders',
    CUSTOM_LESSONS: 'custom_lessons',
};

const ADDRESSES_KEY = 'addresses';

const PREDEFINED_ADDRESSES = {
    campuses: [
        { id: 'bs', code: 'БС', name: 'Большая Семёновская', address: 'ул. Б. Семёновская, д. 38', type: 'campus' },
        { id: 'pk', code: 'ПК', name: 'Павла Корчагина', address: 'ул. Павла Корчагина, д. 22', type: 'campus' },
        { id: 'pr', code: 'ПР', name: 'Прянишникова', address: 'ул. Прянишникова, 2А', type: 'campus' },
        { id: 'av', code: 'АВ', name: 'Автозаводская', address: 'ул. Автозаводская, д. 16', type: 'campus' },
        { id: 'm', code: 'М', name: 'Михалковская', address: 'ул. Михалковская, д. 7', type: 'campus' },
    ],
    dorms: [
        { id: 'dorm1', code: '№1', name: 'Общежитие №1', address: 'ул. Малая Семёновская, д. 12', type: 'dorm' },
        { id: 'dorm2', code: '№2', name: 'Общежитие №2', address: 'ул. 7-я Парковая, д. 9/26', type: 'dorm' },
        { id: 'dorm3', code: '№3', name: 'Общежитие №3', address: 'ул. 1-я Дубровская, д. 16А, стр. 2', type: 'dorm' },
        { id: 'dorm4', code: '№4', name: 'Общежитие №4', address: 'ул. 800-летия Москвы, д. 28', type: 'dorm' },
        { id: 'dorm5', code: '№5', name: 'Общежитие №5', address: 'ул. Михалковская, д. 7, корп. 3', type: 'dorm' },
        { id: 'dorm6', code: '№6', name: 'Общежитие №6', address: 'ул. Б. Галушкина, д. 9', type: 'dorm' },
        { id: 'dorm7', code: '№7', name: 'Общежитие №7', address: 'ул. Павла Корчагина, д. 20А, к. 3', type: 'dorm' },
        { id: 'dorm8', code: '№8', name: 'Общежитие №8', address: 'Рижский проезд, д. 15, к. 2', type: 'dorm' },
        { id: 'dorm9', code: '№9', name: 'Общежитие №9', address: 'Рижский проезд, д. 15, к. 1', type: 'dorm' },
        { id: 'dorm10', code: '№10', name: 'Общежитие №10', address: '1-й Балтийский переулок, д. 6/21 корп. 3', type: 'dorm' },
        { id: 'dorm11', code: '№11', name: 'Общежитие №11', address: 'ул. Павла Корчагина, д. 22А, к. 2', type: 'dorm' },
    ],
};

export const loadAddresses = async () => {
    try {
        const customAddresses = await AsyncStorage.getItem(ADDRESSES_KEY);
        return {
            predefined: PREDEFINED_ADDRESSES,
            custom: customAddresses ? JSON.parse(customAddresses) : [],
        };
    } catch (error) {
        console.error('ошибка загрузки адресов:', error);
        return {
            predefined: PREDEFINED_ADDRESSES,
            custom: [],
        };
    }
};

export const saveCustomAddress = async (address) => {
    try {
        const addresses = await loadAddresses();
        const newAddress = {
            id: Date.now().toString(),
            name: address.name,
            address: address.address,
            type: 'custom',
            createdAt: new Date().toISOString(),
        };
        addresses.custom.push(newAddress);
        await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses.custom));
        return newAddress;
    } catch (error) {
        console.error('ошибка сохранения адреса:', error);
        throw error;
    }
};

export const deleteCustomAddress = async (id) => {
    try {
        const addresses = await loadAddresses();
        addresses.custom = addresses.custom.filter(addr => addr.id !== id);
        await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses.custom));
    } catch (error) {
        console.error('ошибка удаления адреса:', error);
        throw error;
    }
};

export const getAllAddressesList = async () => {
    const addresses = await loadAddresses();
    return [
        ...addresses.predefined.campuses,
        ...addresses.predefined.dorms,
        ...addresses.custom,
    ];
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

export const updateCustomLesson = async (id, lessonData) => {
    try {
        const lessons = await loadCustomLessons();
        const index = lessons.findIndex(lesson => lesson.id === id);

        if (index !== -1) {
            lessons[index] = {
                ...lessons[index],
                ...lessonData,
                updatedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(lessons));
        }
    } catch (error) {
        console.error('Ошибка обновления кастомного занятия:', error);
        throw error;
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