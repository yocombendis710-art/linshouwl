const axios = require('axios');
const pool = require('../db');
const UPSTREAM_URL = 'https://2key.kckc1818.com/openapi.php';

// 动态获取当前激活的上游卡密
async function getActiveCdkey() {
    try {
        const [rows] = await pool.query('SELECT cdkey FROM upstream_cdkeys WHERE is_active = 1 LIMIT 1');
        if (rows.length > 0) return rows[0].cdkey;
    } catch (e) { console.error("获取上游卡密异常", e); }
    return process.env.UPSTREAM_MASTER_CDKEY; // 数据库没有时，回退到 env 配置
}

exports.submitTask = async (email, password, twofa, task_type = 'full') => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { action: 'submit_task', cdkey, email, password, twofa, task_type });
        return response.data;
    } catch (error) { return { success: false, message: '上游通信异常' }; }
};

exports.getStatus = async (upstream_task_id) => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { action: 'get_status', cdkey, task_id: upstream_task_id });
        return response.data;
    } catch (error) { return { success: false, message: '状态查询失败' }; }
};

exports.rerunTask = async (upstream_task_id) => {
    try {
        const cdkey = await getActiveCdkey();
        const params = new URLSearchParams();
        params.append('id', upstream_task_id);
        const response = await axios.post('https://2key.kckc1818.com/api.php?action=rerun', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': `cdkey=${cdkey}` }
        });
        return response.data;
    } catch (error) { return { success: false, message: '重试请求异常' }; }
};

// 新增：查询上游卡密余额
exports.getBalance = async () => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { action: 'get_balance', cdkey });
        return response.data;
    } catch (error) { return { success: false, message: '余额查询异常' }; }
};