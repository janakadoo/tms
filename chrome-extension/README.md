# VMS Auto-Login Chrome Extension

## Installation Instructions

### Step 1: Enable Developer Mode
1. Open Chrome/Edge browser
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Toggle **"Developer mode"** ON (top right corner)

### Step 2: Load Extension
1. Click **"Load unpacked"** button
2. Navigate to: `e:\my\ANTYGRAVITY\chrome-extension`
3. Click **"Select Folder"**
4. Extension will appear in your extensions list

### Step 3: Pin Extension (Optional)
1. Click the puzzle icon in Chrome toolbar
2. Find "VMS Auto-Login"
3. Click the pin icon to keep it visible

## How to Use

### From VMS:
1. Go to your VMS Tracking page
2. Select a vehicle
3. Click **"Launch Tracking System"**
4. Extension will automatically:
   - Open tracking website
   - Click "ID No" tab
   - Fill tracking ID
   - Fill password
   - Click GO button
   - **You're logged in!** ✅

### Direct Use:
The extension also works if you manually visit `en.aika168.com` - it will detect pending logins from VMS.

## Troubleshooting

**Extension not working?**
- Make sure Developer Mode is ON
- Check that extension is enabled (toggle should be blue)
- Open browser console (F12) to see extension logs

**Still having issues?**
- Reload the extension: Go to `chrome://extensions/`, find VMS Auto-Login, click reload icon
- Check browser console for error messages

## Technical Details
- **Permissions**: Storage, ActiveTab, Scripting
- **Host Permissions**: en.aika168.com, local files
- **Auto-login delay**: 1 second (adjustable in background.js)
