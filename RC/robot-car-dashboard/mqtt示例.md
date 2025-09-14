import mqtt from 'mqtt'
import { ref } from 'vue'

// MQTT连接状态
export const connectionStatus = ref(false)
// 接收的消息
export const receivedMessages = ref({})

// MQTT客户端实例
let client = null

// MQTT连接配置
const mqttConfig = {
  protocol: 'ws',
  host: '0.0.0.0', // broker地址
  port: 8083,
  endpoint: '/mqtt',
  clean: true,
  connectTimeout: 30 * 1000,
  reconnectPeriod: 4000,
  clientId: 'car_monitor_' + Math.random().toString(16).substring(2, 8),
  username: 'wcz',
  password: 'wcz123321.',
}

// 传感器主题映射
export const topics = {
  hall: 'car/sensor/hall',
  ultrasonic: 'car/sensor/ultrasonic',
  vibration: 'car/sensor/vibration',
  alcohol: 'car/sensor/alcohol',
  position: 'car/position',
  camera: 'car/camera',
  map: 'car/map',
  test: 'testtopic/1'  // 添加测试主题
}

// 创建MQTT连接
export function createConnection() {
  try {
    const { protocol, host, port, endpoint, ...options } = mqttConfig
    const connectUrl = `${protocol}://${host}:${port}${endpoint}`
    
    console.log('尝试连接到MQTT服务器:', connectUrl, '配置:', { ...options, password: '********' })
    client = mqtt.connect(connectUrl, options)
    
    client.on('connect', () => {
      console.log('MQTT连接成功! ClientId:', options.clientId)
      connectionStatus.value = true
      
      // 连接成功后订阅所有主题
      Object.values(topics).forEach(topic => {
        subscribeToTopic(topic)
      })
      
      // 额外订阅任何测试主题，确保覆盖所有可能的主题
      subscribeToTopic('testtopic/#')
      subscribeToTopic('camera/#')  // 专门为摄像头添加通配符主题
      subscribeToTopic('#')  // 订阅所有主题 (谨慎使用)
    })
    
    client.on('reconnect', () => {
      console.log('MQTT重新连接中...')
    })
    
    client.on('error', (error) => {
      console.error('MQTT连接失败:', error)
      connectionStatus.value = false
    })
    
    client.on('message', (topic, message) => {
      try {
        // 检查是否是相机/视频相关主题
        const isCameraTopic = topic === topics.camera || 
                             topic.startsWith('camera/') || 
                             topic.startsWith('video/') ||
                             topic.includes('camera') ||
                             topic.includes('video') ||
                             topic.includes('image');
        
        if (isCameraTopic) {
          console.log(`收到相机数据，主题: ${topic}, 数据大小: ${message.length} 字节`);
          handleCameraMessage(topic, message);
        } else {
          // 非相机数据的常规处理
          handleRegularMessage(topic, message);
        }
      } catch (e) {
        console.error('消息处理错误:', e);
        try {
          // 即使处理出错，也尝试保存原始消息
          receivedMessages.value[topic] = message.toString();
        } catch (innerError) {
          console.error('保存原始消息失败:', innerError);
        }
      }
    })
    
    return client
  } catch (error) {
    console.error('MQTT连接错误:', error)
    return null
  }
}

// 处理相机/视频流消息
function handleCameraMessage(topic, message) {
  try {
    // 对于相机数据，首先尝试作为JSON解析
    try {
      const jsonData = JSON.parse(message.toString());
      console.log(`相机数据解析为JSON对象:`, Object.keys(jsonData));
      
      // 更新到相机主题
      receivedMessages.value[topics.camera] = jsonData;
      
      // 同时更新到原始主题（如果不同的话）
      if (topic !== topics.camera) {
        receivedMessages.value[topic] = jsonData;
      }
    } catch (jsonError) {
      // 如果不是JSON，假设是二进制或base64数据
      const messageStr = message.toString();
      // 发送原始数据到相机主题，应用层会处理格式转换
      receivedMessages.value[topics.camera] = messageStr;
      
      // 同时更新到原始主题（如果不同的话）
      if (topic !== topics.camera) {
        receivedMessages.value[topic] = messageStr;
      }
      
      console.log(`相机数据作为原始数据处理, 长度: ${messageStr.length}字节`);
    }
  } catch (e) {
    console.error('处理相机消息错误:', e);
  }
}

