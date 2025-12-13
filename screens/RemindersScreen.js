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
} from 'react-native';
import { loadReminders, addReminder, updateReminder, deleteReminder } from '../utils/storage';

export default function RemindersScreen() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        loadRemindersData();
    }, []);

    const loadRemindersData = async () => {
        setLoading(true);
        try {
            const data = await loadReminders();
            setReminders(data || []);
        } catch (error) {
            console.error('ошибка загрузки напоминаний:', error);
        }
        setLoading(false);
    };

    const openModal = (reminder = null) => {
        if (reminder) {
            setEditingReminder(reminder);
            setTitle(reminder.title);
            setDescription(reminder.description || '');
            setDate(reminder.date);
            setTime(reminder.time);
        } else {
            setEditingReminder(null);
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
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
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('ошибка', 'введите название напоминания');
            return;
        }

        if (!date.trim()) {
            Alert.alert('ошибка', 'введите дату в формате дд.мм.гггг');
            return;
        }

        if (!time.trim()) {
            Alert.alert('ошибка', 'введите время в формате чч:мм');
            return;
        }

        const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!dateRegex.test(date)) {
            Alert.alert('ошибка', 'неверный формат даты. используйте дд.мм.гггг');
            return;
        }

        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(time)) {
            Alert.alert('ошибка', 'неверный формат времени. используйте чч:мм');
            return;
        }

        try {
            const reminderData = {
                title: title.trim(),
                description: description.trim(),
                date: date.trim(),
                time: time.trim(),
            };

            if (editingReminder) {
                await updateReminder(editingReminder.id, reminderData);
            } else {
                await addReminder(reminderData);
            }

            await loadRemindersData();
            closeModal();
            Alert.alert(
                'успешно',
                editingReminder ? 'напоминание обновлено' : 'напоминание создано'
            );
        } catch (error) {
            console.error('ошибка сохранения напоминания:', error);
            Alert.alert('ошибка', 'не удалось сохранить напоминание');
        }
    };

    const handleDelete = (reminder) => {
        Alert.alert(
            'удалить напоминание?',
            `вы уверены что хотите удалить "${reminder.title}"?`,
            [
                { text: 'отмена', style: 'cancel' },
                {
                    text: 'удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteReminder(reminder.id);
                            await loadRemindersData();
                        } catch (error) {
                            console.error('ошибка удаления напоминания:', error);
                            Alert.alert('ошибка', 'не удалось удалить напоминание');
                        }
                    },
                },
            ]
        );
    };

    const renderReminderItem = ({ item }) => {
        const isPast = isReminderPast(item.date, item.time);

        return (
            <TouchableOpacity
                style={[styles.reminderCard, isPast && styles.reminderCardPast]}
                onPress={() => openModal(item)}
                onLongPress={() => handleDelete(item)}
            >
                <View style={styles.reminderHeader}>
                    <Text style={[styles.reminderTitle, isPast && styles.reminderTitlePast]}>
                        {item.title}
                    </Text>
                    {isPast && (
                        <View style={styles.pastBadge}>
                            <Text style={styles.pastBadgeText}>прошло</Text>
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
                </View>

                <Text style={styles.reminderHint}>
                    нажмите для редактирования • удержите для удаления
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
                <Text style={styles.headerTitle}>напоминания</Text>
                <Text style={styles.headerSubtitle}>
                    {reminders.length} {reminders.length === 1 ? 'напоминание' : 'напоминаний'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>загрузка...</Text>
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
                    <Text style={styles.emptyTitle}>нет напоминаний</Text>
                    <Text style={styles.emptySubtitle}>
                        создайте первое напоминание о важном событии
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => openModal()}
            >
                <Text style={styles.addButtonText}>+ создать напоминание</Text>
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
                                {editingReminder ? 'редактировать напоминание' : 'новое напоминание'}
                            </Text>

                            <Text style={styles.inputLabel}>название *</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="например: дедлайн по проекту"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.inputLabel}>описание</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="дополнительная информация"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.inputLabel}>дата * (дд.мм.гггг)</Text>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="12.12.2025"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            <Text style={styles.inputLabel}>время * (чч:мм)</Text>
                            <TextInput
                                style={styles.input}
                                value={time}
                                onChangeText={setTime}
                                placeholder="14:30"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
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
                                    onPress={handleSave}
                                >
                                    <Text style={styles.saveButtonText}>сохранить</Text>
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
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    listContent: {
        padding: 15,
    },
    reminderCard: {
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
        color: '#333',
        flex: 1,
    },
    reminderTitlePast: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    pastBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    pastBadgeText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
    },
    reminderDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    reminderFooter: {
        marginBottom: 8,
    },
    reminderDateTime: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    reminderHint: {
        fontSize: 11,
        color: '#999',
        fontStyle: 'italic',
    },
    addButton: {
        backgroundColor: '#007AFF',
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
        color: '#666',
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
        color: '#333',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
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
        backgroundColor: '#007AFF',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});