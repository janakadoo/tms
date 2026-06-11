const fs = require('fs');
const path = require('path');

const files = [
    'js/utils.js',
    'js/store.js',
    'js/modules/vehicles.js',
    'js/modules/drivers.js',
    'js/modules/trips.js',
    'js/modules/fuel.js',
    'js/modules/expenses.js',
    'js/modules/reports.js',
    'js/modules/maintenance.js',
    'js/modules/tracking.js',
    'js/modules/settings.js',
    'js/app.js'
];

const outputFile = 'js/bundle.js';

let bundleContent = `/* BUNDLED JS - Generated at ${new Date().toISOString()} */

// Global Error Handler
window.onerror = function(msg, url, line, col, error) {
    console.error('Global Error:', msg, 'Line:', line, error);
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = '#ef4444';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '1rem';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerText = 'Error: ' + msg + ' (Line: ' + line + ')';
    document.body.appendChild(errorDiv);
    return false;
};
\n`;

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove import statements
        content = content.replace(/import .* from .*/g, '');

        // Remove export keywords (export const -> const, export default -> )
        content = content.replace(/export const/g, 'const');
        content = content.replace(/export default/g, '');

        bundleContent += `\n/* --- SOURCE: ${file} --- */\n`;
        bundleContent += content + '\n';
    } else {
        console.error(`File not found: ${file}`);
    }
});

fs.writeFileSync(path.join(__dirname, outputFile), bundleContent);
console.log(`Bundle created at ${outputFile}`);
