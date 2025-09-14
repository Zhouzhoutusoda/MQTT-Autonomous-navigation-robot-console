import { defineStore } from 'pinia'

export const useRobotStore = defineStore('robot', {
  state: () => ({
    // Sensor data
    sensors: {
      obstacle: {
        front: 0,
        left: 0,
        right: 0,
        back: 0
      },
      magnetic: {
        detected: false
      },
      alcohol: {
        level: 0,
        detected: false
      },
      vibration: {
        detected: false
      },
      lidarData: [] // Store lidar distance data (array of 502 distance values)
    },
    
    // Decision system data
    decisions: {
      currentAction: 'Waiting',
      nextAction: 'Undecided',
      confidence: 0,
      reasoning: '',
      path: []
    },
    
    // System status
    systemStatus: {
      batteryLevel: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      connectionStatus: 'Offline',
      currentMode: 'Manual Control'
    },
    
    // Historical data (for charts)
    history: {
      obstacles: [],
      decisions: [],
      path: []
    },
    
    // Camera data
    camera: {
      imageUrl: null,
      isActive: true,
      resolution: '1280x720',
      fps: 30
    },
    
    // Map data
    map: {
      mazeData: [], // 2D array representing maze map
      robotPosition: { x: 0, y: 0 },
      robotDirection: 0, // Angle in degrees, 0 is right, 90 is down
      explorationPercentage: 0,
      width: 20,
      height: 20
    }
  }),
  
  actions: {
    updateSensorData(sensorType, data) {
      if (this.sensors[sensorType] !== undefined) {
        this.sensors[sensorType] = { ...this.sensors[sensorType], ...data };
      }
    },
    
    // Update lidar data with array of 502 distance values
    updateLidarData(data) {
      // Handle various data formats
      let distanceArray = null;
      
      // Handle plain array format
      if (Array.isArray(data)) {
        distanceArray = data;
      } 
      // Handle object with ranges property
      else if (data && typeof data === 'object' && Array.isArray(data.ranges)) {
        distanceArray = data.ranges;
      }
      // Handle string format from MQTT "lidar: [0.304, 0.301, ...]" 
      else if (typeof data === 'string' && data.startsWith('lidar:')) {
        try {
          const dataString = data.replace('lidar:', '').trim();
          const parsedData = JSON.parse(dataString);
          if (Array.isArray(parsedData)) {
            distanceArray = parsedData;
          }
        } catch (e) {
          console.error('Error parsing lidar data string:', e);
          return;
        }
      } else {
        console.warn('Invalid lidar data format, expected array, object with ranges property, or string');
        return;
      }
      
      // Verify length - expecting 502 elements for a complete scan
      if (distanceArray.length === 502) {
        // Convert any non-numeric values to 0 (invalid readings)
        const validatedData = distanceArray.map(val => {
          // Check if value is numeric and not NaN
          if (typeof val === 'number' && !isNaN(val)) {
            // Keep value within valid range (no negative values)
            return val < 0 ? 0 : val;
          }
          return 0; // Invalid or NaN values become 0
        });
        
        this.sensors.lidarData = [...validatedData];
      } else {
        console.warn(`Received lidar data with unexpected length: ${distanceArray.length}, expected 502 elements`);
        
        // If array is smaller than 502, pad with zeros
        // If array is larger, truncate
        if (distanceArray.length < 502) {
          this.sensors.lidarData = [...distanceArray, ...new Array(502 - distanceArray.length).fill(0)];
        } else {
          this.sensors.lidarData = distanceArray.slice(0, 502);
        }
      }
    },
    
    updateDecision(decisionData) {
      this.decisions = { ...this.decisions, ...decisionData };
      
      // Save decision history
      this.history.decisions.push({
        timestamp: new Date(),
        action: decisionData.currentAction,
        reasoning: decisionData.reasoning
      });
      
      // Limit history size
      if (this.history.decisions.length > 100) {
        this.history.decisions.shift();
      }
    },
    
    updateSystemStatus(statusData) {
      this.systemStatus = { ...this.systemStatus, ...statusData };
    },
    
    updateCameraData(cameraData) {
      this.camera = { ...this.camera, ...cameraData };
    },
    
    updateMapData(mapData) {
      this.map = { ...this.map, ...mapData };
    },
    
    updateRobotPosition(position, direction) {
      this.map.robotPosition = position || this.map.robotPosition;
      
      if (direction !== undefined) {
        this.map.robotDirection = direction;
      }
    },
    
    updateMazeData(mazeData) {
      this.map.mazeData = mazeData;
      
      // Calculate exploration percentage
      if (mazeData && mazeData.length > 0) {
        const totalCells = this.map.width * this.map.height;
        const exploredCells = mazeData.flat().filter(cell => cell !== 0).length;
        this.map.explorationPercentage = Math.round((exploredCells / totalCells) * 100);
      }
    },
    
    reset() {
      // Reset all data to initial state
      this.$reset();
    }
  }
}) 