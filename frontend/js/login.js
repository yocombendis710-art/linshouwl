async function doLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_role', data.role);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.innerText = data.message || '登录失败';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        errorMsg.innerText = '网络连接异常';
        errorMsg.style.display = 'block';
    }
}