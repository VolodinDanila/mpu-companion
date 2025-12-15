import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    Linking,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { loadSettings, saveSettings, loadAddresses, saveCustomAddress, deleteCustomAddress, loadTravelTimes, saveTravelTime, getTravelTime, clearScheduleCache } from '../utils/storage';

export default function SettingsScreen() {
    const { theme, themeMode, setTheme } = useTheme();
    const styles = createStyles(theme);

    const [loading, setLoading] = useState(false);
    const [homeAddress, setHomeAddress] = useState('');
    const [routineMinutes, setRoutineMinutes] = useState('30');
    const [groupNumber, setGroupNumber] = useState('');
    const [transportMode, setTransportMode] = useState('transit');
    const [bufferMinutes, setBufferMinutes] = useState('15');

    const [addressesModalVisible, setAddressesModalVisible] = useState(false);
    const [addresses, setAddresses] = useState({ predefined: { campuses: [], dorms: [] }, custom: [] });
    const [newAddressName, setNewAddressName] = useState('');
    const [newAddressValue, setNewAddressValue] = useState('');
    const [travelTimeModalVisible, setTravelTimeModalVisible] = useState(false);
    const [selectedAddressForTime, setSelectedAddressForTime] = useState(null);
    const [travelTimeInput, setTravelTimeInput] = useState('');
    const [travelTimes, setTravelTimes] = useState({});

    useEffect(() => {
        loadSettingsFromStorage();
    }, []);

    const loadSettingsFromStorage = async () => {
        setLoading(true);
        try {
            const settings = await loadSettings();
            if (settings) {
                setHomeAddress(settings.homeAddress || '');
                setRoutineMinutes(settings.routineMinutes?.toString() || '30');
                setGroupNumber(settings.groupNumber || '');
                setTransportMode(settings.transportMode || 'transit');
                setBufferMinutes(settings.bufferMinutes?.toString() || '15');
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
        setLoading(false);
    };

    const loadAddressesList = async () => {
        try {
            const data = await loadAddresses();
            setAddresses(data);

            const times = await loadTravelTimes();
            setTravelTimes(times);
        } catch (error) {
            console.error('Ошибка загрузки адресов:', error);
        }
    };

    const openTravelTimeModal = async (address) => {
        setSelectedAddressForTime(address);
        const time = await getTravelTime(address.id);
        setTravelTimeInput(time.toString());
        setTravelTimeModalVisible(true);
    };

    const closeTravelTimeModal = () => {
        setTravelTimeModalVisible(false);
        setSelectedAddressForTime(null);
        setTravelTimeInput('');
    };

    const saveTravelTimeForAddress = async () => {
        const minutes = parseInt(travelTimeInput, 10);
        if (isNaN(minutes) || minutes < 1) {
            Alert.alert('Ошибка', 'Введите корректное время в минутах');
            return;
        }

        try {
            await saveTravelTime(selectedAddressForTime.id, minutes);
            await loadAddressesList();
            closeTravelTimeModal();
            Alert.alert('Успешно', `Время в пути установлено: ${minutes} мин`);
        } catch (error) {
            console.error('Ошибка сохранения времени:', error);
            Alert.alert('Ошибка', 'Не удалось сохранить время');
        }
    };

    const openRouteForAddress = async () => {
        if (!homeAddress) {
            Alert.alert('Ошибка', 'Укажите домашний адрес в настройках');
            return;
        }

        const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(homeAddress)}~${encodeURIComponent(selectedAddressForTime.address)}&rtt=mt`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert('Ошибка', 'Не удалось открыть Яндекс.Карты');
        }
    };

    const handleSave = async () => {
        if (!homeAddress.trim()) {
            Alert.alert('Ошибка', 'Укажите домашний адрес');
            return;
        }

        if (!groupNumber.trim()) {
            Alert.alert('Ошибка', 'Укажите номер группы');
            return;
        }

        const routine = parseInt(routineMinutes, 10);
        if (isNaN(routine) || routine < 0) {
            Alert.alert('Ошибка', 'Неверное значение утренней рутины');
            return;
        }

        const buffer = parseInt(bufferMinutes, 10);
        if (isNaN(buffer) || buffer < 0) {
            Alert.alert('Ошибка', 'Неверное значение запаса времени');
            return;
        }

        setLoading(true);
        try {
            const oldSettings = await loadSettings();
            const groupChanged = oldSettings?.groupNumber !== groupNumber.trim();

            const settings = {
                homeAddress: homeAddress.trim(),
                routineMinutes: routine,
                groupNumber: groupNumber.trim(),
                transportMode,
                bufferMinutes: buffer,
            };

            await saveSettings(settings);

            if (groupChanged) {
                await clearScheduleCache();
            }

            Alert.alert('Успешно', 'Настройки сохранены', [
                {
                    text: 'ОК',
                    onPress: () => {
                        if (groupChanged) {
                            loadSettingsFromStorage();
                        }
                    }
                }
            ]);
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            Alert.alert('Ошибка', 'Не удалось сохранить настройки');
        }
        setLoading(false);
    };

    const openAddressesModal = async () => {
        await loadAddressesList();
        setAddressesModalVisible(true);
    };

    const closeAddressesModal = () => {
        setAddressesModalVisible(false);
        setNewAddressName('');
        setNewAddressValue('');
    };

    const handleAddCustomAddress = async () => {
        if (!newAddressName.trim() || !newAddressValue.trim()) {
            Alert.alert('Ошибка', 'Заполните название и адрес');
            return;
        }

        try {
            await saveCustomAddress({
                name: newAddressName.trim(),
                address: newAddressValue.trim(),
            });
            await loadAddressesList();
            setNewAddressName('');
            setNewAddressValue('');
            Alert.alert('Успешно', 'Адрес добавлен');
        } catch (error) {
            console.error('Ошибка добавления адреса:', error);
            Alert.alert('Ошибка', 'Не удалось добавить адрес');
        }
    };

    const handleDeleteAddress = (address) => {
        if (address.type !== 'custom') {
            Alert.alert('Ошибка', 'Встроенные адреса нельзя удалить');
            return;
        }

        Alert.alert(
            'Удалить адрес?',
            `Вы уверены что хотите удалить "${address.name}"?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCustomAddress(address.id);
                            await loadAddressesList();
                        } catch (error) {
                            console.error('Ошибка удаления адреса:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить адрес');
                        }
                    },
                },
            ]
        );
    };

    const renderAddressItem = ({ item }) => {
        const travelTime = travelTimes[item.id] || 90;

        return (
            <View style={styles.addressCardContainer}>
                <TouchableOpacity
                    style={styles.addressCard}
                    onLongPress={() => handleDeleteAddress(item)}
                >
                    <View style={styles.addressHeader}>
                        <Text style={styles.addressName}>
                            {item.code ? `${item.code} — ${item.name}` : item.name}
                        </Text>
                        {item.type === 'custom' && (
                            <View style={styles.customAddressBadge}>
                                <Text style={styles.customAddressBadgeText}>Своё</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.addressValue}>{item.address}</Text>
                    <Text style={styles.travelTimeText}>⏱ {travelTime} мин в пути</Text>
                    {item.type === 'custom' && (
                        <Text style={styles.addressHint}>Удержите для удаления</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.travelTimeButton}
                    onPress={() => openTravelTimeModal(item)}
                >
                    <Text style={styles.travelTimeButtonText}>🕐</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const transportModes = [
        { id: 'transit', icon: '🚌', label: 'Общественный' },
        { id: 'auto', icon: '🚗', label: 'Авто' },
        { id: 'pedestrian', icon: '🚶', label: 'Пешком' },
    ];

    const themeOptions = [
        { id: 'light', label: 'Светлая', icon: '☀️' },
        { id: 'dark', label: 'Тёмная', icon: '🌙' },
        { id: 'system', label: 'Системная', icon: '⚙️' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Настройки</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Тема оформления</Text>
                        <View style={styles.themeButtons}>
                            {themeOptions.map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.themeButton,
                                        themeMode === option.id && styles.themeButtonActive,
                                    ]}
                                    onPress={() => setTheme(option.id)}
                                >
                                    <Text style={styles.themeIcon}>{option.icon}</Text>
                                    <Text
                                        style={[
                                            styles.themeLabel,
                                            themeMode === option.id && styles.themeLabelActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Адреса</Text>
                        <TouchableOpacity
                            style={styles.addressesButton}
                            onPress={openAddressesModal}
                        >
                            <Text style={styles.addressesButtonText}>📍 Управление адресами</Text>
                            <Text style={styles.addressesButtonSubtext}>
                                Корпуса, общежития и свои адреса
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Основные настройки</Text>

                        <Text style={styles.inputLabel}>Домашний адрес *</Text>
                        <TextInput
                            style={styles.input}
                            value={homeAddress}
                            onChangeText={setHomeAddress}
                            placeholder="Ул. Примерная, д. 123"
                            placeholderTextColor={theme.textTertiary}
                        />

                        <Text style={styles.inputLabel}>Номер группы *</Text>
                        <TextInput
                            style={styles.input}
                            value={groupNumber}
                            onChangeText={setGroupNumber}
                            placeholder="231-324"
                            placeholderTextColor={theme.textTertiary}
                        />

                        <Text style={styles.inputLabel}>Утренняя рутина (минуты)</Text>
                        <TextInput
                            style={styles.input}
                            value={routineMinutes}
                            onChangeText={setRoutineMinutes}
                            placeholder="30"
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Запас времени (минуты)</Text>
                        <TextInput
                            style={styles.input}
                            value={bufferMinutes}
                            onChangeText={setBufferMinutes}
                            placeholder="15"
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Транспорт</Text>
                        <View style={styles.transportButtons}>
                            {transportModes.map(mode => (
                                <TouchableOpacity
                                    key={mode.id}
                                    style={[
                                        styles.transportButton,
                                        transportMode === mode.id && styles.transportButtonActive,
                                    ]}
                                    onPress={() => setTransportMode(mode.id)}
                                >
                                    <Text style={styles.transportIcon}>{mode.icon}</Text>
                                    <Text
                                        style={[
                                            styles.transportLabel,
                                            transportMode === mode.id && styles.transportLabelActive,
                                        ]}
                                    >
                                        {mode.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Сохранить</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={addressesModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeAddressesModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Адреса</Text>

                        <ScrollView style={styles.addressesList}>
                            <Text style={styles.addressCategoryTitle}>🏛 Корпуса университета</Text>
                            <FlatList
                                data={addresses.predefined.campuses}
                                renderItem={renderAddressItem}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                            />

                            <Text style={styles.addressCategoryTitle}>🏠 Общежития</Text>
                            <FlatList
                                data={addresses.predefined.dorms}
                                renderItem={renderAddressItem}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                            />

                            {addresses.custom.length > 0 && (
                                <>
                                    <Text style={styles.addressCategoryTitle}>📌 Свои адреса</Text>
                                    <FlatList
                                        data={addresses.custom}
                                        renderItem={renderAddressItem}
                                        keyExtractor={item => item.id}
                                        scrollEnabled={false}
                                    />
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.addAddressSection}>
                            <Text style={styles.addAddressTitle}>Добавить свой адрес</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={newAddressName}
                                onChangeText={setNewAddressName}
                                placeholder="Название (например: Работа)"
                                placeholderTextColor={theme.textTertiary}
                            />
                            <TextInput
                                style={styles.modalInput}
                                value={newAddressValue}
                                onChangeText={setNewAddressValue}
                                placeholder="Адрес"
                                placeholderTextColor={theme.textTertiary}
                            />
                            <TouchableOpacity
                                style={styles.addAddressButton}
                                onPress={handleAddCustomAddress}
                            >
                                <Text style={styles.addAddressButtonText}>+ Добавить</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={closeAddressesModal}
                        >
                            <Text style={styles.closeModalButtonText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={travelTimeModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeTravelTimeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.travelTimeModalContent}>
                        <Text style={styles.travelTimeModalTitle}>Время в пути</Text>
                        <Text style={styles.travelTimeModalSubtitle}>
                            {selectedAddressForTime?.code ? `${selectedAddressForTime.code} — ${selectedAddressForTime.name}` : selectedAddressForTime?.name}
                        </Text>

                        <TouchableOpacity
                            style={styles.viewRouteButton}
                            onPress={openRouteForAddress}
                        >
                            <Text style={styles.viewRouteButtonText}>🗺 Посмотреть маршрут в Яндекс.Картах</Text>
                        </TouchableOpacity>

                        <Text style={styles.travelTimeInputLabel}>Время в пути (минуты)</Text>
                        <TextInput
                            style={styles.travelTimeInput}
                            value={travelTimeInput}
                            onChangeText={setTravelTimeInput}
                            placeholder="90"
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="numeric"
                        />

                        <View style={styles.travelTimeModalButtons}>
                            <TouchableOpacity
                                style={[styles.travelTimeModalButton, styles.cancelButton]}
                                onPress={closeTravelTimeModal}
                            >
                                <Text style={styles.cancelButtonText}>Отмена</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.travelTimeModalButton, styles.saveButton]}
                                onPress={saveTravelTimeForAddress}
                            >
                                <Text style={styles.saveButtonText}>Сохранить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
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
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 15,
    },
    themeButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    themeButton: {
        flex: 1,
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.border,
    },
    themeButtonActive: {
        borderColor: theme.primary,
        backgroundColor: theme.primary + '10',
    },
    themeIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    themeLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    themeLabelActive: {
        color: theme.primary,
        fontWeight: '600',
    },
    addressesButton: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.primary,
    },
    addressesButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 4,
    },
    addressesButtonSubtext: {
        fontSize: 13,
        color: theme.textSecondary,
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
    transportButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    transportButton: {
        flex: 1,
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.border,
    },
    transportButtonActive: {
        borderColor: theme.primary,
        backgroundColor: theme.primary + '10',
    },
    transportIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    transportLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    transportLabelActive: {
        color: theme.primary,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: theme.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 20,
    },
    addressesList: {
        maxHeight: '50%',
    },
    addressCategoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 15,
        marginBottom: 10,
    },
    addressCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressCard: {
        flex: 1,
        backgroundColor: theme.inputBackground,
        padding: 12,
        borderRadius: 10,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    addressName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    customAddressBadge: {
        backgroundColor: theme.warning,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    customAddressBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    addressValue: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    addressHint: {
        fontSize: 11,
        color: theme.warning,
        fontStyle: 'italic',
        marginTop: 4,
    },
    travelTimeText: {
        fontSize: 12,
        color: theme.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    travelTimeButton: {
        width: 44,
        height: 44,
        backgroundColor: theme.primary,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    travelTimeButtonText: {
        fontSize: 20,
    },
    addAddressSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    addAddressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    modalInput: {
        backgroundColor: theme.inputBackground,
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 10,
    },
    addAddressButton: {
        backgroundColor: theme.warning,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    addAddressButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    closeModalButton: {
        backgroundColor: theme.inputBackground,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    closeModalButtonText: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '600',
    },
    travelTimeModalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    travelTimeModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 5,
    },
    travelTimeModalSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 20,
    },
    viewRouteButton: {
        backgroundColor: theme.primary,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    viewRouteButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    travelTimeInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 8,
    },
    travelTimeInput: {
        backgroundColor: theme.inputBackground,
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 20,
    },
    travelTimeModalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    travelTimeModalButton: {
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
});