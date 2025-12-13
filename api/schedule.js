const USE_PROXY = true;
const PROXY_HOST = '10.0.2.2';
const PROXY_PORT = 3001;
const BASE_URL = USE_PROXY
    ? `http://${PROXY_HOST}:${PROXY_PORT}`
    : 'https://rasp.dmami.ru/site/group'

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

    const url = `${BASE_URL}?group=${groupNumber}&session=0`;

    try {
        console.log(`📅 запрашиваю расписание для группы: ${groupNumber}`);
        console.log(`🔗 url: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`ошибка сервера: ${response.status}`);
        }

        const text = await response.text();
        console.log('📥 получен ответ, длина:', text.length);

        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('❌ не удалось распарсить json:', parseError);
            throw new Error('некорректный формат данных от сервера');
        }

        if (!data || !data.grid) {
            console.warn('⚠️ в ответе нет данных grid');
            throw new Error('сервер вернул пустое расписание');
        }

        console.log('✅ расписание успешно загружено с сервера');
        return data;

    } catch (error) {
        console.error('❌ ошибка загрузки расписания:', error);

        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('не удалось подключиться к серверу университета. проверьте интернет-соединение.');
        }

        if (error.message && error.message.includes('NetworkError')) {
            throw new Error('cors ошибка: для веб-версии требуется прокси-сервер. на android приложение будет работать корректно.');
        }

        throw error;
    }
};

export const parseSchedule = (rawSchedule) => {
    if (!rawSchedule || !rawSchedule.grid) {
        console.log('⚠️ нет данных grid в расписании');
        return {};
    }

    const parsedSchedule = {};

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

                if (shouldExcludeSubject(lesson.sbj)) {
                    console.log(`🚫 пропускаем: ${lesson.sbj} (${dayKey}, пара ${lessonNumber})`);
                    return;
                }

                if (lesson.df && lesson.dt) {
                    const now = new Date();
                    const dateFrom = new Date(lesson.df);
                    const dateTo = new Date(lesson.dt);

                    if (now > dateTo || now < dateFrom) {
                        return;
                    }
                }

                let room = 'аудитория не указана';
                if (lesson.shortRooms && lesson.shortRooms.length > 0) {
                    room = lesson.shortRooms[0];
                } else if (lesson.auditories && lesson.auditories.length > 0) {
                    const auditory = lesson.auditories[0];
                    room = auditory.title ? auditory.title.replace(/<[^>]*>/g, '') : 'аудитория не указана';
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
                };

                allLessonsForDay.push(parsedLesson);
            });
        });

        allLessonsForDay.sort((a, b) => a.lessonNumber - b.lessonNumber);
        parsedSchedule[dayKey] = allLessonsForDay;

        console.log(`✅ день ${dayKey}: ${allLessonsForDay.length} занятий (после фильтрации)`);
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
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const normalizedDay = currentDay === 0 ? 7 : currentDay;

    const todaySchedule = parsedSchedule[normalizedDay] || [];

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