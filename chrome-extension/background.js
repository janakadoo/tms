// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autoLogin') {
        console.log('VMS Ext: Received login request', request.id);

        // 1. Store credentials securely in local storage
        chrome.storage.local.set({
            'pending_login': {
                id: request.id,
                password: request.password,
                timestamp: Date.now()
            }
        }, () => {
            // 2. Open the tracking site
            chrome.tabs.create({
                url: 'https://en.aika168.com/'
            });
        });

        sendResponse({ success: true });
    }
    return true; // Keep channel open
});

function performAutoLogin(trackingId, trackingPassword) {
    console.log('VMS Extension: Starting auto-login...');

    setTimeout(() => {
        // Step 1: Click ID No tab
        const idTab = document.querySelector('a[href*="ID"]');
        if (idTab) {
            console.log('VMS Extension: Clicking ID tab');
            idTab.click();
        }

        setTimeout(() => {
            // Step 2: Fill credentials
            const idField = document.querySelector('input[name*="txtLoginName"], input[id*="txtLoginName"]');
            const pwdField = document.querySelector('input[name*="txtPassword"], input[type="password"]');

            if (idField && pwdField) {
                console.log('VMS Extension: Filling credentials');
                idField.value = trackingId;
                pwdField.value = trackingPassword;

                // Trigger events
                idField.dispatchEvent(new Event('input', { bubbles: true }));
                idField.dispatchEvent(new Event('change', { bubbles: true }));
                pwdField.dispatchEvent(new Event('input', { bubbles: true }));
                pwdField.dispatchEvent(new Event('change', { bubbles: true }));

                setTimeout(() => {
                    // Step 3: Click login button
                    const btn = document.querySelector('input[type="submit"], button[type="submit"], .btnLogin, #btnLogin');
                    if (btn) {
                        console.log('VMS Extension: Clicking login button');
                        btn.click();
                    }
                }, 300);
            }
        }, 800);
    }, 1000);
}
