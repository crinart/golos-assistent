/**
 * Internal Map Tool - Main Application Script
 * Pure ES6, no bundlers, functions ≤ 50 lines
 * Local authentication system with SHA-256 password hashing
 */

// Global application state
const AppState = {
    map: null,
    isLoggedIn: false,
    userRole: 'editor', // All authenticated users are editors
    currentTool: 'point',
    tempMarkers: [],
    linePoints: [],
    mapData: {
        points: [],
        lines: []
    }
};

// Authentication credentials (SHA-256 hashed password)
const AUTH_CONFIG = {
    username: 'Crinart',
    passwordHash: 'd117614e560a9e782c09856b725c2ab6a59779cd6079c8534950e0691fe4a24b' // SHA-256 of "252061qQ"
};

/**
 * Calculate SHA-256 hash of input string
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear any previous error messages
    hideLoginError();
    
    // Validate credentials
    if (username === AUTH_CONFIG.username) {
        const passwordHash = await sha256(password);
        if (passwordHash === AUTH_CONFIG.passwordHash) {
            // Successful login
            AppState.isLoggedIn = true;
            showMainApp();
            return;
        }
    }
    
    // Failed login
    showLoginError('Incorrect login or password.');
}

/**
 * Show login screen
 */
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    
    // Clear form fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideLoginError();
}

/**
 * Show main application
 */
function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    
    // Update UI with user info (local login system)
    document.getElementById('user-email').textContent = AUTH_CONFIG.username;
    const roleBadge = document.getElementById('user-role');
    roleBadge.textContent = AppState.userRole;
    roleBadge.className = `role-badge ${AppState.userRole}`;
    
    // Initialize map if not already done
    if (!AppState.map) {
        initMap();
    }
    
    // Load saved data
    loadMapData();
}

/**
 * Show login error message
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

/**
 * Hide login error message
 */
function hideLoginError() {
    const errorDiv = document.getElementById('login-error');
    errorDiv.style.display = 'none';
}

/**
 * Sign out current user
 */
function signOut() {
    AppState.isLoggedIn = false;
    AppState.userRole = 'editor';
    showLoginScreen();
}

/**
 * Initialize Leaflet map
 */
function initMap() {
    // Create map centered on a default location
    AppState.map = L.map('map').setView([40.7128, -74.0060], 10);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(AppState.map);
    
    // Add click handler for adding points
    AppState.map.on('click', handleMapClick);
}

/**
 * Handle map click events
 */
function handleMapClick(e) {
    if (!AppState.isLoggedIn) return;
    
    if (AppState.currentTool === 'point') {
        showPointForm(e.latlng);
    } else if (AppState.currentTool === 'line') {
        handleLineClick(e.latlng);
    }
}

/**
 * Show point creation form
 */
function showPointForm(latlng) {
    // Clear any existing temp markers
    clearTempMarkers();
    
    // Add temporary marker
    const tempMarker = L.marker(latlng).addTo(AppState.map);
    AppState.tempMarkers.push(tempMarker);
    
    // Show form
    document.getElementById('point-form').style.display = 'block';
    document.getElementById('line-form').style.display = 'none';
    
    // Store coordinates for later use
    AppState.tempPointCoords = latlng;
    
    // Focus on title input
    document.getElementById('point-title').focus();
}

/**
 * Handle line drawing clicks
 */
