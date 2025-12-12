import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';

export default function SettingsScreen() {
    const [morningRoutine, setMorningRoutine] = useState('60');
    const [homeAddress, setHomeAddress] = useState('');
    const [groupNumber, setGroupNumber] = useState('');
    const [campusAddresses, setCampusAddresses] = useState([
        { code: 'пр', name: 'Прянишникова', address: '', duration: '' },
        { code: 'пк', name: 'Павла Корчагина', address: '', duration: '' },
        { code: 'ав', name: 'Автозаводская', address: '', duration: '' },
        { code: 'бс', name: 'Большая Семёновская', address: '', duration: '' },
    ]);
    const [transportType, setTransportType] = useState('public');
    const [extraTime, setExtraTime] = useState('10');

    const handleSaveSettings = () => {
        if (!homeAddress.trim()) {
            Alert.alert('Ошибка', 'Укажите домашний адрес');
            return;
        }

        const hasCampus = campusAddresses.some(c => c.address.trim());
        if (!hasCampus) {
            Alert.alert('Ошибка', 'Укажите адрес хотя бы одного корпуса');
            return;
        }

        Alert.alert('Успех', 'Настройки сохранены');
    };

    const renderTransportButton = (type, label, emoji) => (
        <TouchableOpacity
            key={type}
            style={[
                styles.transportButton,
                transportType === type && styles.transportButtonActive,
            ]}
            onPress={() => setTransportType(type)}
        >
            <Text style={styles.transportEmoji}>{emoji}</Text>
            <Text
                style={[
                    styles.transportText,
                    transportType === type && styles.transportTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Утренняя рутина</Text>
                <Text style={styles.sectionDescription}>
                    Сколько времени вам нужно на утренние сборы?
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={morningRoutine}
                        onChangeText={setMorningRoutine}
                        placeholder="60"
                        keyboardType="numeric"
                        maxLength={3}
                    />
                    <Text style={styles.inputLabel}>минут</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Адреса</Text>

                <Text style={styles.label}>Домашний адрес</Text>
                <TextInput
                    style={styles.textInput}
                    value={homeAddress}
                    onChangeText={setHomeAddress}
                    placeholder="Например: Москва, ул. Ленина, д. 15"
                    placeholderTextColor="#999"
                />

                <Text style={[styles.label, styles.labelMarginTop]}>Корпуса университета</Text>
                <Text style={styles.helperText}>
                    Укажите адреса корпусов и время в пути до них
                </Text>

                {campusAddresses.map((campus, index) => (
                    <View key={campus.code} style={styles.campusInputContainer}>
                        <Text style={styles.campusCode}>{campus.code.toUpperCase()}</Text>
                        <View style={styles.campusTextInputContainer}>
                            <Text style={styles.campusName}>{campus.name}</Text>
                            <TextInput
                                style={styles.campusTextInput}
                                value={campus.address}
                                onChangeText={(text) => {
                                    const updated = [...campusAddresses];
                                    updated[index].address = text;
                                    setCampusAddresses(updated);
                                }}
                                placeholder="Адрес корпуса"
                                placeholderTextColor="#999"
                            />
                            <View style={styles.campusDurationContainer}>
                                <TextInput
                                    style={styles.campusDurationInput}
                                    value={campus.duration}
                                    onChangeText={(text) => {
                                        const updated = [...campusAddresses];
                                        updated[index].duration = text;
                                        setCampusAddresses(updated);
                                    }}
                                    placeholder="60"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.campusDurationLabel}>мин</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎓 Учебная группа</Text>

                <Text style={styles.label}>Номер группы</Text>
                <TextInput
                    style={styles.textInput}
                    value={groupNumber}
                    onChangeText={setGroupNumber}
                    placeholder="Например: 231-324"
                    placeholderTextColor="#999"
                />
                <Text style={styles.helperText}>
                    Введите номер вашей группы для автоматической загрузки расписания
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚗 Способ передвижения</Text>
                <Text style={styles.sectionDescription}>
                    Как вы добираетесь до университета?
                </Text>

                <View style={styles.transportContainer}>
                    {renderTransportButton('public', 'Общественный\nтранспорт', '🚌')}
                    {renderTransportButton('car', 'Личный\nавтомобиль', '🚗')}
                    {renderTransportButton('walk', 'Пешком', '🚶')}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏱️ Дополнительное время</Text>
                <Text style={styles.sectionDescription}>
                    Запас времени на непредвиденные обстоятельства
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={extraTime}
                        onChangeText={setExtraTime}
                        placeholder="10"
                        keyboardType="numeric"
                        maxLength={2}
                    />
                    <Text style={styles.inputLabel}>минут</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSettings}
            >
                <Text style={styles.saveButtonText}>Сохранить настройки</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    💡 Приложение автоматически рассчитает время будильника на основе
                    ваших настроек, расписания и текущей дорожной ситуации.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 15,
        padding: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    input: {
        fontSize: 24,
        fontWeight: '600',
        color: '#007AFF',
        minWidth: 60,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 16,
        color: '#666',
        marginLeft: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    labelMarginTop: {
        marginTop: 15,
    },
    textInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic',
    },
    campusInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 12,
    },
    campusCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        width: 40,
        textAlign: 'center',
    },
    campusTextInputContainer: {
        flex: 1,
        marginLeft: 10,
    },
    campusName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    campusTextInput: {
        fontSize: 14,
        color: '#333',
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 8,
    },
    campusDurationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    campusDurationInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        padding: 0,
    },
    campusDurationLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    transportContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    transportButton: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    transportButtonActive: {
        backgroundColor: '#E8F4FD',
        borderColor: '#007AFF',
    },
    transportEmoji: {
        fontSize: 30,
        marginBottom: 8,
    },
    transportText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    transportTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        margin: 20,
        marginTop: 25,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#FFF9E6',
        margin: 20,
        marginTop: 0,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE88C',
        marginBottom: 30,
    },
    infoText: {
        fontSize: 14,
        color: '#8B7500',
        lineHeight: 20,
    },
}); 