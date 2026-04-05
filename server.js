const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

const groups = {
    '6413-100503D': '1213641978',
    '6411-100503D': '1282690301',
    '6412-100503D': '1282690279'
};

const knownTeachers = [
    { id: '335824546', name: 'Максимов А.И.' },
    { id: '664017039', name: 'Борисов А.Н.' },
    { id: '364272302', name: 'Агафонов А.А.' },
    { id: '333991624', name: 'Веричев А.В.' },
    { id: '432837452', name: 'Юзькив Р.Р.' },
    { id: '544973937', name: 'Шапиро Д.А.' },
    { id: '147619112', name: 'Кузнецов А.В.' },
    { id: '651422674', name: 'Позднякова Д.С.' },
    { id: '62061001', name: 'Мясников В.В.' }
];

app.get('/api/groups', (req, res) => {
    res.json([
        { id: '1213641978', name: '6413-100503D' },
        { id: '1282690301', name: '6411-100503D' },
        { id: '1282690279', name: '6412-100503D' }
    ]);
});

app.get('/api/schedule/group/:id', async (req, res) => {
    const groupId = req.params.id;
    const week = req.query.week || '31';
    
    let groupName = '6413-100503D';
    for (const [name, id] of Object.entries(groups)) {
        if (id === groupId) {
            groupName = name;
            break;
        }
    }
    
    try {
        const url = `https://ssau.ru/rasp?groupId=${groupId}&selectedWeek=${week}`;
        console.log(`Parsing group: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        const schedule = parseGroupSchedule(html, groupName, week);
        res.json(schedule);
        
    } catch (error) {
        console.error('Parse error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/search/teacher', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.json([]);
    }
    
    try {
        const url = `https://ssau.ru/rasp?search=${encodeURIComponent(query)}`;
        console.log(`Searching teacher: ${url}`);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const teachers = [];
        
        $('.schedule__teacher a').each((i, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href');
            const match = href && href.match(/staffId=(\d+)/);
            if (match && name && name.toLowerCase().includes(query.toLowerCase())) {
                if (!teachers.find(t => t.id === match[1])) {
                    teachers.push({ id: match[1], name: name });
                }
            }
        });
        
        if (teachers.length === 0) {
            const matched = knownTeachers.filter(t => 
                t.name.toLowerCase().includes(query.toLowerCase())
            );
            return res.json(matched);
        }
        
        res.json(teachers.slice(0, 10));
        
    } catch (error) {
        console.error('Search error:', error);
        const matched = knownTeachers.filter(t => 
            t.name.toLowerCase().includes(query.toLowerCase())
        );
        res.json(matched);
    }
});

app.get('/api/schedule/teacher', async (req, res) => {
    const teacherId = req.query.id;
    const week = req.query.week || '31';
    
    try {
        const url = `https://ssau.ru/rasp?staffId=${teacherId}&selectedWeek=${week}`;
        console.log(`Parsing teacher: ${url}`);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const html = await response.text();
        const schedule = parseTeacherSchedule(html, teacherId, week);
        res.json(schedule);
        
    } catch (error) {
        console.error('Teacher parse error:', error);
        
        const teacher = knownTeachers.find(t => t.id === teacherId);
        if (teacher) {
            res.json(getMockTeacherSchedule(teacherId, week));
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});


function parseGroupSchedule(html, groupName, weekNum) {
    const $ = cheerio.load(html);
    
    const scheduleItems = $('.schedule__items');
    if (scheduleItems.length === 0) {
        throw new Error('Schedule container not found');
    }
    
    const days = [];
    scheduleItems.find('.schedule__head:not(:has(.schedule__time-item))').each((i, el) => {
        const weekday = $(el).find('.schedule__head-weekday').text().trim();
        const date = $(el).find('.schedule__head-date').text().trim();
        if (weekday && date) {
            days.push({ weekday: capitalizeDay(weekday), date, index: i });
        }
    });
    
    if (days.length === 0) {
        throw new Error('No days found');
    }
    
    console.log(`Found days: ${days.length}`);
    
    const weekData = [];
    days.forEach((day, idx) => {
        weekData.push({
            day: day.weekday,
            date: day.date,
            lessons: []
        });
    });
    
    const timeBlocks = scheduleItems.find('.schedule__time');
    
    timeBlocks.each((timeBlockIndex, timeBlock) => {
        const $timeBlock = $(timeBlock);
        
        const timeItems = $timeBlock.find('.schedule__time-item');
        const timeRange = [];
        timeItems.each((i, timeEl) => {
            const timeText = $(timeEl).text().trim();
            const time = timeText.split(' ')[0];
            if (time) timeRange.push(time);
        });
        
        let timeInterval = '';
        if (timeRange.length === 2) {
            timeInterval = `${timeRange[0]}-${timeRange[1]}`;
        } else if (timeRange.length === 1) {
            timeInterval = timeRange[0];
        }
        
        let nextElement = $timeBlock.next();
        let dayIndex = 0;
        
        while (nextElement.length && !nextElement.hasClass('schedule__time')) {
            if (nextElement.hasClass('schedule__item') && !nextElement.hasClass('schedule__head')) {
                const lessonElements = nextElement.find('.schedule__lesson');
                
                lessonElements.each((lessonIdx, lessonElem) => {
                    const $lesson = $(lessonElem);
                    
                    const subject = $lesson.find('.schedule__discipline').text().trim();
                    if (subject && dayIndex < days.length) {
                        const type = $lesson.find('.schedule__lesson-type-chip').text().trim();
                        const place = $lesson.find('.schedule__place').text().trim();
                        
                        let teacherName = '';
                        const teacherLink = $lesson.find('.schedule__teacher a');
                        if (teacherLink.length) {
                            teacherName = teacherLink.text().trim();
                        } else {
                            teacherName = $lesson.find('.schedule__teacher').text().trim();
                        }
                        
                        weekData[dayIndex].lessons.push({
                            time: formatTimeRange(timeInterval),
                            name: subject,
                            teacher: teacherName || 'Не указан',
                            room: place || 'Не указана',
                            type: type || 'Занятие'
                        });
                    }
                });
                dayIndex++;
            }
            nextElement = nextElement.next();
        }
    });
    
    const totalLessons = weekData.reduce((sum, day) => sum + day.lessons.length, 0);
    console.log(`Parsed lessons: ${totalLessons}`);
    
    return {
        group: groupName,
        fullName: '10.05.03 Информационная безопасность автоматизированных систем',
        weeks: {
            current: parseInt(weekNum) || 31,
            weeks: {
                [weekNum]: weekData
            }
        }
    };
}

function parseTeacherSchedule(html, teacherId, weekNum) {
    const $ = cheerio.load(html);
    
    const scheduleItems = $('.schedule__items');
    if (scheduleItems.length === 0) {
        throw new Error('Schedule container not found');
    }
    
    const weekData = [];
    const daysMap = {};
    
    scheduleItems.find('.schedule__head:not(:has(.schedule__time-item))').each((i, el) => {
        const weekday = $(el).find('.schedule__head-weekday').text().trim();
        const date = $(el).find('.schedule__head-date').text().trim();
        if (weekday && date) {
            daysMap[i] = { weekday: capitalizeDay(weekday), date };
        }
    });
    
    const timeBlocks = scheduleItems.find('.schedule__time');
    
    timeBlocks.each((timeBlockIndex, timeBlock) => {
        const $timeBlock = $(timeBlock);
        
        const timeItems = $timeBlock.find('.schedule__time-item');
        const timeRange = [];
        timeItems.each((i, timeEl) => {
            const timeText = $(timeEl).text().trim();
            const time = timeText.split(' ')[0];
            if (time) timeRange.push(time);
        });
        
        let timeInterval = '';
        if (timeRange.length === 2) {
            timeInterval = `${timeRange[0]}-${timeRange[1]}`;
        } else if (timeRange.length === 1) {
            timeInterval = timeRange[0];
        }
        
        let nextElement = $timeBlock.next();
        let dayIndex = 0;
        
        while (nextElement.length && !nextElement.hasClass('schedule__time')) {
            if (nextElement.hasClass('schedule__item') && !nextElement.hasClass('schedule__head')) {
                const lessonElements = nextElement.find('.schedule__lesson');
                
                lessonElements.each((lessonIdx, lessonElem) => {
                    const $lesson = $(lessonElem);
                    
                    const subject = $lesson.find('.schedule__discipline').text().trim();
                    if (subject && daysMap[dayIndex]) {
                        const type = $lesson.find('.schedule__lesson-type-chip').text().trim();
                        const place = $lesson.find('.schedule__place').text().trim();
                        
                        const groupsList = [];
                        $lesson.find('.schedule__groups a').each((i, groupEl) => {
                            groupsList.push($(groupEl).text().trim());
                        });
                        
                        let dayObj = weekData.find(d => d.day === daysMap[dayIndex].weekday);
                        if (!dayObj) {
                            dayObj = {
                                day: daysMap[dayIndex].weekday,
                                date: daysMap[dayIndex].date,
                                lessons: []
                            };
                            weekData.push(dayObj);
                        }
                        
                        dayObj.lessons.push({
                            time: formatTimeRange(timeInterval),
                            name: subject,
                            room: place || 'Не указана',
                            type: type || 'Занятие',
                            groups: groupsList.join(', ')
                        });
                    }
                });
                dayIndex++;
            }
            nextElement = nextElement.next();
        }
    });
    
    return {
        teacherId: teacherId,
        fullName: 'Расписание преподавателя',
        weeks: {
            current: parseInt(weekNum) || 31,
            weeks: {
                [weekNum]: weekData
            }
        }
    };
}

function capitalizeDay(day) {
    const days = {
        'понедельник': 'Понедельник',
        'вторник': 'Вторник',
        'среда': 'Среда',
        'четверг': 'Четверг',
        'пятница': 'Пятница',
        'суббота': 'Суббота'
    };
    return days[day.toLowerCase()] || day;
}

function formatTimeRange(timeStr) {
    const timeMap = {
        '08:00': '08:00-09:35',
        '09:35': '09:35-11:20',
        '09:45': '09:45-11:20',
        '11:20': '11:20-13:05',
        '11:30': '11:30-13:05',
        '13:05': '13:05-14:50',
        '13:30': '13:30-15:05',
        '15:05': '15:05-16:50',
        '15:15': '15:15-16:50',
        '16:50': '16:50-18:35',
        '17:00': '17:00-18:35'
    };
    return timeMap[timeStr] || timeStr;
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});