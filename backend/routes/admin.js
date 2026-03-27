const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken, requireSuperAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const upstreamAPI = require('../services/upstreamAPI');

router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ success: false, message: '账号或密码错误' });
        const admin = rows[0]; 
        if (!admin.is_active) return res.status(403).json({ success: false, message: '账号已被禁用' });
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ success: false, message: '账号或密码错误' });
        const token = jwt.sign({ id: admin.id, role_level: admin.role_level }, process.env.JWT_SECRET, { expiresIn: '12h' });
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await pool.query('UPDATE admins SET last_login_ip = ? WHERE id = ?', [ip, admin.id]);
        res.json({ success: true, token, role: admin.role_level });
    } catch (error) { res.status(500).json({ success: false, message: '内部错误' }); }
});

router.get('/tasks', verifyToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    try {
        const [activeTasks] = await pool.query("SELECT id, upstream_task_id FROM import_tasks WHERE status IN ('Pending', 'Running') AND upstream_task_id IS NOT NULL AND upstream_task_id != 'unknown'");
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

        const [stats] = await pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('Pending', 'Running') THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed FROM import_tasks`);
        const [tasks] = await pool.query(`
            SELECT t.id, t.upstream_task_id as task_id, t.email, t.status, t.upstream_message as message, 
                   DATE_FORMAT(t.updated_at, '%Y-%m-%d %H:%i:%s') as completed_at, t.client_ip, c.cdkey, t.offer_url
            FROM import_tasks t JOIN local_cdkeys c ON t.local_cdkey_id = c.id
            ORDER BY t.created_at DESC LIMIT ? OFFSET ?
        `, [limit, offset]);
        res.json({ success: true, stats: stats[0], accounts: tasks });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/cdkeys', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM local_cdkeys ORDER BY created_at DESC');
    res.json(rows);
});

router.post('/cdkeys', verifyToken, async (req, res) => {
    const { cdkey, max_usages, count } = req.body;
    try {
        const generateCount = parseInt(count) || 1;
        let generatedKeys = [];
        
        if (generateCount > 1 || !cdkey) {
            for (let i = 0; i < generateCount; i++) {
                const randomKey = 'K-' + Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
                await pool.query('INSERT INTO local_cdkeys (cdkey, max_usages, created_by) VALUES (?, ?, ?)', [randomKey, max_usages, req.admin.id]);
                generatedKeys.push(randomKey);
            }
            res.json({ success: true, message: `成功生成 ${generateCount} 张卡密`, keys: generatedKeys });
        } else {
            await pool.query('INSERT INTO local_cdkeys (cdkey, max_usages, created_by) VALUES (?, ?, ?)', [cdkey, max_usages, req.admin.id]);
            generatedKeys.push(cdkey);
            res.json({ success: true, message: '卡密生成成功', keys: generatedKeys });
        }
    } catch (err) { res.status(400).json({ success: false, message: '卡密生成失败（可能重复）' }); }
});

router.delete('/cdkeys/:id', verifyToken, async (req, res) => {
    await pool.query('DELETE FROM local_cdkeys WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

router.post('/cdkeys/:id/add_quota', verifyToken, async (req, res) => {
    const { amount } = req.body;
    await pool.query('UPDATE local_cdkeys SET max_usages = max_usages + ? WHERE id = ?', [parseInt(amount), req.params.id]);
    res.json({ success: true, message: `成功增加 ${amount} 额度` });
});

router.post('/cdkeys/batch_delete', verifyToken, async (req, res) => {
    const { remaining } = req.body;
    if (remaining === undefined) return res.status(400).json({ success: false, message: '缺少参数' });
    try {
        const [result] = await pool.query('DELETE FROM local_cdkeys WHERE (max_usages - current_usages) = ?', [parseInt(remaining)]);
        res.json({ success: true, message: `已成功吊销 ${result.affectedRows} 张卡密` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/upstream', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM upstream_cdkeys ORDER BY id DESC');
    res.json({ success: true, data: rows });
});
router.get('/upstream/balance', verifyToken, async (req, res) => {
    const data = await upstreamAPI.getBalance();
    res.json(data);
});
router.post('/upstream', verifyToken, async (req, res) => {
    const { cdkey } = req.body;
    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM upstream_cdkeys');
    const isActive = rows[0].cnt === 0 ? 1 : 0; 
    try {
        await pool.query('INSERT INTO upstream_cdkeys (cdkey, is_active) VALUES (?, ?)', [cdkey, isActive]);
        res.json({ success: true, message: '上游卡密添加成功' });
    } catch(e) { res.json({ success: false, message: '卡密可能已存在' }); }
});
router.put('/upstream/:id/active', verifyToken, async (req, res) => {
    await pool.query('UPDATE upstream_cdkeys SET is_active = 0');
    await pool.query('UPDATE upstream_cdkeys SET is_active = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '已切换为当前激活卡密' });
});
router.delete('/upstream/:id', verifyToken, async (req, res) => {
    await pool.query('DELETE FROM upstream_cdkeys WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '已删除上游卡密' });
});

router.get('/announcements', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
});
router.post('/announcements', verifyToken, async (req, res) => {
    const { type, title, content } = req.body;
    try {
        await pool.query('INSERT INTO announcements (type, title, content) VALUES (?, ?, ?)', [type, title, content]);
        res.json({ success: true, message: '公告发布成功' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/announcements/:id', verifyToken, async (req, res) => {
    const { type, title, content } = req.body;
    try {
        await pool.query('UPDATE announcements SET type = ?, title = ?, content = ? WHERE id = ?', [type, title, content, req.params.id]);
        res.json({ success: true, message: '公告修改成功' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/announcements/:id', verifyToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '公告已删除' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/employees', verifyToken, requireSuperAdmin, async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO admins (username, password_hash, role_level) VALUES (?, ?, 1)', [username, hash]);
        res.json({ success: true, message: '员工添加成功' });
    } catch (err) { res.status(400).json({ success: false, message: '账号已存在' }); }
});

router.post('/rerun', verifyToken, async (req, res) => {
    const { id } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT * FROM import_tasks WHERE id = ? FOR UPDATE', [id]);
        if (rows.length === 0) throw new Error('任务不存在');
        const task = rows[0];

        if (task.status !== 'Failed') throw new Error('只能重试失败的任务');
        
        const upRes = await upstreamAPI.rerunTask(task.upstream_task_id);

        if (upRes.success) {
            await connection.query('UPDATE import_tasks SET status = ?, upstream_message = ?, updated_at = NOW() WHERE id = ?', ['Running', '管理员强制重试中...', task.id]);
            await connection.commit();
            res.json({ success: true, message: '强制重试指令已发送' });
        } else {
            await connection.commit();
            res.json({ success: false, message: upRes.message || '上游强制重试失败' });
        }
    } catch (error) { await connection.rollback(); res.status(500).json({ success: false, message: error.message }); } finally { connection.release(); }
});

module.exports = router;