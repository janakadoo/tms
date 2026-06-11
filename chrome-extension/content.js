console.log('VMS Extension: Content script loaded on', window.location.href);

// Check URL for credentials (try both current window and top window)
let urlParams = new URLSearchParams(window.location.search);
let vmsId = urlParams.get('vms_id');
let vmsPwd = urlParams.get('vms_pwd');

// If not found in current window, check top window (for iframe scenario)
if ((!vmsId || !vmsPwd) && window.top !== window) {
    try {
        urlParams = new URLSearchParams(window.top.location.search);
        vmsId = urlParams.get('vms_id');
        vmsPwd = urlParams.get('vms_pwd');
        console.log('VMS Extension: Checking top window for credentials...');
    } catch (e) {
        // Cross-origin security - can't access
    }
}

if (vmsId && vmsPwd) {
    console.log('VMS Extension: Credentials found, starting login...');
    showStatus('VMS: Credentials Detected!', 'blue');

    // Wait for page to fully load
    setTimeout(() => {
        performLogin(vmsId, vmsPwd);
    }, 1500);
}

function performLogin(id, pwd) {
    let attempts = 0;
    const maxAttempts = 60;
    let tabClicked = false;

    const interval = setInterval(() => {
        attempts++;

        // Determine the document to work with
        const targetDoc = getTargetDocument();

        if (!targetDoc) {
            console.log('VMS: No accessible document found');
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                showStatus('VMS: Cannot access page - Please login manually', 'red');
            }
            return;
        }

        // STEP 1: Find and click "ID No" tab (try multiple strategies)
        if (!tabClicked) {
            const idTab = findIdTab(targetDoc);

            if (idTab) {
                console.log('VMS: Found ID No tab, clicking...');
                showStatus('VMS: Clicking "ID No" tab...', 'orange');

                // Try multiple click methods
                idTab.click();

                // Trigger mouse events as backup
                try {
                    idTab.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
                    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
                    idTab.dispatchEvent(mouseDownEvent);
                    idTab.dispatchEvent(mouseUpEvent);
                } catch (e) { }

                tabClicked = true;
                console.log('VMS: Tab clicked successfully');
                return; // Wait for next iteration to fill fields
            }
        }

        // STEP 2: Check if input fields are visible after tab click
        const idInput = targetDoc.querySelector('input[name="txtImeiNo"], input[id="txtImeiNo"]');
        const pwdInput = targetDoc.querySelector('input[name="txtImeiPassword"], input[id="txtImeiPassword"]');

        if (idInput && pwdInput && idInput.offsetParent !== null) {
            console.log('VMS: Found input fields');
            showStatus('VMS: Filling credentials...', 'green');

            // Fill ID field
            if (idInput.value !== id) {
                fillField(idInput, id);
                console.log('VMS: ID filled');
            }

            // Fill password field
            if (pwdInput.value !== pwd) {
                fillField(pwdInput, pwd);
                console.log('VMS: Password filled');
            }

            // STEP 3: Click GO button
            const goBtn = targetDoc.querySelector('#btnLoginImei, input[name="btnLoginImei"]');

            if (idInput.value === id && pwdInput.value === pwd && goBtn) {
                console.log('VMS: Both fields filled, clicking GO button');
                showStatus('VMS: Logging in! 🚀', '#10b981');

                clearInterval(interval);

                setTimeout(() => {
                    goBtn.click();
                    console.log('VMS: Login submitted!');
                }, 500);
            }
        } else if (tabClicked && attempts > 10) {
            // If tab was clicked but fields still not visible after 10 attempts
            console.log('VMS: Fields not visible yet, attempt', attempts);
        }

        if (attempts >= maxAttempts) {
            clearInterval(interval);
            showStatus('VMS: Timeout - Check if fields are visible', 'red');
            console.log('VMS: Reached max attempts');
        }

    }, 400);
}

function getTargetDocument() {
    // If we're in an iframe, use current document
    if (window.top !== window) {
        return document;
    }

    // If we're in top frame, try to access iframe
    const iframe = document.querySelector('iframe');
    if (iframe) {
        try {
            return iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) {
            console.log('VMS: Cannot access iframe (cross-origin)');
        }
    }

    // Fallback to current document
    return document;
}

function findIdTab(doc) {
    // Strategy 1: Look for exact text matches
    const elements = doc.querySelectorAll('a, span, div, li, td, button');
    for (const el of elements) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text === 'ID No.' || text === 'ID No' || text === 'IMEI' || text.toUpperCase() === 'ID NO') {
            console.log('VMS: Found tab by text:', text);
            return el;
        }
    }

    // Strategy 2: Look for links with href containing specific patterns
    const links = doc.querySelectorAll('a[href]');
    for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = (link.innerText || '').trim();
        if (href.includes('ID') || text.includes('ID No')) {
            console.log('VMS: Found tab by href/text:', text);
            return link;
        }
    }

    // Strategy 3: Look for clickable elements near IMEI input
    const idInput = doc.querySelector('#txtImeiNo');
    if (idInput) {
        const parent = idInput.closest('div, table, form');
        if (parent) {
            const nearbyLinks = parent.querySelectorAll('a, span[onclick], div[onclick]');
            for (const el of nearbyLinks) {
                const text = (el.innerText || '').trim();
                if (text.includes('ID') || text.includes('IMEI')) {
                    console.log('VMS: Found tab near input:', text);
                    return el;
                }
            }
        }
    }

    return null;
}

function fillField(el, value) {
    el.focus();
    el.value = value;

    // Trigger all possible events
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));

    el.blur();
}

function showStatus(msg, color) {
    // Try to show in top window if possible
    let targetDoc;
    try {
        targetDoc = window.top.document;
    } catch (e) {
        targetDoc = document;
    }

    let el = targetDoc.getElementById('vms-status');
    if (!el) {
        el = targetDoc.createElement('div');
        el.id = 'vms-status';
        el.style.cssText = 'position:fixed; top:10px; right:10px; padding:12px 24px; color:white; border-radius:8px; z-index:999999; font-family:Arial, sans-serif; font-weight:bold; font-size:15px; box-shadow:0 6px 16px rgba(0,0,0,0.4); pointer-events:none; transition: all 0.3s;';
        targetDoc.body.appendChild(el);
    }
    el.style.backgroundColor = color === 'blue' ? '#3b82f6' :
        color === 'green' ? '#10b981' :
            color === 'orange' ? '#f59e0b' :
                color === 'red' ? '#ef4444' : color;
    el.textContent = msg;

    // Auto-hide after 8 seconds for non-error messages
    if (color !== 'red') {
        setTimeout(() => {
            if (el && el.parentNode) {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 300);
            }
        }, 8000);
    }
}
