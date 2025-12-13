import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
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
                }}
            >
                <Tab.Screen
                    name="главная"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'главная',
                    }}
                />
                <Tab.Screen
                    name="расписание"
                    component={ScheduleScreen}
                    options={{
                        tabBarLabel: 'расписание',
                    }}
                />
                <Tab.Screen
                    name="напоминания"
                    component={RemindersScreen}
                    options={{
                        tabBarLabel: 'напоминания',
                    }}
                />
                <Tab.Screen
                    name="настройки"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'настройки',
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}