/**
 * Внутренний инструмент карт - Основной JavaScript файл
 * Интеграция с Supabase для аутентификации и хранения данных
 */

// Конфигурация Supabase
const SUPABASE_URL = "https://roifbqxbocdzfnjipstl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaWZicXhib2NkemZuamlwc3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODMwOTcsImV4cCI6MjA2ODM1OTA5N30.zEXZeKdGxiSfzDfd-E-CyE0Sp3Ut2tWIhTZ1VW_v6kE";

// Инициализация Supabase клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Глобальные переменные
let map;
let currentUser = null;
let points = [];
let lines = [];
let selectedPoints = [];
let isDrawingLine = false;
let currentMarker = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

/**
 * Инициализация приложения
 */
async function initializeApp() {
    try {
        // Проверка текущей сессии
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await showMainApp();
        } else {
            showLoginScreen();
        }
        
        // Слушатель изменений аутентификации
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await showMainApp();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLoginScreen();
            }
        });
        
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Ошибка инициализации приложения');
    }
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Форма входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Кнопки заголовка
    document.getElementById('search-btn')?.addEventListener('click', handleSearch);
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('export-btn')?.addEventListener('click', exportData);
    document.getElementById('import-btn')?.addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file')?.addEventListener('change', importData);
    document.getElementById('signout-btn')?.addEventListener('click', handleSignOut);
    
    // Кнопки инструментов
    document.getElementById('add-point-btn')?.addEventListener('click', startAddPoint);
    document.getElementById('draw-line-btn')?.addEventListener('click', startDrawLine);
    document.getElementById('clear-selection-btn')?.addEventListener('click', clearSelection);
    document.getElementById('add-by-coords-btn')?.addEventListener('click', showCoordsModal);
    document.getElementById('center-map-btn')?.addEventListener('click', centerMap);
    document.getElementById('clear-all-btn')?.addEventListener('click', clearAllData);
    
    // Модальные окна
    setupModalListeners();
}

/**
 * Настройка обработчиков модальных окон
 */
function setupModalListeners() {
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Кнопки модальных окон
    document.getElementById('save-point-btn')?.addEventListener('click', savePoint);
    document.getElementById('cancel-point-btn')?.addEventListener('click', () => hideModal('point-modal'));
    
    document.getElementById('save-coord-point-btn')?.addEventListener('click', saveCoordPoint);
    document.getElementById('cancel-coord-btn')?.addEventListener('click', () => hideModal('coords-modal'));
    
    document.getElementById('save-line-btn')?.addEventListener('click', saveLine);
    document.getElementById('finish-line-btn')?.addEventListener('click', finishLineSelection);
    document.getElementById('cancel-line-btn')?.addEventListener('click', cancelLineDrawing);
    
    document.getElementById('error-ok-btn')?.addEventListener('click', () => hideModal('error-modal'));
}

/**
 * Обработка входа в систему
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showLoginError('Пожалуйста, заполните все поля');
        return;
    }
    
    showLoading(true);
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        // Успешный вход будет обработан в onAuthStateChange
    } catch (error) {
        console.error('Ошибка входа:', error);
        showLoginError('Неверный email или пароль');
    } finally {
        showLoading(false);
    }
}

/**
 * Выход из системы
 */
async function handleSignOut() {
    try {
        showLoading(true);
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showError('Ошибка при выходе из системы');
    } finally {
        showLoading(false);
    }
}

/**
 * Показать экран входа
 */
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-error').style.display = 'none';
    
    // Очистка формы
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

/**
 * Показать основное приложение
 */
async function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    
    // Отображение email пользователя
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement && currentUser) {
        userEmailElement.textContent = currentUser.email;
    }
    
    // Инициализация карты
    if (!map) {
        initializeMap();
    }
    
    // Загрузка данных
    await loadData();
}

/**
 * Инициализация карты Leaflet
 */
function initializeMap() {
    // Создание карты с центром в Москве
    map = L.map('map').setView([55.7558, 37.6176], 10);
    
    // Добавление слоя OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Обработчик клика по карте
    map.on('click', handleMapClick);
}

