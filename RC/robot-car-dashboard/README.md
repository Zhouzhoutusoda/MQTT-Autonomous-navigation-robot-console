# 机器人控制台系统

An intuitive dashboard for monitoring and controlling an autonomous navigation robot. This dashboard displays sensor data, 3D Lidar information, camera feed, maze map, and decision-making processes in a Tesla-inspired interface.

## Features

- **Real-time Sensor Monitoring**: Display obstacle, magnetic field, alcohol, and vibration sensor data
- **3D Lidar Visualization**: View point cloud data from the robot's Lidar sensor
- **Live Camera Feed**: See what the robot sees with real-time camera streaming
- **2D Maze Mapping**: Track the robot's position and exploration progress in a 2D maze
- **Decision-Making System**: Monitor the robot's decisions and reasoning
- **MQTT Communication**: Connect to the robot via MQTT for real-time data exchange
- **Simulation Mode**: Use built-in simulated data for testing without a physical robot

## Tech Stack

- **Frontend**: Vue 3, Vite, Pinia, Three.js
- **Communications**: MQTT over WebSockets
- **Visualization**: Canvas API, Three.js

## API Interface Documentation

### MQTT Topics

The dashboard communicates with the robot using the following MQTT topics:

#### Sensor Data Topics

| Topic | Description | Data Format |
|-------|-------------|-------------|
| `robot/sensors/obstacle` | Obstacle detection data | `{front: number, left: number, right: number, back: number}` |
| `robot/sensors/magnetic` | Magnetic field data | `{x: number, y: number, z: number, strength: number}` |
| `robot/sensors/alcohol` | Alcohol sensor data | `{level: number, detected: boolean}` |
| `robot/sensors/vibration` | Vibration sensor data | `{x: number, y: number, z: number, magnitude: number}` |
| `robot/sensors/lidar` | Lidar point cloud data | `{points: Array<{x: number, y: number, z: number}>}` |

#### Camera Topics

| Topic | Description | Data Format |
|-------|-------------|-------------|
| `robot/camera/feed` | Camera image feed | `{imageUrl: string, timestamp: string}` |

#### Map and Navigation Topics

| Topic | Description | Data Format |
|-------|-------------|-------------|
| `robot/map/data` | Map data | `{mazeData: Array<Array<number>>, width: number, height: number}` |
| `robot/map/position` | Robot position | `{position: {x: number, y: number}, direction: number}` |

#### Decision System Topics

| Topic | Description | Data Format |
|-------|-------------|-------------|
| `robot/decision/current` | Current decision | `{currentAction: string, nextAction: string, confidence: number, reasoning: string, path: Array}` |

#### System Status Topics

| Topic | Description | Data Format |
|-------|-------------|-------------|
| `robot/system/status` | System status | `{batteryLevel: number, cpuUsage: number, memoryUsage: number, currentMode: string}` |

### Command Topics

To control the robot, publish messages to:

| Topic | Description | Data Format |
|-------|-------------|-------------|
| `robot/command/{command}` | Send commands to robot | `{timestamp: string, command: string, ...params}` |

## MQTT Message Format

All MQTT messages use JSON format. Example message for obstacle data:

```json
{
  "front": 45,
  "left": 20,
  "right": 30,
  "back": 100
}
```

## 快速开始

1. 确保您的MQTT服务器已启动并运行在 0.0.0.0:8083

### MQTT Message Format

All MQTT messages use JSON format. Example message for obstacle data:

```json
{
  "front": 45,
  "left": 20,
  "right": 30,
  "back": 100
}
```

## Configuration

The MQTT connection can be configured with:

- Host (default: localhost)
- Port (default: 9001)
- Protocol (default: ws)
- Username and password (if required)

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```
（ npm run dev -- --host）
### Running in Development Mode

```bash
// node index.js
npm run dev
前端服务器启动代码：npm run dev --host
后端服务器启动代码：npx vite --host
访问：http://localhost:8080
```

### Building for Production

```bash
npm run build
```

## Simulating Robot Data

For testing purposes, you can simulate robot data using:

```bash
node mqtt-simulator.js
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