// 处理常规消息
function handleRegularMessage(topic, message) {
  const messageStr = message.toString();
  console.log(`----- 收到原始MQTT消息 -----`);
  console.log(`主题: ${topic}`);
  console.log(`内容: ${messageStr.length > 100 ? messageStr.substring(0, 100) + '...(已截断)' : messageStr}`);
  
  try {
    // 尝试解析JSON
    let payload;
    try {
      // 预处理：处理某些格式化的JSON字符串（可能包含额外空格）
      const trimmedStr = messageStr.trim();
      payload = JSON.parse(trimmedStr);
      console.log(`解析为JSON对象:`, payload);
    } catch (jsonError) {
      console.log('JSON解析失败:', jsonError.message);
      
      // 再次尝试，去除可能存在的额外空格
      try {
        // 对于格式化的JSON字符串，尝试移除多余空格后再解析
        if (messageStr.includes('"value"') && messageStr.includes('"unit"')) {
          const compactJson = messageStr.replace(/\s+/g, ' ').trim();
          payload = JSON.parse(compactJson);
          console.log(`二次尝试解析为JSON对象成功:`, payload);
        } else {
          throw new Error('非标准JSON格式');
        }
      } catch (retryError) {
        // 如果再次失败，尝试作为数值处理
        const numValue = parseFloat(messageStr);
        if (!isNaN(numValue)) {
          payload = numValue;
          console.log(`解析为数值:`, payload);
        } else {
          // 如果不是数值，直接使用原始字符串
          payload = messageStr;
          console.log(`保留为字符串:`, payload);
        }
      }
    }
    
    // 更新对应主题的消息
    receivedMessages.value[topic] = payload;
    
    // 注：已移除将testtopic/1数据复制到传感器主题的代码，避免错误更新
    
    if (receivedMessages.value && Object.keys(receivedMessages.value).length < 5) {
      // 如果消息数量不多，打印所有
      console.log('所有接收到的消息:', JSON.stringify(receivedMessages.value, null, 2));
    } else {
      // 否则只打印当前主题的消息
      console.log('当前主题消息:', topic, JSON.stringify(payload, null, 2));
    }
  } catch (e) {
    console.error('消息处理错误:', e);
    console.log('原始消息内容:', messageStr.length > 100 ? messageStr.substring(0, 100) + '...(已截断)' : messageStr);
    // 即使处理出错，也尝试保存原始消息
    receivedMessages.value[topic] = messageStr;
  }
  
  console.log(`----- 消息处理完成 -----`);
}

// 订阅主题
export function subscribeToTopic(topic, qos = 0) {
  if (!client || !client.connected) {
    console.error('MQTT客户端未连接')
    return false
  }
  
  client.subscribe(topic, { qos }, (error) => {
    if (error) {
      console.error(`订阅主题 ${topic} 失败:`, error)
      return false
    }
    console.log(`成功订阅主题: ${topic}`)
    return true
  })
}

// 取消订阅主题
export function unsubscribeFromTopic(topic) {
  if (!client || !client.connected) {
    console.error('MQTT客户端未连接')
    return false
  }
  
  client.unsubscribe(topic, (error) => {
    if (error) {
      console.error(`取消订阅主题 ${topic} 失败:`, error)
      return false
    }
    console.log(`成功取消订阅主题: ${topic}`)
    return true
  })
}

// 发布消息
export function publishMessage(topic, message, qos = 0) {
  if (!client || !client.connected) {
    console.error('MQTT客户端未连接')
    return false
  }
  
  const payload = typeof message === 'object' ? JSON.stringify(message) : message
  
  client.publish(topic, payload, { qos }, (error) => {
    if (error) {
      console.error(`发布消息至主题 ${topic} 失败:`, error)
      return false
    }
    console.log(`成功发布消息至主题: ${topic}`)
    return true
  })
}

// 断开连接
export function disconnectMqtt() {
  if (client && client.connected) {
    client.end()
    connectionStatus.value = false
    console.log('MQTT连接已断开')
    return true
  }
  return false
}