const express = require('express');
const router = express.Router();
const pool = require('../db');
const upstreamAPI = require('../services/upstreamAPI');
const { apiLimiter } = require('../middleware/rateLimiter');

const verifyClientCdkey = async (req, res, next) => {
    const cdkey = req.headers['x-cdkey'];
    if (!cdkey) return res.status(401).json({ success: false, message: '未提供卡密，请先登录' });
    const [rows] = await pool.query('SELECT * FROM local_cdkeys WHERE cdkey = ?', [cdkey]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: '卡密无效或已被删除' });
    req.cdkeyData = rows[0];
    next();
};

router.post('/login', apiLimiter, async (req, res) => {
    const { cdkey } = req.body;
    const [rows] = await pool.query('SELECT * FROM local_cdkeys WHERE cdkey = ?', [cdkey]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: '无效的授权卡密' });
    res.json({ success: true, message: '登录成功' });
});

router.get('/announcements', verifyClientCdkey, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
});

router.get('/dashboard', verifyClientCdkey, async (req, res) => {
    const cdkeyId = req.cdkeyData.id;
    try {
        const [activeTasks] = await pool.query(
            "SELECT id, upstream_task_id FROM import_tasks WHERE local_cdkey_id = ? AND status IN ('Pending', 'Running') AND upstream_task_id IS NOT NULL AND upstream_task_id != 'unknown'",
            [cdkeyId]
        );
        if (activeTasks.length > 0) {
            const updatePromises = activeTasks.map(async (task) => {
                try {
                    const upRes = await upstreamAPI.getStatus(task.upstream_task_id);
                    if (upRes.success && upRes.data) {
                        await pool.query(
                            'UPDATE import_tasks SET status = ?, upstream_message = ?, updated_at = NOW(), offer_url = ?, has_offer_url = ? WHERE id = ?',
                            [upRes.data.status, upRes.data.message || '无详情', upRes.data.offer_url || '', upRes.data.has_offer_url ? 1 : 0, task.id]
                        );
                    }
                } catch (e) { }
            });
            await Promise.all(updatePromises);
        }

        const [stats] = await pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('Pending', 'Running') THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed FROM import_tasks WHERE local_cdkey_id = ?`, [cdkeyId]);
        const [tasks] = await pool.query(`SELECT id, upstream_task_id as task_id, email, status, upstream_message as message, task_type, offer_url, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM import_tasks WHERE local_cdkey_id = ? ORDER BY created_at DESC LIMIT 50`, [cdkeyId]);

        res.json({ success: true, balance: req.cdkeyData.max_usages - req.cdkeyData.current_usages, max_usages: req.cdkeyData.max_usages, stats: stats[0], tasks: tasks });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/submit_batch', verifyClientCdkey, apiLimiter, async (req, res) => {
    const { tasks, task_type = 'full' } = req.body;
    const keyData = req.cdkeyData;
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!tasks || tasks.length === 0) return res.status(400).json({ success: false, message: '提交为空' });
    if (keyData.current_usages + tasks.length > keyData.max_usages) return res.status(400).json({ success: false, message: `余额不足！剩余 ${keyData.max_usages - keyData.current_usages} 次` });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE local_cdkeys SET current_usages = current_usages + ?, last_used_ip = ? WHERE id = ?', [tasks.length, clientIp, keyData.id]);

        let insertedTasks = [];
        for (const t of tasks) {
            const encPwd = Buffer.from(t.pwd).toString('base64');
            const [taskRes] = await connection.query(
                `INSERT INTO import_tasks (local_cdkey_id, email, password_encrypted, twofa_secret, client_ip, task_type) VALUES (?,?,?,?,?,?)`,
                [keyData.id, t.email, encPwd, t.twofa, clientIp, task_type]
            );
            insertedTasks.push({ localTaskId: taskRes.insertId, email: t.email, pwd: t.pwd, twofa: t.twofa });
        }
        await connection.commit();
        res.json({ success: true, message: `成功排队 ${tasks.length} 个任务` });

        insertedTasks.forEach(async (t) => {
            const upRes = await upstreamAPI.submitTask(t.email, t.pwd, t.twofa, task_type);
            if (upRes.success) {
                const upstreamTaskId = upRes.task_id || (upRes.data && upRes.data.task_id) || 'unknown';
                await pool.query('UPDATE import_tasks SET upstream_task_id = ?, status = ? WHERE id = ?', [upstreamTaskId, 'Running', t.localTaskId]);
            } else {
                await pool.query('UPDATE local_cdkeys SET current_usages = current_usages - 1 WHERE id = ?', [keyData.id]);
                const errMsg = upRes.message || (upRes.data && upRes.data.message) || '上游拒绝接单';
                await pool.query('UPDATE import_tasks SET status = ?, upstream_message = ? WHERE id = ?', ['Failed', errMsg, t.localTaskId]);
            }
        });
    } catch (error) { await connection.rollback(); res.status(500).json({ success: false, message: error.message }); } finally { connection.release(); }
});

router.post('/rerun', verifyClientCdkey, apiLimiter, async (req, res) => {
    const { id } = req.body; 
    const keyData = req.cdkeyData;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT * FROM import_tasks WHERE id = ? AND local_cdkey_id = ? FOR UPDATE', [id, keyData.id]);
        if (rows.length === 0) throw new Error('任务不存在或无权操作');
        const task = rows[0];

        if (task.status !== 'Failed') throw new Error('只能重试失败或异常的任务');

        const upRes = await upstreamAPI.rerunTask(task.upstream_task_id);

        if (upRes.success) {
            await connection.query('UPDATE import_tasks SET status = ?, upstream_message = ?, updated_at = NOW() WHERE id = ?', ['Running', '重试排队中...', task.id]);
            await connection.commit();
            res.json({ success: true, message: '重试请求已发送' });
        } else {
            await connection.commit();
            res.json({ success: false, message: upRes.message || '上游重试失败' });
        }
    } catch (error) { await connection.rollback(); res.status(500).json({ success: false, message: error.message }); } finally { connection.release(); }
});

router.post('/tasks/clear', verifyClientCdkey, async (req, res) => {
    const { status } = req.body;
    if (!['Success', 'Failed'].includes(status)) return res.status(400).json({ success: false, message: '参数错误' });
    try {
        const statusQuery = status === 'Failed' ? "IN ('Failed', 'Stopped')" : "= 'Success'";
        await pool.query(`DELETE FROM import_tasks WHERE local_cdkey_id = ? AND status ${statusQuery}`, [req.cdkeyData.id]);
        res.json({ success: true, message: '数据已彻底删除不可恢复' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/tasks/export', verifyClientCdkey, async (req, res) => {
    const { status, type, limit } = req.query;
    const statusQuery = status === 'Failed' ? "IN ('Failed', 'Stopped')" : "= 'Success'";
    const limitQuery = (limit && limit !== 'all') ? `LIMIT ${parseInt(limit)}` : '';
    
    try {
        const [rows] = await pool.query(`SELECT * FROM import_tasks WHERE local_cdkey_id = ? AND status ${statusQuery} ORDER BY updated_at DESC ${limitQuery}`, [req.cdkeyData.id]);
        if (rows.length === 0) return res.json({ success: false, message: '没有可导出的数据' });

        let contentArray = [];
        rows.forEach(r => {
            const pwd = r.password_encrypted ? Buffer.from(r.password_encrypted, 'base64').toString('utf8') : '';
            if (status === 'Success') {
                if (type === 'extract') {
                    contentArray.push(`${r.email}----${r.offer_url || '无链接'}`);
                } else {
                    contentArray.push(`${r.email}----${pwd}----${r.twofa_secret}`);
                }
            } else {
                contentArray.push(`${r.email}----${pwd}----${r.twofa_secret}----${r.upstream_message}`);
            }
        });

        const b64Data = Buffer.from(contentArray.join('\n')).toString('base64');
        res.json({ success: true, data: b64Data, total: rows.length });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

setInterval(async () => {
    try {
        await pool.query("DELETE FROM import_tasks WHERE status IN ('Success', 'Failed', 'Stopped') AND updated_at < DATE_SUB(NOW(), INTERVAL 3 DAY)");
    } catch (e) { console.error("底层自动清理任务异常:", e); }
}, 1000 * 60 * 60);

module.exports = router;