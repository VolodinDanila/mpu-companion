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
    Linking,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { loadSettings, saveScheduleCache, loadScheduleCache, clearScheduleCache, loadCustomLessons, addCustomLesson, deleteCustomLesson, getAllAddressesList } from '../utils/storage';
import {
    fetchScheduleFromUniversity,
    parseSchedule,
    getScheduleForDay,
} from '../api/schedule';
import { lightHaptic, mediumHaptic, heavyHaptic, selectionHaptic } from '../utils/haptics';

export default function ScheduleScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [selectedDay, setSelectedDay] = useState(1);
    const [schedule, setSchedule] = useState([]);
    const [fullSchedule, setFullSchedule] = useState(null);
    const [customLessons, setCustomLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupNumber, setGroupNumber] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [addressPickerVisible, setAddressPickerVisible] = useState(false);

    const [customSubject, setCustomSubject] = useState('');
    const [customType, setCustomType] = useState('');
    const [customRoom, setCustomRoom] = useState('');
    const [customProfessor, setCustomProfessor] = useState('');
    const [customLessonNumber, setCustomLessonNumber] = useState('');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [homeAddress, setHomeAddress] = useState('');
    const [transportMode, setTransportMode] = useState('transit');

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
        loadHomeAddress();
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
            console.error('Ошибка загрузки настроек:', error);
            setLoading(false);
        }
    };

    const loadHomeAddress = async () => {
        try {
            const settings = await loadSettings();
            if (settings) {
                if (settings.homeAddress) {
                    setHomeAddress(settings.homeAddress);
                }
                if (settings.transportMode) {
                    setTransportMode(settings.transportMode);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    };

    const loadCustomLessonsData = async () => {
        try {
            const data = await loadCustomLessons();
            setCustomLessons(data || []);
        } catch (error) {
            console.error('Ошибка загрузки кастомных занятий:', error);
        }
    };

    const loadAddressesList = async () => {
        try {
            const list = await getAllAddressesList();
            setAddresses(list);
        } catch (error) {
            console.error('Ошибка загрузки адресов:', error);
        }
    };

    const loadSchedule = async (group) => {
        setLoading(true);
        try {
            console.log(`📅 Начинаю загрузку расписания для группы: ${group}`);

            const cachedScheduleData = await loadScheduleCache();
            if (cachedScheduleData) {
                console.log('✅ Расписание загружено из кэша');
                setFullSchedule(cachedScheduleData);
                setLoading(false);
                return;
            }

            console.log('🌐 Загружаю расписание с сервера...');
            const rawSchedule = await fetchScheduleFromUniversity(group);
            console.log('📥 Получены данные:', rawSchedule);

            const parsed = parseSchedule(rawSchedule);
            console.log('✅ Расписание распарсено');

            setFullSchedule(parsed);
            await saveScheduleCache(parsed);
            console.log('💾 Расписание сохранено в кэш');

            setLoading(false);
        } catch (error) {
            console.error('❌ Ошибка загрузки расписания:', error);
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

    useEffect(() => {
        if (fullSchedule || customLessons.length > 0) {
            updateScheduleForDay();
        }
    }, [selectedDay, fullSchedule, customLessons]);

    const updateScheduleForDay = () => {
        let daySchedule = [];

        if (fullSchedule) {
            const scheduleData = getScheduleForDay(fullSchedule, selectedDay);
            daySchedule = Array.isArray(scheduleData) ? [...scheduleData] : [];
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
                addressId: custom.addressId,
            });
        });

        daySchedule.sort((a, b) => a.lessonNumber - b.lessonNumber);

        console.log(`📋 Обновление расписания для дня ${selectedDay}:`, daySchedule.length, 'занятий');
        setSchedule(daySchedule);
    };

    const refreshSchedule = async () => {
        if (!groupNumber) {
            Alert.alert('Ошибка', 'Укажите номер группы в настройках');
            return;
        }

        console.log('🗑️ Очистка кэша расписания...');
        await clearScheduleCache();
        console.log('🔄 Загрузка свежего расписания...');
        loadSchedule(groupNumber);
    };

    const openCustomLessonModal = async () => {
        await loadAddressesList();
        setCustomSubject('');
        setCustomType('Лекция');
        setCustomRoom('');
        setCustomProfessor('');
        setCustomLessonNumber('1');
        setSelectedAddress(null);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleSaveCustomLesson = async () => {
        if (!customSubject.trim()) {
            Alert.alert('Ошибка', 'Введите название предмета');
            return;
        }

        const lessonNum = parseInt(customLessonNumber, 10);
        if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 7) {
            Alert.alert('Ошибка', 'Номер пары должен быть от 1 до 7');
            return;
        }

        try {
            const lessonData = {
                subject: customSubject.trim(),
                type: customType.trim() || 'Занятие',
                room: customRoom.trim() || 'Не указана',
                professor: customProfessor.trim() || 'Не указан',
                lessonNumber: lessonNum,
                dayNumber: selectedDay,
                addressId: selectedAddress?.id || null,
            };

            await addCustomLesson(lessonData);
            await loadCustomLessonsData();
            closeModal();
            Alert.alert('Успешно', 'Занятие добавлено в расписание');
        } catch (error) {
            console.error('Ошибка сохранения занятия:', error);
            Alert.alert('Ошибка', 'Не удалось добавить занятие');
        }
    };

    const handleDeleteCustomLesson = (lesson) => {
        mediumHaptic();
        Alert.alert(
            'Удалить занятие?',
            `Вы уверены что хотите удалить "${lesson.subject}"?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const idToDelete = lesson.originalId || lesson.id;
                            await deleteCustomLesson(idToDelete);
                            await loadCustomLessonsData();
                        } catch (error) {
                            console.error('Ошибка удаления занятия:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить занятие');
                        }
                    },
                },
            ]
        );
    };

    const handleLessonClick = async (item) => {
        lightHaptic();
        if (!item.isCustom || !item.addressId) {
            return;
        }

        if (!homeAddress) {
            Alert.alert('Ошибка', 'Укажите домашний адрес в настройках');
            return;
        }

        const address = addresses.length > 0
            ? addresses.find(a => a.id === item.addressId)
            : null;

        if (!address) {
            await loadAddressesList();
            const addr = addresses.find(a => a.id === item.addressId);
            if (!addr) {
                Alert.alert('Ошибка', 'Адрес не найден');
                return;
            }
            openYandexMaps(homeAddress, addr.address);
        } else {
            openYandexMaps(homeAddress, address.address);
        }
    };

    const openYandexMaps = async (from, to) => {
        const routeType = transportMode === 'auto' ? 'auto'
            : transportMode === 'pedestrian' ? 'pd'
                : 'mt';

        const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(from)}~${encodeURIComponent(to)}&rtt=${routeType}`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert('Ошибка', 'Не удалось открыть Яндекс.Карты');
        }
    };

    const openAddressPicker = () => {
        setAddressPickerVisible(true);
    };

    const selectAddress = (address) => {
        setSelectedAddress(address);
        setAddressPickerVisible(false);
    };

    const renderClassItem = ({ item }) => {
        const address = item.addressId ? addresses.find(a => a.id === item.addressId) : null;

        return (
            <TouchableOpacity
                style={styles.classCard}
                onPress={() => handleLessonClick(item)}
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
                                <Text style={styles.customBadgeText}>Своё</Text>
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
                    {address && (
                        <Text style={styles.lessonAddress}>
                            📍 {address.code ? `${address.code} — ${address.name}` : address.name}
                        </Text>
                    )}
                    {item.isCustom && (
                        <Text style={styles.customHint}>
                            {address ? 'Нажмите для маршрута • ' : ''}Удержите для удаления
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderDayButton = (day) => (
        <TouchableOpacity
            key={day.id}
            style={[
                styles.dayButton,
                selectedDay === day.id && styles.dayButtonActive,
            ]}
            onPress={() => {
                selectionHaptic();
                setSelectedDay(day.id);
            }}
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
                    <ActivityIndicator size="large" color={theme.primary} />
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
                    onPress={() => {
                        mediumHaptic();
                        openCustomLessonModal();
                    }}
                >
                    <Text style={styles.addCustomButtonText}>+ Добавить своё занятие</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => {
                        lightHaptic();
                        refreshSchedule();
                    }}
                    disabled={!groupNumber}
                >
                    <Text style={styles.updateButtonText}>
                        {groupNumber ? '🔄' : 'Укажите группу'}
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
                            <Text style={styles.modalTitle}>Добавить своё занятие</Text>
                            <Text style={styles.modalSubtitle}>
                                День: {weekDays.find(d => d.id === selectedDay)?.fullName}
                            </Text>

                            <Text style={styles.inputLabel}>Название предмета *</Text>
                            <TextInput
                                style={styles.input}
                                value={customSubject}
                                onChangeText={setCustomSubject}
                                placeholder="Например: Консультация по диплому"
                                placeholderTextColor={theme.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Тип занятия</Text>
                            <TextInput
                                style={styles.input}
                                value={customType}
                                onChangeText={setCustomType}
                                placeholder="Лекция / Практика / Консультация"
                                placeholderTextColor={theme.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Номер пары * (1-7)</Text>
                            <TextInput
                                style={styles.input}
                                value={customLessonNumber}
                                onChangeText={setCustomLessonNumber}
                                placeholder="1"
                                placeholderTextColor={theme.textTertiary}
                                keyboardType="numeric"
                            />

                            <Text style={styles.inputLabel}>Аудитория</Text>
                            <TextInput
                                style={styles.input}
                                value={customRoom}
                                onChangeText={setCustomRoom}
                                placeholder="Пр1234"
                                placeholderTextColor={theme.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Преподаватель</Text>
                            <TextInput
                                style={styles.input}
                                value={customProfessor}
                                onChangeText={setCustomProfessor}
                                placeholder="Иванов И.И."
                                placeholderTextColor={theme.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Место (опционально)</Text>
                            <TouchableOpacity
                                style={styles.addressPicker}
                                onPress={openAddressPicker}
                            >
                                <Text style={styles.addressPickerText}>
                                    {selectedAddress
                                        ? (selectedAddress.code ? `${selectedAddress.code} — ${selectedAddress.name}` : selectedAddress.name)
                                        : '📍 Выбрать адрес'}
                                </Text>
                            </TouchableOpacity>
                            {selectedAddress && (
                                <TouchableOpacity
                                    onPress={() => setSelectedAddress(null)}
                                    style={styles.clearAddressButton}
                                >
                                    <Text style={styles.clearAddressButtonText}>✕ Убрать адрес</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        lightHaptic();
                                        closeModal();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Отмена</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={() => {
                                        mediumHaptic();
                                        handleSaveCustomLesson();
                                    }}
                                >
                                    <Text style={styles.saveButtonText}>Добавить</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={addressPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddressPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModalContent}>
                        <Text style={styles.pickerTitle}>Выберите адрес</Text>
                        <ScrollView style={styles.addressList}>
                            {addresses.map(addr => (
                                <TouchableOpacity
                                    key={addr.id}
                                    style={styles.addressOption}
                                    onPress={() => selectAddress(addr)}
                                >
                                    <Text style={styles.addressOptionName}>
                                        {addr.code ? `${addr.code} — ${addr.name}` : addr.name}
                                    </Text>
                                    <Text style={styles.addressOptionValue}>{addr.address}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closePickerButton}
                            onPress={() => setAddressPickerVisible(false)}
                        >
                            <Text style={styles.closePickerButtonText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    weekSelector: {
        backgroundColor: theme.card,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
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
        backgroundColor: theme.inputBackground,
        minWidth: 50,
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: theme.primary,
    },
    dayButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    dayButtonTextActive: {
        color: '#fff',
    },
    dayHeader: {
        backgroundColor: theme.card,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    dayHeaderText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.text,
    },
    scheduleList: {
        padding: 15,
        paddingBottom: 100,
    },
    classCard: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: theme.shadow,
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
        borderRightColor: theme.primary,
        marginRight: 15,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.primary,
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
        color: theme.text,
        flex: 1,
    },
    customBadge: {
        backgroundColor: theme.warning,
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
        backgroundColor: theme.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 10,
    },
    typeBadgeCustom: {
        backgroundColor: theme.warning + '20',
    },
    typeText: {
        fontSize: 12,
        color: theme.primary,
        fontWeight: '500',
    },
    typeTextCustom: {
        color: theme.warning,
    },
    roomText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    professorText: {
        fontSize: 13,
        color: theme.textTertiary,
        marginTop: 3,
    },
    lessonAddress: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 4,
    },
    customHint: {
        fontSize: 11,
        color: theme.warning,
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
        color: theme.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: theme.textTertiary,
        textAlign: 'center',
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 20,
        gap: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.background,
    },
    addCustomButton: {
        flex: 1,
        backgroundColor: theme.warning,
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
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.primary,
        width: 50,
    },
    updateButtonText: {
        color: theme.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
    },
    addressPicker: {
        backgroundColor: theme.inputBackground,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.border,
    },
    addressPickerText: {
        fontSize: 15,
        color: theme.text,
    },
    clearAddressButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    clearAddressButtonText: {
        fontSize: 13,
        color: theme.danger,
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
        backgroundColor: theme.inputBackground,
    },
    cancelButtonText: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: theme.warning,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    pickerModalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 15,
    },
    addressList: {
        maxHeight: '80%',
    },
    addressOption: {
        padding: 14,
        backgroundColor: theme.inputBackground,
        borderRadius: 10,
        marginBottom: 8,
    },
    addressOptionName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    addressOptionValue: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    closePickerButton: {
        backgroundColor: theme.inputBackground,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    closePickerButtonText: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '600',
    },
});