function handleLineClick(latlng) {
    AppState.linePoints.push(latlng);
    
    // Add temporary marker
    const tempMarker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'line-point-marker',
            html: `<div style="background: #ff6b6b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(AppState.map);
    AppState.tempMarkers.push(tempMarker);
    
    if (AppState.linePoints.length === 2) {
        // Draw temporary line
        const tempLine = L.polyline(AppState.linePoints, {
            color: '#ff6b6b',
            weight: 3,
            dashArray: '5, 5'
        }).addTo(AppState.map);
        AppState.tempMarkers.push(tempLine);
        
        // Enable save button
        document.getElementById('save-line-btn').disabled = false;
    }
}

/**
 * Save new point
 */
function savePoint() {
    const title = document.getElementById('point-title').value.trim();
    const note = document.getElementById('point-note').value.trim();
    
    if (!title) {
        alert('Please enter a title for the point');
        return;
    }
    
    const point = {
        id: generateId(),
        title,
        note,
        lat: AppState.tempPointCoords.lat,
        lng: AppState.tempPointCoords.lng,
        timestamp: Date.now()
    };
    
    AppState.mapData.points.push(point);
    addPointToMap(point);
    saveMapData();
    cancelPointForm();
}

/**
 * Save new power line
 */
function saveLine() {
    const label = document.getElementById('line-label').value.trim();
    
    if (!label) {
        alert('Please enter a label for the power line');
        return;
    }
    
    const line = {
        id: generateId(),
        label,
        points: AppState.linePoints.map(p => ({ lat: p.lat, lng: p.lng })),
        timestamp: Date.now()
    };
    
    AppState.mapData.lines.push(line);
    addLineToMap(line);
    saveMapData();
    cancelLineForm();
}

/**
 * Cancel point form
 */
function cancelPointForm() {
    document.getElementById('point-form').style.display = 'none';
    document.getElementById('point-title').value = '';
    document.getElementById('point-note').value = '';
    clearTempMarkers();
    AppState.tempPointCoords = null;
}

/**
 * Cancel line form
 */
function cancelLineForm() {
    document.getElementById('line-form').style.display = 'none';
    document.getElementById('line-label').value = '';
    document.getElementById('save-line-btn').disabled = true;
    clearTempMarkers();
    AppState.linePoints = [];
}

/**
 * Clear temporary markers and lines
 */
function clearTempMarkers() {
    AppState.tempMarkers.forEach(marker => {
        AppState.map.removeLayer(marker);
    });
    AppState.tempMarkers = [];
}

/**
 * Add point to map
 */
function addPointToMap(point) {
    const marker = L.marker([point.lat, point.lng])
        .bindPopup(createPointPopup(point))
        .addTo(AppState.map);
    
    // Store reference for later removal
    point.mapLayer = marker;
}

/**
 * Add line to map
 */
function addLineToMap(line) {
    const polyline = L.polyline(
        line.points.map(p => [p.lat, p.lng]),
        {
            color: '#007bff',
            weight: 4,
            opacity: 0.8
        }
    ).bindPopup(createLinePopup(line))
     .addTo(AppState.map);
    
    // Store reference for later removal
    line.mapLayer = polyline;
}

/**
 * Create popup content for points
 */
function createPointPopup(point) {
    const editButtons = `
        <div class="popup-actions">
            <button class="popup-btn edit" onclick="editPoint('${point.id}')">Edit</button>
            <button class="popup-btn delete" onclick="deletePoint('${point.id}')">Delete</button>
        </div>`;
    
    return `
        <div class="popup-title">${escapeHtml(point.title)}</div>
        <div class="popup-note">${escapeHtml(point.note)}</div>
        ${editButtons}
    `;
}

/**
 * Create popup content for lines
 */
function createLinePopup(line) {
    const editButtons = `
        <div class="popup-actions">
            <button class="popup-btn edit" onclick="editLine('${line.id}')">Edit</button>
            <button class="popup-btn delete" onclick="deleteLine('${line.id}')">Delete</button>
        </div>`;
    
    return `
        <div class="popup-title">Power Line: ${escapeHtml(line.label)}</div>
        ${editButtons}
    `;
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Set current tool
 */
function setTool(tool) {
    AppState.currentTool = tool;
    
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tool === 'point') {
        document.getElementById('add-point-btn').classList.add('active');
        document.getElementById('line-form').style.display = 'none';
    } else if (tool === 'line') {
        document.getElementById('draw-line-btn').classList.add('active');
        document.getElementById('point-form').style.display = 'none';
        document.getElementById('line-form').style.display = 'block';
    }
    
    // Clear any ongoing operations
    cancelPointForm();
    cancelLineForm();
}

/**
 * Clear current selection
 */
function clearSelection() {
    cancelPointForm();
    cancelLineForm();
    setTool('point');
}

/**
 * Save map data to localStorage
 */
function saveMapData() {
    try {
        localStorage.setItem('mapData', JSON.stringify(AppState.mapData));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data locally');
    }
}

/**
 * Load map data from localStorage
 */
function loadMapData() {
    try {
        const saved = localStorage.getItem('mapData');
        if (saved) {
            AppState.mapData = JSON.parse(saved);
            
            // Add all points to map
            AppState.mapData.points.forEach(point => {
                addPointToMap(point);
            });
            
            // Add all lines to map
            AppState.mapData.lines.forEach(line => {
                addLineToMap(line);
            });
        }
    } catch (error) {
        console.error('Error loading data:', error);
        AppState.mapData = { points: [], lines: [] };
    }
}

/**
 * Export map data as JSON
 */
function exportData() {
    const dataStr = JSON.stringify(AppState.mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `map-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

/**
 * Import map data from JSON file
 */
function importData() {
    document.getElementById('import-file').click();
}

/**
 * Handle file import
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!importedData.points || !importedData.lines) {
                throw new Error('Invalid data format');
            }
            
            // Clear existing data
            clearAllMapData();
            
            // Load imported data
            AppState.mapData = importedData;
            
            // Add to map
            AppState.mapData.points.forEach(point => {
                addPointToMap(point);
            });
            
            AppState.mapData.lines.forEach(line => {
                addLineToMap(line);
            });
            
            // Save to localStorage
            saveMapData();
            
            alert('Data imported successfully');
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import data. Please check file format.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

/**
 * Clear all map data
 */
function clearAllMapData() {
    // Remove all points from map
    AppState.mapData.points.forEach(point => {
        if (point.mapLayer) {
            AppState.map.removeLayer(point.mapLayer);
        }
    });
    
    // Remove all lines from map
    AppState.mapData.lines.forEach(line => {
        if (line.mapLayer) {
            AppState.map.removeLayer(line.mapLayer);
        }
    });
    
    // Clear data
    AppState.mapData = { points: [], lines: [] };
}

/**
 * Delete a point
 */
function deletePoint(pointId) {
    if (confirm('Are you sure you want to delete this point?')) {
        const pointIndex = AppState.mapData.points.findIndex(p => p.id === pointId);
        if (pointIndex !== -1) {
            const point = AppState.mapData.points[pointIndex];
            
            // Remove from map
            if (point.mapLayer) {
                AppState.map.removeLayer(point.mapLayer);
            }
            
            // Remove from data
            AppState.mapData.points.splice(pointIndex, 1);
            saveMapData();
        }
    }
}

/**
 * Delete a line
 */
function deleteLine(lineId) {
    if (confirm('Are you sure you want to delete this power line?')) {
        const lineIndex = AppState.mapData.lines.findIndex(l => l.id === lineId);
        if (lineIndex !== -1) {
            const line = AppState.mapData.lines[lineIndex];
            
            // Remove from map
            if (line.mapLayer) {
                AppState.map.removeLayer(line.mapLayer);
            }
            
            // Remove from data
            AppState.mapData.lines.splice(lineIndex, 1);
            saveMapData();
        }
    }
}

/**
 * Edit a point (simplified implementation)
 */
function editPoint(pointId) {
    const point = AppState.mapData.points.find(p => p.id === pointId);
    if (point) {
        const newTitle = prompt('Enter new title:', point.title);
        if (newTitle !== null && newTitle.trim()) {
            const newNote = prompt('Enter new note:', point.note);
            if (newNote !== null) {
                point.title = newTitle.trim();
                point.note = newNote.trim();
                
                // Update popup
                point.mapLayer.setPopupContent(createPointPopup(point));
                saveMapData();
            }
        }
    }
}

/**
 * Edit a line (simplified implementation)
 */
function editLine(lineId) {
    const line = AppState.mapData.lines.find(l => l.id === lineId);
    if (line) {
        const newLabel = prompt('Enter new label:', line.label);
        if (newLabel !== null && newLabel.trim()) {
            line.label = newLabel.trim();
            
            // Update popup
            line.mapLayer.setPopupContent(createLinePopup(line));
            saveMapData();
        }
    }
}

/**
 * Initialize application
 */
function initApp() {
    // Set up login form event listener
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Set up other event listeners (only available after login)
    document.getElementById('signout-btn').addEventListener('click', signOut);
    
    // Tool buttons
    document.getElementById('add-point-btn').addEventListener('click', () => setTool('point'));
    document.getElementById('draw-line-btn').addEventListener('click', () => setTool('line'));
    document.getElementById('clear-selection-btn').addEventListener('click', clearSelection);
    
    // Form buttons
    document.getElementById('save-point-btn').addEventListener('click', savePoint);
    document.getElementById('cancel-point-btn').addEventListener('click', cancelPointForm);
    document.getElementById('save-line-btn').addEventListener('click', saveLine);
    document.getElementById('cancel-line-btn').addEventListener('click', cancelLineForm);
    
    // Export/Import buttons
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', importData);
    document.getElementById('import-file').addEventListener('change', handleFileImport);
    
    // Form submission handlers
    document.getElementById('point-title').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') savePoint();
    });
    
    document.getElementById('line-label').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveLine();
    });
    
    // Show login screen initially
    showLoginScreen();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make functions globally available for popup buttons
window.deletePoint = deletePoint;
window.deleteLine = deleteLine;
window.editPoint = editPoint;
window.editLine = editLine;