/**
 * Обработка клика по карте
 */
function handleMapClick(e) {
    if (isDrawingLine) {
        // Режим рисования линии - добавляем точку к выбранным
        const nearestPoint = findNearestPoint(e.latlng);
        if (nearestPoint && !selectedPoints.includes(nearestPoint.id)) {
            selectedPoints.push(nearestPoint.id);
            highlightSelectedPoints();
            updateSelectedPointsCount();
        }
    } else {
        // Обычный режим - показываем модальное окно для добавления точки
        currentMarker = e.latlng;
        showModal('point-modal');
    }
}

/**
 * Поиск ближайшей точки к координатам
 */
function findNearestPoint(latlng, maxDistance = 0.001) {
    let nearest = null;
    let minDistance = maxDistance;
    
    points.forEach(point => {
        const distance = Math.sqrt(
            Math.pow(point.lat - latlng.lat, 2) + 
            Math.pow(point.lng - latlng.lng, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = point;
        }
    });
    
    return nearest;
}

/**
 * Загрузка данных из Supabase
 */
async function loadData() {
    try {
        showLoading(true);
        
        // Загрузка точек
        const { data: pointsData, error: pointsError } = await supabase
            .from('points')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (pointsError) throw pointsError;
        
        // Загрузка линий
        const { data: linesData, error: linesError } = await supabase
            .from('lines')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (linesError) throw linesError;
        
        points = pointsData || [];
        lines = linesData || [];
        
        renderMapData();
        updateStatusMessage();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Ошибка загрузки данных из базы');
    } finally {
        showLoading(false);
    }
}

/**
 * Отрисовка данных на карте
 */
function renderMapData() {
    // Очистка существующих слоев
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
    
    // Отрисовка точек
    points.forEach(point => {
        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 6,
            fillColor: selectedPoints.includes(point.id) ? '#ffc107' : '#007bff',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        // Всплывающая подсказка
        marker.bindPopup(`
            <strong>${point.title}</strong><br>
            ${point.comment || 'Без комментария'}<br>
            <small>Координаты: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}</small>
        `);
        
        // Сохранение ID точки в маркере
        marker.pointId = point.id;
    });
    
    // Отрисовка линий
    lines.forEach(line => {
        if (line.point_ids && line.point_ids.length >= 2) {
            const linePoints = line.point_ids.map(pointId => {
                const point = points.find(p => p.id === pointId);
                return point ? [point.lat, point.lng] : null;
            }).filter(Boolean);
            
            if (linePoints.length >= 2) {
                const polyline = L.polyline(linePoints, {
                    color: '#28a745',
                    weight: 3,
                    opacity: 0.8
                }).addTo(map);
                
                polyline.bindPopup(`<strong>${line.name}</strong><br>Точек: ${linePoints.length}`);
            }
        }
    });
}

/**
 * Начать добавление точки
 */
function startAddPoint() {
    showError('Кликните по карте, чтобы добавить точку');
}

/**
 * Начать рисование линии
 */
function startDrawLine() {
    if (points.length < 2) {
        showError('Для создания линии нужно минимум 2 точки');
        return;
    }
    
    isDrawingLine = true;
    selectedPoints = [];
    showModal('line-modal');
    updateSelectedPointsCount();
    
    // Изменение стиля кнопки
    const btn = document.getElementById('draw-line-btn');
    btn.textContent = 'Выберите точки на карте';
    btn.style.background = '#ffc107';
}

/**
 * Завершить выбор точек для линии
 */
function finishLineSelection() {
    if (selectedPoints.length < 2) {
        showError('Выберите минимум 2 точки для создания линии');
        return;
    }
    
    // Скрыть кнопку "Завершить выбор"
    document.getElementById('finish-line-btn').style.display = 'none';
}

/**
 * Сохранить линию
 */
async function saveLine() {
    const lineName = document.getElementById('line-name').value.trim();
    
    if (!lineName) {
        showError('Введите название линии');
        return;
    }
    
    if (selectedPoints.length < 2) {
        showError('Выберите минимум 2 точки');
        return;
    }
    
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('lines')
            .insert([{
                name: lineName,
                point_ids: selectedPoints,
                user_id: currentUser.id
            }])
            .select();
        
        if (error) throw error;
        
        // Добавление в локальный массив
        lines.push(data[0]);
        
        // Сброс состояния
        cancelLineDrawing();
        
        // Перерисовка карты
        renderMapData();
        updateStatusMessage();
        
        hideModal('line-modal');
        
    } catch (error) {
        console.error('Ошибка сохранения линии:', error);
        showError('Ошибка сохранения линии');
    } finally {
        showLoading(false);
    }
}

