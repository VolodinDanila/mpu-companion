const BASE_URL = 'https://rasp.dmami.ru/site/group';

const LESSON_TIMES = {
    1: '09:00-10:30',
    2: '10:40-12:10',
    3: '12:20-13:50',
    4: '14:30-16:00',
    5: '16:10-17:40',
    6: '17:50-19:20',
    7: '19:30-21:00',
};

export const fetchScheduleFromUniversity = async (groupNumber) => {
    if (!groupNumber || !groupNumber.trim()) {
        throw new Error('не указан номер группы');
    }

    console.log(`📅 запрашиваю расписание для группы: ${groupNumber}`);

    return getMockScheduleData();
};

export const parseSchedule = (rawSchedule) => {
    if (!rawSchedule || !rawSchedule.grid) {
        console.log('⚠️ нет данных grid в расписании');
        return {};
    }

    const parsedSchedule = {};

    Object.keys(rawSchedule.grid).forEach(dayKey => {
        const dayData = rawSchedule.grid[dayKey];

        if (!dayData || typeof dayData !== 'object') {
            parsedSchedule[dayKey] = [];
            return;
        }

        const allLessonsForDay = [];

        Object.keys(dayData).forEach(lessonNumber => {
            const lessonsInSlot = dayData[lessonNumber];

            if (!Array.isArray(lessonsInSlot) || lessonsInSlot.length === 0) {
                return;
            }

            lessonsInSlot.forEach((lesson, slotIndex) => {
                if (!lesson || typeof lesson !== 'object') {
                    return;
                }

                const time = LESSON_TIMES[lessonNumber] || '';
                const teacher = lesson.teacher || 'преподаватель не указан';
                const room = lesson.room || 'аудитория не указана';

                const parsedLesson = {
                    id: `${dayKey}-${lessonNumber}-${slotIndex}`,
                    time: time,
                    subject: lesson.subject || 'неизвестный предмет',
                    type: lesson.type || 'занятие',
                    room: room,
                    professor: teacher,
                    lessonNumber: parseInt(lessonNumber, 10),
                };

                allLessonsForDay.push(parsedLesson);
            });
        });

        allLessonsForDay.sort((a, b) => a.lessonNumber - b.lessonNumber);
        parsedSchedule[dayKey] = allLessonsForDay;
    });

    return parsedSchedule;
};

export const getScheduleForDay = (parsedSchedule, dayNumber) => {
    if (!parsedSchedule || !parsedSchedule[dayNumber]) {
        return [];
    }
    return parsedSchedule[dayNumber];
};

export const getNextClass = (parsedSchedule) => {
    const now = new Date();
    const currentDay = now.getDay();
    const normalizedDay = currentDay === 0 ? 7 : currentDay;

    const todaySchedule = parsedSchedule[normalizedDay] || [];

    for (const lesson of todaySchedule) {
        return {
            ...lesson,
            date: 'сегодня',
            dayNumber: normalizedDay,
        };
    }

    for (let offset = 1; offset <= 7; offset++) {
        const checkDay = ((normalizedDay - 1 + offset) % 6) + 1;
        const daySchedule = parsedSchedule[checkDay] || [];

        if (daySchedule.length > 0) {
            return {
                ...daySchedule[0],
                date: offset === 1 ? 'завтра' : getDayName(checkDay),
                dayNumber: checkDay,
            };
        }
    }

    return null;
};

const getDayName = (dayNumber) => {
    const days = {
        1: 'понедельник',
        2: 'вторник',
        3: 'среда',
        4: 'четверг',
        5: 'пятница',
        6: 'суббота',
    };
    return days[dayNumber] || 'неизвестный день';
};

const getMockScheduleData = () => {
    return {
        grid: {
            1: {
                1: [{
                    subject: 'математический анализ',
                    type: 'лекция',
                    room: 'пр-123',
                    teacher: 'иванов и.и.',
                }],
                2: [{
                    subject: 'программирование',
                    type: 'практика',
                    room: 'пр-301',
                    teacher: 'петрова а.с.',
                }],
            },
            2: {
                3: [{
                    subject: 'физика',
                    type: 'лекция',
                    room: 'пр-215',
                    teacher: 'сидоров п.п.',
                }],
            },
        },
    };
};