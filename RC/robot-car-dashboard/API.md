# MQTT API 文档

## 连接信息
- **协议**: WebSocket (ws)
- **Host**: 0.0.0.0
- **Port**: 8083
- **路径**: /mqtt
- **Username**: default_user
- **Password**: 0000

## Topic Structure

All topics follow the pattern: `robot/{category}/{item}`

## Sensor Data Topics

### Obstacle Sensor
- **Topic**: `robot/sensors/obstacle`
- **Purpose**: Provides distance measurements to obstacles in all directions
- **Data Format**:
```json
{
  "front": 45, 
  "left": 20,   
  "right": 30,  
  "back": 100   
}
```
*Distance values in centimeters*

### Magnetic Field Sensor
- **Topic**: `robot/sensors/magnetic`
- **Purpose**: Detects magnetic field presence (binary detection only)
- **Data Format**:
```json
1
```
or
```json
0
```
or as an object:
```json
{
  "detected": 1
}
```

* Value 1 indicates magnetic field is detected
* Value 0 indicates no magnetic field is detected
* The sensor only provides binary detection (present/absent) without field strength measurement

### Alcohol Sensor
- **Topic**: `robot/sensors/alcohol`
- **Purpose**: Detects alcohol presence and concentration
- **Data Format**:
```json
{
  "level": 0.08,    
  "detected": true  
}
```

### Vibration Sensor
- **Topic**: `robot/sensors/vibration`
- **Purpose**: Detects vibration presence (binary detection only)
- **Data Format**:
```json
1
```
or
```json
0
```
or as an object:
```json
{
  "detected": 1
}
```

* Value 1 indicates vibration is detected
* Value 0 indicates no vibration is detected
* The sensor only provides binary detection (present/absent) without magnitude measurement

### Lidar Sensor
- **Topic**: `robot/sensors/lidar`
- **Purpose**: Provides 502 distance values from the 360° circular scan, automatically converted to 3D visualization
- **Data Format**:

The dashboard now supports two data formats:

1. **New Format (Preferred)**: Individual points with x, y coordinates and timestamp
```json
{
  "x": 10.5,
  "y": 20.3,
  "timestamp": 1651234567890
}
```

Key information for new format:
- Object with x, y coordinates (in meters)
- Optional timestamp (milliseconds since epoch)
- Points are accumulated over time to build the 3D visualization
- Points older than 5 seconds are automatically removed

2. **Legacy Format**: 502-element array representing a full 360° scan
```json
{
  "ranges": [0.498, 0.5, 0.502, 0.504, 0.506, ... 497 more values ...]
}
```

Key information for legacy format:
- Object with `ranges` property containing a 502-element array
- Each element represents a distance in meters
- Element index corresponds to angle (0 = front of robot, progressing clockwise)
- Angle step: 360° / 502 ≈ 0.717° per element
- 0, negative values, or NaN indicate invalid readings
- Maximum reliable range: 10 meters (configurable)

The dashboard also accepts alternative legacy formats for compatibility:

```json
[0.498, 0.5, 0.502, 0.504, 0.506, ... 497 more values ...]
```

```json
{
  "distances": [0.498, 0.5, 0.502, 0.504, 0.506, ... 497 more values ...]
}
```

The dashboard converts all data formats into a 3D visualization by:
1. Converting coordinates to 3D space
2. Creating multiple height levels for each point
3. Color-coding points based on distance (red for close, green/cyan for far)

**Visualization Features**
- Adjustable vertical layers (1-10)
- Camera controls for rotating, panning, and zooming
- Automatic wall generation from point clusters

**Example: Sending New Format Lidar Data**
You can send lidar data to the dashboard using an MQTT client:

```javascript
// JavaScript example using MQTT.js
const mqtt = require('mqtt');
const client = mqtt.connect('ws://0.0.0.0:8083/mqtt', {
  clientId: `robot_dashboard_${Math.random().toString(16).substr(2, 8)}`,
  username: 'default_user',
  password: '0000',
  username: 'cloud1',
  password: 'Hheidiaowosiquanjia!!!'
});

// Publish point cloud data every 100ms
client.on('connect', function () {
  console.log('Connected to MQTT broker');
  
  setInterval(() => {
    // Generate a point with x, y coordinates
    const point = {
      x: Math.random() * 10 - 5,  // Random x between -5 and 5
      y: Math.random() * 10,      // Random y between 0 and 10
      timestamp: Date.now()
    };
    
    client.publish('robot/sensors/lidar', JSON.stringify(point));
  }, 100);
});
```