/**
 * Отменить рисование линии
 */
function cancelLineDrawing() {
    isDrawingLine = false;
    selectedPoints = [];
    
    // Восстановление стиля кнопки
    const btn = document.getElementById('draw-line-btn');
    btn.textContent = 'Нарисовать линию';
    btn.style.background = '#28a745';
    
    renderMapData();
    hideModal('line-modal');
}

/**
 * Очистить выбор
 */
function clearSelection() {
    selectedPoints = [];
    isDrawingLine = false;
    
    // Восстановление стиля кнопки
    const btn = document.getElementById('draw-line-btn');
    btn.textContent = 'Нарисовать линию';
    btn.style.background = '#28a745';
    
    renderMapData();
}

/**
 * Подсветить выбранные точки
 */
function highlightSelectedPoints() {
    renderMapData();
}

/**
 * Обновить счетчик выбранных точек
 */
function updateSelectedPointsCount() {
    const countElement = document.getElementById('selected-points-count');
    if (countElement) {
        countElement.textContent = selectedPoints.length;
    }
}

/**
 * Сохранить точку
 */
async function savePoint() {
    const title = document.getElementById('point-title').value.trim();
    const comment = document.getElementById('point-comment').value.trim();
    
    if (!title) {
        showError('Введите название точки');
        return;
    }
    
    if (!currentMarker) {
        showError('Выберите место на карте');
        return;
    }
    
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('points')
            .insert([{
                title: title,
                comment: comment,
                lat: currentMarker.lat,
                lng: currentMarker.lng,
                user_id: currentUser.id
            }])
            .select();
        
        if (error) throw error;
        
        // Добавление в локальный массив
        points.push(data[0]);
        
        // Очистка формы
        document.getElementById('point-title').value = '';
        document.getElementById('point-comment').value = '';
        currentMarker = null;
        
        // Перерисовка карты
        renderMapData();
        updateStatusMessage();
        
        hideModal('point-modal');
        
    } catch (error) {
        console.error('Ошибка сохранения точки:', error);
        showError('Ошибка сохранения точки');
    } finally {
        showLoading(false);
    }
}

/**
 * Показать модальное окно координат
 */
function showCoordsModal() {
    showModal('coords-modal');
}

/**
 * Сохранить точку по координатам
 */
async function saveCoordPoint() {
    const lat = parseFloat(document.getElementById('coord-lat').value);
    const lng = parseFloat(document.getElementById('coord-lng').value);
    const title = document.getElementById('coord-title').value.trim();
    const comment = document.getElementById('coord-comment').value.trim();
    
    if (isNaN(lat) || isNaN(lng)) {
        showError('Введите корректные координаты');
        return;
    }
    
    if (!title) {
        showError('Введите название точки');
        return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        showError('Координаты вне допустимого диапазона');
        return;
    }
    
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('points')
            .insert([{
                title: title,
                comment: comment,
                lat: lat,
                lng: lng,
                user_id: currentUser.id
            }])
            .select();
        
        if (error) throw error;
        
        // Добавление в локальный массив
        points.push(data[0]);
        
        // Центрирование карты на новой точке
        map.setView([lat, lng], 15);
        
        // Очистка формы
        document.getElementById('coord-lat').value = '';
        document.getElementById('coord-lng').value = '';
        document.getElementById('coord-title').value = '';
        document.getElementById('coord-comment').value = '';
        
        // Перерисовка карты
        renderMapData();
        updateStatusMessage();
        
        hideModal('coords-modal');
        
    } catch (error) {
        console.error('Ошибка сохранения точки:', error);
        showError('Ошибка сохранения точки');
    } finally {
        showLoading(false);
    }
}

