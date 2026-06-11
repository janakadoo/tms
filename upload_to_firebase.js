// Script to upload existing database.sqlite to Firebase Realtime Database
const fs = require('fs');
const path = require('path');

// Firebase config
const PROJECT_ID = 'ja-transport-managemnt-system';
const DB_URL = 'https://ja-transport-managemnt-system-default-rtdb.asia-southeast1.firebasedatabase.app';
const FB_PATH = 'tms_database/db_data';
const API_KEY = 'AIzaSyAAPXz79A3M142K-MgArp-JK4BBFzpCVK0';

const http = require('https');

// Read the sqlite file
const dbPath = path.join(__dirname, 'database.sqlite');
const data = fs.readFileSync(dbPath);
const b64 = data.toString('base64');
console.log(`DB size: ${data.length} bytes → base64: ${b64.length} chars`);

// PUT to Firebase REST API
const body = JSON.stringify(b64);
const url = `${DB_URL}/${FB_PATH}.json?key=${API_KEY}`;

const urlParsed = new URL(url);
const options = {
    hostname: urlParsed.hostname,
    path: urlParsed.pathname + urlParsed.search,
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
};

console.log('Uploading to Firebase...');
const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Database successfully uploaded to Firebase!');
            console.log('Firebase responded:', responseData.slice(0, 80) + '...');
        } else {
            console.error('❌ Upload failed. Status:', res.statusCode);
            console.error('Response:', responseData);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.write(body);
req.end();
