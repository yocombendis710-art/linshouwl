const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) return res.status(403).json({ success: false, message: '拒绝访问：未提供鉴权Token' });

    const token = bearerHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: 'Token失效或被篡改' });
        req.admin = decoded; 
        next();
    });
};

exports.requireSuperAdmin = (req, res, next) => {
    if (req.admin.role_level!== 0) {
        return res.status(403).json({ success: false, message: '权限不足：仅超管可执行此操作' });
    }
    next();
};