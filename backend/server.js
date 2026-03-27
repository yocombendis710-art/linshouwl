require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();

// 【修复核心】告诉 Express 信任前面第 1 层 Nginx 反向代理传来的真实客户端 IP
app.set('trust proxy', 1);

app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/client', apiRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});