let currentGroupId = null;
let currentWeek = 31;
let scheduleData = null;
let currentView = 'group';
let currentTeacherId = null;
let currentTeacherName = '';

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const timeSlots = ['08:00', '09:45', '11:30', '13:30', '15:15', '17:00'];

const fullTimeSlots = {
    '08:00': '08:00 - 09:35',
    '09:45': '09:45 - 11:20',
    '11:30': '11:30 - 13:05',
    '13:30': '13:30 - 15:05',
    '15:15': '15:15 - 16:50',
    '17:00': '17:00 - 18:35'
};

function getCurrentWeek() {
    const today = new Date();
    const startDate = new Date(2026, 2, 30);
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let weekNumber = Math.floor(diffDays / 7) + 31;
    if (weekNumber < 29) weekNumber = 29;
    if (weekNumber > 35) weekNumber = 35;
    return weekNumber;
}

$(document).ready(function() {
    console.log('Скрипт загружен');
    
    currentWeek = getCurrentWeek();
    updateWeekDisplay();
    
    loadGroups();
    
    $('#loadBtn').click(function() {
        currentGroupId = $('#groupSelect').val();
        if (!currentGroupId) {
            alert('Пожалуйста, выберите группу');
            return;
        }
        currentView = 'group';
        loadSchedule();
    });
    
    $('#searchTeacherBtn').click(function() {
        const query = $('#teacherSearchInput').val().trim();
        if (query.length < 2) {
            alert('Введите минимум 2 символа');
            return;
        }
        searchTeacher(query);
    });
    
    $('#weekPrevBtn').click(function() {
        if (currentWeek > 29) {
            currentWeek--;
            updateWeekDisplay();
            if (currentView === 'group' && currentGroupId) {
                loadSchedule();
            } else if (currentView === 'teacher' && currentTeacherId) {
                loadTeacherSchedule(currentTeacherId, currentTeacherName);
            }
        }
    });
    
    $('#weekNextBtn').click(function() {
        if (currentWeek < 35) {
            currentWeek++;
            updateWeekDisplay();
            if (currentView === 'group' && currentGroupId) {
                loadSchedule();
            } else if (currentView === 'teacher' && currentTeacherId) {
                loadTeacherSchedule(currentTeacherId, currentTeacherName);
            }
        }
    });
});

