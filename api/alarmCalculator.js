export const parseTimeString = (timeStr, baseDate = new Date()) => {
    if (!timeStr) return null;

    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);

    return date;
};

export const formatTime = (date) => {
    if (!date || !(date instanceof Date)) return '';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const getRelativeDayName = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';

    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[targetDate.getDay()];
};

export const calculateAlarm = (nextClass, settings, routeData) => {
    if (!nextClass || !nextClass.time) {
        return null;
    }

    const classStartTime = parseTimeString(nextClass.time);
    if (!classStartTime) {
        return null;
    }

    const morningRoutine = parseInt(settings?.morningRoutine || '60', 10);
    const extraTime = parseInt(settings?.extraTime || '10', 10);
    const travelTime = routeData?.duration || 30;
    const trafficExtra = routeData?.trafficInfo?.additionalTime || 0;

    const totalTravelTime = travelTime + trafficExtra;
    const totalMinutesBeforeClass = morningRoutine + totalTravelTime + extraTime;

    const alarmTime = new Date(classStartTime.getTime() - totalMinutesBeforeClass * 60000);

    let alarmDate = new Date(alarmTime);

    const now = new Date();
    if (alarmTime < now) {
        if (nextClass.date !== 'Сегодня') {
            const daysForward = getDaysForward(nextClass.dayNumber);
            alarmDate = new Date(now);
            alarmDate.setDate(alarmDate.getDate() + daysForward);
            alarmDate.setHours(alarmTime.getHours(), alarmTime.getMinutes(), 0, 0);
        }
    }

    return {
        time: formatTime(alarmDate),
        date: getRelativeDayName(alarmDate),
        fullDate: alarmDate,
        classTime: nextClass.time.split(' ')[0],
        className: nextClass.subject,
        classType: nextClass.type,
        breakdown: {
            morningRoutine,
            travelTime: totalTravelTime,
            extraTime,
            total: totalMinutesBeforeClass,
        },
    };
};

const getDaysForward = (targetDayNumber) => {
    const today = new Date().getDay();
    const normalizedToday = today === 0 ? 7 : today;

    let daysForward = targetDayNumber - normalizedToday;
    if (daysForward <= 0) {
        daysForward += 7;
    }

    return daysForward;
};

export const getTimeUntilAlarm = (alarmTime) => {
    if (!alarmTime) return null;

    const now = new Date();
    const diff = alarmTime - now;

    if (diff < 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
        hours,
        minutes,
        totalMinutes: Math.floor(diff / (1000 * 60)),
        formatted: `${hours}ч ${minutes}мин`,
    };
};