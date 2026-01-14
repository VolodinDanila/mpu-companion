import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const IS_EMULATOR = Platform.OS === 'android' && !Platform.isPad;

export const lightHaptic = () => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (__DEV__) {
            console.log('💫 [Haptics] Light impact');
        }
    } catch (error) {
        console.log('⚠️ [Haptics] Not supported:', error.message);
    }
};

export const mediumHaptic = () => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (__DEV__) {
            console.log('💥 [Haptics] Medium impact');
        }
    } catch (error) {
        console.log('⚠️ [Haptics] Not supported');
    }
};

export const heavyHaptic = () => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        if (__DEV__) {
            console.log('💢 [Haptics] Heavy impact');
        }
    } catch (error) {
        console.log('⚠️ [Haptics] Not supported');
    }
};

export const successHaptic = () => {
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (__DEV__) {
            console.log('✅ [Haptics] Success notification');
        }
    } catch (error) {
        console.log('⚠️ [Haptics] Not supported');
    }
};

export const errorHaptic = () => {
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        if (__DEV__) {
            console.log('❌ [Haptics] Error notification');
        }
    } catch (error) {
        console.log('⚠️ [Haptics] Not supported');
    }
};

export const selectionHaptic = () => {
    try {
        Haptics.selectionAsync();

        if (__DEV__) {
            console.log('👆 [Haptics] Selection');
        }
    } catch (error) {
        console.log('⚠️ [Haptics] Not supported');
    }
};