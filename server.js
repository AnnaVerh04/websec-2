const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/api/groups', (req, res) => {
    res.json([
        { id: '1213641978', name: '6413-100503D' },
        { id: '1213641979', name: '6411-100503D' },
        { id: '1213641980', name: '6412-100503D' }
    ]);
});

app.get('/api/schedule/group/:id', (req, res) => {
    const groupId = req.params.id;
    const week = req.query.week || '31';
    
    console.log(`Запрос расписания: группа ${groupId}, неделя ${week}`);
    res.json(getScheduleData(groupId, week));
});

function getScheduleData(groupId, weekNum) {
    const schedules = {
        '1213641978': {
            '30': [
                { day: 'Понедельник', date: '23.03.2026', lessons: [{ time: '08:00-09:35', name: 'Военная подготовка', teacher: 'Преподаватели Военной Кафедры', room: 'Военная кафедра - 4', type: 'Другое' }] },
                { day: 'Вторник', date: '24.03.2026', lessons: [] },
                { day: 'Среда', date: '25.03.2026', lessons: [{ time: '09:45-11:20', name: 'Современные технологии информационной безопасности', teacher: 'Максимов А.И.', room: 'online', type: 'Лекция' }] },
                { day: 'Четверг', date: '26.03.2026', lessons: [] },
                { day: 'Пятница', date: '27.03.2026', lessons: [] },
                { day: 'Суббота', date: '28.03.2026', lessons: [] }
            ],
            '31': [
                { day: 'Понедельник', date: '30.03.2026', lessons: [{ time: '08:00-09:35', name: 'Военная подготовка', teacher: 'Преподаватели Военной Кафедры', room: 'Военная кафедра - 4', type: 'Другое' }] },
                { day: 'Вторник', date: '31.03.2026', lessons: [] },
                { day: 'Среда', date: '01.04.2026', lessons: [{ time: '09:45-11:20', name: 'Современные технологии информационной безопасности', teacher: 'Максимов А.И.', room: 'online', type: 'Лекция' }] },
                { day: 'Четверг', date: '02.04.2026', lessons: [{ time: '11:30-13:05', name: 'Безопасность открытых информационных систем', teacher: 'Борисов А.Н.', room: '101а - 3', type: 'Лабораторная' }] },
                { day: 'Пятница', date: '03.04.2026', lessons: [{ time: '09:45-11:20', name: 'Современные технологии информационной безопасности', teacher: 'Максимов А.И.', room: 'online', type: 'Лабораторная' }] },
                { day: 'Суббота', date: '04.04.2026', lessons: [] }
            ],
            '32': [
                { day: 'Понедельник', date: '06.04.2026', lessons: [{ time: '08:00-09:35', name: 'Форензика', teacher: 'Веричев А.В.', room: 'online', type: 'Лекция' }] },
                { day: 'Вторник', date: '07.04.2026', lessons: [] },
                { day: 'Среда', date: '08.04.2026', lessons: [{ time: '09:45-11:20', name: 'Безопасность открытых информационных систем', teacher: 'Борисов А.Н.', room: '101а - 3', type: 'Лабораторная' }] },
                { day: 'Четверг', date: '09.04.2026', lessons: [] },
                { day: 'Пятница', date: '10.04.2026', lessons: [{ time: '11:30-13:05', name: 'Безопасность систем баз данных', teacher: 'Агафонов А.А.', room: 'online', type: 'Лекция' }] },
                { day: 'Суббота', date: '11.04.2026', lessons: [] }
            ],
            '33': [
                { day: 'Понедельник', date: '13.04.2026', lessons: [{ time: '08:00-09:35', name: 'Веб-разработка', teacher: 'Агафонов А.А.', room: 'online', type: 'Лекция' }] },
                { day: 'Вторник', date: '14.04.2026', lessons: [{ time: '09:45-11:20', name: 'Компьютерная алгебра', teacher: 'Веричев А.В.', room: '313 - адм', type: 'Лекция' }] },
                { day: 'Среда', date: '15.04.2026', lessons: [] },
                { day: 'Четверг', date: '16.04.2026', lessons: [{ time: '11:30-13:05', name: 'Компьютерная алгебра', teacher: 'Позднякова Д.С.', room: '608 - 18', type: 'Практика' }] },
                { day: 'Пятница', date: '17.04.2026', lessons: [{ time: '13:30-15:05', name: 'Безопасность открытых информационных систем', teacher: 'Кузнецов А.В.', room: 'online', type: 'Лекция' }] },
                { day: 'Суббота', date: '18.04.2026', lessons: [{ time: '09:45-11:20', name: 'Цифровая обработка сигналов', teacher: 'Шапиро Д.А.', room: '102а - 3', type: 'Лабораторная' }] }
            ]
        },
        '1213641979': {
            '31': [
                { day: 'Понедельник', date: '30.03.2026', lessons: [{ time: '08:00-09:35', name: 'Военная подготовка', teacher: 'Преподаватели Военной Кафедры', room: 'Военная кафедра - 4', type: 'Другое' }] },
                { day: 'Вторник', date: '31.03.2026', lessons: [] },
                { day: 'Среда', date: '01.04.2026', lessons: [{ time: '09:45-11:20', name: 'Современные технологии информационной безопасности', teacher: 'Максимов А.И.', room: 'online', type: 'Лекция' }] },
                { day: 'Четверг', date: '02.04.2026', lessons: [] },
                { day: 'Пятница', date: '03.04.2026', lessons: [] },
                { day: 'Суббота', date: '04.04.2026', lessons: [] }
            ]
        },
        '1213641980': {
            '31': [
                { day: 'Понедельник', date: '30.03.2026', lessons: [{ time: '08:00-09:35', name: 'Военная подготовка', teacher: 'Преподаватели Военной Кафедры', room: 'Военная кафедра - 4', type: 'Другое' }] },
                { day: 'Вторник', date: '31.03.2026', lessons: [] },
                { day: 'Среда', date: '01.04.2026', lessons: [{ time: '09:45-11:20', name: 'Современные технологии информационной безопасности', teacher: 'Максимов А.И.', room: 'online', type: 'Лекция' }] },
                { day: 'Четверг', date: '02.04.2026', lessons: [] },
                { day: 'Пятница', date: '03.04.2026', lessons: [] },
                { day: 'Суббота', date: '04.04.2026', lessons: [] }
            ]
        }
    };
    
    const groupSchedule = schedules[groupId] || schedules['1213641978'];
    const weekData = groupSchedule[weekNum] || groupSchedule['31'] || [];
    
    return {
        group: groupId,
        fullName: '10.05.03 Информационная безопасность автоматизированных систем',
        weeks: {
            current: parseInt(weekNum) || 31,
            weeks: {
                [weekNum]: weekData
            }
        }
    };
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});