import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    primary: '#007AFF',
    success: '#4CAF50',
    warning: '#FF9500',
    danger: '#FF3B30',
    border: '#e0e0e0',
    shadow: '#000000',
    tabBar: '#ffffff',
    inputBackground: '#f8f8f8',
};

export const darkTheme = {
    background: '#000000',
    card: '#1c1c1e',
    text: '#ffffff',
    textSecondary: '#ebebf5',
    textTertiary: '#8e8e93',
    primary: '#0a84ff',
    success: '#30d158',
    warning: '#ff9f0a',
    danger: '#ff453a',
    border: '#38383a',
    shadow: '#000000',
    tabBar: '#1c1c1e',
    inputBackground: '#2c2c2e',
};

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState('system');
    const [currentTheme, setCurrentTheme] = useState(systemColorScheme === 'dark' ? darkTheme : lightTheme);

    useEffect(() => {
        loadThemePreference();
    }, []);

    useEffect(() => {
        updateTheme();
    }, [themeMode, systemColorScheme]);

    const loadThemePreference = async () => {
        try {
            const saved = await AsyncStorage.getItem('theme_preference');
            if (saved) {
                setThemeMode(saved);
            }
        } catch (error) {
            console.error('ошибка загрузки темы:', error);
        }
    };

    const updateTheme = () => {
        if (themeMode === 'system') {
            setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
        } else if (themeMode === 'dark') {
            setCurrentTheme(darkTheme);
        } else {
            setCurrentTheme(lightTheme);
        }
    };

    const setTheme = async (mode) => {
        try {
            await AsyncStorage.setItem('theme_preference', mode);
            setThemeMode(mode);
        } catch (error) {
            console.error('ошибка сохранения темы:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: currentTheme, themeMode, setTheme, isDark: currentTheme === darkTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme должен использоваться внутри ThemeProvider');
    }
    return context;
};