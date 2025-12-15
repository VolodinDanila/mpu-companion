import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { loadReminders, addReminder, updateReminder, deleteReminder, loadSettings, getAllAddressesList } from '../utils/storage';

export default function RemindersScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [addressPickerVisible, setAddressPickerVisible] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [homeAddress, setHomeAddress] = useState('');
    const [transportMode, setTransportMode] = useState('transit');

    useEffect(() => {
        loadRemindersData();
        loadHomeAddress();
    }, []);

    const loadRemindersData = async () => {
        setLoading(true);
        try {
            const data = await loadReminders();
            setReminders(data || []);
        } catch (error) {
            console.error('Ошибка загрузки напоминаний:', error);
        }
        setLoading(false);
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

    const loadAddressesList = async () => {
        try {
            const list = await getAllAddressesList();
            setAddresses(list);
        } catch (error) {
            console.error('Ошибка загрузки адресов:', error);
        }
    };

    const formatTime = (text) => {
        const cleaned = text.replace(/[^\d]/g, '');
        if (cleaned.length <= 2) {
            return cleaned;
        }
        if (cleaned.length <= 4) {
            return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
        }
        return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    };

    const formatDate = (text) => {
        const cleaned = text.replace(/[^\d]/g, '');
        if (cleaned.length <= 2) {
            return cleaned;
        }
        if (cleaned.length <= 4) {
            return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
        }
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    };

    const openModal = async (reminder = null) => {
        await loadAddressesList();

        if (reminder) {
            setEditingReminder(reminder);
            setTitle(reminder.title);
            setDescription(reminder.description || '');
            setDate(reminder.date);
            setTime(reminder.time);

            if (reminder.addressId) {
                const addr = addresses.find(a => a.id === reminder.addressId);
                setSelectedAddress(addr || null);
            } else {
                setSelectedAddress(null);
            }
        } else {
            setEditingReminder(null);
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
            setSelectedAddress(null);
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingReminder(null);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setSelectedAddress(null);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Ошибка', 'Введите название напоминания');
            return;
        }

        if (!date.trim()) {
            Alert.alert('Ошибка', 'Введите дату в формате ДД.ММ.ГГГГ');
            return;
        }

        if (!time.trim()) {
            Alert.alert('Ошибка', 'Введите время в формате ЧЧ:ММ');
            return;
        }

        const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!dateRegex.test(date)) {
            Alert.alert('Ошибка', 'Неверный формат даты. Используйте ДД.ММ.ГГГГ');
            return;
        }

        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(time)) {
            Alert.alert('Ошибка', 'Неверный формат времени. Используйте ЧЧ:ММ');
            return;
        }

        try {
            const reminderData = {
                title: title.trim(),
                description: description.trim(),
                date: date.trim(),
                time: time.trim(),
                addressId: selectedAddress?.id || null,
            };

            if (editingReminder) {
                await updateReminder(editingReminder.id, reminderData);
            } else {
                await addReminder(reminderData);
            }

            await loadRemindersData();
            closeModal();
            Alert.alert(
                'Успешно',
                editingReminder ? 'Напоминание обновлено' : 'Напоминание создано'
            );
        } catch (error) {
            console.error('Ошибка сохранения напоминания:', error);
            Alert.alert('Ошибка', 'Не удалось сохранить напоминание');
        }
    };

    const handleDelete = (reminder) => {
        Alert.alert(
            'Удалить напоминание?',
            `Вы уверены что хотите удалить "${reminder.title}"?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteReminder(reminder.id);
                            await loadRemindersData();
                        } catch (error) {
                            console.error('Ошибка удаления напоминания:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить напоминание');
                        }
                    },
                },
            ]
        );
    };

    const handleReminderClick = async (reminder) => {
        if (!reminder.addressId) {
            openModal(reminder);
            return;
        }

        if (!homeAddress) {
            Alert.alert('Ошибка', 'Укажите домашний адрес в настройках');
            return;
        }

        const address = addresses.length > 0
            ? addresses.find(a => a.id === reminder.addressId)
            : null;

        if (!address) {
            await loadAddressesList();
            const addr = addresses.find(a => a.id === reminder.addressId);
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

    const renderReminderItem = ({ item }) => {
        const isPast = isReminderPast(item.date, item.time);
        const address = item.addressId ? addresses.find(a => a.id === item.addressId) : null;

        return (
            <TouchableOpacity
                style={[styles.reminderCard, isPast && styles.reminderCardPast]}
                onPress={() => handleReminderClick(item)}
                onLongPress={() => handleDelete(item)}
            >
                <View style={styles.reminderHeader}>
                    <Text style={[styles.reminderTitle, isPast && styles.reminderTitlePast]}>
                        {item.title}
                    </Text>
                    {isPast && (
                        <View style={styles.pastBadge}>
                            <Text style={styles.pastBadgeText}>Прошло</Text>
                        </View>
                    )}
                </View>

                {item.description && (
                    <Text style={styles.reminderDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                <View style={styles.reminderFooter}>
                    <Text style={styles.reminderDateTime}>
                        📅 {item.date} · 🕐 {item.time}
                    </Text>
                    {address && (
                        <Text style={styles.reminderAddress}>
                            📍 {address.code ? `${address.code} — ${address.name}` : address.name}
                        </Text>
                    )}
                </View>

                <Text style={styles.reminderHint}>
                    {address ? 'Нажмите для маршрута • ' : 'Нажмите для редактирования • '}Удержите для удаления
                </Text>
            </TouchableOpacity>
        );
    };

    const isReminderPast = (dateStr, timeStr) => {
        try {
            const [day, month, year] = dateStr.split('.').map(Number);
            const [hours, minutes] = timeStr.split(':').map(Number);
            const reminderDate = new Date(year, month - 1, day, hours, minutes);
            return reminderDate < new Date();
        } catch {
            return false;
        }
    };

    const sortedReminders = [...reminders].sort((a, b) => {
        try {
            const [dayA, monthA, yearA] = a.date.split('.').map(Number);
            const [hoursA, minutesA] = a.time.split(':').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);

            const [dayB, monthB, yearB] = b.date.split('.').map(Number);
            const [hoursB, minutesB] = b.time.split(':').map(Number);
            const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);

            return dateA - dateB;
        } catch {
            return 0;
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Напоминания</Text>
                <Text style={styles.headerSubtitle}>
                    {reminders.length} {reminders.length === 1 ? 'напоминание' : 'напоминаний'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Загрузка...</Text>
                </View>
            ) : sortedReminders.length > 0 ? (
                <FlatList
                    data={sortedReminders}
                    renderItem={renderReminderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📌</Text>
                    <Text style={styles.emptyTitle}>Нет напоминаний</Text>
                    <Text style={styles.emptySubtitle}>
                        Создайте первое напоминание о важном событии
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => openModal()}
            >
                <Text style={styles.addButtonText}>+ Создать напоминание</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>
                                {editingReminder ? 'Редактировать напоминание' : 'Новое напоминание'}
                            </Text>

                            <Text style={styles.inputLabel}>Название *</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Например: Дедлайн по проекту"
                                placeholderTextColor={theme.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Описание</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Дополнительная информация"
                                placeholderTextColor={theme.textTertiary}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.inputLabel}>Дата * (ДД.ММ.ГГГГ)</Text>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={(text) => setDate(formatDate(text))}
                                placeholder="12.12.2025"
                                placeholderTextColor={theme.textTertiary}
                                keyboardType="numeric"
                                maxLength={10}
                            />

                            <Text style={styles.inputLabel}>Время * (ЧЧ:ММ)</Text>
                            <TextInput
                                style={styles.input}
                                value={time}
                                onChangeText={(text) => setTime(formatTime(text))}
                                placeholder="14:30"
                                placeholderTextColor={theme.textTertiary}
                                keyboardType="numeric"
                                maxLength={5}
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
                                    onPress={closeModal}
                                >
                                    <Text style={styles.cancelButtonText}>Отмена</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.saveButtonText}>Сохранить</Text>
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
    header: {
        backgroundColor: theme.card,
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    listContent: {
        padding: 15,
    },
    reminderCard: {
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
    reminderCardPast: {
        opacity: 0.6,
    },
    reminderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reminderTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    reminderTitlePast: {
        textDecorationLine: 'line-through',
        color: theme.textTertiary,
    },
    pastBadge: {
        backgroundColor: theme.inputBackground,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    pastBadgeText: {
        fontSize: 11,
        color: theme.textTertiary,
        fontWeight: '500',
    },
    reminderDescription: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 10,
    },
    reminderFooter: {
        marginBottom: 8,
    },
    reminderDateTime: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: '500',
        marginBottom: 4,
    },
    reminderAddress: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2,
    },
    reminderHint: {
        fontSize: 11,
        color: theme.textTertiary,
        fontStyle: 'italic',
    },
    addButton: {
        backgroundColor: theme.primary,
        margin: 15,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 15,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textTertiary,
        textAlign: 'center',
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
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
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
        backgroundColor: theme.primary,
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