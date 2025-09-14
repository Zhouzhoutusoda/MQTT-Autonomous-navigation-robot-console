import mqtt from 'mqtt';
import { useRobotStore } from '../stores/robotStore';

/**
 * MQTT Service
 * 
 * This service handles all MQTT communication between the dashboard and the robot
 * It provides methods for connecting, subscribing to topics, and handling messages
 * 
 * API Interface Summary:
 * - connect(options): Connects to MQTT broker
 * - disconnect(): Disconnects from MQTT broker
 * - sendCommand(command, data): Sends commands to the robot
 */
class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.store = null;
    this.topics = {
      // Sensor data topics
      SENSOR_OBSTACLE: 'robot/sensors/obstacle',     // Obstacle sensor data
      SENSOR_MAGNETIC: 'robot/sensors/magnetic',     // Magnetic field sensor data
      SENSOR_ALCOHOL: 'robot/sensors/alcohol',       // Alcohol sensor data
      SENSOR_VIBRATION: 'robot/sensors/vibration',   // Vibration sensor data
      SENSOR_LIDAR: 'robot/sensors/lidar',           // Lidar point cloud data
      
      // Camera topics
      CAMERA_FEED: 'robot/camera/feed',              // Camera image feed
      
      // Map and navigation topics
      MAP_DATA: 'robot/map/data',                    // Map data
      ROBOT_POSITION: 'robot/map/position',          // Robot position
      
      // Decision system topics
      DECISION_CURRENT: 'robot/decision/current',    // Current decision
      
      // System status topics
      SYSTEM_STATUS: 'robot/system/status'           // System status
    };
    
    // Default connection configuration
    this.defaultOptions = {
      host: '0.0.0.0', // Set this to your MQTT server IP address, this is changed to the frontend access server
      port: 8083,
      protocol: 'ws',
      path: '/mqtt',
      clientId: `robot_dashboard_${Math.random().toString(16).substr(2, 8)}`,
      username: 'default_user',
      password: '0000',
      clean: true,
      connectTimeout: 30 * 1000,
      reconnectPeriod: 4000,
      clientId: 'car_monitor_' + Math.random().toString(16).substring(2, 8),
      username: 'cloud1',
      password: 'Hheidiaowosiquanjia!!!',
    };
  }

  /**
   * Initialize the store reference
   */
  init() {
    this.store = useRobotStore();
  }

  /**
   * Connect to the MQTT broker
   * 
   * @param {Object} options - Connection options
   * @param {string} options.host - Broker hostname
   * @param {number} options.port - Broker port
   * @param {string} options.protocol - Protocol (ws or wss)
   * @param {string} options.username - Optional username
   * @param {string} options.password - Optional password
   * @returns {Promise} Connection result
   */
  connect(options = {}) {
    if (!this.store) {
      this.init();
    }
    
    return new Promise((resolve, reject) => {
      const connectOptions = { ...this.defaultOptions, ...options };
      const url = `${connectOptions.protocol}://${connectOptions.host}:${connectOptions.port}${connectOptions.path}`;
      
      console.log('Connecting to MQTT broker at:', url);
      
      this.client = mqtt.connect(url, {
        username: connectOptions.username,
        password: connectOptions.password,
        clientId: `robot_dashboard_${Math.random().toString(16).substring(2, 10)}`
      });
      
      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        this.isConnected = true;
        this.subscribe();
        this.store.updateSystemStatus({ connectionStatus: 'Online' });
        resolve(true);
      });
      
      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
        this.isConnected = false;
        this.store.updateSystemStatus({ connectionStatus: 'Error' });
        reject(error);
      });
      
      this.client.on('offline', () => {
        console.log('MQTT client is offline');
        this.isConnected = false;
        this.store.updateSystemStatus({ connectionStatus: 'Offline' });
      });
      
      this.client.on('message', this.handleMessage.bind(this));
    });
  }

  /**
   * Disconnect from the MQTT broker
   */
  disconnect() {
    if (this.client && this.isConnected) {
      this.client.end();
      this.isConnected = false;
      this.store.updateSystemStatus({ connectionStatus: 'Offline' });
      console.log('Disconnected from MQTT broker');
    }
  }

  /**
   * Subscribe to all topics
   */
  subscribe() {
    if (!this.client || !this.isConnected) return;
    
    Object.values(this.topics).forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    });
    
    // Also subscribe to wildcard topics for all robot data
    this.client.subscribe('robot/#', (err) => {
      if (err) {
        console.error('Error subscribing to robot/#:', err);
      } else {
        console.log('Subscribed to all robot topics');
      }
    });
  }

  /**
   * Handle incoming MQTT messages
   * 
   * @param {string} topic - Message topic
   * @param {Buffer} message - Message payload
   */
  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      
      // Process message based on topic
      switch (topic) {
        case this.topics.SENSOR_OBSTACLE:
          this.handleObstacleData(payload);
          break;
        case this.topics.SENSOR_MAGNETIC:
          this.handleMagneticData(payload);
          break;
        case this.topics.SENSOR_ALCOHOL:
          this.handleAlcoholData(payload);
          break;
        case this.topics.SENSOR_VIBRATION:
          this.handleVibrationData(payload);
          break;
        case this.topics.SENSOR_LIDAR:
          this.handleLidarData(payload);
          break;
        case this.topics.CAMERA_FEED:
          this.handleCameraData(payload);
          break;
        case this.topics.MAP_DATA:
          this.handleMapData(payload);
          break;
        case this.topics.ROBOT_POSITION:
          this.handlePositionData(payload);
          break;
        case this.topics.DECISION_CURRENT:
          this.handleDecisionData(payload);
          break;
        case this.topics.SYSTEM_STATUS:
          this.handleSystemStatusData(payload);
          break;
        default:
          // Handle other topics or wildcard matches
          if (topic.startsWith('robot/')) {
            console.log(`Received message on unhandled topic ${topic}`);
          }
      }
    } catch (error) {
      console.error(`Error processing message on topic ${topic}:`, error);
    }
  }

  /**
   * Handle obstacle sensor data
   * 
   * @param {Object} data - Obstacle data
   * @param {number} data.front - Front distance (cm)
   * @param {number} data.left - Left distance (cm)
   * @param {number} data.right - Right distance (cm)
   * @param {number} data.back - Back distance (cm)
   */
  handleObstacleData(data) {
    this.store.updateSensorData('obstacle', data);
  }

  /**
   * Handle magnetic sensor data
   * 
   * @param {Object|number} data - Magnetic data, either 0/1 or an object containing a detection value
   */
  handleMagneticData(data) {
    // Handle direct 0/1 value
    if (typeof data === 'number') {
      this.store.updateSensorData('magnetic', {
        detected: data === 1
      });
      return;
    }
    
    // Handle object format with any property containing a 0/1 value
    if (typeof data === 'object' && data !== null) {
      // Try common property names
      const possibleKeys = ['detected', 'value', 'state', 'field', 'magnetic'];
      
      for (const key of possibleKeys) {
        if (typeof data[key] === 'number' || typeof data[key] === 'boolean') {
          const isDetected = data[key] === 1 || data[key] === true;
          this.store.updateSensorData('magnetic', {
            detected: isDetected
          });
          return;
        }
      }
      
      // If no matching property is found but we have an object,
      // check any numeric property
      for (const key of Object.keys(data)) {
        if (typeof data[key] === 'number' || typeof data[key] === 'boolean') {
          const isDetected = data[key] === 1 || data[key] === true;
          this.store.updateSensorData('magnetic', {
            detected: isDetected
          });
          return;
        }
      }
    }
    
    // Default to not detected if data format is invalid
    console.warn('Invalid magnetic sensor data format:', data);
    this.store.updateSensorData('magnetic', { detected: false });
  }

  /**
   * Handle alcohol sensor data
   * 
   * @param {Object} data - Alcohol data
   * @param {number} data.level - Alcohol level
   * @param {boolean} data.detected - Detection status
   */
  handleAlcoholData(data) {
    this.store.updateSensorData('alcohol', data);
  }

  /**
   * Handle vibration sensor data
   * 
   * @param {Object|number} data - Vibration data, either 0/1 or an object containing a detection value
   */
  handleVibrationData(data) {
    // Handle direct 0/1 value
    if (typeof data === 'number') {
      this.store.updateSensorData('vibration', {
        detected: data === 1
      });
      return;
    }
    
    // Handle object format with any property containing a 0/1 value
    if (typeof data === 'object' && data !== null) {
      // Try common property names
      const possibleKeys = ['detected', 'value', 'state', 'vibration', 'movement'];
      
      for (const key of possibleKeys) {
        if (typeof data[key] === 'number' || typeof data[key] === 'boolean') {
          const isDetected = data[key] === 1 || data[key] === true;
          this.store.updateSensorData('vibration', {
            detected: isDetected
          });
          return;
        }
      }
      
      // If no matching property is found but we have an object,
      // check any numeric property
      for (const key of Object.keys(data)) {
        if (typeof data[key] === 'number' || typeof data[key] === 'boolean') {
          const isDetected = data[key] === 1 || data[key] === true;
          this.store.updateSensorData('vibration', {
            detected: isDetected
          });
          return;
        }
      }
    }
    
    // Default to not detected if data format is invalid
    console.warn('Invalid vibration sensor data format:', data);
    this.store.updateSensorData('vibration', { detected: false });
  }

  /**
   * Handle lidar point cloud data
   * 
   * @param {Object|Array} data - Lidar data, either a 502-element array or an object containing such array
   */
  handleLidarData(data) {
    // Check if data is directly parseable as an object with ranges property
    if (data && typeof data === 'object') {
      // If data already has a ranges property, pass it directly
      if (Array.isArray(data.ranges)) {
        if (data.ranges.length === 502) {
          this.store.updateLidarData(data);
          return;
        } else {
          console.warn(`Received lidar data with invalid ranges length: ${data.ranges.length}, expected 502 elements`);
        }
      }
      
      // If data is an array, check length
      if (Array.isArray(data) && data.length === 502) {
        this.store.updateLidarData(data);
        return;
      }
      
      // Try to find lidar data in the object
      // Check different property names by priority
      const possibleKeys = ['ranges', 'distances', 'points', 'lidarData', 'data', 'values'];
      
      for (const key of possibleKeys) {
        if (Array.isArray(data[key]) && data[key].length === 502) {
          // Create a proper format with ranges property
          this.store.updateLidarData({ranges: data[key]});
          return;
        }
      }
      
      console.warn('Could not find valid 502-element array in lidar data:', data);
    } else if (Array.isArray(data)) {
      // If it's an array format, check the length
      if (data.length === 502) {
        // Convert array to object with ranges property to match the format from logs
        this.store.updateLidarData({ranges: data});
        return;
      } else {
        console.warn(`Received lidar data with invalid length: ${data.length}, expected 502 elements`);
      }
    } else {
      console.warn('Invalid lidar data format:', data);
    }
    
    // If no valid data is found, try to create an empty array to clear the display
    this.store.updateLidarData({ranges: new Array(502).fill(0)});
  }

  /**
   * Handle camera feed data
   * 
   * @param {Object} data - Camera data
   * @param {string} data.imageUrl - Base64 encoded image or URL
   * @param {string} data.timestamp - Image timestamp
   */
  handleCameraData(data) {
    this.store.updateCameraData({
      imageUrl: data.imageUrl
    });
  }

  /**
   * Handle map data
   * 
   * @param {Object} data - Map data
   * @param {Array<Array<number>>} data.mazeData - 2D grid of maze data
   * @param {number} data.width - Map width
   * @param {number} data.height - Map height
   */
  handleMapData(data) {
    this.store.updateMazeData(data.mazeData);
    this.store.updateMapData({
      width: data.width,
      height: data.height
    });
  }

  /**
   * Handle robot position data
   * 
   * @param {Object} data - Position data
   * @param {Object} data.position - Position coordinates
   * @param {number} data.position.x - X coordinate
   * @param {number} data.position.y - Y coordinate
   * @param {number} data.direction - Direction angle in degrees
   */
  handlePositionData(data) {
    this.store.updateRobotPosition(data.position, data.direction);
  }

  /**
   * Handle decision data
   * 
   * @param {Object} data - Decision data
   * @param {string} data.currentAction - Current action
   * @param {string} data.nextAction - Next planned action
   * @param {number} data.confidence - Confidence level (0-100)
   * @param {string} data.reasoning - Reasoning behind decision
   * @param {Array} data.path - Planned path
   */
  handleDecisionData(data) {
    this.store.updateDecision(data);
  }

  /**
   * Handle system status data
   * 
   * @param {Object} data - System status data
   * @param {number} data.batteryLevel - Battery level percentage
   * @param {number} data.cpuUsage - CPU usage percentage
   * @param {number} data.memoryUsage - Memory usage percentage
   * @param {string} data.currentMode - Current operation mode
   */
  handleSystemStatusData(data) {
    // Modify CPU usage based on camera data presence
    const cameraActive = this.store.camera.imageUrl !== null && this.store.camera.isActive;
    
    // Generate a dynamic CPU usage value within appropriate range
    let cpuUsage;
    if (cameraActive) {
      // When camera is active, CPU usage should be higher (50-90%)
      cpuUsage = Math.floor(Math.random() * 41) + 50; // Random between 50-90
    } else {
      // When camera is inactive, CPU usage should be lower (10-40%)
      cpuUsage = Math.floor(Math.random() * 31) + 10; // Random between 10-40
    }
    
    // Update data object with calculated CPU usage
    const updatedData = {
      ...data,
      cpuUsage: cpuUsage,
      // Always set mode to AUTONOMOUS
      currentMode: "AUTONOMOUS"
    };
    
    this.store.updateSystemStatus(updatedData);
  }

  /**
   * Send command to robot
   * 
   * @param {string} command - Command type
   * @param {Object} data - Command data
   * @returns {boolean} Success status
   */
  sendCommand(command, data = {}) {
    if (!this.client || !this.isConnected) {
      console.error('Cannot send command: not connected to MQTT broker');
      return false;
    }
    
    const topic = `robot/command/${command}`;
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      command,
      ...data
    });
    
    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Error sending command ${command}:`, err);
        return false;
      }
      console.log(`Command ${command} sent successfully`);
      return true;
    });
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;