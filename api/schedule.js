const USE_PROXY = true;
const PROXY_URL = 'https://mpu-schedule.danilavolodinn.workers.dev/';
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

const isScheduleEmpty = (data) => {
    if (!data || !data.grid) return true;

    const gridKeys = Object.keys(data.grid);
    if (gridKeys.length === 0) return true;

    for (const dayKey in data.grid) {
        const dayData = data.grid[dayKey];
        if (dayData && typeof dayData === 'object') {
            const lessonKeys = Object.keys(dayData);
            if (lessonKeys.length > 0) {
                for (const lessonKey in dayData) {
                    const lessons = dayData[lessonKey];
                    if (Array.isArray(lessons) && lessons.length > 0) {
                        const hasRealLesson = lessons.some(lesson =>
                            lesson && lesson.sbj && lesson.sbj.trim() !== ''
                        );
                        if (hasRealLesson) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
};

export const fetchScheduleFromUniversity = async (groupNumber) => {
    if (!groupNumber || !groupNumber.trim()) {
        throw new Error('Не указан номер группы');
    }

    try {
        console.log(`📅 Запрашиваю расписание для группы: ${groupNumber}`);

        console.log('🔍 Попытка 1: Обычное расписание...');
        try {
            const url1 = USE_PROXY
                ? `${PROXY_URL}?group=${groupNumber}&session=0`
                : `${BASE_URL}?group=${groupNumber}&session=0`;

            console.log('   URL:', url1);
            const response1 = await fetch(url1, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            if (response1.ok) {
                const text1 = await response1.text();
                console.log('   Получен ответ, длина:', text1.length);

                let data1;
                try {
                    data1 = JSON.parse(text1);
                } catch (e) {
                    console.log('   ⚠️ Не JSON, пропускаю');
                    throw new Error('Not JSON');
                }

                console.log('   Grid keys:', Object.keys(data1.grid || {}).length);

                if (!isScheduleEmpty(data1)) {
                    console.log('✅ Обычное расписание загружено!');
                    return data1;
                }

                console.log('   ⚠️ Расписание пустое');
            }
        } catch (error) {
            console.log('   ❌ Ошибка:', error.message);
        }

        console.log('🔍 Попытка 2: Расписание сессии...');
        try {
            const url2 = USE_PROXY
                ? `${PROXY_URL}?group=${groupNumber}&session=1`
                : `${BASE_URL}?group=${groupNumber}&session=1`;

            console.log('   URL:', url2);
            const response2 = await fetch(url2, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            if (response2.ok) {
                const text2 = await response2.text();
                console.log('   Получен ответ, длина:', text2.length);

                let data2;
                try {
                    data2 = JSON.parse(text2);
                } catch (e) {
                    console.log('   ⚠️ Не JSON (возможно HTML страница поиска)');
                    throw new Error('Not JSON');
                }

                console.log('   Grid keys:', Object.keys(data2.grid || {}).length);

                if (!isScheduleEmpty(data2)) {
                    console.log('✅ Расписание сессии загружено!');
                    return data2;
                }

                console.log('   ⚠️ Расписание сессии пустое');
            }
        } catch (error) {
            console.log('   ❌ Ошибка:', error.message);
        }

        throw new Error('Расписание не найдено. Возможно его еще нет на сервере.');

    } catch (error) {
        console.error('❌ Финальная ошибка:', error);
        throw error;
    }
};

const isDateKey = (key) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(key);
};

const convertDateToDayNumber = (dateStr) => {
    try {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 ? 7 : dayOfWeek;
    } catch {
        return 1;
    }
};

const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const findNearestDateForDay = (dayNumber, allDates, currentDate) => {
    const today = currentDate || new Date();
    today.setHours(0, 0, 0, 0);

    const datesForDay = allDates.filter(dateStr => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
        return dayOfWeek === dayNumber;
    }).sort();

    for (const dateStr of datesForDay) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        if (date >= today) {
            return dateStr;
        }
    }

    return datesForDay[datesForDay.length - 1] || null;
};

export const parseSchedule = (rawSchedule, selectedDate = null) => {
    if (!rawSchedule || !rawSchedule.grid) {
        console.log('⚠️ нет данных grid в расписании');
        return {};
    }

    const parsedSchedule = {};
    const isSession = rawSchedule.isSession || false;

    const EXCLUDED_SUBJECTS = [
        'проектная деятельность',
        'общая физическая подготовка',
        'физическая культура',
        'физкультура',
    ];

    const shouldExcludeSubject = (subjectName) => {
        if (!subjectName) return false;
        const normalized = subjectName.toLowerCase().trim();
        return EXCLUDED_SUBJECTS.some(excluded => normalized.includes(excluded));
    };

    console.log('🔍 дни в расписании:', Object.keys(rawSchedule.grid));
    console.log('📊 Режим сессии:', isSession);

    const allSessionDates = Object.keys(rawSchedule.grid).filter(isDateKey);
    const currentDate = selectedDate || new Date();

    console.log('📅 Доступные даты сессии:', allSessionDates);
    console.log('📅 Текущая/выбранная дата:', getDateString(currentDate));

    Object.keys(rawSchedule.grid).forEach(dayKey => {
        const dayData = rawSchedule.grid[dayKey];

        if (!dayData || typeof dayData !== 'object') {
            return;
        }

        const allLessonsForDay = [];
        let targetDayNumber = dayKey;

        if (isDateKey(dayKey)) {
            targetDayNumber = convertDateToDayNumber(dayKey);
        }

        Object.keys(dayData).forEach(lessonNumber => {
            const lessonsInSlot = dayData[lessonNumber];

            if (!Array.isArray(lessonsInSlot) || lessonsInSlot.length === 0) {
                return;
            }

            lessonsInSlot.forEach((lesson, slotIndex) => {
                if (!lesson || typeof lesson !== 'object') {
                    return;
                }

                if (!isSession && shouldExcludeSubject(lesson.sbj)) {
                    console.log(`🚫 пропускаю: ${lesson.sbj} (${dayKey}, пара ${lessonNumber})`);
                    return;
                }

                if (!isSession && lesson.df && lesson.dt) {
                    const now = new Date();
                    const dateFrom = new Date(lesson.df);
                    const dateTo = new Date(lesson.dt);

                    if (now > dateTo || now < dateFrom) {
                        return;
                    }
                }

                let room = 'аудитория не указана';
                if (lesson.location) {
                    room = lesson.location;
                } else if (lesson.shortRooms && lesson.shortRooms.length > 0) {
                    room = lesson.shortRooms[0];
                } else if (lesson.auditories && lesson.auditories.length > 0) {
                    const auditory = lesson.auditories[0];
                    if (typeof auditory === 'object' && auditory.title) {
                        room = auditory.title.replace(/<[^>]*>/g, '');
                    } else if (typeof auditory === 'string') {
                        room = auditory.replace(/<[^>]*>/g, '');
                    }
                }

                const time = LESSON_TIMES[lessonNumber] || '';
                const teacher = lesson.teacher && lesson.teacher.trim() !== ''
                    ? lesson.teacher
                    : 'преподаватель не указан';

                const subjectName = lesson.sbj || 'неизвестный предмет';

                const parsedLesson = {
                    id: `${dayKey}-${lessonNumber}-${slotIndex}`,
                    time: time,
                    subject: subjectName,
                    type: lesson.type || 'занятие',
                    room: room,
                    professor: teacher,
                    lessonNumber: parseInt(lessonNumber, 10),
                    dateFrom: lesson.df || null,
                    dateTo: lesson.dt || null,
                    isSession: isSession,
                    sessionDate: isSession ? dayKey : null,
                };

                allLessonsForDay.push(parsedLesson);
            });
        });

        allLessonsForDay.sort((a, b) => a.lessonNumber - b.lessonNumber);

        if (isDateKey(dayKey)) {
            if (!parsedSchedule[targetDayNumber]) {
                parsedSchedule[targetDayNumber] = [];
            }

            allLessonsForDay.forEach(lesson => {
                lesson.sessionDateObj = new Date(dayKey);
            });

            parsedSchedule[targetDayNumber].push(...allLessonsForDay);
        } else {
            parsedSchedule[dayKey] = allLessonsForDay;
        }

        console.log(`✅ день ${dayKey}: ${allLessonsForDay.length} занятий (после фильтрации)`);
    });

    if (isSession) {
        Object.keys(parsedSchedule).forEach(dayNum => {
            parsedSchedule[dayNum].sort((a, b) => {
                if (a.sessionDate && b.sessionDate) {
                    const dateCompare = a.sessionDate.localeCompare(b.sessionDate);
                    if (dateCompare !== 0) return dateCompare;
                }
                return a.lessonNumber - b.lessonNumber;
            });
        });
    }

    return { schedule: parsedSchedule, isSession, allSessionDates };
};

export const getScheduleForDay = (parsedData, dayNumber, referenceDate = null) => {
    if (!parsedData) return [];

    const { schedule, isSession, allSessionDates } = parsedData;

    if (!schedule || !schedule[dayNumber]) {
        return [];
    }

    if (!isSession) {
        return schedule[dayNumber];
    }

    const today = referenceDate || new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = findNearestDateForDay(dayNumber, allSessionDates, today);

    if (!targetDate) {
        console.log(`⚠️ Нет занятий для дня ${dayNumber} начиная с ${getDateString(today)}`);
        return [];
    }

    console.log(`📅 Показываю занятия для дня ${dayNumber} на дату: ${targetDate}`);

    return schedule[dayNumber].filter(lesson => lesson.sessionDate === targetDate);
};

export const getNextClass = (parsedData) => {
    if (!parsedData) return null;

    const { schedule, isSession } = parsedData;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const normalizedDay = currentDay === 0 ? 7 : currentDay;

    if (isSession) {
        const todayStr = getDateString(now);

        for (let day = normalizedDay; day <= 7; day++) {
            const daySchedule = schedule[day] || [];

            for (const lesson of daySchedule) {
                if (!lesson.sessionDate) continue;

                const lessonDate = new Date(lesson.sessionDate);
                lessonDate.setHours(0, 0, 0, 0);
                const nowDate = new Date(now);
                nowDate.setHours(0, 0, 0, 0);

                if (lessonDate < nowDate) continue;

                if (lessonDate.getTime() === nowDate.getTime()) {
                    const lessonTime = parseTimeString(lesson.time);
                    if (lessonTime <= currentTime) continue;
                }

                return {
                    ...lesson,
                    date: lessonDate.getTime() === nowDate.getTime() ? 'сегодня' :
                        lessonDate.getTime() === nowDate.getTime() + 86400000 ? 'завтра' :
                            lesson.sessionDate,
                    dayNumber: day,
                };
            }
        }

        for (let day = 1; day < normalizedDay; day++) {
            const daySchedule = schedule[day] || [];

            for (const lesson of daySchedule) {
                if (!lesson.sessionDate) continue;

                const lessonDate = new Date(lesson.sessionDate);
                lessonDate.setHours(0, 0, 0, 0);
                const nowDate = new Date(now);
                nowDate.setHours(0, 0, 0, 0);

                if (lessonDate < nowDate) continue;

                return {
                    ...lesson,
                    date: lesson.sessionDate,
                    dayNumber: day,
                };
            }
        }

        return null;
    }

    const todaySchedule = schedule[normalizedDay] || [];

    for (const lesson of todaySchedule) {
        const lessonTime = parseTimeString(lesson.time);
        if (lessonTime > currentTime) {
            return {
                ...lesson,
                date: 'сегодня',
                dayNumber: normalizedDay,
            };
        }
    }

    for (let offset = 1; offset <= 7; offset++) {
        const checkDay = ((normalizedDay - 1 + offset) % 6) + 1;
        const daySchedule = schedule[checkDay] || [];

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

const parseTimeString = (timeStr) => {
    if (!timeStr) return 0;

    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
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