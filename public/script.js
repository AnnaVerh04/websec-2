let currentGroupId = null;
let currentWeek = 31;
let scheduleData = null;

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const timeSlots = ['08:00', '09:45', '11:30', '13:15'];

$(document).ready(function() {
    console.log('✅ Скрипт загружен');
    
    loadGroups();
    
    $('#loadBtn').click(function() {
        currentGroupId = $('#groupSelect').val();
        if (!currentGroupId) {
            alert('Пожалуйста, выберите группу');
            return;
        }
        loadSchedule();
    });
    
    $('#weekPrevBtn').click(function() {
        if (currentWeek > 30) {
            currentWeek--;
            updateWeekDisplay();
            if (currentGroupId) {
                loadSchedule();
            }
        }
    });
    
    $('#weekNextBtn').click(function() {
        if (currentWeek < 33) {
            currentWeek++;
            updateWeekDisplay();
            if (currentGroupId) {
                loadSchedule();
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
                $select.append('<option value="1213641979">6411-100503D</option>');
                $select.append('<option value="1213641980">6412-100503D</option>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Ошибка загрузки групп:', error);
            const $select = $('#groupSelect');
            $select.empty();
            $select.append('<option value="">-- Выберите группу --</option>');
            $select.append('<option value="1213641978">6413-100503D</option>');
            $select.append('<option value="1213641979">6411-100503D</option>');
            $select.append('<option value="1213641980">6412-100503D</option>');
        }
    });
}

function loadSchedule() {
    if (!currentGroupId) return;
    
    $('#scheduleContainer').html('<div class="placeholder"><span>⏳</span><p>Загрузка расписания...</p></div>');
    
    console.log(`Загрузка расписания для группы ${currentGroupId}, неделя ${currentWeek}`);
    
    $.ajax({
        url: `/api/schedule/group/${currentGroupId}?week=${currentWeek}`,
        method: 'GET',
        timeout: 15000,
        success: function(data) {
            console.log('Расписание получено:', data);
            scheduleData = data;
            
            if (data && data.weeks && data.weeks.weeks) {
                renderScheduleTable();
                updateGroupInfo();
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

function renderScheduleTable() {
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
                    lessonsMap[day.day][startTime] = lesson;
                }
            });
        }
    });
    
    const fullTimeSlots = {
        '08:00': '08:00 - 09:35',
        '09:45': '09:45 - 11:20',
        '11:30': '11:30 - 13:05',
        '13:15': '13:15 - 14:50'
    };
    
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
            const lesson = lessonsMap[day] ? lessonsMap[day][timeSlot] : null;
            
            if (lesson) {
                html += `
                    <td class="lesson-cell">
                        <div class="lesson-item">
                            <div class="lesson-name">${escapeHtml(lesson.name)}</div>
                            <div class="lesson-teacher">${escapeHtml(lesson.teacher)}</div>
                            <div class="lesson-room">${escapeHtml(lesson.room)}</div>
                            <span class="lesson-type">${escapeHtml(lesson.type)}</span>
                        </div>
                    </td>
                `;
            } else {
                html += `<td class="lesson-cell"><div class="no-lessons">—</div></td>`;
            }
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
    $('#weekPrevBtn').prop('disabled', currentWeek <= 30);
    $('#weekNextBtn').prop('disabled', currentWeek >= 33);
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
    $('#scheduleContainer').html(`<div class="placeholder"><span>❌</span><p>${message}</p></div>`);
}