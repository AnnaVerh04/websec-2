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
        console.log(`Parsing: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        const schedule = parseSchedule(html, groupId, groupName, week);
        res.json(schedule);
        
    } catch (error) {
        console.error('Parse error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

function parseSchedule(html, groupId, groupName, weekNum) {
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