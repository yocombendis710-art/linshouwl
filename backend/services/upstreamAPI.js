const axios = require('axios');
const pool = require('../db');

// 依据提供的 2Key API 开发者文档基准地址配置
const UPSTREAM_URL = 'https://2key.kckc1818.com/openapi.php';

// 动态获取系统中处于激活状态的主控端卡密
async function getActiveCdkey() {
    try {
        const [rows] = await pool.query('SELECT cdkey FROM upstream_cdkeys WHERE is_active = 1 LIMIT 1');
        if (rows.length > 0) return rows.cdkey;
    } catch (e) { 
        console.error("主控路由：尝试提取上游卡密时发生异常", e); 
    }
    // 降级回落到环境变量中的硬编码卡密
    return process.env.UPSTREAM_MASTER_CDKEY;
}

/**
 * 提交排队任务 (submit_task)
 * 支持普通提交流水线以及由于密码错误导致的"修改后重建流水线"
 */
exports.submitTask = async (email, password, twofa, task_type = 'full') => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { 
            action: 'submit_task', 
            cdkey: cdkey, 
            email: email, 
            password: password, 
            twofa: twofa, 
            task_type: task_type 
        }, {
            timeout: 15000 // 配置15秒超时防挂起
        });
        return response.data;
    } catch (error) { 
        return { success: false, message: '上游链路断裂，提交通信异常' }; 
    }
};

/**
 * 实时查询任务状态 (get_status)
 */
exports.getStatus = async (upstream_task_id) => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { 
            action: 'get_status', 
            cdkey: cdkey, 
            task_id: upstream_task_id 
        });
        return response.data;
    } catch (error) { 
        return { success: false, message: '云端控制台失联，状态获取失败' }; 
    }
};

/**
 * 请求原路强制重试任务
 * 注：基于历史遗留的旧 API 端点处理重试
 */
exports.rerunTask = async (upstream_task_id) => {
    try {
        const cdkey = await getActiveCdkey();
        const params = new URLSearchParams();
        params.append('id', upstream_task_id);
        const response = await axios.post('https://2key.kckc1818.com/api.php?action=rerun', params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Cookie': `cdkey=${cdkey}` 
            },
            timeout: 10000
        });
        return response.data;
    } catch (error) { 
        return { success: false, message: '重试调度指令发送遭遇网络阻断' }; 
    }
};

/**
 * 【新增】取消排队任务 (cancel_task)
 * 用于终止处于 Pending 状态的挂起任务
 */
exports.cancelTask = async (upstream_task_id) => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { 
            action: 'cancel_task', 
            cdkey: cdkey, 
            task_id: upstream_task_id 
        });
        return response.data;
    } catch (error) { 
        return { success: false, message: '下发拦截取消指令时通信受阻' }; 
    }
};

/**
 * 获取主控端点余额池统计 (get_balance)
 */
exports.getBalance = async () => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { 
            action: 'get_balance', 
            cdkey: cdkey 
        });
        return response.data;
    } catch (error) { 
        return { success: false, message: '获取底层代理节点配额查询异常' }; 
    }
};

/**
 * 获取已暂存的优惠链接 (purchase_failed_link)
 * 针对 Failed 状态但抓取到了隐藏资产的任务
 */
exports.purchaseFailedLink = async (upstream_task_id) => {
    try {
        const cdkey = await getActiveCdkey();
        const response = await axios.post(UPSTREAM_URL, { 
            action: 'purchase_failed_link', 
            cdkey: cdkey, 
            task_id: upstream_task_id 
        });
        return response.data;
    } catch (error) { 
        return { success: false, message: '请求解锁暂存链接过程中网络崩溃' }; 
    }
};