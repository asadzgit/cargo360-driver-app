class ClientTracker {
    constructor() {
        this.map = null;
        this.driverMarker = null;
        this.pickupMarker = null;
        this.deliveryMarker = null;
        this.routeLine = null;
        this.traveledRoute = null;
        this.journeyData = null;
        this.isConnected = false;
        this.routeCoordinates = [];
        
        this.init();
    }

    init() {
        this.initMap();
        this.setupEventListeners();
        this.loadJourneyData();
        this.startLiveTracking();
    }

    initMap() {
        // Initialize map centered on US
        this.map = L.map('map').setView([40.7128, -74.0060], 10);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);
    }

    setupEventListeners() {
        document.getElementById('centerMap').addEventListener('click', () => {
            this.centerMapOnRoute();
        });

        document.getElementById('refreshLocation').addEventListener('click', () => {
            this.refreshDriverLocation();
        });

        document.getElementById('contactDriver').addEventListener('click', () => {
            this.contactDriver();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideShareModal();
        });

        document.getElementById('copyLink').addEventListener('click', () => {
            this.copyTrackingLink();
        });
    }

    loadJourneyData() {
        // Get journey ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const journeyId = urlParams.get('journey') || 'demo-journey-1';
        
        // Mock journey data - in real app, fetch from API
        this.journeyData = {
            id: journeyId,
            clientName: 'ABC Logistics',
            driverName: 'John Smith',
            driverPhone: '+1 234 567 8900',
            fromLocation: 'New York, NY',
            toLocation: 'Boston, MA',
            fromCoords: { latitude: 40.7128, longitude: -74.0060 },
            toCoords: { latitude: 42.3601, longitude: -71.0589 },
            loadType: 'Electronics',
            vehicleType: 'Medium Truck',
            estimatedDuration: '4.5 hours',
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        };

        this.updateJourneyUI();
        this.addRouteMarkers();
    }

    updateJourneyUI() {
        if (!this.journeyData) return;

        document.getElementById('journeyTitle').textContent = 
            `Delivery to ${this.journeyData.toLocation}`;
        document.getElementById('journeyId').textContent = this.journeyData.id;
        document.getElementById('fromLocation').textContent = this.journeyData.fromLocation;
        document.getElementById('toLocation').textContent = this.journeyData.toLocation;
        document.getElementById('driverName').textContent = this.journeyData.driverName;
        
        // Add initial timeline entry
        this.addTimelineEntry('Journey started', this.journeyData.startTime);
    }

    addRouteMarkers() {
        if (!this.journeyData) return;

        // Add pickup marker
        this.pickupMarker = L.marker([
            this.journeyData.fromCoords.latitude, 
            this.journeyData.fromCoords.longitude
        ], {
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
        }).addTo(this.map);

        this.pickupMarker.bindPopup(`
            <div class="location-popup">
                <h4>Pickup Location</h4>
                <p>${this.journeyData.fromLocation}</p>
            </div>
        `);

        // Add delivery marker
        this.deliveryMarker = L.marker([
            this.journeyData.toCoords.latitude, 
            this.journeyData.toCoords.longitude
        ], {
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
        }).addTo(this.map);

        this.deliveryMarker.bindPopup(`
            <div class="location-popup">
                <h4>Delivery Location</h4>
                <p>${this.journeyData.toLocation}</p>
            </div>
        `);

        // Draw planned route line
        this.routeLine = L.polyline([
            [this.journeyData.fromCoords.latitude, this.journeyData.fromCoords.longitude],
            [this.journeyData.toCoords.latitude, this.journeyData.toCoords.longitude]
        ], {
            color: '#cbd5e1',
            weight: 3,
            opacity: 0.6,
            dashArray: '10, 5',
        }).addTo(this.map);

        // Fit map to show entire route
        this.centerMapOnRoute();
    }

    startLiveTracking() {
        this.updateConnectionStatus(true);
        
        // Simulate receiving live driver location updates
        this.simulateDriverMovement();
        
        // Start polling for updates every 5 seconds
        setInterval(() => {
            this.simulateDriverMovement();
        }, 5000);
    }

    simulateDriverMovement() {
        if (!this.journeyData) return;

        // Simulate driver moving from pickup to delivery
        const startLat = this.journeyData.fromCoords.latitude;
        const startLng = this.journeyData.fromCoords.longitude;
        const endLat = this.journeyData.toCoords.latitude;
        const endLng = this.journeyData.toCoords.longitude;
        
        // Calculate progress based on time (simulate 4.5 hour journey)
        const journeyDuration = 4.5 * 60 * 60 * 1000; // 4.5 hours in ms
        const elapsed = Date.now() - this.journeyData.startTime.getTime();
        const progress = Math.min(0.95, Math.max(0, elapsed / journeyDuration)); // Cap at 95%
        
        // Interpolate current position
        const currentLat = startLat + (endLat - startLat) * progress;
        const currentLng = startLng + (endLng - startLng) * progress;
        
        // Add some realistic movement variation
        const variation = 0.001;
        const finalLat = currentLat + (Math.random() - 0.5) * variation;
        const finalLng = currentLng + (Math.random() - 0.5) * variation;

        const driverLocation = {
            latitude: finalLat,
            longitude: finalLng,
            speed: 55 + Math.random() * 20, // 55-75 km/h
            heading: this.calculateBearing(startLat, startLng, endLat, endLng),
            accuracy: 5 + Math.random() * 10,
            timestamp: Date.now(),
        };

        this.updateDriverLocation(driverLocation, progress);
    }

    updateDriverLocation(location, progress) {
        // Update or create driver marker
        if (this.driverMarker) {
            this.driverMarker.setLatLng([location.latitude, location.longitude]);
        } else {
            this.driverMarker = L.marker([location.latitude, location.longitude], {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="route-marker driver-marker">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                            <path d="M15 18H9"/>
                            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                            <circle cx="17" cy="18" r="2"/>
                            <circle cx="7" cy="18" r="2"/>
                        </svg>
                    </div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                })
            }).addTo(this.map);

            this.driverMarker.bindPopup(`
                <div class="driver-popup">
                    <h4>${this.journeyData.driverName}</h4>
                    <div class="popup-info">
                        <div class="popup-row">
                            <span class="popup-label">Speed:</span>
                            <span class="popup-value" id="popupSpeed">-</span>
                        </div>
                        <div class="popup-row">
                            <span class="popup-label">Progress:</span>
                            <span class="popup-value" id="popupProgress">-</span>
                        </div>
                        <div class="popup-row">
                            <span class="popup-label">ETA:</span>
                            <span class="popup-value" id="popupETA">-</span>
                        </div>
                    </div>
                    <div class="popup-progress">
                        <div class="popup-progress-bar">
                            <div class="popup-progress-fill" id="popupProgressFill" style="width: 0%"></div>
                        </div>
                        <div class="popup-progress-text" id="popupProgressText">0% Complete</div>
                    </div>
                </div>
            `);
        }

        // Update traveled route
        this.routeCoordinates.push([location.latitude, location.longitude]);
        
        if (this.traveledRoute) {
            this.map.removeLayer(this.traveledRoute);
        }
        
        if (this.routeCoordinates.length > 1) {
            this.traveledRoute = L.polyline(this.routeCoordinates, {
                color: '#059669',
                weight: 4,
                opacity: 0.8,
            }).addTo(this.map);
        }

        // Calculate route statistics
        const totalDistance = this.calculateDistance(
            this.journeyData.fromCoords.latitude,
            this.journeyData.fromCoords.longitude,
            this.journeyData.toCoords.latitude,
            this.journeyData.toCoords.longitude
        );
        
        const remainingDistance = this.calculateDistance(
            location.latitude,
            location.longitude,
            this.journeyData.toCoords.latitude,
            this.journeyData.toCoords.longitude
        );

        const progressPercentage = Math.max(0, Math.min(100, progress * 100));
        const estimatedTimeRemaining = remainingDistance / (location.speed || 60); // Assume 60 km/h if no speed

        // Update UI
        this.updateProgressUI(progressPercentage, remainingDistance, estimatedTimeRemaining, location.speed);
        
        // Update popup if open
        this.updateDriverPopup(location.speed, progressPercentage, estimatedTimeRemaining);
        
        // Add milestone updates
        this.checkMilestones(progressPercentage);
        
        // Update driver status
        this.updateDriverStatus(progressPercentage);
    }

    updateProgressUI(progressPercentage, remainingDistance, estimatedTimeRemaining, speed) {
        document.getElementById('progressPercentage').textContent = `${progressPercentage.toFixed(1)}%`;
        document.getElementById('progressFill').style.width = `${progressPercentage}%`;
        document.getElementById('remainingDistance').textContent = remainingDistance.toFixed(1);
        document.getElementById('estimatedTime').textContent = estimatedTimeRemaining.toFixed(1);
        document.getElementById('currentSpeed').textContent = speed ? (speed * 3.6).toFixed(0) : '0';
    }

    updateDriverPopup(speed, progress, eta) {
        const popupSpeed = document.getElementById('popupSpeed');
        const popupProgress = document.getElementById('popupProgress');
        const popupETA = document.getElementById('popupETA');
        const popupProgressFill = document.getElementById('popupProgressFill');
        const popupProgressText = document.getElementById('popupProgressText');

        if (popupSpeed) popupSpeed.textContent = speed ? `${(speed * 3.6).toFixed(1)} km/h` : '0 km/h';
        if (popupProgress) popupProgress.textContent = `${progress.toFixed(1)}%`;
        if (popupETA) popupETA.textContent = `${eta.toFixed(1)}h`;
        if (popupProgressFill) popupProgressFill.style.width = `${progress}%`;
        if (popupProgressText) popupProgressText.textContent = `${progress.toFixed(1)}% Complete`;
    }

    updateDriverStatus(progress) {
        const statusElement = document.getElementById('driverStatus');
        let status = 'En route to pickup';
        
        if (progress < 10) {
            status = 'Preparing for pickup';
        } else if (progress < 25) {
            status = 'En route to pickup';
        } else if (progress < 50) {
            status = 'Load picked up, en route';
        } else if (progress < 90) {
            status = 'Approaching destination';
        } else {
            status = 'Arriving at destination';
        }
        
        statusElement.textContent = status;
    }

    checkMilestones(progress) {
        const milestones = [
            { threshold: 10, message: 'Driver departed for pickup', triggered: false },
            { threshold: 25, message: 'Load picked up successfully', triggered: false },
            { threshold: 50, message: 'Halfway to destination', triggered: false },
            { threshold: 75, message: 'Approaching delivery location', triggered: false },
            { threshold: 90, message: 'Driver has arrived at destination', triggered: false },
        ];

        milestones.forEach(milestone => {
            if (progress >= milestone.threshold && !milestone.triggered) {
                this.addTimelineEntry(milestone.message, new Date());
                milestone.triggered = true;
            }
        });
    }

    addTimelineEntry(message, timestamp) {
        const timeline = document.getElementById('timeline');
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        timelineItem.innerHTML = `
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
                <div class="timeline-text">${message}</div>
                <div class="timeline-time">${timestamp.toLocaleTimeString()}</div>
            </div>
        `;
        
        timeline.insertBefore(timelineItem, timeline.firstChild);
        
        // Remove active class from previous items
        setTimeout(() => {
            const dots = timeline.querySelectorAll('.timeline-dot');
            dots.forEach((dot, index) => {
                if (index > 0) {
                    dot.classList.remove('active');
                }
            });
        }, 2000);
    }

    centerMapOnRoute() {
        if (!this.journeyData) return;

        const bounds = L.latLngBounds();
        bounds.extend([this.journeyData.fromCoords.latitude, this.journeyData.fromCoords.longitude]);
        bounds.extend([this.journeyData.toCoords.latitude, this.journeyData.toCoords.longitude]);
        
        if (this.driverMarker) {
            bounds.extend(this.driverMarker.getLatLng());
        }
        
        this.map.fitBounds(bounds, { padding: [50, 50] });
    }

    refreshDriverLocation() {
        // Visual feedback
        const button = document.getElementById('refreshLocation');
        button.style.transform = 'rotate(360deg)';
        button.style.transition = 'transform 0.5s ease';
        
        setTimeout(() => {
            button.style.transform = 'rotate(0deg)';
        }, 500);
        
        // Force update
        this.simulateDriverMovement();
        this.addTimelineEntry('Location refreshed', new Date());
    }

    contactDriver() {
        if (!this.journeyData) return;
        
        const phone = this.journeyData.driverPhone;
        const message = `Hi ${this.journeyData.driverName}, I'm tracking my delivery. How is everything going?`;
        
        // Try to open SMS app
        const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
        
        try {
            window.open(smsUrl, '_self');
        } catch (error) {
            // Fallback: copy phone number to clipboard
            navigator.clipboard.writeText(phone).then(() => {
                alert(`Driver phone number copied: ${phone}`);
            }).catch(() => {
                alert(`Driver phone: ${phone}`);
            });
        }
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            indicator.className = 'connection-indicator';
            text.textContent = 'Live';
        } else {
            indicator.className = 'connection-indicator disconnected';
            text.textContent = 'Reconnecting...';
        }
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;
        
        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
        
        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }

    showShareModal() {
        const modal = document.getElementById('shareModal');
        const shareLink = document.getElementById('shareLink');
        const currentUrl = window.location.href;
        
        shareLink.value = currentUrl;
        modal.style.display = 'flex';
    }

    hideShareModal() {
        document.getElementById('shareModal').style.display = 'none';
    }

    copyTrackingLink() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        document.execCommand('copy');
        
        const copyBtn = document.getElementById('copyLink');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#10b981';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#2563eb';
        }, 2000);
    }
}

// Initialize tracker when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.clientTracker = new ClientTracker();
});

// Handle incoming location updates from driver app
function handleDriverLocationUpdate(data) {
    if (window.clientTracker) {
        const progress = data.progress?.progressPercentage / 100 || 0;
        window.clientTracker.updateDriverLocation(data.location, progress);
        
        // Add timeline entry for location update
        window.clientTracker.addTimelineEntry(
            'Location updated', 
            new Date(data.timestamp)
        );
    }
}

// Export for external use
window.handleDriverLocationUpdate = handleDriverLocationUpdate;

// Simulate receiving real-time updates
function simulateRealTimeUpdate() {
    if (window.clientTracker) {
        window.clientTracker.simulateDriverMovement();
    }
}

// Auto-refresh every 30 seconds for demo
setInterval(simulateRealTimeUpdate, 30000);