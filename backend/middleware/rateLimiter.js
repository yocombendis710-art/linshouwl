const rateLimit = require('express-rate-limit');

// 安全提取 IP
const customKeyGenerator = (req) => {
    return req.ip;
};

exports.apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { success: false, message: '请求过于频繁，请稍后再试。' },
    keyGenerator: customKeyGenerator
});

exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: '登录失败次数过多，请15分钟后再试。' },
    keyGenerator: customKeyGenerator
});