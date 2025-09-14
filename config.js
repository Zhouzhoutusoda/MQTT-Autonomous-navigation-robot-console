require('dotenv').config();

module.exports = {
    // 内网MQTT配置
    localMqtt: {
        url: process.env.LOCAL_MQTT_URL,
        options: {
            clientId: process.env.LOCAL_MQTT_CLIENT_ID,
            username: process.env.LOCAL_MQTT_USERNAME,
            password: process.env.LOCAL_MQTT_PASSWORD,
            clean: true,
            reconnectPeriod: 5000,
        }
    },

    // 公网MQTT配置
    publicMqtt: {
        url: process.env.PUBLIC_MQTT_URL,
        options: {
            clientId: process.env.PUBLIC_MQTT_CLIENT_ID,
            username: process.env.PUBLIC_MQTT_USERNAME,
            password: process.env.PUBLIC_MQTT_PASSWORD,
            clean: true,
            reconnectPeriod: 5000,
        }
    },

    // 订阅的主题
    topics: process.env.TOPICS ? process.env.TOPICS.split(',') : ['#']
};
