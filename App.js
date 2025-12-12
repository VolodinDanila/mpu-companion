import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: styles.tabBar,
                    headerStyle: styles.header,
                    headerTintColor: '#fff',
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

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
    },
    header: {
        backgroundColor: '#007AFF',
    },
});