import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { loadSettings, loadScheduleCache, loadReminders, loadCustomLessons, getTravelTime, getAllAddressesList } from '../utils/storage';
import { fetchWeatherByCity, getMockWeatherData, getWeatherRecommendations } from '../api/weather';
import { getNextClass } from '../api/schedule';
import { calculateAlarm, getTimeUntilAlarm } from '../utils/alarmCalculator';
import { scheduleAlarm, cancelAlarm, requestPermissions } from '../utils/alarmManager';

export default function HomeScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [nextAlarm, setNextAlarm] = useState(null);
    const [weather, setWeather] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);
    const [alarmData, setAlarmData] = useState({
        time: null,
        breakdown: null,
        nextClass: null,
    });
    const [alarmActive, setAlarmActive] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            loadData();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        requestPermissions();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const settings = await loadSettings();
            await loadWeatherData(settings);
            await loadAlarmData(settings);
            setLoading(false);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setLoading(false);
        }
    };

    const loadAlarmData = async () => {
        try {
            const settings = await loadSettings();
            const cachedSchedule = await loadScheduleCache();
            const customLessons = await loadCustomLessons();
            const reminders = await loadReminders();
            const addressList = await getAllAddressesList();

            const now = new Date();

            setAddresses(addressList);

            if (!cachedSchedule && (!customLessons || customLessons.length === 0) && (!reminders || reminders.length === 0)) {
                setAlarmData({
                    time: null,
                    breakdown: null,
                    nextClass: null,
                });
                setAlarmActive(false);
                await cancelAlarm();
                return;
            }

            const routine = settings?.routineMinutes || 30;
            const buffer = settings?.bufferMinutes || 15;

            let allCandidates = [];

            if (cachedSchedule) {
                const scheduleKeys = Object.keys(cachedSchedule);

                for (const dayKey of scheduleKeys) {
                    const dayLessons = cachedSchedule[dayKey] || [];

                    for (const lesson of dayLessons) {
                        const [hours, minutes] = lesson.time.split('-')[0].split(':').map(Number);
                        const targetDayOfWeek = parseInt(dayKey, 10);
                        const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

                        for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
                            const eventDate = new Date(now);

                            let daysToAdd = targetDayOfWeek - currentDayOfWeek;
                            if (daysToAdd < 0) daysToAdd += 7;
                            daysToAdd += weekOffset * 7;

                            eventDate.setDate(eventDate.getDate() + daysToAdd);
                            eventDate.setHours(hours, minutes, 0, 0);

                            if (eventDate <= now) continue;

                            let travelTime = 90;
                            if (lesson.room) {
                                const roomStr = lesson.room.toLowerCase();
                                let campusCode = null;
                                if (roomStr.includes('пр')) campusCode = 'pr';
                                else if (roomStr.includes('пк')) campusCode = 'pk';
                                else if (roomStr.includes('бс') || roomStr.includes('б') || roomStr.startsWith('б')) campusCode = 'bs';
                                else if (roomStr.includes('ав')) campusCode = 'av';
                                else if (roomStr.includes('м')) campusCode = 'm';

                                if (campusCode) {
                                    const campus = addressList.find(a => a.id === campusCode);
                                    if (campus) {
                                        travelTime = await getTravelTime(campus.id);
                                    }
                                }
                            }

                            const alarmTime = new Date(eventDate);
                            alarmTime.setMinutes(alarmTime.getMinutes() - routine - travelTime - buffer);

                            if (alarmTime > now) {
                                allCandidates.push({
                                    event: { ...lesson, dayNumber: targetDayOfWeek },
                                    eventDate,
                                    alarmTime,
                                    travelTime,
                                });
                                break;
                            }
                        }
                    }
                }
            }

            if (customLessons && customLessons.length > 0) {
                const lessonTimes = {
                    1: '09:00-10:30',
                    2: '10:40-12:10',
                    3: '12:20-13:50',
                    4: '14:30-16:00',
                    5: '16:10-17:40',
                    6: '17:50-19:20',
                    7: '19:30-21:00',
                };

                for (const custom of customLessons) {
                    const timeStr = lessonTimes[custom.lessonNumber] || '';
                    const [hours, minutes] = timeStr.split('-')[0].split(':').map(Number);
                    const targetDayOfWeek = custom.dayNumber;
                    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

                    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
                        const eventDate = new Date(now);

                        let daysToAdd = targetDayOfWeek - currentDayOfWeek;
                        if (daysToAdd < 0) daysToAdd += 7;
                        daysToAdd += weekOffset * 7;

                        eventDate.setDate(eventDate.getDate() + daysToAdd);
                        eventDate.setHours(hours, minutes, 0, 0);

                        if (eventDate <= now) continue;

                        let travelTime = 90;
                        if (custom.addressId) {
                            travelTime = await getTravelTime(custom.addressId);
                        }

                        const alarmTime = new Date(eventDate);
                        alarmTime.setMinutes(alarmTime.getMinutes() - routine - travelTime - buffer);

                        if (alarmTime > now) {
                            allCandidates.push({
                                event: {
                                    ...custom,
                                    time: timeStr,
                                    isCustom: true,
                                },
                                eventDate,
                                alarmTime,
                                travelTime,
                            });
                            break;
                        }
                    }
                }
            }

            if (reminders && reminders.length > 0) {
                for (const reminder of reminders) {
                    const [day, month, year] = reminder.date.split('.').map(Number);
                    const [hours, minutes] = reminder.time.split(':').map(Number);
                    const eventDate = new Date(year, month - 1, day, hours, minutes);

                    if (eventDate <= now) continue;

                    let travelTime = 90;
                    if (reminder.addressId) {
                        travelTime = await getTravelTime(reminder.addressId);
                    }

                    const alarmTime = new Date(eventDate);
                    alarmTime.setMinutes(alarmTime.getMinutes() - routine - travelTime - buffer);

                    if (alarmTime > now) {
                        allCandidates.push({
                            event: {
                                id: `reminder-${reminder.id}`,
                                time: reminder.time,
                                subject: reminder.title,
                                type: 'Напоминание',
                                room: reminder.description || '',
                                isReminder: true,
                            },
                            eventDate,
                            alarmTime,
                            travelTime,
                        });
                    }
                }
            }

            if (allCandidates.length === 0) {
                setAlarmData({
                    time: null,
                    breakdown: null,
                    nextClass: null,
                });
                setAlarmActive(false);
                await cancelAlarm();
                return;
            }

            allCandidates.sort((a, b) => a.alarmTime - b.alarmTime);
            const nearest = allCandidates[0];

            const alarmDataToSet = {
                time: nearest.alarmTime,
                breakdown: {
                    routine,
                    travel: nearest.travelTime,
                    buffer,
                },
                nextClass: {
                    subject: nearest.event.subject,
                    time: nearest.event.time,
                    room: nearest.event.room || '',
                    day: nearest.event.dayNumber,
                },
            };

            setAlarmData(alarmDataToSet);

            const result = await scheduleAlarm(alarmDataToSet);
            setAlarmActive(result !== null);

        } catch (error) {
            console.error('Ошибка загрузки данных будильника:', error);
            setAlarmData({
                time: null,
                breakdown: null,
                nextClass: null,
            });
            setAlarmActive(false);
        }
    };

    const loadWeatherData = async (settings) => {
        try {
            let weatherData;

            if (settings?.homeAddress) {
                try {
                    const city = settings.homeAddress.split(',')[0].trim();
                    weatherData = await fetchWeatherByCity(city);
                } catch (apiError) {
                    weatherData = getMockWeatherData();
                }
            } else {
                weatherData = getMockWeatherData();
            }

            setWeather(weatherData);
            const weatherRecs = getWeatherRecommendations(weatherData);
            setRecommendations(weatherRecs);

        } catch (error) {
            console.error('Ошибка загрузки погоды:', error);
            const mockWeather = getMockWeatherData();
            setWeather(mockWeather);
            setRecommendations(getWeatherRecommendations(mockWeather));
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Загрузка данных...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.alarmCard}>
                <View style={styles.alarmHeader}>
                    <Text style={styles.sectionTitle}>Следующий будильник</Text>
                    {alarmActive && (
                        <View style={styles.activeIndicator}>
                            <View style={styles.activeDot} />
                            <Text style={styles.activeText}>Активен</Text>
                        </View>
                    )}
                </View>

                {alarmData.time && alarmData.nextClass ? (
                    <View style={styles.alarmInfo}>
                        <Text style={styles.alarmTime}>
                            {alarmData.time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.alarmDate}>
                            {alarmData.time.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.classInfo}>
                            Занятие в {alarmData.nextClass.time.split('-')[0]}
                        </Text>
                        <Text style={styles.className}>{alarmData.nextClass.subject}</Text>
                        {alarmData.nextClass.room && (
                            <Text style={styles.classRoom}>{alarmData.nextClass.room}</Text>
                        )}

                        {alarmData.breakdown && (
                            <View style={styles.breakdownContainer}>
                                <Text style={styles.breakdownTitle}>Расчёт времени:</Text>
                                <Text style={styles.breakdownItem}>
                                    Утренняя рутина: {alarmData.breakdown.routine} мин
                                </Text>
                                <Text style={styles.breakdownItem}>
                                    Время в пути: {alarmData.breakdown.travel} мин
                                </Text>
                                <Text style={styles.breakdownItem}>
                                    Запас времени: {alarmData.breakdown.buffer} мин
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <Text style={styles.noDataText}>
                        Нет запланированных занятий.{'\n'}
                        Добавьте расписание в настройках.
                    </Text>
                )}
            </View>

            <View style={styles.weatherCard}>
                <Text style={styles.sectionTitle}>Погода на утро</Text>

                {weather ? (
                    <View style={styles.weatherInfo}>
                        <Text style={styles.temperature}>{weather.temperature}°C</Text>
                        <Text style={styles.condition}>{weather.condition}</Text>
                        <View style={styles.weatherDetails}>
                            <Text style={styles.weatherDetailItem}>
                                Ощущается как {weather.feelsLike}°C
                            </Text>
                            <Text style={styles.weatherDetailItem}>
                                Влажность: {weather.humidity}%
                            </Text>
                            <Text style={styles.weatherDetailItem}>
                                Ветер: {weather.windSpeed} м/с
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noDataText}>Нет данных о погоде</Text>
                )}
            </View>

            <View style={styles.recommendationsCard}>
                <Text style={styles.sectionTitle}>Рекомендации</Text>

                {recommendations.length > 0 ? (
                    <View style={styles.recommendationsList}>
                        {recommendations.map((recommendation, index) => (
                            <View key={index} style={styles.recommendationItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.recommendationText}>{recommendation}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noDataText}>Нет рекомендаций</Text>
                )}
            </View>

            <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadData}
            >
                <Text style={styles.refreshButtonText}>Обновить данные</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.textSecondary,
    },
    alarmCard: {
        backgroundColor: theme.card,
        margin: 15,
        marginBottom: 10,
        padding: 20,
        borderRadius: 12,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    alarmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.success + '20',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.success,
        marginRight: 6,
    },
    activeText: {
        fontSize: 12,
        color: theme.success,
        fontWeight: '600',
    },
    weatherCard: {
        backgroundColor: theme.card,
        margin: 15,
        marginBottom: 10,
        marginTop: 5,
        padding: 20,
        borderRadius: 12,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendationsCard: {
        backgroundColor: theme.card,
        margin: 15,
        marginTop: 5,
        padding: 20,
        borderRadius: 12,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
    },
    alarmInfo: {
        alignItems: 'center',
    },
    alarmTime: {
        fontSize: 48,
        fontWeight: 'bold',
        color: theme.primary,
    },
    alarmDate: {
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 5,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 15,
    },
    classInfo: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    className: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        marginTop: 5,
    },
    breakdownContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        width: '100%',
    },
    breakdownTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
        marginBottom: 8,
    },
    breakdownItem: {
        fontSize: 12,
        color: theme.textTertiary,
        marginTop: 4,
    },
    weatherInfo: {
        alignItems: 'center',
    },
    temperature: {
        fontSize: 42,
        fontWeight: 'bold',
        color: theme.warning,
    },
    condition: {
        fontSize: 18,
        color: theme.textSecondary,
        marginTop: 5,
    },
    weatherDetails: {
        marginTop: 12,
        alignItems: 'center',
    },
    weatherDetailItem: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 4,
    },
    recommendationsList: {
        marginTop: 5,
    },
    recommendationItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    bullet: {
        fontSize: 18,
        color: theme.primary,
        marginRight: 10,
        marginTop: -2,
    },
    recommendationText: {
        fontSize: 15,
        color: theme.text,
        flex: 1,
        lineHeight: 22,
    },
    noDataText: {
        fontSize: 14,
        color: theme.textTertiary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    refreshButton: {
        backgroundColor: theme.primary,
        margin: 15,
        marginTop: 5,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    classRoom: {
        fontSize: 14,
        color: theme.textTertiary,
        marginTop: 2,
    },
});