**Python Example for New Format**
```python
# Python example using paho-mqtt
import paho.mqtt.client as mqtt
import json
import time
import random

# Connect to MQTT broker
client = mqtt.Client(transport="websockets")
client.username_pw_set("cloud1", "Hheidiaowosiquanjia!!!")
client.connect("8.208.3.55", 8083, 60)

# Start publishing
client.loop_start()
try:
    while True:
        # Generate a point with x, y coordinates
        point = {
            "x": random.uniform(-5, 5),  # Random x between -5 and 5
            "y": random.uniform(0, 10),  # Random y between 0 and 10
            "timestamp": int(time.time() * 1000)
        }
        
        client.publish("robot/sensors/lidar", json.dumps(point))
        time.sleep(0.1)  # Send points every 100ms
except KeyboardInterrupt:
    client.loop_stop()
    client.disconnect()
```

## Camera Data

### Camera Feed
- **Topic**: `robot/camera/feed`
- **Purpose**: Provides real-time camera images
- **Data Format**:
```json
{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZ...",  
  "timestamp": "2023-07-15T08:30:45.123Z"               
}
```
*Base64 encoded image or URL with ISO timestamp*

## Map Data

### Maze Map
- **Topic**: `robot/map/data`
- **Purpose**: Provides the current map data discovered by the robot
- **Data Format**:
```json
{
  "mazeData": [
    [0, 0, 2, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 3, 2, 0]
  ],
  "width": 20,
  "height": 20
}
```

**Cell Values**:
- 0: Unexplored
- 1: Passable
- 2: Obstacle
- 3: Target

### Robot Position
- **Topic**: `robot/map/position`
- **Purpose**: Reports the current position and orientation of the robot
- **Data Format**:
```json
{
  "position": {
    "x": 5,  
    "y": 7   
  },
  "direction": 90 
}
```
*X,Y coordinates in grid; Direction in degrees (0 = right, 90 = down, 180 = left, 270 = up)*

## Decision System

### Current Decision
- **Topic**: `robot/decision/current`
- **Purpose**: Provides information about the robot's current decision-making
- **Data Format**:
```json
{
  "currentAction": "MOVE_FORWARD",
  "nextAction": "TURN_RIGHT",
  "confidence": 85,          
  "reasoning": "Detected open path ahead with no obstacles",
  "path": [
    {"x": 5, "y": 7},
    {"x": 6, "y": 7}
  ]
}
```
*Confidence as percentage (0-100); Path as array of coordinates*

**Note:** The dashboard will directly display the `currentAction` value as the robot's decision. This value should always be provided in English.

## System Status

### System Information
- **Topic**: `robot/system/status`
- **Purpose**: Provides system status information
- **Data Format**:
```json
{
  "batteryLevel": 75,    
  "cpuUsage": 32,        
  "memoryUsage": 45,    
  "currentMode": "AUTONOMOUS" 
}
```
*Values as percentages (0-100); Mode is always set to "AUTONOMOUS"*

**Note:** CPU usage is dynamically calculated based on camera status:
- When camera is active: 50-90% range
- When camera is inactive: 10-40% range

## Robot Command Topics

Commands can be sent to the robot using the following topic pattern:

- **Topic**: `robot/command/{command_type}`
- **Purpose**: Send commands to control the robot
- **Data Format**:
```json
{
  "timestamp": "2023-07-15T08:30:45.123Z",
  "command": "MOVE_FORWARD"
}
```
*Additional parameters may be specific to the command type*

### Available Commands

1. Movement Commands
   - `robot/command/move`
   ```json
   {
     "timestamp": "2023-07-15T08:30:45.123Z",
     "command": "move",
     "direction": "forward", 
     "duration": 1000        
   }
   ```
   *Direction: "forward", "backward", "left", "right"; Duration in milliseconds*

2. Stop Command
   - `robot/command/stop`
   ```json
   {
     "timestamp": "2023-07-15T08:30:45.123Z",
     "command": "stop"
   }
   ```

3. Mode Change Command
   - `robot/command/mode`
   ```json
   {
     "timestamp": "2023-07-15T08:30:45.123Z",
     "command": "mode",
     "mode": "AUTONOMOUS" 
   }
   ```
   *Mode options: "AUTONOMOUS", "MANUAL", "EXPLORATION"*

## Error Handling

When errors occur, they will be published to:

- **Topic**: `robot/error`
- **Data Format**:
```json
{
  "timestamp": "2023-07-15T08:30:45.123Z",
  "errorCode": "SENSOR_FAILURE",
  "message": "Obstacle sensor not responding",
  "severity": "HIGH"
}
```

## Implementation Example

Here's how to use the MQTT service in the dashboard code:

```javascript
import mqttService from '../services/mqttService';

// Connect to MQTT broker
mqttService.connect({
  host: '8.208.3.55',
  port: 8083
}).then(() => {
  console.log('Connected to MQTT broker');
}).catch(error => {
  console.error('Failed to connect to MQTT broker', error);
});

// Send a command to the robot
mqttService.sendCommand('move', {
  direction: 'forward',
  duration: 1000
});
```