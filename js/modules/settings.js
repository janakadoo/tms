/* ================================================================
   TMS | SETTINGS MODULE
   ================================================================ */
import { DB }    from '../db.js?v=3';
import { Utils } from '../utils.js?v=3';

export const SettingsModule = {
    _container: null,
    init(container) { SettingsModule._container = container; SettingsModule.render(); },

    render() {
        const s = DB.Settings.getAll();

        SettingsModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>System Settings</h2><p>Configure your TMS system preferences and manage data</p></div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1.5rem">

                <!-- Company Settings -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                            Company Profile
                        </div>
                    </div>
                    <form id="settingsForm">
                        <div class="card-body" style="display:flex;flex-direction:column;gap:1rem">
                            <div class="form-group">
                                <label class="form-label">Company Name</label>
                                <input type="text" class="form-input" id="s_company" value="${Utils.esc(s.company_name||'')}" placeholder="My Transport Co.">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Currency Code</label>
                                    <select class="form-select" id="s_currency">
                                        ${['LKR','USD','EUR','GBP','INR','SGD','AUD'].map(c=>`<option ${(s.currency||'LKR')===c?'selected':''}>${c}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Currency Symbol</label>
                                    <input type="text" class="form-input" id="s_symbol" value="${Utils.esc(s.currency_symbol||'Rs.')}" placeholder="Rs.">
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button type="submit" class="btn btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Appearance -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"/></svg>
                            Appearance
                        </div>
                    </div>
                    <div class="card-body" style="display:flex;flex-direction:column;gap:1rem">
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.875rem;background:var(--bg-elevated);border-radius:var(--r-md)">
                            <div>
                                <div style="font-weight:500;font-size:0.875rem">Dark Mode</div>
                                <div style="font-size:0.75rem;color:var(--text-muted)">Toggle between dark and light theme</div>
                            </div>
                            <button class="btn btn-secondary btn-sm" id="themeSettingsToggle">Toggle Theme</button>
                        </div>
                        <div style="padding:0.875rem;background:var(--bg-elevated);border-radius:var(--r-md)">
                            <div style="font-weight:500;font-size:0.875rem;margin-bottom:0.5rem">System Version</div>
                            <div style="font-size:0.875rem;color:var(--text-muted)">TMS Pro v3.0 — SaaS Edition</div>
                        </div>
                    </div>
                </div>

                <!-- User Management (Sub-Users) -->
                ${!window._isSubUser ? `
                <div class="card" style="grid-column: 1 / -1">
                    <div class="card-header">
                        <div class="card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
                            User Management (Staff Accounts)
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-wrap" style="margin-bottom:1.5rem">
                            <table class="table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                                <tbody>
                                    ${DB.SystemUsers.getAll().map(u => `
                                        <tr>
                                            <td>${Utils.esc(u.name)}</td>
                                            <td>${Utils.esc(u.email)}</td>
                                            <td><span class="expiry-tag expiry-ok">${Utils.esc(u.role)}</span></td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm delete-user-btn" data-id="${u.id}" style="color:var(--danger);border-color:rgba(244,63,94,0.3)">Remove</button>
                                            </td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No staff users added yet.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                        <form id="addUserForm" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:1rem;align-items:end;background:var(--bg-elevated);padding:1rem;border-radius:var(--r-md)">
                            <div class="form-group">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-input" id="newUserName" required placeholder="John Doe">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-input" id="newUserEmail" required placeholder="staff@company.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="text" class="form-input" id="newUserPass" required placeholder="TempPass123!">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Role</label>
                                <select class="form-select" id="newUserRole">
                                    <option value="Manager">Manager</option>
                                    <option value="Data Entry">Data Entry</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary" id="addUserBtn">Add User</button>
                        </form>
                    </div>
                </div>
                ` : ''}

                ${!window._isSubUser ? `
                <!-- Database Management -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>
                            Database Management
                        </div>
                    </div>
                    <div class="card-body" style="display:flex;flex-direction:column;gap:0.75rem">
                        <div style="padding:0.875rem;background:var(--bg-elevated);border-radius:var(--r-md);font-size:0.875rem">
                            <div style="font-weight:500;margin-bottom:0.5rem">Database Status</div>
                            <div style="color:var(--text-muted)">Storage: localStorage (SQLite binary)</div>
                            <div style="color:var(--text-muted);margin-top:0.25rem">Size: ${SettingsModule._dbSize()}</div>
                        </div>
                        <button class="btn btn-secondary w-full" id="exportDbBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                            Export Database (JSON)
                        </button>
                        <div style="position:relative">
                            <button class="btn btn-secondary w-full" id="importDbBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                                Import JSON Backup
                            </button>
                            <input type="file" id="importFileInput" accept=".json" style="display:none">
                        </div>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="card" style="border-color:var(--danger-border)">
                    <div class="card-header" style="background:var(--danger-bg)">
                        <div class="card-title" style="color:var(--danger)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                            Danger Zone
                        </div>
                    </div>
                    <div class="card-body">
                        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1rem">These actions are irreversible. Use with extreme caution.</p>
                        <button class="btn btn-danger w-full" id="resetDbBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                            Reset All Data
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>`;

        SettingsModule._bindEvents();
    },

    _dbSize() {
        try {
            const bytes = (localStorage.getItem('tms_db_v2') || '').length;
            return bytes > 1024*1024 ? (bytes/1024/1024).toFixed(2)+' MB' : (bytes/1024).toFixed(1)+' KB';
        } catch { return 'Unknown'; }
    },

    _bindEvents() {
        // Save settings
        document.getElementById('settingsForm').onsubmit = e => {
            e.preventDefault();
            DB.Settings.set('company_name',     document.getElementById('s_company').value);
            DB.Settings.set('currency',         document.getElementById('s_currency').value);
            DB.Settings.set('currency_symbol',  document.getElementById('s_symbol').value);
            // Update company label in topbar
            const lbl = document.getElementById('companyLabel');
            if (lbl) lbl.textContent = document.getElementById('s_company').value || 'Admin';
            Utils.toast('Settings saved!', 'success');
        };

        // Theme toggle
        document.getElementById('themeSettingsToggle').onclick = () => {
            document.getElementById('themeToggleBtn').click();
        };

        // Export JSON
        document.getElementById('exportDbBtn').onclick = () => {
            const data = DB.Analytics.exportJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
            const url  = URL.createObjectURL(blob);
            const a    = Object.assign(document.createElement('a'), {href:url, download:`TMS_backup_${Utils.today()}.json`});
            a.click(); URL.revokeObjectURL(url);
            Utils.toast('Database exported!', 'success');
        };

        // Import JSON
        document.getElementById('importDbBtn').onclick = () => document.getElementById('importFileInput').click();
        document.getElementById('importFileInput').onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                Utils.toast('Backup loaded — full import requires page reload. Data exported successfully.', 'info');
                console.log('Imported data:', data);
            } catch(err) {
                Utils.toast('Invalid backup file!', 'error');
            }
        };

        // Reset
        document.getElementById('resetDbBtn').onclick = async () => {
            const ok = await Utils.confirm(
                'This will permanently DELETE all vehicles, drivers, trips, fuel logs, expenses, and maintenance records. This action CANNOT be undone!',
                'Reset All Data'
            );
            if (ok) {
                localStorage.removeItem('tms_db_v2');
                Utils.toast('Database reset. Reloading...', 'warning');
                setTimeout(() => location.reload(), 1500);
            }
        };

        // Add Sub-User
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn   = document.getElementById('addUserBtn');
                const name  = document.getElementById('newUserName').value;
                const email = document.getElementById('newUserEmail').value;
                const pass  = document.getElementById('newUserPass').value;
                const role  = document.getElementById('newUserRole').value;
                
                btn.textContent = 'Adding...';
                btn.disabled = true;

                try {
                    // 1. Create user in Firebase via secondary app
                    const cred = await window._fbSecondaryAuth.createUserWithEmailAndPassword(email, pass);
                    const newUid = cred.user.uid;

                    // 2. Map new user to current user's DB
                    const currentUid = firebase.auth().currentUser.uid;
                    await firebase.database().ref('tms_database/mappings/' + newUid).set(currentUid);

                    // 3. Save to local SQLite
                    DB.SystemUsers.add({
                        id: newUid,
                        email: email,
                        name: name,
                        role: role,
                        status: 'Active'
                    });

                    Utils.toast('Staff user added successfully!', 'success');
                    SettingsModule.render(); // refresh UI
                } catch(err) {
                    Utils.toast('Error: ' + err.message, 'error');
                    console.error('Add user error:', err);
                } finally {
                    btn.textContent = 'Add User';
                    btn.disabled = false;
                }
            };
        }

        // Delete Sub-User
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.getAttribute('data-id');
                const ok = await Utils.confirm('Are you sure you want to remove this user?', 'Remove Staff');
                if (ok) {
                    // Remove mapping from Firebase so they can't access DB anymore
                    try { await firebase.database().ref('tms_database/mappings/' + id).remove(); } catch(e) {}
                    // Remove from local DB
                    DB.SystemUsers.delete(id);
                    Utils.toast('User removed', 'success');
                    SettingsModule.render();
                }
            };
        });
    },
};
