export const extractCampusCode = (room) => {
    if (!room || typeof room !== 'string') {
        return null;
    }

    const cleanRoom = room.replace(/<[^>]*>/g, '').trim().toLowerCase();
    const match = cleanRoom.match(/^(пр|пк|ав|бс)-/);

    if (match) {
        return match[1];
    }

    return null;
};

export const getNextCampus = (schedule, currentTime = new Date()) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        return null;
    }

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    for (const lesson of schedule) {
        if (!lesson.time || !lesson.room) {
            continue;
        }

        const timeMatch = lesson.time.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) {
            continue;
        }

        const lessonHour = parseInt(timeMatch[1], 10);
        const lessonMinute = parseInt(timeMatch[2], 10);
        const lessonTimeInMinutes = lessonHour * 60 + lessonMinute;

        if (lessonTimeInMinutes + 90 >= currentTimeInMinutes) {
            const campusCode = extractCampusCode(lesson.room);
            if (campusCode) {
                console.log(`📍 определён корпус для ближайшей пары: ${campusCode}`);
                return campusCode;
            }
        }
    }

    for (const lesson of schedule) {
        if (lesson.room) {
            const campusCode = extractCampusCode(lesson.room);
            if (campusCode) {
                console.log(`📍 используем корпус первой пары дня: ${campusCode}`);
                return campusCode;
            }
        }
    }

    return null;
};

export const getCampusAddress = (campusCode, campusAddresses) => {
    if (!campusCode || !campusAddresses || !Array.isArray(campusAddresses)) {
        return null;
    }

    const campus = campusAddresses.find(c => c.code === campusCode);

    if (campus && campus.address && campus.address.trim()) {
        console.log(`📍 найден адрес для корпуса "${campusCode}": ${campus.address}`);
        return campus.address;
    }

    console.log(`⚠️ адрес для корпуса "${campusCode}" не найден в настройках`);
    return null;
};