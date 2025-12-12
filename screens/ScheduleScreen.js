import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { loadSettings, saveScheduleCache, loadScheduleCache, clearScheduleCache } from '../utils/storage';
import {
    fetchScheduleFromUniversity,
    parseSchedule,
    getScheduleForDay,
} from '../api/schedule';

export default function ScheduleScreen() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [schedule, setSchedule] = useState([]);
    const [fullSchedule, setFullSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [groupNumber, setGroupNumber] = useState('');

    const weekDays = [
        { id: 1, name: 'ПН', fullName: 'Понедельник' },
        { id: 2, name: 'ВТ', fullName: 'Вторник' },
        { id: 3, name: 'СР', fullName: 'Среда' },
        { id: 4, name: 'ЧТ', fullName: 'Четверг' },
        { id: 5, name: 'ПТ', fullName: 'Пятница' },
        { id: 6, name: 'СБ', fullName: 'Суббота' },
    ];

    useEffect(() => {
        loadGroupNumber();
    }, []);

    useEffect(() => {
        if (fullSchedule) {
            updateScheduleForDay();
        }
    }, [selectedDay, fullSchedule]);

    const loadGroupNumber = async () => {
        try {
            const settings = await loadSettings();
            if (settings && settings.groupNumber) {
                setGroupNumber(settings.groupNumber);
                loadSchedule(settings.groupNumber);
            } else {
                setLoading(false);
                Alert.alert(
                    'Настройка группы',
                    'Укажите номер группы в разделе "Настройки" для загрузки расписания',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('ошибка загрузки настроек:', error);
            setLoading(false);
        }
    };

    const loadSchedule = async (group) => {
        setLoading(true);
        try {
            console.log(`📅 начинаю загрузку расписания для группы: ${group}`);

            const cachedSchedule = await loadScheduleCache();
            if (cachedSchedule) {
                console.log('✅ расписание загружено из кэша');
                setFullSchedule(cachedSchedule);
                setLoading(false);
                return;
            }

            console.log('🌐 загружаю расписание с сервера rasp.dmami.ru...');
            const rawSchedule = await fetchScheduleFromUniversity(group);
            console.log('📥 получены данные:', rawSchedule);

            const parsed = parseSchedule(rawSchedule);
            console.log('✅ расписание распарсено:', Object.keys(parsed).length, 'дней');

            setFullSchedule(parsed);
            await saveScheduleCache(parsed);
            console.log('💾 расписание сохранено в кэш');

            setLoading(false);
        } catch (error) {
            console.error('❌ ошибка загрузки расписания:', error);
            setLoading(false);
            Alert.alert(
                'Ошибка загрузки расписания',
                error.message || 'Не удалось загрузить расписание. Проверьте номер группы.',
                [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Повторить', onPress: () => loadSchedule(group) }
                ]
            );
        }
    };

    const updateScheduleForDay = () => {
        if (!fullSchedule) {
            setSchedule([]);
            return;
        }

        const daySchedule = getScheduleForDay(fullSchedule, selectedDay);
        setSchedule(daySchedule || []);
    };

    const refreshSchedule = async () => {
        if (!groupNumber) {
            Alert.alert('Ошибка', 'Укажите номер группы в настройках');
            return;
        }

        console.log('🗑️ очистка кэша расписания...');
        await clearScheduleCache();
        console.log('🔄 загрузка свежего расписания...');
        loadSchedule(groupNumber);
    };

    const renderClassItem = ({ item }) => (
        <View style={styles.classCard}>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{item.time}</Text>
            </View>

            <View style={styles.classInfo}>
                <Text style={styles.subjectText}>{item.subject}</Text>
                <View style={styles.detailsRow}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                    <Text style={styles.roomText}>{item.room}</Text>
                </View>
                <Text style={styles.professorText}>{item.professor}</Text>
            </View>
        </View>
    );

    const renderDayButton = (day) => (
        <TouchableOpacity
            key={day.id}
            style={[
                styles.dayButton,
                selectedDay === day.id && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(day.id)}
        >
            <Text
                style={[
                    styles.dayButtonText,
                    selectedDay === day.id && styles.dayButtonTextActive,
                ]}
            >
                {day.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.weekSelector}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.weekSelectorContent}
                >
                    {weekDays.map(renderDayButton)}
                </ScrollView>
            </View>

            <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>
                    {weekDays.find(d => d.id === selectedDay)?.fullName}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Загрузка расписания...</Text>
                </View>
            ) : schedule.length > 0 ? (
                <FlatList
                    data={schedule}
                    renderItem={renderClassItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.scheduleList}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        📚 В этот день занятий нет
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.updateButton}
                onPress={refreshSchedule}
                disabled={!groupNumber}
            >
                <Text style={styles.updateButtonText}>
                    {groupNumber ? '🔄 Обновить расписание' : 'Укажите группу в настройках'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    weekSelector: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    weekSelectorContent: {
        paddingHorizontal: 15,
    },
    dayButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    dayButtonActive: {
        backgroundColor: '#007AFF',
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    dayButtonTextActive: {
        color: '#fff',
    },
    dayHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    dayHeaderText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    scheduleList: {
        padding: 15,
    },
    classCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timeContainer: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 2,
        borderRightColor: '#007AFF',
        marginRight: 15,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#007AFF',
        textAlign: 'center',
    },
    classInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    subjectText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    typeBadge: {
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 10,
    },
    typeText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    roomText: {
        fontSize: 14,
        color: '#666',
    },
    professorText: {
        fontSize: 13,
        color: '#999',
        marginTop: 3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    updateButton: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    updateButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
});