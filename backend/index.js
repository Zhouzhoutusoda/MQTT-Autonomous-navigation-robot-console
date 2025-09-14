const mqtt = require('mqtt');
const config = require('./config');

// 添加连接选项
const localOptions = {
    ...config.localMqtt.options,
    connectTimeout: 10000, // 10秒连接超时
    reconnectPeriod: 5000  // 5秒重连间隔
};

const publicOptions = {
    ...config.publicMqtt.options,
    connectTimeout: 10000, // 10秒连接超时
    reconnectPeriod: 5000  // 5秒重连间隔
};

// 连接内网MQTT服务器
console.log('正在连接到内网MQTT服务器...');
console.log(`内网连接URL: ${config.localMqtt.url}`);
const localClient = mqtt.connect(config.localMqtt.url, localOptions);

// 连接公网MQTT服务器
console.log('正在连接到公网MQTT服务器...');
console.log(`公网连接URL: ${config.publicMqtt.url}`);
const publicClient = mqtt.connect(config.publicMqtt.url, publicOptions);

// 内网MQTT连接事件处理
localClient.on('connect', () => {
    console.log('已连接到内网MQTT服务器');

    // 订阅配置的主题
    config.topics.forEach(topic => {
        localClient.subscribe(topic, (err) => {
            if (!err) {
                console.log(`已订阅内网主题: ${topic}`);
            } else {
                console.error(`订阅内网主题失败: ${topic}`, err);
            }
        });
    });
});

localClient.on('error', (err) => {
    console.error('内网MQTT连接错误:', err);
});

// 公网MQTT连接事件处理
publicClient.on('connect', () => {
    console.log('已连接到公网MQTT服务器');
});

publicClient.on('error', (err) => {
    console.error('公网MQTT连接错误:', err.message);
    console.error('错误详情:', err);
});

publicClient.on('offline', () => {
    console.log('公网MQTT连接已离线');
});

publicClient.on('reconnect', () => {
    console.log('正在尝试重连公网MQTT服务器...');
});

// 处理来自内网的消息并转发到公网
localClient.on('message', (topic, message, packet) => {
    console.log(`收到内网消息: ${topic} -> ${message.toString()}`);

    // 将消息转发到公网MQTT服务器
    publicClient.publish(topic, message, { qos: packet.qos, retain: packet.retain }, (err) => {
        if (err) {
            console.error(`消息转发失败: ${topic}`, err);
        } else {
            console.log(`消息已转发到公网: ${topic}`);
        }
    });
});

// 处理程序退出
process.on('SIGINT', () => {
    console.log('正在关闭MQTT连接...');
    localClient.end();
    publicClient.end();
    process.exit();
});
