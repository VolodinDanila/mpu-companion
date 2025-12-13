import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { loadSettings, saveScheduleCache, loadScheduleCache, clearScheduleCache, loadCustomLessons, addCustomLesson, deleteCustomLesson } from '../utils/storage';
import {
    fetchScheduleFromUniversity,
    parseSchedule,
    getScheduleForDay,
} from '../api/schedule';

export default function ScheduleScreen() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [schedule, setSchedule] = useState([]);
    const [fullSchedule, setFullSchedule] = useState(null);
    const [customLessons, setCustomLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupNumber, setGroupNumber] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const [customSubject, setCustomSubject] = useState('');
    const [customType, setCustomType] = useState('');
    const [customRoom, setCustomRoom] = useState('');
    const [customProfessor, setCustomProfessor] = useState('');
    const [customLessonNumber, setCustomLessonNumber] = useState('');

    const weekDays = [
        { id: 1, name: 'ПН', fullName: 'Понедельник' },
        { id: 2, name: 'ВТ', fullName: 'Вторник' },
        { id: 3, name: 'СР', fullName: 'Среда' },
        { id: 4, name: 'ЧТ', fullName: 'Четверг' },
        { id: 5, name: 'ПТ', fullName: 'Пятница' },
        { id: 6, name: 'СБ', fullName: 'Суббота' },
    ];

    const lessonTimes = {
        1: '09:00-10:30',
        2: '10:40-12:10',
        3: '12:20-13:50',
        4: '14:30-16:00',
        5: '16:10-17:40',
        6: '17:50-19:20',
        7: '19:30-21:00',
    };

    useEffect(() => {
        loadGroupNumber();
        loadCustomLessonsData();
    }, []);

    useEffect(() => {
        if (fullSchedule || customLessons.length > 0) {
            updateScheduleForDay();
        }
    }, [selectedDay, fullSchedule, customLessons]);

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

    const loadCustomLessonsData = async () => {
        try {
            const data = await loadCustomLessons();
            setCustomLessons(data || []);
        } catch (error) {
            console.error('ошибка загрузки кастомных занятий:', error);
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
        let daySchedule = [];

        if (fullSchedule) {
            const universitySchedule = getScheduleForDay(fullSchedule, selectedDay) || [];
            daySchedule = [...universitySchedule];
        }

        const customForDay = customLessons.filter(lesson => lesson.dayNumber === selectedDay);

        customForDay.forEach(custom => {
            daySchedule.push({
                id: `custom-${custom.id}`,
                time: lessonTimes[custom.lessonNumber] || '',
                subject: custom.subject,
                type: custom.type,
                room: custom.room,
                professor: custom.professor,
                lessonNumber: custom.lessonNumber,
                isCustom: true,
                originalId: custom.id,
            });
        });

        daySchedule.sort((a, b) => a.lessonNumber - b.lessonNumber);

        console.log(`📋 обновление расписания для дня ${selectedDay}:`, daySchedule.length, 'занятий');
        setSchedule(daySchedule);
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

    const openCustomLessonModal = () => {
        setCustomSubject('');
        setCustomType('Лекция');
        setCustomRoom('');
        setCustomProfessor('');
        setCustomLessonNumber('1');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleSaveCustomLesson = async () => {
        if (!customSubject.trim()) {
            Alert.alert('ошибка', 'введите название предмета');
            return;
        }

        const lessonNum = parseInt(customLessonNumber, 10);
        if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 7) {
            Alert.alert('ошибка', 'номер пары должен быть от 1 до 7');
            return;
        }

        try {
            const lessonData = {
                subject: customSubject.trim(),
                type: customType.trim() || 'Занятие',
                room: customRoom.trim() || 'не указана',
                professor: customProfessor.trim() || 'не указан',
                lessonNumber: lessonNum,
                dayNumber: selectedDay,
            };

            await addCustomLesson(lessonData);
            await loadCustomLessonsData();
            closeModal();
            Alert.alert('успешно', 'занятие добавлено в расписание');
        } catch (error) {
            console.error('ошибка сохранения занятия:', error);
            Alert.alert('ошибка', 'не удалось добавить занятие');
        }
    };

    const handleDeleteCustomLesson = (lesson) => {
        Alert.alert(
            'удалить занятие?',
            `вы уверены что хотите удалить "${lesson.subject}"?`,
            [
                { text: 'отмена', style: 'cancel' },
                {
                    text: 'удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const idToDelete = lesson.originalId || lesson.id;
                            await deleteCustomLesson(idToDelete);
                            await loadCustomLessonsData();
                        } catch (error) {
                            console.error('ошибка удаления занятия:', error);
                            Alert.alert('ошибка', 'не удалось удалить занятие');
                        }
                    },
                },
            ]
        );
    };

    const renderClassItem = ({ item }) => (
        <TouchableOpacity
            style={styles.classCard}
            onLongPress={() => item.isCustom ? handleDeleteCustomLesson(item) : null}
        >
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{item.time}</Text>
            </View>

            <View style={styles.classInfo}>
                <View style={styles.subjectRow}>
                    <Text style={styles.subjectText}>{item.subject}</Text>
                    {item.isCustom && (
                        <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>своё</Text>
                        </View>
                    )}
                </View>
                <View style={styles.detailsRow}>
                    <View style={[styles.typeBadge, item.isCustom && styles.typeBadgeCustom]}>
                        <Text style={[styles.typeText, item.isCustom && styles.typeTextCustom]}>
                            {item.type}
                        </Text>
                    </View>
                    <Text style={styles.roomText}>{item.room}</Text>
                </View>
                <Text style={styles.professorText}>{item.professor}</Text>
                {item.isCustom && (
                    <Text style={styles.customHint}>удержите для удаления</Text>
                )}
            </View>
        </TouchableOpacity>
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
                <View style={styles.weekButtonsRow}>
                    {weekDays.map(renderDayButton)}
                </View>
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

            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.addCustomButton}
                    onPress={openCustomLessonModal}
                >
                    <Text style={styles.addCustomButtonText}>+ добавить своё занятие</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={refreshSchedule}
                    disabled={!groupNumber}
                >
                    <Text style={styles.updateButtonText}>
                        {groupNumber ? '🔄' : 'укажите группу'}
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>добавить своё занятие</Text>
                            <Text style={styles.modalSubtitle}>
                                день: {weekDays.find(d => d.id === selectedDay)?.fullName}
                            </Text>

                            <Text style={styles.inputLabel}>название предмета *</Text>
                            <TextInput
                                style={styles.input}
                                value={customSubject}
                                onChangeText={setCustomSubject}
                                placeholder="например: консультация по диплому"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.inputLabel}>тип занятия</Text>
                            <TextInput
                                style={styles.input}
                                value={customType}
                                onChangeText={setCustomType}
                                placeholder="лекция / практика / консультация"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.inputLabel}>номер пары * (1-7)</Text>
                            <TextInput
                                style={styles.input}
                                value={customLessonNumber}
                                onChangeText={setCustomLessonNumber}
                                placeholder="1"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            <Text style={styles.inputLabel}>аудитория</Text>
                            <TextInput
                                style={styles.input}
                                value={customRoom}
                                onChangeText={setCustomRoom}
                                placeholder="Пр1234"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.inputLabel}>преподаватель</Text>
                            <TextInput
                                style={styles.input}
                                value={customProfessor}
                                onChangeText={setCustomProfessor}
                                placeholder="Иванов И.И."
                                placeholderTextColor="#999"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={closeModal}
                                >
                                    <Text style={styles.cancelButtonText}>отмена</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleSaveCustomLesson}
                                >
                                    <Text style={styles.saveButtonText}>добавить</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    weekButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 5,
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        minWidth: 50,
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: '#007AFF',
    },
    dayButtonText: {
        fontSize: 13,
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
        paddingBottom: 100,
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
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    customBadge: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    customBadgeText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
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
    typeBadgeCustom: {
        backgroundColor: '#FFF3E0',
    },
    typeText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    typeTextCustom: {
        color: '#FF9500',
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
    customHint: {
        fontSize: 11,
        color: '#FF9500',
        fontStyle: 'italic',
        marginTop: 5,
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
    bottomButtons: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f5f5f5',
    },
    addCustomButton: {
        flex: 1,
        backgroundColor: '#FF9500',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addCustomButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    updateButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
        width: 50,
    },
    updateButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 25,
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#FF9500',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});