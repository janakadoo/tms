/* Store.js - LocalStorage Manager */

const STORAGE_KEYS = {
    VEHICLES: 'vms_vehicles',
    DRIVERS: 'vms_drivers',
    TRIPS: 'vms_trips',
    FUEL: 'vms_fuel',
    EXPENSES: 'vms_expenses',
    MAINTENANCE: 'vms_maintenance',
    SETTINGS: 'vms_settings'
};

// Initial Mock Data to populate if empty
const MOCK_DATA = {
    vehicles: [
        { id: 'v1', regNo: 'CAB-1234', type: 'Car', brand: 'Toyota', model: 'Prius', year: 2018, status: 'Active', fuelType: 'Petrol' },
        { id: 'v2', regNo: 'PI-5566', type: 'Van', brand: 'Nissan', model: 'Caravan', year: 2015, status: 'Active', fuelType: 'Diesel' }
    ],
    drivers: [
        { id: 'd1', name: 'Kasun Perera', licenseNo: 'B1234567', contact: '0771234567', status: 'Active' },
        { id: 'd2', name: 'Amal Silva', licenseNo: 'B9876543', contact: '0719876543', status: 'Active' }
    ],
    maintenance: [
        { id: 'm1', vehicleId: 'v1', date: '2023-10-15', type: 'Routine Service', cost: 15000, garage: 'Toyota Lanka', status: 'Completed', description: 'Regular 5000km service' }
    ]
};

export const Store = {
    // Generic Get
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // Generic Set
    set: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Initialize Store with Mock Data if empty
    init: () => {
        if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
            Store.set(STORAGE_KEYS.VEHICLES, MOCK_DATA.vehicles);
        }
        if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) {
            Store.set(STORAGE_KEYS.DRIVERS, MOCK_DATA.drivers);
        }
        if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) {
            Store.set(STORAGE_KEYS.MAINTENANCE, MOCK_DATA.maintenance);
        }
    },

    // Entity Specific Helpers
    Vehicles: {
        getAll: () => Store.get(STORAGE_KEYS.VEHICLES),
        add: (vehicle) => {
            const list = Store.Vehicles.getAll();
            list.push(vehicle);
            Store.set(STORAGE_KEYS.VEHICLES, list);
        },
        update: (updatedVehicle) => {
            let list = Store.Vehicles.getAll();
            list = list.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
            Store.set(STORAGE_KEYS.VEHICLES, list);
        },
        delete: (id) => {
            let list = Store.Vehicles.getAll();
            list = list.filter(v => v.id !== id);
            Store.set(STORAGE_KEYS.VEHICLES, list);
        }
    },

    Drivers: {
        getAll: () => Store.get(STORAGE_KEYS.DRIVERS),
        add: (driver) => {
            const list = Store.Drivers.getAll();
            list.push(driver);
            Store.set(STORAGE_KEYS.DRIVERS, list);
        },
        update: (updatedDriver) => {
            let list = Store.Drivers.getAll();
            list = list.map(d => d.id === updatedDriver.id ? updatedDriver : d);
            Store.set(STORAGE_KEYS.DRIVERS, list);
        },
        delete: (id) => {
            let list = Store.Drivers.getAll();
            list = list.filter(d => d.id !== id);
            Store.set(STORAGE_KEYS.DRIVERS, list);
        }
    },

    Trips: {
        getAll: () => Store.get(STORAGE_KEYS.TRIPS),
        add: (trip) => {
            const list = Store.Trips.getAll();
            list.push(trip);
            Store.set(STORAGE_KEYS.TRIPS, list);
        },
        update: (updatedTrip) => {
            let list = Store.Trips.getAll();
            list = list.map(t => t.id === updatedTrip.id ? updatedTrip : t);
            Store.set(STORAGE_KEYS.TRIPS, list);
        },
        delete: (id) => {
            let list = Store.Trips.getAll();
            list = list.filter(t => t.id !== id);
            Store.set(STORAGE_KEYS.TRIPS, list);
        }
    },

    Fuel: {
        getAll: () => Store.get(STORAGE_KEYS.FUEL),
        add: (entry) => {
            const list = Store.Fuel.getAll();
            list.push(entry);
            Store.set(STORAGE_KEYS.FUEL, list);
        },
        update: (updatedEntry) => {
            let list = Store.Fuel.getAll();
            list = list.map(f => f.id === updatedEntry.id ? updatedEntry : f);
            Store.set(STORAGE_KEYS.FUEL, list);
        },
        delete: (id) => {
            let list = Store.Fuel.getAll();
            list = list.filter(f => f.id !== id);
            Store.set(STORAGE_KEYS.FUEL, list);
        }
    },

    Expenses: {
        getAll: () => Store.get(STORAGE_KEYS.EXPENSES),
        add: (entry) => {
            const list = Store.Expenses.getAll();
            list.push(entry);
            Store.set(STORAGE_KEYS.EXPENSES, list);
        },
        update: (updatedEntry) => {
            let list = Store.Expenses.getAll();
            list = list.map(e => e.id === updatedEntry.id ? updatedEntry : e);
            Store.set(STORAGE_KEYS.EXPENSES, list);
        },
        delete: (id) => {
            let list = Store.Expenses.getAll();
            list = list.filter(e => e.id !== id);
            Store.set(STORAGE_KEYS.EXPENSES, list);
        }
    },

    Services: {
        getAll: () => Store.get(STORAGE_KEYS.MAINTENANCE),
        add: (service) => {
            const list = Store.Services.getAll();
            list.push(service);
            Store.set(STORAGE_KEYS.MAINTENANCE, list);
        },
        update: (updatedService) => {
            let list = Store.Services.getAll();
            list = list.map(s => s.id === updatedService.id ? updatedService : s);
            Store.set(STORAGE_KEYS.MAINTENANCE, list);
        },
        delete: (id) => {
            let list = Store.Services.getAll();
            list = list.filter(s => s.id !== id);
            Store.set(STORAGE_KEYS.MAINTENANCE, list);
        }
    },

    // Add other entities as needed
};