function loadGroups() {
    console.log('Загрузка групп...');
    
    $.ajax({
        url: '/api/groups',
        method: 'GET',
        timeout: 5000,
        success: function(data) {
            console.log('Группы получены:', data);
            const $select = $('#groupSelect');
            $select.empty();
            $select.append('<option value="">-- Выберите группу --</option>');
            
            if (Array.isArray(data)) {
                data.forEach(group => {
                    $select.append(`<option value="${group.id}">${group.name}</option>`);
                });
            } else {
                $select.append('<option value="1213641978">6413-100503D</option>');
                $select.append('<option value="1282690301">6411-100503D</option>');
                $select.append('<option value="1282690279">6412-100503D</option>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Ошибка загрузки групп:', error);
            const $select = $('#groupSelect');
            $select.empty();
            $select.append('<option value="">-- Выберите группу --</option>');
            $select.append('<option value="1213641978">6413-100503D</option>');
            $select.append('<option value="1282690301">6411-100503D</option>');
            $select.append('<option value="1282690279">6412-100503D</option>');
        }
    });
}

function loadSchedule() {
    if (!currentGroupId) return;
    
    $('#scheduleContainer').html('<div class="placeholder"><p>Загрузка расписания...</p></div>');
    
    console.log(`Загрузка расписания для группы ${currentGroupId}, неделя ${currentWeek}`);
    
    $.ajax({
        url: `/api/schedule/group/${currentGroupId}?week=${currentWeek}`,
        method: 'GET',
        timeout: 15000,
        success: function(data) {
            console.log('Расписание получено:', data);
            scheduleData = data;
            
            if (data && data.weeks && data.weeks.weeks) {
                renderScheduleTable(false);
                updateGroupInfo();
                currentView = 'group';
            } else {
                showError('Не удалось загрузить расписание');
            }
        },
        error: function(xhr, status, error) {
            console.error('Ошибка:', status, error);
            showError('Ошибка загрузки расписания');
        }
    });
}

function searchTeacher(query) {
    $('#scheduleContainer').html('<div class="placeholder"><p>Поиск преподавателя...</p></div>');
    
    $.ajax({
        url: `/api/search/teacher?q=${encodeURIComponent(query)}`,
        method: 'GET',
        success: function(teachers) {
            if (teachers.length === 0) {
                showError('Преподаватель не найден');
                return;
            }
            
            let html = '<div class="search-results"><h3>Найденные преподаватели:</h3>';
            teachers.forEach(teacher => {
                html += `
                    <div class="teacher-result" data-id="${teacher.id}" data-name="${teacher.name}">
                        <span>${escapeHtml(teacher.name)}</span>
                        <button class="btn-select-teacher">Выбрать</button>
                    </div>
                `;
            });
            html += '</div>';
            $('#scheduleContainer').html(html);
            
            $('.btn-select-teacher').click(function() {
                const teacherId = $(this).closest('.teacher-result').data('id');
                const teacherName = $(this).closest('.teacher-result').data('name');
                loadTeacherSchedule(teacherId, teacherName);
            });
        },
        error: function() {
            showError('Ошибка поиска');
        }
    });
}

function loadTeacherSchedule(teacherId, teacherName) {
    currentView = 'teacher';
    currentTeacherId = teacherId;
    currentTeacherName = teacherName;
    
    $('#scheduleContainer').html('<div class="placeholder"><p>Загрузка расписания преподавателя...</p></div>');
    
    $.ajax({
        url: `/api/schedule/teacher?id=${teacherId}&week=${currentWeek}`,
        method: 'GET',
        success: function(data) {
            scheduleData = data;
            if (data && data.weeks && data.weeks.weeks) {
                renderScheduleTable(true);
                $('#groupTitle').text(`Расписание: ${teacherName}`);
                $('#groupSubtitle').text('Преподаватель');
            } else {
                showError('Не удалось загрузить расписание');
            }
        },
        error: function() {
            showError('Ошибка загрузки');
        }
    });
}

function renderScheduleTable(isTeacher) {
    if (!scheduleData || !scheduleData.weeks || !scheduleData.weeks.weeks) {
        showError('Нет данных для отображения');
        return;
    }
    
    const weekData = scheduleData.weeks.weeks[currentWeek];
    if (!weekData) {
        showError(`Нет данных за ${currentWeek} неделю`);
        return;
    }
    
    const lessonsMap = {};
    const datesMap = {};
    
    weekData.forEach(day => {
        lessonsMap[day.day] = {};
        datesMap[day.day] = day.date || '';
        if (day.lessons && Array.isArray(day.lessons)) {
            day.lessons.forEach(lesson => {
                if (lesson.time) {
                    const startTime = lesson.time.split('-')[0];
                    if (lessonsMap[day.day][startTime]) {
                        if (!Array.isArray(lessonsMap[day.day][startTime])) {
                            lessonsMap[day.day][startTime] = [lessonsMap[day.day][startTime]];
                        }
                        lessonsMap[day.day][startTime].push(lesson);
                    } else {
                        lessonsMap[day.day][startTime] = lesson;
                    }
                }
            });
        }
    });
    
    let html = '<table class="schedule-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th>Время</th>';
    
    days.forEach(day => {
        const date = datesMap[day] ? `<br><span class="day-date">${formatDate(datesMap[day])}</span>` : '';
        html += `<th>${day}${date}</th>`;
    });
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    timeSlots.forEach(timeSlot => {
        html += '<tr>';
        html += `<td class="time-column"><strong>${fullTimeSlots[timeSlot]}</strong></td>`;
        
        days.forEach(day => {
            const lessonData = lessonsMap[day] ? lessonsMap[day][timeSlot] : null;
            
            html += `<td class="lesson-cell">`;
            
            if (lessonData) {
                const lessons = Array.isArray(lessonData) ? lessonData : [lessonData];
                
                lessons.forEach((lesson, idx) => {
                    if (isTeacher) {
                        html += `
                            <div class="lesson-item">
                                <div class="lesson-name">${escapeHtml(lesson.name)}</div>
                                <div class="lesson-room">${escapeHtml(lesson.room)}</div>
                                <span class="lesson-type">${escapeHtml(lesson.type)}</span>
                                ${lesson.groups ? `<div class="lesson-groups">Группы: ${escapeHtml(lesson.groups)}</div>` : ''}
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="lesson-item">
                                <div class="lesson-name">${escapeHtml(lesson.name)}</div>
                                <div class="lesson-teacher">${escapeHtml(lesson.teacher)}</div>
                                <div class="lesson-room">${escapeHtml(lesson.room)}</div>
                                <span class="lesson-type">${escapeHtml(lesson.type)}</span>
                            </div>
                        `;
                    }
                    if (idx < lessons.length - 1) {
                        html += `<div class="lesson-separator"></div>`;
                    }
                });
            } else {
                html += `<div class="no-lessons">—</div>`;
            }
            
            html += `</td>`;
        });
        
        html += '</tr>';
    });
    
    html += '</tbody>';
    html += '</table>';
    
    $('#scheduleContainer').html(html);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return `${parts[0]}.${parts[1]}`;
    }
    return dateStr;
}

function updateWeekDisplay() {
    $('#currentWeekLabel').html(`${currentWeek} неделя`);
    $('#weekPrevBtn').prop('disabled', currentWeek <= 29);
    $('#weekNextBtn').prop('disabled', currentWeek >= 35);
}

function updateGroupInfo() {
    const groupName = $('#groupSelect option:selected').text();
    $('#groupTitle').text(`Расписание, ${groupName}`);
    $('#groupSubtitle').text('10.05.03 Информационная безопасность автоматизированных систем');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showError(message) {
    $('#scheduleContainer').html(`<div class="placeholder"><p>${message}</p></div>`);
}