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
} from 'react-native';
import { loadSettings, saveSettings, loadAddresses, saveCustomAddress, deleteCustomAddress } from '../utils/storage';

export default function SettingsScreen() {
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
        } catch (error) {
            console.error('Ошибка загрузки адресов:', error);
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
            const settings = {
                homeAddress: homeAddress.trim(),
                routineMinutes: routine,
                groupNumber: groupNumber.trim(),
                transportMode,
                bufferMinutes: buffer,
            };

            await saveSettings(settings);
            Alert.alert('Успешно', 'Настройки сохранены');
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

    const renderAddressItem = ({ item }) => (
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
            {item.type === 'custom' && (
                <Text style={styles.addressHint}>Удержите для удаления</Text>
            )}
        </TouchableOpacity>
    );

    const transportModes = [
        { id: 'transit', icon: '🚌', label: 'Общественный' },
        { id: 'auto', icon: '🚗', label: 'Авто' },
        { id: 'pedestrian', icon: '🚶', label: 'Пешком' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Настройки</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <View style={styles.content}>
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
                            placeholder="ул. Примерная, д. 123"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Номер группы *</Text>
                        <TextInput
                            style={styles.input}
                            value={groupNumber}
                            onChangeText={setGroupNumber}
                            placeholder="231-324"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Утренняя рутина (минуты)</Text>
                        <TextInput
                            style={styles.input}
                            value={routineMinutes}
                            onChangeText={setRoutineMinutes}
                            placeholder="30"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Запас времени (минуты)</Text>
                        <TextInput
                            style={styles.input}
                            value={bufferMinutes}
                            onChangeText={setBufferMinutes}
                            placeholder="15"
                            placeholderTextColor="#999"
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
                                placeholderTextColor="#999"
                            />
                            <TextInput
                                style={styles.modalInput}
                                value={newAddressValue}
                                onChangeText={setNewAddressValue}
                                placeholder="Адрес"
                                placeholderTextColor="#999"
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
        </ScrollView>
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
        color: '#333',
        marginBottom: 15,
    },
    addressesButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    addressesButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 4,
    },
    addressesButtonSubtext: {
        fontSize: 13,
        color: '#666',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    transportButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    transportButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    transportButtonActive: {
        borderColor: '#007AFF',
        backgroundColor: '#E8F4FD',
    },
    transportIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    transportLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    transportLabelActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007AFF',
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
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 20,
    },
    addressesList: {
        maxHeight: '50%',
    },
    addressCategoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
        marginBottom: 10,
    },
    addressCard: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
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
        color: '#333',
        flex: 1,
    },
    customAddressBadge: {
        backgroundColor: '#FF9500',
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
        color: '#666',
    },
    addressHint: {
        fontSize: 11,
        color: '#FF9500',
        fontStyle: 'italic',
        marginTop: 4,
    },
    addAddressSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    addAddressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    modalInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 10,
    },
    addAddressButton: {
        backgroundColor: '#FF9500',
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
        backgroundColor: '#f0f0f0',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    closeModalButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
});