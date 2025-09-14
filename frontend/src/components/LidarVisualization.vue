<template>
  <div class="lidar-container">
    <div class="lidar-header">
      <h3>3D Lidar Visualization</h3>
    </div>
    <div ref="lidarCanvas" class="lidar-canvas"></div>
    <div class="lidar-controls">
      <button @click="resetCamera" class="control-button">Reset View</button>
      <div class="control-options">
        <div class="layer-control">
          <span>Layers:</span>
          <button @click="decreaseLayers" class="control-button layer-button">-</button>
          <span>{{ verticalLayers }}</span>
          <button @click="increaseLayers" class="control-button layer-button">+</button>
        </div>
      </div>
      <div class="lidar-info">
        <span>Points: {{ pointCount }}/502</span>
      </div>
      <div class="lidar-status">
        <span class="status-label">Status:</span>
        <span class="status-value" :class="{ 'status-active': isActive }">
          {{ isActive ? 'Live Data' : 'No Data' }}
        </span>
      </div>
      <button @click="clearLidarPoints" class="control-button">Clear</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRobotStore } from '../stores/robotStore';
import lidarRenderService from '../services/lidarRenderService';
import mqttService from '../services/mqttService';

export default {
  name: 'LidarVisualization',
  setup() {
    const robotStore = useRobotStore();
    const lidarCanvas = ref(null);
    const isActive = ref(false);
    const pointCount = ref(0);
    const verticalLayers = ref(5);
    const lastPointTime = ref(0);
    
    // Maximum number of lidar points to store
    const MAX_LIDAR_POINTS = 502;
    
    // Clear all lidar data
    const clearLidarPoints = () => {
      lidarRenderService.clearPointCloud();
      pointCount.value = 0;
      robotStore.sensors.lidarData = [];
      isActive.value = false;
    };
    
    // Watch for lidar data changes in the store
    watch(
      () => robotStore.sensors.lidarData,
      (newData) => {
        if (newData && Array.isArray(newData) && newData.length === 502) {
          // Process the 502-element distance array
          // Clean array - replace NaN with 0 for proper rendering
          const cleanedData = newData.map(val => isNaN(val) ? 0 : val);
          
          // Update point cloud visualization
          const validPoints = lidarRenderService.updatePointCloudLegacy(cleanedData);
          pointCount.value = validPoints || cleanedData.filter(distance => distance > 0).length;
          isActive.value = true;
          lastPointTime.value = Date.now();
        } else if (newData && typeof newData === 'string' && newData.startsWith('lidar:')) {
          // Handle string format "lidar: [0.304, 0.301, ...]" from MQTT
          try {
            const dataString = newData.replace('lidar:', '').trim();
            const parsedData = JSON.parse(dataString);
            if (Array.isArray(parsedData) && parsedData.length === 502) {
              // Clean array - replace NaN with 0 for proper rendering
              const cleanedData = parsedData.map(val => isNaN(val) ? 0 : val);
              
              // Update point cloud visualization
              const validPoints = lidarRenderService.updatePointCloudLegacy(cleanedData);
              pointCount.value = validPoints || cleanedData.filter(distance => distance > 0).length;
              isActive.value = true;
              lastPointTime.value = Date.now();
            }
          } catch (e) {
            console.error('Error parsing lidar data string:', e);
            checkDataTimeout();
          }
        } else {
          // If data format is not as expected, we don't clear
          // This allows accumulation of points from other sources
          checkDataTimeout();
        }
      }
    );
    
    // Connect to MQTT when component mounts (if not already connected)
    onMounted(() => {
      // If mqttService is not connected, try to connect
      if (mqttService && !mqttService.isConnected) {
        mqttService.connect().catch(error => {
          console.error('Failed to connect to MQTT:', error);
        });
      }
      
      // The service will automatically subscribe to topics and update the store
    });

    // Check for data timeout (no data received for 3 seconds)
    const checkDataTimeout = () => {
      if (Date.now() - lastPointTime.value > 3000) {
        isActive.value = false;
      }
    };

    // Set up interval to check for data timeout
    let timeoutChecker;
    onMounted(() => {
      timeoutChecker = setInterval(checkDataTimeout, 1000);
    });

    onUnmounted(() => {
      clearInterval(timeoutChecker);
    });

    // Increase vertical layers
    const increaseLayers = () => {
      verticalLayers.value = lidarRenderService.setVerticalLayers(verticalLayers.value + 1);
      
      // Update existing point cloud
      if (robotStore.sensors.lidarData && Array.isArray(robotStore.sensors.lidarData) && 
          robotStore.sensors.lidarData.length === 502) {
        // Clean array - replace NaN with 0 for proper rendering
        const cleanedData = robotStore.sensors.lidarData.map(val => isNaN(val) ? 0 : val);
        lidarRenderService.updatePointCloudLegacy(cleanedData);
      }
    };

    // Decrease vertical layers
    const decreaseLayers = () => {
      verticalLayers.value = lidarRenderService.setVerticalLayers(verticalLayers.value - 1);
      
      // Update existing point cloud
      if (robotStore.sensors.lidarData && Array.isArray(robotStore.sensors.lidarData) && 
          robotStore.sensors.lidarData.length === 502) {
        // Clean array - replace NaN with 0 for proper rendering
        const cleanedData = robotStore.sensors.lidarData.map(val => isNaN(val) ? 0 : val);
        lidarRenderService.updatePointCloudLegacy(cleanedData);
      }
    };
    
    onMounted(() => {
      if (lidarCanvas.value) {
        lidarRenderService.init(lidarCanvas.value);
        
        // Initial values consistent with service
        verticalLayers.value = lidarRenderService.verticalLayers;
        
        // Immediately render existing data
        if (robotStore.sensors.lidarData && Array.isArray(robotStore.sensors.lidarData) && 
            robotStore.sensors.lidarData.length === 502) {
          // Clean array - replace NaN with 0 for proper rendering
          const cleanedData = robotStore.sensors.lidarData.map(val => isNaN(val) ? 0 : val);
          const validPoints = lidarRenderService.updatePointCloudLegacy(cleanedData);
          pointCount.value = validPoints || cleanedData.filter(distance => distance > 0).length;
          isActive.value = true;
          lastPointTime.value = Date.now();
        }
        
        // Add window resize listener to ensure 3D rendering area responds correctly
        window.addEventListener('resize', handleResize);
        
        // Monitor MQTT panel collapse state changes, adjust rendering size
        document.addEventListener('mqttPanelToggle', () => {
          setTimeout(() => {
            handleResize();
          }, 300); // Add delay to ensure DOM has updated
        });
      }
    });
    
    onUnmounted(() => {
      lidarRenderService.dispose();
      // Remove window resize listener
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mqttPanelToggle', handleResize);
    });
    
    const resetCamera = () => {
      if (lidarRenderService.camera) {
        lidarRenderService.camera.position.set(0, 8, 12);
        lidarRenderService.camera.lookAt(0, 0, 0);
        if (lidarRenderService.controls) {
          lidarRenderService.controls.reset();
        }
      }
    };
    
    // Handle window resize
    const handleResize = () => {
      if (lidarCanvas.value) {
        nextTick(() => {
          // Notify lidarRenderService to update size
          lidarRenderService.onWindowResize(lidarCanvas.value);
        });
      }
    };
    
    return {
      lidarCanvas,
      isActive,
      pointCount,
      verticalLayers,
      resetCamera,
      increaseLayers,
      decreaseLayers,
      clearLidarPoints
    };
  }
};
</script>

