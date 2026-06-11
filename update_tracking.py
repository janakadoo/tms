import re

# Read the file
with open(r'e:\my\ANTYGRAVITY\js\modules\tracking.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new launchTracking function
new_function = '''    launchTracking: () => {
        const vehicles = Store.Vehicles.getAll().filter(v => v.trackingId);
        const selectedVehicle = vehicles.find(v => v.id === TrackingModule.state.selectedVehicleId);

        if (!selectedVehicle) {
            alert('Please select a vehicle first');
            return;
        }

        // 1. Copy ID to clipboard immediately
        navigator.clipboard.writeText(selectedVehicle.trackingId).then(() => {
            TrackingModule.showToast('🆔 ID Copied! Select "ID No" tab & Paste', '#10b981', 4000);
        }).catch(() => console.log('Clipboard failed'));

        // 2. Aggressive auto-login script (will be blocked by CORS but we try)
        const script = `(function() { try { const id='${selectedVehicle.trackingId}'; const pwd='${selectedVehicle.trackingPassword}'; const tabs=document.querySelectorAll('a,div,span'); for(let t of tabs) if(t.innerText&&t.innerText.toUpperCase().includes('ID NO')) {t.click();break;} setTimeout(()=>{const inputs=document.querySelectorAll('input'); for(let i of inputs){if(i.name&&(i.name.toLowerCase().includes('imei')||i.name.toLowerCase().includes('user')))i.value=id; if(i.type=='password')i.value=pwd;} const btns=document.querySelectorAll('input[type=submit],button'); for(let b of btns) if(b.value&&b.value.toLowerCase().includes('go'))b.click();},800);} catch(e){} })();`;

        const width = Math.min(1400, screen.width - 100);
        const height = screen.height - 100;
        const win = window.open('https://en.aika168.com/', 'VMS_Tracking_' + selectedVehicle.id, `width=${width},height=${height},left=${(screen.width-width)/2},top=20,resizable=yes`);

        // Try inject (will be blocked by CORS)
        if (win) setTimeout(() => { try { const s=win.document.createElement('script'); s.textContent=script; win.document.body.appendChild(s); } catch(e){} }, 1000);
    },'''

# Find and replace the launchTracking function
pattern = r'    launchTracking: \(\) => \{[^}]*(?:\{[^}]*\}[^}]*)*\},'
content = re.sub(pattern, new_function, content, count=1, flags=re.DOTALL)

# Write back
with open(r'e:\my\ANTYGRAVITY\js\modules\tracking.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated successfully!")
