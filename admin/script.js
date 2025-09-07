class AdminDashboard {
    constructor() {
        this.map = null;
        this.drivers = new Map();
        this.journeys = new Map();
        this.markers = new Map();
        this.routeLines = new Map();
        this.selectedJourney = null;
        this.isConnected = true;
        
        this.init();
    }

    init() {
        this.initMap();
        this.setupEventListeners();
        this.startDataPolling();
        this.loadMockData();
        this.setupWebSocketConnection();
    }

    initMap() {
        // Initialize Leaflet map centered on US
        this.map = L.map('map').setView([39.8283, -98.5795], 5);
        
        // Add OpenStreetMap tiles with better styling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // Add map click handler
        this.map.on('click', () => {
            this.hideJourneyPanel();
        });
    }

    setupEventListeners() {
        document.getElementById('centerMap').addEventListener('click', () => {
            this.centerMapOnDrivers();
        });

        document.getElementById('toggleView').addEventListener('click', () => {
            this.toggleMapView();
        });

        document.getElementById('refreshData').addEventListener('click', () => {
            this.refreshData();
        });

        document.getElementById('closePanel').addEventListener('click', () => {
            this.hideJourneyPanel();
        });
    }

    setupWebSocketConnection() {
        // In a real app, this would be a WebSocket connection
        // For demo, we'll simulate real-time updates
        this.updateConnectionStatus(true);
        
        // Simulate occasional connection issues
        setInterval(() => {
            const shouldDisconnect = Math.random() < 0.05; // 5% chance
            this.updateConnectionStatus(!shouldDisconnect);
        }, 10000);
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            indicator.className = 'connection-indicator connected';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'connection-indicator disconnected';
            text.textContent = 'Reconnecting...';
        }
    }

    startDataPolling() {
        // Poll for updates every 3 seconds for real-time feel
        setInterval(() => {
            if (this.isConnected) {
                this.fetchLiveData();
            }
        }, 3000);
        
        // Initial load
        this.fetchLiveData();
    }

    async fetchLiveData() {
        try {
            // In real app, this would fetch from your API
            this.simulateIncomingData();
        } catch (error) {
            console.error('Error fetching live data:', error);
            this.showError('Failed to fetch live tracking data');
            this.updateConnectionStatus(false);
        }
    }

    simulateIncomingData() {
        // Simulate receiving live driver location data with more realistic movement
        const mockDriverData = [
            {
                driverId: 'driver-1',
                driverName: 'John Smith',
                journeyId: 'journey-1',
                location: {
                    latitude: 40.7589 + (Math.sin(Date.now() / 10000) * 0.05),
                    longitude: -73.9851 + (Math.cos(Date.now() / 10000) * 0.05),
                    accuracy: 8 + Math.random() * 5,
                    speed: 65 + Math.sin(Date.now() / 5000) * 15,
                    heading: (Date.now() / 1000) % 360,
                },
                timestamp: Date.now(),
                progress: {
                    progressPercentage: Math.min(95, 35 + (Date.now() % 100000) / 1000),
                    remainingDistance: Math.max(10, 150 - (Date.now() % 100000) / 1000),
                    estimatedTimeRemaining: Math.max(0.2, 2.5 - (Date.now() % 100000) / 50000),
                },
                journey: {
                    fromLocation: 'New York, NY',
                    toLocation: 'Boston, MA',
                    clientName: 'ABC Logistics',
                    fromCoords: { latitude: 40.7128, longitude: -74.0060 },
                    toCoords: { latitude: 42.3601, longitude: -71.0589 },
                },
            },
            {
                driverId: 'driver-2',
                driverName: 'Sarah Johnson',
                journeyId: 'journey-2',
                location: {
                    latitude: 41.8781 + (Math.cos(Date.now() / 8000) * 0.03),
                    longitude: -87.6298 + (Math.sin(Date.now() / 8000) * 0.03),
                    accuracy: 6 + Math.random() * 4,
                    speed: 55 + Math.cos(Date.now() / 6000) * 20,
                    heading: ((Date.now() / 800) % 360),
                },
                timestamp: Date.now(),
                progress: {
                    progressPercentage: Math.min(90, 70 + (Date.now() % 80000) / 1000),
                    remainingDistance: Math.max(5, 80 - (Date.now() % 80000) / 1000),
                    estimatedTimeRemaining: Math.max(0.1, 1.2 - (Date.now() % 80000) / 80000),
                },
                journey: {
                    fromLocation: 'Chicago, IL',
                    toLocation: 'Detroit, MI',
                    clientName: 'XYZ Corp',
                    fromCoords: { latitude: 41.8781, longitude: -87.6298 },
                    toCoords: { latitude: 42.3314, longitude: -83.0458 },
                },
            },
            {
                driverId: 'driver-3',
                driverName: 'Mike Wilson',
                journeyId: 'journey-3',
                location: {
                    latitude: 34.0522 + (Math.sin(Date.now() / 12000) * 0.04),
                    longitude: -118.2437 + (Math.cos(Date.now() / 12000) * 0.04),
                    accuracy: 12 + Math.random() * 8,
                    speed: 45 + Math.sin(Date.now() / 4000) * 25,
                    heading: ((Date.now() / 600) % 360),
                },
                timestamp: Date.now(),
                progress: {
                    progressPercentage: Math.min(85, 15 + (Date.now() % 120000) / 1000),
                    remainingDistance: Math.max(20, 200 - (Date.now() % 120000) / 1000),
                    estimatedTimeRemaining: Math.max(0.5, 3.2 - (Date.now() % 120000) / 60000),
                },
                journey: {
                    fromLocation: 'Los Angeles, CA',
                    toLocation: 'San Francisco, CA',
                    clientName: 'Tech Solutions Inc',
                    fromCoords: { latitude: 34.0522, longitude: -118.2437 },
                    toCoords: { latitude: 37.7749, longitude: -122.4194 },
                },
            },
        ];

        mockDriverData.forEach(data => {
            this.updateDriverLocation(data);
        });

        this.updateStatistics();
    }

    updateDriverLocation(data) {
        const { driverId, driverName, location, progress, journey } = data;
        
        // Update driver data
        this.drivers.set(driverId, {
            id: driverId,
            name: driverName,
            location,
            progress,
            journey,
            lastUpdate: new Date(),
        });

        // Update map marker
        this.updateMapMarker(driverId, driverName, location, progress, journey);
        
        // Update drivers list
        this.updateDriversList();
        
        // Add alerts for significant events
        if (progress.progressPercentage > 90 && !this.drivers.get(driverId)?.alertSent) {
            this.addAlert(`${driverName} is approaching destination`, 'warning');
            // Mark alert as sent to avoid spam
            const driver = this.drivers.get(driverId);
            if (driver) {
                driver.alertSent = true;
            }
        }
    }

    updateMapMarker(driverId, driverName, location, progress, journey) {
        const { latitude, longitude, speed, heading } = location;
        
        if (this.markers.has(driverId)) {
            // Update existing marker position smoothly
            const marker = this.markers.get(driverId);
            marker.setLatLng([latitude, longitude]);
            
            // Update marker color based on progress
            marker.setStyle({
                fillColor: this.getDriverColor(progress.progressPercentage),
            });
        } else {
            // Create new driver marker
            const marker = L.circleMarker([latitude, longitude], {
                radius: 12,
                fillColor: this.getDriverColor(progress.progressPercentage),
                color: '#ffffff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9,
            }).addTo(this.map);

            // Add popup with comprehensive driver info
            const popupContent = `
                <div class="driver-popup">
                    <div class="popup-header">
                        <h4>${driverName}</h4>
                        <span class="driver-id">${driverId}</span>
                    </div>
                    <div class="popup-content">
                        <div class="popup-section">
                            <strong>Journey:</strong> ${journey.fromLocation} → ${journey.toLocation}
                        </div>
                        <div class="popup-section">
                            <strong>Client:</strong> ${journey.clientName}
                        </div>
                        <div class="popup-section">
                            <strong>Progress:</strong> ${progress.progressPercentage.toFixed(1)}%
                        </div>
                        <div class="popup-stats">
                            <div class="popup-stat">
                                <span class="stat-label">Speed</span>
                                <span class="stat-value">${speed ? (speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}</span>
                            </div>
                            <div class="popup-stat">
                                <span class="stat-label">ETA</span>
                                <span class="stat-value">${progress.estimatedTimeRemaining.toFixed(1)}h</span>
                            </div>
                            <div class="popup-stat">
                                <span class="stat-label">Remaining</span>
                                <span class="stat-value">${progress.remainingDistance.toFixed(1)} km</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            });
            
            // Add click handler to show journey details
            marker.on('click', () => {
                this.showJourneyDetails(driverId);
            });

            this.markers.set(driverId, marker);
        }

        // Update route visualization
        this.updateRouteVisualization(driverId, journey, location);
    }

    updateRouteVisualization(driverId, journey, currentLocation) {
        // Remove existing route
        if (this.routeLines.has(driverId)) {
            this.map.removeLayer(this.routeLines.get(driverId));
        }

        const startCoords = [journey.fromCoords.latitude, journey.fromCoords.longitude];
        const endCoords = [journey.toCoords.latitude, journey.toCoords.longitude];
        const currentCoords = [currentLocation.latitude, currentLocation.longitude];

        // Create route group
        const routeGroup = L.layerGroup();

        // Add start marker
        const startMarker = L.marker(startCoords, {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="route-marker pickup-marker">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
            })
        });

        // Add destination marker
        const endMarker = L.marker(endCoords, {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="route-marker delivery-marker">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
            })
        });

        // Add route lines
        const completedRoute = L.polyline([startCoords, currentCoords], {
            color: '#10b981',
            weight: 4,
            opacity: 0.8,
        });

        const remainingRoute = L.polyline([currentCoords, endCoords], {
            color: '#94a3b8',
            weight: 3,
            opacity: 0.6,
            dashArray: '10, 5',
        });

        // Add all to group
        routeGroup.addLayer(startMarker);
        routeGroup.addLayer(endMarker);
        routeGroup.addLayer(completedRoute);
        routeGroup.addLayer(remainingRoute);
        
        // Add to map
        routeGroup.addTo(this.map);
        this.routeLines.set(driverId, routeGroup);
    }

    getDriverColor(progressPercentage) {
        if (progressPercentage < 25) return '#ef4444'; // Red - just started
        if (progressPercentage < 50) return '#f59e0b'; // Orange - in progress
        if (progressPercentage < 75) return '#3b82f6'; // Blue - halfway
        return '#10b981'; // Green - almost done
    }

    updateDriversList() {
        const driversList = document.getElementById('driversList');
        driversList.innerHTML = '';

        this.drivers.forEach((driver, driverId) => {
            const driverElement = document.createElement('div');
            driverElement.className = 'driver-item';
            driverElement.onclick = () => this.focusOnDriver(driverId);
            
            const lastUpdateText = this.getTimeAgo(driver.lastUpdate);
            const speedText = driver.location.speed ? 
                `${(driver.location.speed * 3.6).toFixed(0)} km/h` : 'Stationary';

            driverElement.innerHTML = `
                <div class="driver-info">
                    <div class="driver-name">${driver.name}</div>
                    <div class="driver-status">
                        ${driver.progress.progressPercentage.toFixed(1)}% complete • ${speedText}
                    </div>
                    <div class="driver-update">Updated ${lastUpdateText}</div>
                </div>
                <div class="driver-indicator" style="background-color: ${this.getDriverColor(driver.progress.progressPercentage)}"></div>
            `;
            
            driversList.appendChild(driverElement);
        });
    }

    focusOnDriver(driverId) {
        const driver = this.drivers.get(driverId);
        if (!driver) return;

        // Center map on driver
        this.map.setView([driver.location.latitude, driver.location.longitude], 12);
        
        // Open marker popup
        const marker = this.markers.get(driverId);
        if (marker) {
            marker.openPopup();
        }

        // Show journey details
        this.showJourneyDetails(driverId);
    }

    updateStatistics() {
        const activeDrivers = this.drivers.size;
        const activeJourneys = Array.from(this.drivers.values()).filter(d => d.journey).length;
        const totalDistance = Array.from(this.drivers.values())
            .reduce((sum, driver) => sum + driver.progress.remainingDistance, 0);

        document.getElementById('activeDrivers').textContent = activeDrivers;
        document.getElementById('activeJourneys').textContent = activeJourneys;
        document.getElementById('totalDistance').textContent = totalDistance.toFixed(0);
    }

    showJourneyDetails(driverId) {
        const driver = this.drivers.get(driverId);
        if (!driver) return;

        this.selectedJourney = driverId;
        const panel = document.getElementById('journeyPanel');
        const content = document.getElementById('journeyContent');

        const etaTime = new Date(Date.now() + (driver.progress.estimatedTimeRemaining * 60 * 60 * 1000));

        content.innerHTML = `
            <div class="journey-info">
                <div class="journey-title">${driver.name}</div>
                <div class="journey-id">Journey ID: ${driver.journey?.id || 'N/A'}</div>
                <div class="journey-meta">
                    <div class="meta-item">
                        <div class="meta-value">${driver.progress.progressPercentage.toFixed(1)}%</div>
                        <div class="meta-label">Progress</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-value">${driver.location.speed ? (driver.location.speed * 3.6).toFixed(0) : '0'}</div>
                        <div class="meta-label">km/h</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-value">${driver.progress.estimatedTimeRemaining.toFixed(1)}h</div>
                        <div class="meta-label">ETA</div>
                    </div>
                </div>
            </div>

            <div class="route-info">
                <h4 style="margin-bottom: 1rem; color: #1e293b;">Route Details</h4>
                <div class="route-item">
                    <svg class="route-icon pickup" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span class="route-text">From: ${driver.journey.fromLocation}</span>
                </div>
                <div class="route-item">
                    <svg class="route-icon delivery" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span class="route-text">To: ${driver.journey.toLocation}</span>
                </div>
                <div class="route-item">
                    <svg class="route-icon" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span class="route-text">Client: ${driver.journey.clientName}</span>
                </div>
            </div>

            <div class="progress-section">
                <h4 style="margin-bottom: 1rem; color: #1e293b;">Journey Progress</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${driver.progress.progressPercentage}%"></div>
                </div>
                <div class="progress-stats">
                    <div class="progress-stat">
                        <div class="progress-stat-value">${(100 - driver.progress.progressPercentage).toFixed(1)}%</div>
                        <div class="progress-stat-label">Remaining</div>
                    </div>
                    <div class="progress-stat">
                        <div class="progress-stat-value">${driver.progress.remainingDistance.toFixed(0)} km</div>
                        <div class="progress-stat-label">Distance</div>
                    </div>
                    <div class="progress-stat">
                        <div class="progress-stat-value">${etaTime.toLocaleTimeString()}</div>
                        <div class="progress-stat-label">ETA</div>
                    </div>
                </div>
            </div>

            <div class="live-data">
                <h4 style="margin-bottom: 1rem; color: #1e293b;">Live Data</h4>
                <div class="live-stats">
                    <div class="live-stat">
                        <span class="live-stat-label">Current Speed:</span>
                        <span class="live-stat-value">${driver.location.speed ? (driver.location.speed * 3.6).toFixed(1) + ' km/h' : 'Stationary'}</span>
                    </div>
                    <div class="live-stat">
                        <span class="live-stat-label">Heading:</span>
                        <span class="live-stat-value">${driver.location.heading ? driver.location.heading.toFixed(0) + '°' : 'N/A'}</span>
                    </div>
                    <div class="live-stat">
                        <span class="live-stat-label">Accuracy:</span>
                        <span class="live-stat-value">±${driver.location.accuracy?.toFixed(0)}m</span>
                    </div>
                    <div class="live-stat">
                        <span class="live-stat-label">Last Update:</span>
                        <span class="live-stat-value">${this.getTimeAgo(driver.lastUpdate)}</span>
                    </div>
                </div>
            </div>

            <div class="timeline">
                <h4 style="margin-bottom: 1rem; color: #1e293b;">Recent Updates</h4>
                <div class="timeline-item">
                    <div class="timeline-dot active"></div>
                    <div class="timeline-text">Location updated ${this.getTimeAgo(driver.lastUpdate)}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-text">Journey ${driver.progress.progressPercentage.toFixed(0)}% complete</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-text">Currently traveling at ${driver.location.speed ? (driver.location.speed * 3.6).toFixed(0) + ' km/h' : '0 km/h'}</div>
                </div>
            </div>
        `;

        panel.style.display = 'block';
    }

    hideJourneyPanel() {
        document.getElementById('journeyPanel').style.display = 'none';
        this.selectedJourney = null;
    }

    centerMapOnDrivers() {
        if (this.drivers.size === 0) {
            this.addAlert('No active drivers to center on', 'info');
            return;
        }

        const bounds = L.latLngBounds();
        this.drivers.forEach(driver => {
            bounds.extend([driver.location.latitude, driver.location.longitude]);
        });
        
        this.map.fitBounds(bounds, { padding: [50, 50] });
        this.addAlert('Map centered on all active drivers', 'info');
    }

    toggleMapView() {
        // Toggle between satellite and street view
        // For demo, just zoom in/out
        const currentZoom = this.map.getZoom();
        this.map.setZoom(currentZoom > 10 ? 5 : 12);
    }

    refreshData() {
        this.addAlert('Refreshing live data...', 'info');
        this.fetchLiveData();
        
        // Visual feedback
        const button = document.getElementById('refreshData');
        button.style.transform = 'rotate(360deg)';
        button.style.transition = 'transform 0.5s ease';
        setTimeout(() => {
            button.style.transform = 'rotate(0deg)';
        }, 500);
    }

    addAlert(message, type = 'info') {
        const alertsList = document.getElementById('alertsList');
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item alert-${type}`;
        
        const iconMap = {
            info: '🔵',
            warning: '🟡',
            error: '🔴',
            success: '🟢'
        };

        alertElement.innerHTML = `
            <div class="alert-header">
                <span class="alert-icon">${iconMap[type] || '🔵'}</span>
                <div class="alert-time">${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="alert-message">${message}</div>
        `;
        
        alertsList.insertBefore(alertElement, alertsList.firstChild);
        
        // Keep only last 15 alerts
        while (alertsList.children.length > 15) {
            alertsList.removeChild(alertsList.lastChild);
        }

        // Auto-remove after 10 seconds for info alerts
        if (type === 'info') {
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 10000);
        }
    }

    showError(message) {
        this.addAlert(message, 'error');
        this.updateConnectionStatus(false);
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 30) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    loadMockData() {
        // Add initial system alerts
        this.addAlert('Admin dashboard initialized', 'success');
        this.addAlert('Live tracking system active', 'info');
        this.addAlert('WebSocket connection established', 'success');
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AdminDashboard();
});

// Handle real-time updates from drivers
function handleDriverLocationUpdate(data) {
    if (window.dashboard) {
        window.dashboard.updateDriverLocation(data);
    }
}

// Export for external use
window.handleDriverLocationUpdate = handleDriverLocationUpdate;

// Simulate receiving data from mobile app
function simulateDriverUpdate(driverData) {
    if (window.dashboard) {
        window.dashboard.updateDriverLocation(driverData);
        window.dashboard.addAlert(`Location update from ${driverData.driverName}`, 'info');
    }
}

window.simulateDriverUpdate = simulateDriverUpdate;