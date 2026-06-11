const http = require('http');
const req = http.request('http://localhost:8080/', { method: 'GET' }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Has Firebase script:', d.includes('firebase-app-compat'));
        console.log('Has sql-wasm:', d.includes('sql-wasm'));
        console.log('Has module script:', d.includes('type="module"'));
    });
});
req.end();
