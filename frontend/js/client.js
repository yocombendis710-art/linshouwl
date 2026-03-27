async function submitTask() {
    const btn = document.getElementById('submitBtn');
    const msg = document.getElementById('msg');
    const data = {
        local_cdkey: document.getElementById('cdkey').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        twofa: document.getElementById('twofa').value
    };

    if(!data.local_cdkey ||!data.email ||!data.password) {
        msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.innerText = '请填写完整信息'; return;
    }

    btn.disabled = true; btn.innerText = '提交中...';
    try {
        const res = await fetch('/api/client/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        msg.style.display = 'block';
        msg.style.color = result.success? '#10b981' : '#ef4444';
        msg.innerText = result.message;
    } catch (error) {
        msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.innerText = '网络异常，请稍后再试';
    } finally {
        btn.disabled = false; btn.innerText = '提交运行';
    }
}