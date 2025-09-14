/**
 * MQTT模拟器 - 用于开发测试
 * 
 * 这个脚本模拟了机器人发送的MQTT消息，以便于在没有实际硬件的情况下测试前端界面。
 * 使用方法：安装依赖后运行 `node mqtt-simulator.js`
 */

const mqtt = require('mqtt');
const client = mqtt.connect('ws://localhost:9001');  // 修改为WebSocket连接，与前端保持一致

// 生成随机数据的函数
function generateRandomData() {
  // 障碍物传感器数据
  const obstacleData = {
    front: Math.random() * 100,
    left: Math.random() * 100,
    right: Math.random() * 100,
    back: Math.random() * 100
  };
  
  // 磁场传感器数据
  const magneticX = (Math.random() * 2 - 1) * 10;
  const magneticY = (Math.random() * 2 - 1) * 10;
  const magneticZ = (Math.random() * 2 - 1) * 5;
  const magneticData = {
    x: magneticX,
    y: magneticY,
    z: magneticZ,
    strength: Math.sqrt(magneticX*magneticX + magneticY*magneticY + magneticZ*magneticZ)
  };
  
  // 酒精传感器数据
  const alcoholLevel = Math.random() * 15;
  const alcoholData = {
    level: alcoholLevel,
    detected: alcoholLevel > 5
  };
  
  // 振动传感器数据
  const vibX = Math.random() * 10;
  const vibY = Math.random() * 10;
  const vibZ = Math.random() * 10;
  const vibrationData = {
    x: vibX,
    y: vibY,
    z: vibZ,
    magnitude: Math.sqrt(vibX*vibX + vibY*vibY + vibZ*vibZ)
  };
  
  // 系统状态数据
  const systemStatus = {
    batteryLevel: 70 + Math.random() * 30,
    cpuUsage: 20 + Math.random() * 60,
    memoryUsage: 30 + Math.random() * 50,
    connectionStatus: '已连接',
    currentMode: ['自动导航', '避障模式', '探索模式', '跟随模式'][Math.floor(Math.random() * 4)]
  };
  
  // 决策数据
  const actions = ['前进', '右转', '左转', '停止', '后退', '缓慢前进', '扫描环境'];
  const nextActions = ['探索新区域', '继续当前路线', '返回起点', '避开障碍', '等待命令'];
  const reasoning = [
    '检测到前方障碍物，需要避让',
    '检测到左侧障碍物，向右转向',
    '磁场强度增加，可能接近目标',
    '检测到酒精浓度，应避开该区域',
    '振动增强，地形不平，减速前进',
    '没有探测到障碍物，可以继续前进',
    '已经探索完当前区域，寻找新路径'
  ];
  
  const decisionData = {
    currentAction: actions[Math.floor(Math.random() * actions.length)],
    nextAction: nextActions[Math.floor(Math.random() * nextActions.length)],
    confidence: 60 + Math.random() * 40,
    reasoning: reasoning[Math.floor(Math.random() * reasoning.length)],
    path: []
  };
  
  // 激光雷达数据
  const lidarPoints = [];
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * 8;
    lidarPoints.push({
      x: Math.cos(angle) * dist,
      y: Math.random() * 2 - 1,  // 高度在-1到1之间
      z: Math.sin(angle) * dist,
      intensity: Math.random() * 255
    });
  }
  
  // 摄像头图像数据 (模拟，使用占位图片URL)
  const cameraImages = [
    'https://via.placeholder.com/640x480.png?text=Camera+Feed+1',
    'https://via.placeholder.com/640x480.png?text=Camera+Feed+2',
    'https://via.placeholder.com/640x480.png?text=Camera+Feed+3',
    'https://via.placeholder.com/640x480.png?text=Camera+Feed+4',
    'https://via.placeholder.com/640x480.png?text=Camera+Feed+5'
  ];
  
  const cameraData = {
    imageUrl: cameraImages[Math.floor(Math.random() * cameraImages.length)],
    isActive: true,
    resolution: '1280x720',
    fps: 30
  };
  
  // 地图数据模拟
  // 作为示例，我们只发送机器人的位置和朝向
  // 实际应用中，应该发送完整的迷宫地图数据
  const mapData = {
    robotPosition: { 
      x: Math.floor(Math.random() * 20), 
      y: Math.floor(Math.random() * 20) 
    },
    robotDirection: Math.floor(Math.random() * 360)
  };
  
  return {
    obstacle: obstacleData,
    magnetic: magneticData,
    alcohol: alcoholData,
    vibration: vibrationData,
    systemStatus: systemStatus,
    decision: decisionData,
    lidar: lidarPoints,
    camera: cameraData,
    map: mapData
  };
}

// 连接到MQTT代理
client.on('connect', function () {
  console.log('已连接到MQTT代理');
  
  // 定期发送模拟数据
  setInterval(function() {
    const data = generateRandomData();
    
    // 发布传感器数据
    client.publish('robot/sensors/obstacle', JSON.stringify(data.obstacle));
    client.publish('robot/sensors/magnetic', JSON.stringify(data.magnetic));
    client.publish('robot/sensors/alcohol', JSON.stringify(data.alcohol));
    client.publish('robot/sensors/vibration', JSON.stringify(data.vibration));
    
    // 发布系统状态
    client.publish('robot/system/status', JSON.stringify(data.systemStatus));
    
    // 发布决策数据
    client.publish('robot/decisions', JSON.stringify(data.decision));
    
    // 发布激光雷达数据
    client.publish('robot/lidar/data', JSON.stringify(data.lidar));
    
    // 发布摄像头数据
    client.publish('robot/camera/image', JSON.stringify(data.camera));
    
    // 发布地图数据
    client.publish('robot/map/data', JSON.stringify(data.map));
    
    console.log('已发送模拟数据');
  }, 1000);
});

// 错误处理
client.on('error', function (err) {
  console.error('MQTT错误:', err);
  console.error('请确保MQTT代理服务器已经运行，并支持WebSocket连接');
  console.error('您可以使用Mosquitto或其他MQTT代理，并确保WebSocket端口(9001)已开启');
});

// 连接失败处理
client.on('close', function() {
  console.log('MQTT连接已关闭');
});

// 关闭时清理
process.on('SIGINT', function() {
  client.end();
  process.exit();
}); 