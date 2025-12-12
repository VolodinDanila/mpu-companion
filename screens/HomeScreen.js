import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';

export default function HomeScreen() {
    const [loading, setLoading] = useState(true);
    const [nextAlarm, setNextAlarm] = useState(null);
    const [weather, setWeather] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);

        setTimeout(() => {
            setNextAlarm({
                time: '07:30',
                date: 'Завтра',
                classTime: '09:00',
                className: 'Математический анализ',
                breakdown: {
                    morningRoutine: 60,
                    travelTime: 45,
                    extraTime: 15,
                },
            });

            setWeather({
                temperature: 15,
                feelsLike: 13,
                condition: 'Облачно с прояснениями',
                humidity: 65,
                windSpeed: 5,
            });

            setRecommendations([
                'Оденьтесь теплее — +15°C',
                'Будильник через 14ч 25мин',
                'Хорошая погода для прогулки',
            ]);

            setLoading(false);
        }, 500);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Загрузка данных...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.alarmCard}>
                <Text style={styles.sectionTitle}>Следующий будильник</Text>

                {nextAlarm ? (
                    <View style={styles.alarmInfo}>
                        <Text style={styles.alarmTime}>{nextAlarm.time}</Text>
                        <Text style={styles.alarmDate}>{nextAlarm.date}</Text>

                        <View style={styles.divider} />

                        <Text style={styles.classInfo}>
                            Занятие в {nextAlarm.classTime}
                        </Text>
                        <Text style={styles.className}>{nextAlarm.className}</Text>

                        {nextAlarm.breakdown && (
                            <View style={styles.breakdownContainer}>
                                <Text style={styles.breakdownTitle}>Расчёт времени:</Text>
                                <Text style={styles.breakdownItem}>
                                    Утренняя рутина: {nextAlarm.breakdown.morningRoutine} мин
                                </Text>
                                <Text style={styles.breakdownItem}>
                                    Время в пути: {nextAlarm.breakdown.travelTime} мин
                                </Text>
                                <Text style={styles.breakdownItem}>
                                    Запас времени: {nextAlarm.breakdown.extraTime} мин
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <Text style={styles.noDataText}>
                        Нет запланированных занятий
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    alarmCard: {
        backgroundColor: '#fff',
        margin: 15,
        marginBottom: 10,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    weatherCard: {
        backgroundColor: '#fff',
        margin: 15,
        marginBottom: 10,
        marginTop: 5,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendationsCard: {
        backgroundColor: '#fff',
        margin: 15,
        marginTop: 5,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    alarmInfo: {
        alignItems: 'center',
    },
    alarmTime: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    alarmDate: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 15,
    },
    classInfo: {
        fontSize: 14,
        color: '#666',
    },
    className: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginTop: 5,
    },
    breakdownContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        width: '100%',
    },
    breakdownTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    breakdownItem: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    weatherInfo: {
        alignItems: 'center',
    },
    temperature: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FF9500',
    },
    condition: {
        fontSize: 18,
        color: '#666',
        marginTop: 5,
    },
    weatherDetails: {
        marginTop: 12,
        alignItems: 'center',
    },
    weatherDetailItem: {
        fontSize: 13,
        color: '#666',
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
        color: '#007AFF',
        marginRight: 10,
        marginTop: -2,
    },
    recommendationText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
        lineHeight: 22,
    },
    noDataText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    refreshButton: {
        backgroundColor: '#007AFF',
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
});