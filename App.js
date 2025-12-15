import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
    const { theme, isDark } = useTheme();

    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textTertiary,
                    tabBarStyle: {
                        backgroundColor: theme.tabBar,
                        borderTopWidth: 1,
                        borderTopColor: theme.border,
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

                        if (route.name === 'Главная') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Расписание') {
                            iconName = focused ? 'calendar' : 'calendar-outline';
                        } else if (route.name === 'Напоминания') {
                            iconName = focused ? 'notifications' : 'notifications-outline';
                        } else if (route.name === 'Настройки') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Главная" component={HomeScreen} />
                <Tab.Screen name="Расписание" component={ScheduleScreen} />
                <Tab.Screen name="Напоминания" component={RemindersScreen} />
                <Tab.Screen name="Настройки" component={SettingsScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppNavigator />
        </ThemeProvider>
    );
}