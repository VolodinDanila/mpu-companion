import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#999',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#e0e0e0',
                        paddingTop: 5,
                        paddingBottom: 5,
                        height: 60,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                    },
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'главная') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'расписание') {
                            iconName = focused ? 'calendar' : 'calendar-outline';
                        } else if (route.name === 'напоминания') {
                            iconName = focused ? 'notifications' : 'notifications-outline';
                        } else if (route.name === 'настройки') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen
                    name="главная"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Главная',
                    }}
                />
                <Tab.Screen
                    name="расписание"
                    component={ScheduleScreen}
                    options={{
                        tabBarLabel: 'Расписание',
                    }}
                />
                <Tab.Screen
                    name="напоминания"
                    component={RemindersScreen}
                    options={{
                        tabBarLabel: 'Напоминания',
                    }}
                />
                <Tab.Screen
                    name="настройки"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'Настройки',
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}