/* js/modules/tracking.js */
import { Utils } from '../utils.js?v=3';
import { DB } from '../db.js?v=3';

export const TrackingModule = {
    init: (container) => {
        TrackingModule.container = container;
        TrackingModule.render();
    },

    state: {
        activeTab: 'live', // live, history, stops, geofence, more
        selectedVehicleId: null
    },

    render: () => {
        TrackingModule.container.innerHTML = `
            <div class="tracking-layout">
                <div class="tracking-sidebar card">
                    <div class="card-header">
                        <h3 class="card-title">Tracking Options</h3>
                    </div>
                    <nav class="tracking-nav">
                        <button class="track-nav-item ${TrackingModule.state.activeTab === 'live' ? 'active' : ''}" data-tab="live">
                            <i data-lucide="activity"></i> Live Tracking
                        </button>
                        <button class="track-nav-item ${TrackingModule.state.activeTab === 'history' ? 'active' : ''}" data-tab="history">
                            <i data-lucide="history"></i> Past History
                        </button>
                        <button class="track-nav-item ${TrackingModule.state.activeTab === 'stops' ? 'active' : ''}" data-tab="stops">
                            <i data-lucide="octagon"></i> Stops
                        </button>
                        <button class="track-nav-item ${TrackingModule.state.activeTab === 'geofence' ? 'active' : ''}" data-tab="geofence">
                            <i data-lucide="map-pin"></i> Geofence
                        </button>
                        <button class="track-nav-item ${TrackingModule.state.activeTab === 'more' ? 'active' : ''}" data-tab="more">
                            <i data-lucide="more-horizontal"></i> More Options
                        </button>
                    </nav>
                </div>
                <div class="tracking-content card">
                    ${TrackingModule.renderContent()}
                </div>
            </div>
            
            <style>
                .tracking-layout {
                    display: grid;
                    grid-template-columns: 250px 1fr;
                    gap: 1.5rem;
                    height: calc(100vh - 140px);
                }
                .tracking-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding: 1rem;
                }
                .track-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: transparent;
                    color: var(--text-color);
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    font-size: 0.95rem;
                }
                .track-nav-item:hover {
                    background: var(--bg-body);
                }
                .track-nav-item.active {
                    background: var(--primary-color);
                    color: white;
                }
                .tracking-content {
                    padding: 1.5rem;
                    overflow-y: auto;
                    position: relative;
                }
                .map-placeholder {
                    background: var(--bg-body);
                    border-radius: var(--border-radius);
                    height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    border: 2px dashed var(--border-color);
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            </style>
        `;

        // Make TrackingModule accessible globally for onclick handlers
        window.TrackingModule = TrackingModule;

        lucide.createIcons();
        TrackingModule.attachListeners();
    },

    renderContent: () => {
        const tab = TrackingModule.state.activeTab;

        // Render specific content based on tab
        if (tab === 'live') return TrackingModule.renderLive();
        if (tab === 'history') return TrackingModule.renderHistory();
        if (tab === 'stops') return TrackingModule.renderStops();
        if (tab === 'geofence') return TrackingModule.renderGeofence();
        if (tab === 'more') return TrackingModule.renderMore();
    },

    renderLive: () => {
        const vehicles = DB.Vehicles.getAll().filter(v => v.tracking_id);

        // Group by type
        const bikes = vehicles.filter(v => v.type === 'Bike');
        const lorries = vehicles.filter(v => v.type === 'Lorry' || v.type === 'Truck');
        const vans = vehicles.filter(v => v.type === 'Van');

        let selectedVehicle = null;
        if (TrackingModule.state.selectedVehicleId) {
            selectedVehicle = vehicles.find(v => v.id === TrackingModule.state.selectedVehicleId);
        } else if (vehicles.length > 0) {
            selectedVehicle = vehicles[0];
            TrackingModule.state.selectedVehicleId = selectedVehicle.id;
        }

        const renderVehicleGroup = (groupVehicles, icon, label, color) => {
            if (groupVehicles.length === 0) return '';

            return `
                <div style="margin-bottom: 0.5rem;">
                    <div style="padding: 0.5rem; background: ${color}; color: white; font-weight: 600; font-size: 0.85rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;">
                        ${icon} ${label} (${groupVehicles.length})
                    </div>
                    ${groupVehicles.map(v => `
                        <div class="p-2 border-bottom hover-bg ${v.id === TrackingModule.state.selectedVehicleId ? 'bg-primary-light' : ''}" 
                             data-vehicle-id="${v.id}" style="cursor:pointer;">
                            <div style="font-weight:500; font-size: 0.9rem;">${v.reg_no}</div>
                            <div class="small text-muted" style="font-size: 0.7rem;">ID: ${v.tracking_id}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const vehicleListHtml = `
            ${renderVehicleGroup(bikes, '🏍️', 'BIKES', '#8b5cf6')}
            ${renderVehicleGroup(lorries, '🚛', 'LORRIES', '#3b82f6')}
            ${renderVehicleGroup(vans, '🚐', 'VANS', '#10b981')}
        `;

        const credentialsHtml = selectedVehicle ? `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                <div class="flex justify-between items-center">
                    <div style="flex: 1;">
                        <span style="font-weight: 600; font-size: 1rem;">📍 ${selectedVehicle.reg_no}</span>
                        <span style="margin-left: 1rem; opacity: 0.8; font-size: 0.75rem;">(${selectedVehicle.type})</span>
                    </div>
                    <div class="flex gap-2" style="font-size: 0.85rem;">
                        <div class="credential-box-compact" onclick="TrackingModule.copyToClipboard('${selectedVehicle.tracking_id}', 'ID')" 
                             style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            <span style="opacity: 0.7; font-size: 0.7rem;">ID:</span>
                            <strong style="margin-left: 0.3rem;">${selectedVehicle.tracking_id}</strong>
                            <i data-lucide="copy" style="width: 14px; height: 14px; margin-left: 0.3rem; display: inline;"></i>
                        </div>
                        <div class="credential-box-compact" onclick="TrackingModule.copyToClipboard('${selectedVehicle.tracking_password}', 'Password')" 
                             style="background: rgba(255,255,255,0.2); padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            <span style="opacity: 0.7; font-size: 0.7rem;">PWD:</span>
                            <strong style="margin-left: 0.3rem;">${selectedVehicle.tracking_password || 'N/A'}</strong>
                            <i data-lucide="copy" style="width: 14px; height: 14px; margin-left: 0.3rem; display: inline;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .credential-box-compact:hover {
                    background: rgba(255,255,255,0.3) !important;
                    transform: scale(1.02);
                }
                .credential-box-compact:active {
                    transform: scale(0.98);
                }
            </style>
        ` : `
            <div class="alert alert-warning" style="display:flex; justify-content:space-between; align-items:center;">
                <span>No vehicles with tracking IDs found.</span>
            </div>`;

        return `
            <div style="height: calc(100vh - 160px); display: flex; flex-direction: column;">
                <div style="display: grid; grid-template-columns: 220px 1fr; gap: 0.75rem; flex: 1; min-height: 0;">
                    <!-- Vehicle List by Category -->
                    <div class="card p-0" style="display: flex; flex-direction: column; max-height: 100%;">
                        <div style="padding: 0.75rem; background: var(--bg-light); border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 0.9rem;">
                            Fleet (${vehicles.length})
                        </div>
                        <div style="overflow-y: auto; flex: 1; padding: 0.5rem;">
                            ${vehicleListHtml || '<div class="p-3 text-muted">No tracked vehicles</div>'}
                        </div>
                    </div>

                    <!-- Tracking Frame -->
                    <div style="display: flex; flex-direction: column; min-height: 0;">
                        ${credentialsHtml}
                        <div class="card" style="flex: 1; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                            <div style="text-align: center; max-width: 600px; padding: 2rem;">
                                <div style="font-size: 4rem; margin-bottom: 1rem;">🗺️</div>
                                <h2 style="margin: 0 0 1rem 0; color: #2d3748;">Live Vehicle Tracking</h2>
                                <p style="color: #4a5568; margin-bottom: 2rem; line-height: 1.6;">
                                    Click below to launch tracking with auto-login
                                </p>
                                <button onclick="TrackingModule.launchTracking()" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem; min-width: 250px;">
                                    <i data-lucide="rocket" style="width: 20px; height: 20px; margin-right: 0.5rem;"></i>
                                    Launch Tracking System
                                </button>
                                <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.8); border-radius: 8px; text-align: left;">
                                    <strong style="color: #2d3748;">Auto-Login Process:</strong>
                                    <ol style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: #4a5568; font-size: 0.9rem;">
                                        <li>Opens tracking website</li>
                                        <li>Attempts automatic login (10 tries)</li>
                                        <li>If blocked: Shows credentials to paste</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    selectVehicle: (id) => {
        TrackingModule.state.selectedVehicleId = id;
        TrackingModule.render();
    },

    copyToClipboard: (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            // Show toast notification
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-weight: 500;
                animation: slideIn 0.3s ease;
            `;
            toast.innerHTML = `✓ ${label} copied to clipboard!`;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        });
    },

    launchTracking: () => {
        const vehicles = DB.Vehicles.getAll().filter(v => v.tracking_id);
        const selectedVehicle = vehicles.find(v => v.id === TrackingModule.state.selectedVehicleId);

        if (!selectedVehicle) {
            alert('Please select a vehicle first');
            return;
        }

        const url = `https://en.aika168.com/?vms_id=${encodeURIComponent(selectedVehicle.tracking_id)}&vms_pwd=${encodeURIComponent(selectedVehicle.tracking_password)}`;

        const width = Math.min(1400, screen.width - 100);
        const height = screen.height - 100;
        const left = (screen.width - width) / 2;
        const top = 20;

        window.open(
            url,
            'VMS_Tracking_' + selectedVehicle.id,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes`
        );

        TrackingModule.showToast('🚀 Opening Tracking Launcher...', '#10b981', 3000);
    },

    showToast: (message, color = '#10b981', duration = 2500) => {
        // Remove existing toasts
        const existing = document.querySelectorAll('.vms-toast');
        existing.forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'vms-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 1.2rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            line-height: 1.5;
            border-left: 5px solid rgba(0,0,0,0.2);
        `;
        toast.innerHTML = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    renderHistory: () => {
        return `
            <h3>History Playback</h3>
            <div class="grid grid-3 gap-4 mb-4">
                <div class="form-group">
                    <label>Select Vehicle</label>
                    <select class="form-select">
                        ${DB.Vehicles.getAll().map(v => `<option value="${v.id}">${v.reg_no} - ${v.brand}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group" style="display:flex; align-items:flex-end;">
                    <button class="btn btn-primary w-100">Show Route</button>
                </div>
            </div>
            <div class="map-placeholder" style="height: 300px;">
                <p>Route Map Visualization</p>
            </div>
        `;
    },

    renderStops: () => {
        return `
            <h3>Vehicle Stops</h3>
            <p class="text-muted mb-4">Detailed report of vehicle stops and duration.</p>
            <table class="table">
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>Location</th>
                        <th>Arrival</th>
                        <th>Departure</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>WP CAB-1234</td>
                        <td>Main Warehouse</td>
                        <td>08:30 AM</td>
                        <td>09:15 AM</td>
                        <td>45 mins</td>
                    </tr>
                    <tr>
                        <td>WP PI-5588</td>
                        <td>Client Office</td>
                        <td>10:00 AM</td>
                        <td>10:10 AM</td>
                        <td>10 mins</td>
                    </tr>
                </tbody>
            </table>
        `;
    },

    renderGeofence: () => {
        return `
            <div class="header-flex mb-4" style="display:flex;justify-content:space-between">
                <h3>Geofence Zones</h3>
                <button class="btn btn-primary btn-sm"><i data-lucide="plus"></i> Add Zone</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                <div class="card p-3 border">
                    <div class="flex justify-between mb-2">
                        <strong>Headquarters</strong>
                        <span class="badge badge-success" style="float:right;background:var(--success);color:white;padding:2px 6px;border-radius:4px;font-size:12px">Active</span>
                    </div>
                    <p class="text-muted small">Radius: 500m</p>
                    <p class="text-muted small">Vehicles: All</p>
                </div>
                 <div class="card p-3 border">
                    <div class="flex justify-between mb-2">
                        <strong>Warehouse B</strong>
                        <span class="badge badge-success" style="float:right;background:var(--success);color:white;padding:2px 6px;border-radius:4px;font-size:12px">Active</span>
                    </div>
                    <p class="text-muted small">Radius: 1000m</p>
                    <p class="text-muted small">Vehicles: Trucks Only</p>
                </div>
            </div>
        `;
    },

    renderMore: () => {
        return `
            <h3>Advanced Tracking Options</h3>
            <div class="list-group mt-4">
                <div class="p-3 border-bottom hover-bg">
                    <h4><i data-lucide="bell"></i> Alerts Configuration</h4>
                    <p class="text-muted small">Speeding, Idle time, Harsh breaking alerts.</p>
                </div>
                <div class="p-3 border-bottom hover-bg">
                    <h4><i data-lucide="share-2"></i> Share Live Location</h4>
                    <p class="text-muted small">Generate temporary links for clients.</p>
                </div>
                <div class="p-3 border-bottom hover-bg">
                    <h4><i data-lucide="download"></i> Export Tracking Data</h4>
                    <p class="text-muted small">Download GPX or KML files.</p>
                </div>
            </div>
        `;
    },

    attachListeners: () => {
        TrackingModule.container.querySelectorAll('.track-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                TrackingModule.state.activeTab = btn.dataset.tab;
                TrackingModule.render();
            });
        });

        TrackingModule.container.addEventListener('click', (e) => {
            const vehicleItem = e.target.closest('[data-vehicle-id]');
            if (vehicleItem) {
                TrackingModule.selectVehicle(vehicleItem.dataset.vehicleId);
            }
        });
    }
};