/**
 * Поиск по городу или координатам
 */
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query) {
        showError('Введите название города или координаты');
        return;
    }
    
    try {
        showLoading(true);
        
        // Проверка, является ли запрос координатами
        const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        
        if (coordMatch) {
            // Поиск по координатам
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                map.setView([lat, lng], 15);
                document.getElementById('search-input').value = '';
            } else {
                showError('Координаты вне допустимого диапазона');
            }
        } else {
            // Поиск по названию города через Nominatim
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            );
            
            if (!response.ok) {
                throw new Error('Ошибка поиска');
            }
            
            const results = await response.json();
            
            if (results.length > 0) {
                const result = results[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                map.setView([lat, lng], 12);
                document.getElementById('search-input').value = '';
            } else {
                showError('Место не найдено');
            }
        }
        
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showError('Ошибка поиска. Проверьте подключение к интернету');
    } finally {
        showLoading(false);
    }
}

/**
 * Центрировать карту
 */
function centerMap() {
    if (points.length > 0) {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [20, 20] });
    } else {
        map.setView([55.7558, 37.6176], 10);
    }
}

/**
 * Экспорт данных
 */
async function exportData() {
    try {
        const exportData = {
            points: points,
            lines: lines,
            exported_at: new Date().toISOString(),
            user: currentUser.email
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showError('Ошибка экспорта данных');
    }
}

/**
 * Импорт данных
 */
async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.points || !Array.isArray(data.points)) {
            throw new Error('Неверный формат файла');
        }
        
        // Импорт точек
        if (data.points.length > 0) {
            const pointsToInsert = data.points.map(point => ({
                title: point.title,
                comment: point.comment || '',
                lat: point.lat,
                lng: point.lng,
                user_id: currentUser.id
            }));
            
            const { error: pointsError } = await supabase
                .from('points')
                .insert(pointsToInsert);
            
            if (pointsError) throw pointsError;
        }
        
        // Импорт линий
        if (data.lines && data.lines.length > 0) {
            const linesToInsert = data.lines.map(line => ({
                name: line.name,
                point_ids: line.point_ids || [],
                user_id: currentUser.id
            }));
            
            const { error: linesError } = await supabase
                .from('lines')
                .insert(linesToInsert);
            
            if (linesError) throw linesError;
        }
        
        // Перезагрузка данных
        await loadData();
        
        // Очистка input
        e.target.value = '';
        
    } catch (error) {
        console.error('Ошибка импорта:', error);
        showError('Ошибка импорта данных. Проверьте формат файла');
    } finally {
        showLoading(false);
    }
}

/**
 * Очистить все данные
 */
async function clearAllData() {
    if (!confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        // Удаление линий
        const { error: linesError } = await supabase
            .from('lines')
            .delete()
            .eq('user_id', currentUser.id);
        
        if (linesError) throw linesError;
        
        // Удаление точек
        const { error: pointsError } = await supabase
            .from('points')
            .delete()
            .eq('user_id', currentUser.id);
        
        if (pointsError) throw pointsError;
        
        // Очистка локальных данных
        points = [];
        lines = [];
        selectedPoints = [];
        
        // Перерисовка карты
        renderMapData();
        updateStatusMessage();
        
    } catch (error) {
        console.error('Ошибка очистки данных:', error);
        showError('Ошибка очистки данных');
    } finally {
        showLoading(false);
    }
}

/**
 * Обновить сообщение статуса
 */
function updateStatusMessage() {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = `Загружено ${points.length} точек и ${lines.length} линий`;
    }
}

/**
 * Показать модальное окно
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('fade-in');
        
        // Фокус на первом поле ввода
        const firstInput = modal.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Скрыть модальное окно
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('fade-in');
    }
}

/**
 * Показать ошибку входа
 */
function showLoginError(message) {
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Показать ошибку в модальном окне
 */
function showError(message) {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        showModal('error-modal');
    }
}

/**
 * Показать/скрыть индикатор загрузки
 */
function showLoading(show) {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

