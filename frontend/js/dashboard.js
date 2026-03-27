function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, match => 
        ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[match]
    );
}

const API_BASE = '/api/admin';
const token = localStorage.getItem('admin_token');
const role = parseInt(localStorage.getItem('admin_role'));

if (!token) window.location.href = 'login.html';

if(role === 0) {
    document.getElementById('employee-panel').style.display = 'block';
}

async function fetchWithAuth(url, options = {}) {
    const res = await fetch(url, {
      ...options,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) handleLogout();
    return res;
}

async function fetchTasks() {
    const res = await fetchWithAuth(`${API_BASE}/tasks`);
    const data = await res.json();
    if(data.success) {
        const tbody = document.getElementById('task-tbody');
        tbody.innerHTML = data.accounts.map(t => `
            <tr>
                <td><span class="badge">${escapeHTML(t.cdkey)}</span></td>
                <td>${escapeHTML(t.email)}</td>
                <td style="font-family:monospace;">${escapeHTML(t.client_ip)}</td>
                <td>${t.status === 'Failed'? '🔴 失败' : '🟢 成功'}</td>
                <td><span class="${t.status === 'Failed'? 'badge badge-err' : ''}">${escapeHTML(t.message || 'N/A')}</span></td>
                <td style="font-size: 0.8rem; color: #94a3b8;">${escapeHTML(t.completed_at)}</td>
            </tr>
        `).join('');
    }
}

async function fetchCdkeys() {
    const res = await fetchWithAuth(`${API_BASE}/cdkeys`);
    const keys = await res.json();
    const tbody = document.getElementById('cdkey-tbody');
    tbody.innerHTML = keys.map(k => `
        <tr>
            <td style="font-family:monospace; color:#f8b500;">${escapeHTML(k.cdkey)}</td>
            <td>${k.max_usages}</td>
            <td>${k.current_usages}</td>
            <td>${escapeHTML(k.last_used_ip || '-')}</td>
            <td><button class="danger" onclick="deleteCdkey('${k.id}')">吊销</button></td>
        </tr>
    `).join('');
}

async function addCdkey() {
    const cdkey = document.getElementById('new-cdkey').value;
    const max_usages = document.getElementById('new-usage').value;
    if(!cdkey ||!max_usages) return alert('参数不全');
    await fetchWithAuth(`${API_BASE}/cdkeys`, { method: 'POST', body: JSON.stringify({ cdkey, max_usages }) });
    fetchCdkeys();
}

async function deleteCdkey(id) {
    if(confirm('确定要吊销此卡密吗？对应的用户将无法再导入！')) {
        await fetchWithAuth(`${API_BASE}/cdkeys/${id}`, { method: 'DELETE' });
        fetchCdkeys();
    }
}

async function addEmployee() {
    const username = document.getElementById('emp-username').value;
    const password = document.getElementById('emp-pwd').value;
    const res = await fetchWithAuth(`${API_BASE}/employees`, { method: 'POST', body: JSON.stringify({ username, password }) });
    const data = await res.json();
    alert(data.message);
}

function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    window.location.href = 'login.html';
}

fetchCdkeys();
fetchTasks();