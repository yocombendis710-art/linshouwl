require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

async function createAdmin() {
    // 你可以在这里修改你想要的账号和密码
    const username = '1739600626';
    const password = 'fyyfyyfyy123';
    
    try {
        // 生成加密后的密码哈希
        const hash = await bcrypt.hash(password, 10);
        
        // 插入到 admins 表中，role_level 设为 0 表示超级管理员，is_active 设为 1 表示启用
        await pool.query(
            'INSERT INTO admins (username, password_hash, role_level, is_active) VALUES (?, ?, 0, 1)', 
            [username, hash]
        );
        console.log(`✅ 成功！超级管理员已创建。账号: ${username} , 密码: ${password}`);
    } catch (err) {
        console.error('❌ 创建失败，可能是该账号已存在，或者数据库未连接:', err.message);
    }
    process.exit();
}

createAdmin();