<style scoped>
.lidar-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #111;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.lidar-header {
  padding: 10px 15px;
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.lidar-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #4fd1c5;
}

.lidar-canvas {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 350px; /* Ensure 3D rendering area has enough space */
}

.lidar-controls {
  position: absolute;
  bottom: 15px;
  left: 15px;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
  gap: 8px;
}

.control-button {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.control-button:hover {
  background-color: rgba(0, 0, 0, 0.9);
}

.control-options {
  display: flex;
  gap: 4px;
  align-items: center;
}

.layer-control {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 12px;
}

.layer-button {
  background-color: rgba(100, 100, 100, 0.5);
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}

.lidar-status, .lidar-info {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.status-label {
  margin-right: 5px;
}

.status-value {
  color: #ff4545;
}

.status-active {
  color: #45ff45;
}

/* 响应式布局调整 */
@media (max-width: 1200px) {
  .lidar-canvas {
    min-height: 300px;
  }
  
  .lidar-header h3 {
    font-size: 0.95rem;
  }
}

@media (max-width: 992px) {
  .lidar-canvas {
    min-height: 280px;
  }
  
  .lidar-controls {
    bottom: 10px;
    left: 10px;
  }
  
  .control-button, .lidar-status, .lidar-info {
    padding: 6px 10px;
    font-size: 11px;
  }
}

@media (max-width: 768px) {
  .lidar-canvas {
    min-height: 250px;
  }
  
  .lidar-header {
    padding: 8px 12px;
  }
  
  .lidar-header h3 {
    font-size: 0.9rem;
  }
  
  .lidar-controls {
    right: 15px;
    justify-content: space-between;
  }
}

@media (max-width: 576px) {
  .lidar-container {
    height: 100%;
    min-height: 300px; /* Set minimum container height */
    position: relative;
  }
  
  .lidar-canvas {
    min-height: 250px;
  }
  
  .lidar-controls {
    bottom: 8px;
    left: 8px;
    right: 8px;
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .control-button, .lidar-status, .lidar-info {
    padding: 5px 8px;
    font-size: 10px;
  }
}
</style> 