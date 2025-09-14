const mqtt = require('mqtt');

// MQTT配置
const MQTT_CONFIG = {
    host: 'localhost',
    port: 8083,
    protocol: 'ws',
    path: '/mqtt',
    username: 'default_user',
    password: '0000'
};

// 构建连接URL
const MQTT_URL = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}${MQTT_CONFIG.path}`;

console.log('🤖 启动MQTT机器人数据模拟器...');
console.log(`📡 连接到MQTT服务器: ${MQTT_URL}`);

// 连接MQTT服务器
const client = mqtt.connect(MQTT_URL, {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    connectTimeout: 10000,
    reconnectPeriod: 5000
});

// 模拟数据生成器
class RobotDataSimulator {
    constructor() {
        this.robotPosition = { x: 5, y: 5 };
        this.robotDirection = 0; // 0-360度
        this.batteryLevel = 100;
        this.isMoving = false;
        this.currentAction = 'exploring';
        this.mazeSize = { width: 20, height: 20 };
        
        // 生成迷宫地图
        this.mazeData = this.generateMaze();
    }

    // 生成简单的迷宫地图
    generateMaze() {
        const maze = [];
        for (let y = 0; y < this.mazeSize.height; y++) {
            const row = [];
            for (let x = 0; x < this.mazeSize.width; x++) {
                // 0: 空地, 1: 墙壁, 2: 起点, 3: 终点
                if (x === 0 || y === 0 || x === this.mazeSize.width - 1 || y === this.mazeSize.height - 1) {
                    row.push(1); // 边界墙
                } else if (x === 5 && y === 5) {
                    row.push(2); // 起点
                } else if (x === 15 && y === 15) {
                    row.push(3); // 终点
                } else if (Math.random() < 0.2) {
                    row.push(1); // 随机墙壁
                } else {
                    row.push(0); // 空地
                }
            }
            maze.push(row);
        }
        return maze;
    }

    // 生成障碍物传感器数据
    generateObstacleData() {
        return {
            front: Math.floor(Math.random() * 100) + 20,
            left: Math.floor(Math.random() * 100) + 15,
            right: Math.floor(Math.random() * 100) + 15,
            back: Math.floor(Math.random() * 100) + 30
        };
    }

    // 生成磁场传感器数据
    generateMagneticData() {
        return {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100,
            strength: Math.random() * 50 + 25
        };
    }

    // 生成酒精传感器数据
    generateAlcoholData() {
        const level = Math.random() * 100;
        return {
            level: level,
            detected: level > 50
        };
    }

    // 生成振动传感器数据
    generateVibrationData() {
        const magnitude = Math.random() * 10;
        return {
            x: (Math.random() - 0.5) * magnitude,
            y: (Math.random() - 0.5) * magnitude,
            z: (Math.random() - 0.5) * magnitude,
            magnitude: magnitude
        };
    }

    // 生成激光雷达数据
    generateLidarData() {
        const points = [];
        const numPoints = 360; // 360度扫描
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const distance = Math.random() * 5 + 0.5; // 0.5-5.5米
            
            points.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                z: Math.random() * 0.5 - 0.25, // 高度变化
                intensity: Math.random() * 255
            });
        }
        
        return { points };
    }

    // 生成摄像头数据
    generateCameraData() {
        const images = [
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7liY3mlrnmkYTlg4/lpLQ8L3RleHQ+PC9zdmc+',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDQ0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7ov5Tlj7fmkYTlg4/lpLQ8L3RleHQ+PC9zdmc+',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNTU1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lt6bmkYTlg4/lpLQ8L3RleHQ+PC9zdmc+'
        ];
        
        return {
            imageUrl: images[Math.floor(Math.random() * images.length)],
            timestamp: new Date().toISOString()
        };
    }

    // 更新机器人位置
    updatePosition() {
        if (this.isMoving) {
            // 简单的随机移动
            const moveX = (Math.random() - 0.5) * 0.5;
            const moveY = (Math.random() - 0.5) * 0.5;
            
            this.robotPosition.x = Math.max(1, Math.min(this.mazeSize.width - 2, this.robotPosition.x + moveX));
            this.robotPosition.y = Math.max(1, Math.min(this.mazeSize.height - 2, this.robotPosition.y + moveY));
            
            this.robotDirection = (this.robotDirection + (Math.random() - 0.5) * 30) % 360;
            if (this.robotDirection < 0) this.robotDirection += 360;
        }
    }

    // 生成决策数据
    generateDecisionData() {
        const actions = ['前进', '左转', '右转', '后退', '停止', '扫描', '探索'];
        const currentAction = actions[Math.floor(Math.random() * actions.length)];
        const nextAction = actions[Math.floor(Math.random() * actions.length)];
        
        return {
            currentAction: currentAction,
            nextAction: nextAction,
            confidence: Math.random() * 100,
            reasoning: `基于传感器数据分析，选择${currentAction}动作`,
            path: [
                { x: this.robotPosition.x, y: this.robotPosition.y },
                { x: this.robotPosition.x + 1, y: this.robotPosition.y },
                { x: this.robotPosition.x + 2, y: this.robotPosition.y + 1 }
            ]
        };
    }

    // 生成系统状态数据
    generateSystemStatus() {
        // 电池缓慢消耗
        this.batteryLevel = Math.max(0, this.batteryLevel - Math.random() * 0.1);
        
        return {
            batteryLevel: Math.round(this.batteryLevel),
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            currentMode: this.isMoving ? '自主导航' : '待机',
            connectionStatus: 'Connected',
            uptime: Math.floor(Date.now() / 1000) % 86400 // 秒数
        };
    }
}

// 创建模拟器实例
const simulator = new RobotDataSimulator();

// MQTT连接事件
client.on('connect', () => {
    console.log('✅ 已连接到MQTT服务器');
    console.log('🚀 开始发送模拟数据...');
    
    // 启动数据发送
    startDataSimulation();
});

client.on('error', (err) => {
    console.error('❌ MQTT连接错误:', err.message);
});

client.on('offline', () => {
    console.log('📴 MQTT连接已离线');
});

client.on('reconnect', () => {
    console.log('🔄 正在重连MQTT服务器...');
});

// 开始数据模拟
function startDataSimulation() {
    // 传感器数据 - 每500ms发送一次
    setInterval(() => {
        client.publish('robot/sensors/obstacle', JSON.stringify(simulator.generateObstacleData()));
        client.publish('robot/sensors/magnetic', JSON.stringify(simulator.generateMagneticData()));
        client.publish('robot/sensors/alcohol', JSON.stringify(simulator.generateAlcoholData()));
        client.publish('robot/sensors/vibration', JSON.stringify(simulator.generateVibrationData()));
    }, 500);

    // 激光雷达数据 - 每200ms发送一次
    setInterval(() => {
        client.publish('robot/sensors/lidar', JSON.stringify(simulator.generateLidarData()));
    }, 200);

    // 摄像头数据 - 每2秒发送一次
    setInterval(() => {
        client.publish('robot/camera/feed', JSON.stringify(simulator.generateCameraData()));
    }, 2000);

    // 位置和地图数据 - 每1秒发送一次
    setInterval(() => {
        simulator.updatePosition();
        
        client.publish('robot/map/data', JSON.stringify({
            mazeData: simulator.mazeData,
            width: simulator.mazeSize.width,
            height: simulator.mazeSize.height
        }));
        
        client.publish('robot/map/position', JSON.stringify({
            position: simulator.robotPosition,
            direction: simulator.robotDirection
        }));
    }, 1000);

    // 决策数据 - 每1.5秒发送一次
    setInterval(() => {
        client.publish('robot/decision/current', JSON.stringify(simulator.generateDecisionData()));
    }, 1500);

    // 系统状态 - 每3秒发送一次
    setInterval(() => {
        client.publish('robot/system/status', JSON.stringify(simulator.generateSystemStatus()));
    }, 3000);

    // 随机切换移动状态
    setInterval(() => {
        simulator.isMoving = Math.random() > 0.3;
        console.log(`🤖 机器人状态: ${simulator.isMoving ? '移动中' : '静止'}`);
    }, 10000);
}

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭模拟器...');
    client.end();
    process.exit();
});

console.log('📊 模拟器配置:');
console.log(`   - 传感器数据: 每500ms`);
console.log(`   - 激光雷达: 每200ms`);
console.log(`   - 摄像头: 每2秒`);
console.log(`   - 位置/地图: 每1秒`);
console.log(`   - 决策数据: 每1.5秒`);
console.log(`   - 系统状态: 每3秒`);
console.log('按 Ctrl+C 停止模拟器');