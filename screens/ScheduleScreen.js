import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';

export default function ScheduleScreen() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    const weekDays = [
        { id: 1, name: 'ПН', fullName: 'Понедельник' },
        { id: 2, name: 'ВТ', fullName: 'Вторник' },
        { id: 3, name: 'СР', fullName: 'Среда' },
        { id: 4, name: 'ЧТ', fullName: 'Четверг' },
        { id: 5, name: 'ПТ', fullName: 'Пятница' },
        { id: 6, name: 'СБ', fullName: 'Суббота' },
    ];

    const mockScheduleData = {
        1: [
            {
                id: '1-1',
                time: '09:00-10:30',
                subject: 'Математический анализ',
                type: 'Лекция',
                room: 'пр-123',
                professor: 'Иванов И.И.',
            },
            {
                id: '1-2',
                time: '10:40-12:10',
                subject: 'Программирование',
                type: 'Практика',
                room: 'пр-301',
                professor: 'Петрова А.С.',
            },
        ],
        2: [
            {
                id: '2-1',
                time: '12:20-13:50',
                subject: 'Физика',
                type: 'Лекция',
                room: 'пр-215',
                professor: 'Сидоров П.П.',
            },
        ],
        3: [],
        4: [
            {
                id: '4-1',
                time: '09:00-10:30',
                subject: 'Английский язык',
                type: 'Практика',
                room: 'пк-401',
                professor: 'Смирнова О.В.',
            },
        ],
        5: [],
        6: [],
    };

    useEffect(() => {
        loadSchedule();
    }, [selectedDay]);

    const loadSchedule = () => {
        setLoading(true);
        setTimeout(() => {
            setSchedule(mockScheduleData[selectedDay] || []);
            setLoading(false);
        }, 300);
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
});