import { Store } from './store.js';
import { Utils } from './utils.js';

export const Seed = {
    run: () => {
        console.log('🌱 Running seed script...');

        const vehiclesToSeed = [
            // BIKES
            { regNo: 'Sampath', brand: 'Bike', model: 'Bike', type: 'Bike', trackingId: '9170997653', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Petrol', year: 2023 },
            { regNo: 'Prathap', brand: 'Bike', model: 'Bike', type: 'Bike', trackingId: '9176093889', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Petrol', year: 2023 },
            { regNo: 'Naween', brand: 'Bike', model: 'Bike', type: 'Bike', trackingId: '9175376733', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Petrol', year: 2023 },
            { regNo: 'Upali', brand: 'Bike', model: 'Bike', type: 'Bike', trackingId: '9175380028', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Petrol', year: 2023 },
            { regNo: 'Thimal', brand: 'Bike', model: 'Bike', type: 'Bike', trackingId: '9176093835', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Petrol', year: 2023 },
            { regNo: 'Dinesh', brand: 'Bike', model: 'Bike', type: 'Bike', trackingId: '9176044130', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Petrol', year: 2023 },

            // LORRIES
            { regNo: 'LL-9815', brand: 'Leyland', model: 'Truck', type: 'Lorry', trackingId: '9175379873', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Diesel', year: 2023 },
            { regNo: 'LL-0906', brand: 'Leyland', model: 'Truck', type: 'Lorry', trackingId: '9175379916', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Diesel', year: 2023 },
            { regNo: 'LL-6343', brand: 'Leyland', model: 'Truck', type: 'Lorry', trackingId: '9175376434', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Diesel', year: 2023 },

            // VANS
            { regNo: 'Shihardeen', brand: 'Van', model: 'Van', type: 'Van', trackingId: '9175376462', trackingPassword: 'Track@2023', status: 'Active', fuelType: 'Diesel', year: 2023 }
        ];

        const existing = Store.Vehicles.getAll();
        console.log('📦 Existing vehicles:', existing.length);

        let added = 0;
        vehiclesToSeed.forEach(seed => {
            const exists = existing.find(v => v.regNo === seed.regNo || v.trackingId === seed.trackingId);
            if (!exists) {
                const newVehicle = {
                    id: Utils.generateId(),
                    ...seed
                };
                console.log('➕ Seeding vehicle:', seed.regNo, 'with ID:', seed.trackingId);
                Store.Vehicles.add(newVehicle);
                added++;
            } else {
                console.log('✓ Vehicle already exists:', seed.regNo);
            }
        });

        console.log(`✅ Seed complete. Added ${added} vehicles.`);
        console.log('📊 Total vehicles now:', Store.Vehicles.getAll().length);
    }
};
