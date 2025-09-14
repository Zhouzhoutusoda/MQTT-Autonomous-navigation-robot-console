#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paho.mqtt.client as mqtt
import json
import time
import random
import math
import sys
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MQTT服务器配置
MQTT_BROKER = '0.0.0.0'
MQTT_PORT = 8083
MQTT_USERNAME = "default_user"
MQTT_PASSWORD = "0000"
CLIENT_ID = f"robot_simulator_{random.randint(0, 1000)}"

# 主题列表
TOPICS = {
    "obstacle": "robot/sensors/obstacle",
    "magnetic": "robot/sensors/magnetic",
    "alcohol": "robot/sensors/alcohol",
    "vibration": "robot/sensors/vibration",
    "lidar": "robot/sensors/lidar",
    "system_status": "robot/system/status",
    "decision": "robot/decision/current",
    "map_data": "robot/map/data",
    "robot_position": "robot/map/position",
    "camera": "robot/camera/feed"
}

# 连接回调
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("已连接到MQTT代理")
    else:
        logger.error(f"连接失败，返回码: {rc}")
        sys.exit(1)

# 发布回调
def on_publish(client, userdata, mid):
    pass

# 创建MQTT客户端
def create_mqtt_client():
    # MQTT 5.0客户端，支持更多特性
    client = mqtt.Client(CLIENT_ID, protocol=mqtt.MQTTv5)
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        logger.info(f"正在连接到MQTT代理 {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        return client
    except Exception as e:
        logger.error(f"连接MQTT服务器失败: {e}")
        sys.exit(1)

# 生成传感器数据
def generate_obstacle_data():
    # 超声波传感器数据，单位厘米（通常范围为2-400cm）
    return {
        "front": random.uniform(5, 200),
        "left": random.uniform(5, 200),
        "right": random.uniform(5, 200),
        "back": random.uniform(5, 200)
    }

def generate_magnetic_data():
    # 二值化的磁场数据，只有0或1
    detected = random.choice([True, False])
    strength = 5.0 if detected else 0.0
    
    return {
        "x": 0,
        "y": 0,
        "z": 0,
        "strength": strength
    }

def generate_alcohol_data():
    # 二值化的酒精传感器数据
    detected = random.choice([True, False])
    return {
        "level": 1.0 if detected else 0.0,
        "detected": detected
    }

def generate_vibration_data():
    # 二值化的震动传感器数据
    detected = random.choice([True, False])
    magnitude = 5.0 if detected else 0.0
    
    return {
        "x": 0,
        "y": 0,
        "z": 0,
        "magnitude": magnitude
    }

def generate_lidar_data():
    points = []
    for _ in range(200):
        angle = random.uniform(0, math.pi * 2)
        dist = 2 + random.uniform(0, 8)
        points.append({
            "x": math.cos(angle) * dist,
            "y": random.uniform(-1, 1),
            "z": math.sin(angle) * dist,
            "intensity": random.uniform(0, 255)
        })
    
    return {
        "points": points
    }

def generate_system_status():
    return {
        "batteryLevel": 70 + random.uniform(0, 30),
        "cpuUsage": 20 + random.uniform(0, 60),
        "memoryUsage": 30 + random.uniform(0, 50),
        "connectionStatus": "Connected",
        "currentMode": random.choice(["Automatic navigation", "Obstacle Avoidance Mode", 
                                   "Explore Mode", "Follow Mode"])
    }

def generate_decision_data():
    actions = ["Go ahead", "Turn right", "Turn left", "Stop", "Back", 
              "Slow Progress", "Scanning environment"]
    nextActions = ["Explore new area", "Continue current route", 
                 "Return to starting point", "Avoid obstacles", "Wait for command"]
    reasons = [
        "An obstacle is detected ahead, and you need to avoid it",
        "An obstacle is detected on the left, turn right",
        "The magnetic field strength is increasing, and you may be approaching the target",
        "Alcohol concentration is detected, and you should avoid this area",
        "Vibration is increasing, the terrain is uneven, and you should slow down",
        "No obstacles are detected, you can continue to move forward",
        "The current area has been explored, and a new path is being sought"
    ]
    
    return {
        "currentAction": random.choice(actions),
        "nextAction": random.choice(nextActions),
        "confidence": 60 + random.uniform(0, 40),
        "reasoning": random.choice(reasons)
    }

def generate_map_data():
    width = 20
    height = 20
    mazeData = [[0 for _ in range(width)] for _ in range(height)]
    
    # 添加边界墙
    for x in range(width):
        mazeData[0][x] = 2  # 上边界
        mazeData[height-1][x] = 2  # 下边界
    
    for y in range(height):
        mazeData[y][0] = 2  # 左边界
        mazeData[y][width-1] = 2  # 右边界
    
    # 添加随机障碍物
    for _ in range(50):
        x = random.randint(1, width-2)
        y = random.randint(1, height-2)
        mazeData[y][x] = 2
    
    # 添加可通过区域
    for y in range(1, height-1):
        for x in range(1, width-1):
            if mazeData[y][x] == 0 and random.random() > 0.3:
                mazeData[y][x] = 1
    
    # 设置目标
    mid_height = math.floor(height/2)
    mid_width = math.floor(width/2)
    mazeData[mid_height][mid_width] = 3
    
    return {
        "mazeData": mazeData,
        "width": width,
        "height": height
    }

def generate_robot_position():
    return {
        "position": {
            "x": random.randint(1, 18),
            "y": random.randint(1, 18)
        },
        "direction": random.choice([0, 90, 180, 270])
    }

def generate_camera_data():
    # 这里我们只生成一个固定的图像URL模拟
    # 在实际应用中，这可能是来自摄像头的base64编码图像
    placeholders = [
        "https://via.placeholder.com/640x480.png?text=Camera+Feed+1",
        "https://via.placeholder.com/640x480.png?text=Camera+Feed+2",
        "https://via.placeholder.com/640x480.png?text=Camera+Feed+3",
        "https://via.placeholder.com/640x480.png?text=Camera+Feed+4",
        "https://via.placeholder.com/640x480.png?text=Camera+Feed+5"
    ]
    
    return {
        "imageUrl": random.choice(placeholders),
        "timestamp": datetime.now().isoformat()
    }

# 主发布循环
def publish_data(client):
    try:
        while True:
            # 发布障碍物传感器数据
            client.publish(TOPICS["obstacle"], json.dumps(generate_obstacle_data()))
            
            # 发布磁场传感器数据
            client.publish(TOPICS["magnetic"], json.dumps(generate_magnetic_data()))
            
            # 发布酒精传感器数据
            client.publish(TOPICS["alcohol"], json.dumps(generate_alcohol_data()))
            
            # 发布振动传感器数据
            client.publish(TOPICS["vibration"], json.dumps(generate_vibration_data()))
            
            # 发布激光雷达数据 (可选，因为数据较大)
            if random.random() > 0.7:  # 30%的概率发送雷达数据
                client.publish(TOPICS["lidar"], json.dumps(generate_lidar_data()))
            
            # 发布系统状态
            client.publish(TOPICS["system_status"], json.dumps(generate_system_status()))
            
            # 发布决策数据
            client.publish(TOPICS["decision"], json.dumps(generate_decision_data()))
            
            # 间歇性发布地图数据
            if random.random() > 0.9:  # 10%的概率发送地图数据
                client.publish(TOPICS["map_data"], json.dumps(generate_map_data()))
            
            # 发布机器人位置
            client.publish(TOPICS["robot_position"], json.dumps(generate_robot_position()))
            
            # 发布摄像头数据
            client.publish(TOPICS["camera"], json.dumps(generate_camera_data()))
            
            logger.info("已发布一轮数据")
            time.sleep(1)  # 每秒发布一次
            
    except KeyboardInterrupt:
        logger.info("用户中断，停止发布")
        client.loop_stop()
        client.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    logger.info("启动机器人数据模拟器...")
    client = create_mqtt_client()
    publish_data(client)