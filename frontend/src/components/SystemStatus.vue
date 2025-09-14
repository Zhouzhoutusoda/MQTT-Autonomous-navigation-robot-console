<template>
  <div class="system-status">
    <div class="status-item battery" v-if="isCameraActive">
      <div class="status-icon">
        <i class="fas fa-battery-three-quarters"></i>
      </div>
      <div class="status-info">
        <div class="status-label">Battery</div>
        <div class="status-value">89%</div>
        <div class="status-bar">
          <div 
            class="status-progress" 
            :style="{ width: '89%', backgroundColor: batteryColor }"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="status-item cpu" v-if="isCameraActive">
      <div class="status-icon">
        <i class="fas fa-microchip"></i>
      </div>
      <div class="status-info">
        <div class="status-label">CPU</div>
        <div class="status-value">37%</div>
        <div class="status-bar">
          <div 
            class="status-progress" 
            :style="{ width: '37%', backgroundColor: cpuColor }"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="status-item memory" v-if="isCameraActive">
      <div class="status-icon">
        <i class="fas fa-memory"></i>
      </div>
      <div class="status-info">
        <div class="status-label">Memory</div>
        <div class="status-value">37%</div>
        <div class="status-bar">
          <div 
            class="status-progress" 
            :style="{ width: '37%', backgroundColor: memoryColor }"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="status-item mode">
      <div class="status-icon">
        <i class="fas fa-robot"></i>
      </div>
      <div class="status-info">
        <div class="status-label">Mode</div>
        <div class="status-value mode-value">AUTONOMOUS</div>
      </div>
    </div>
    
    <div class="status-item connection">
      <div class="status-icon">
        <i class="fas fa-wifi"></i>
      </div>
      <div class="status-info">
        <div class="status-label">Status</div>
        <div 
          class="status-value connection-value" 
          :class="{ 
            'connected': systemStatus.connectionStatus === 'Connected' || systemStatus.connectionStatus === 'Online',
            'disconnected': systemStatus.connectionStatus === 'Disconnected' || systemStatus.connectionStatus === 'Offline' || systemStatus.connectionStatus === 'Error' || systemStatus.connectionStatus === 'Connection failed'
          }"
        >
          {{ isConnected ? 'Online' : 'Offline' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRobotStore } from '../stores/robotStore';

export default {
  name: 'SystemStatus',
  setup() {
    const robotStore = useRobotStore();
    
    // Check if connection is established
    const isConnected = computed(() => {
      const status = robotStore.systemStatus.connectionStatus;
      return status === 'Connected' || status === 'Online';
    });
    
    // Check if camera is active
    const isCameraActive = computed(() => {
      return robotStore.camera.isActive && robotStore.camera.imageUrl !== null;
    });
    
    // Calculate battery color based on fixed level of 89%
    const batteryColor = computed(() => {
      return '#45ff45'; // Green for 89% (> 70%)
    });
    
    // Calculate CPU color based on fixed usage of 37%
    const cpuColor = computed(() => {
      return '#45ff45'; // Green for 37% (< 50%)
    });
    
    // Memory color for fixed 37% usage
    const memoryColor = computed(() => {
      return '#45ff45'; // Green color for 37% (less than 50%)
    });
    
    return {
      systemStatus: robotStore.systemStatus,
      isConnected,
      isCameraActive,
      batteryColor,
      cpuColor,
      memoryColor
    };
  }
};
</script>

<style scoped>
.system-status {
  display: flex;
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  justify-content: space-between;
}

.status-item {
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-right: 1px solid #333;
  margin: 5px 0;
}

.status-item:last-child {
  border-right: none;
}

.status-icon {
  color: #aaa;
  font-size: 1.2rem;
  width: 30px;
  display: flex;
  justify-content: center;
  margin-right: 10px;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  color: #aaa;
  font-size: 0.7rem;
  margin-bottom: 2px;
  text-transform: uppercase;
}

.status-value {
  color: #f0f0f0;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-bar {
  height: 4px;
  background-color: #333;
  border-radius: 2px;
  overflow: hidden;
}

.status-progress {
  height: 100%;
  transition: width 0.5s, background-color 0.5s;
}

.mode-value {
  color: #3070cc;
}

.connection-value {
  font-weight: 500;
}

.connection-value.connected {
  color: #45ff45;
}

.connection-value.disconnected {
  color: #ff4545;
}

/* 大屏设备 (1200px以上) - 默认布局 */

/* 中等屏幕设备 (992px - 1199px) */
@media (max-width: 1199px) {
  .system-status {
    flex-wrap: wrap;
    padding: 8px;
  }
  
  .status-item {
    min-width: 120px;
    margin: 4px 0;
    padding: 0 8px;
  }
  
  .status-icon {
    font-size: 1rem;
    width: 25px;
    margin-right: 8px;
  }
  
  .status-label {
    font-size: 0.65rem;
  }
  
  .status-value {
    font-size: 0.8rem;
    margin-bottom: 4px;
  }
}

/* 小屏设备 (768px - 991px) */
@media (max-width: 991px) {
  .system-status {
    padding: 8px;
    overflow: visible; /* 确保内容可见 */
  }

  .status-item {
    min-width: 110px;
    flex-basis: calc(33.33% - 10px);
    border-right: none;
    border-bottom: 1px solid #333;
    padding: 5px 10px;
  }
  
  .status-item:nth-child(3) {
    border-right: none;
  }
  
  .status-item:nth-child(4), 
  .status-item:nth-child(5) {
    border-bottom: none;
  }
}

/* 平板设备 (576px - 767px) */
@media (max-width: 767px) {
  .system-status {
    padding: 6px;
    flex-direction: row;
    flex-wrap: wrap;
    height: auto;
    overflow: visible;
  }
  
  .status-item {
    min-width: 0;
    flex-basis: calc(50% - 5px);
    margin: 3px 0;
    padding: 4px 6px;
  }
  
  .status-item:nth-child(even) {
    border-right: none;
  }
  
  .status-item:nth-child(3) {
    border-right: 1px solid #333;
  }
  
  .status-item:nth-child(5) {
    flex-basis: 100%;
    border-right: none;
    border-bottom: none;
    justify-content: center;
  }
}

/* 手机设备 (575px以下) */
@media (max-width: 575px) {
  .system-status {
    padding: 5px;
    display: flex;
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  
  .status-item {
    flex-basis: 100%;
    border-right: none;
    padding: 6px 5px;
    margin: 3px 0;
    height: auto;
    min-height: 30px;
  }
  
  .status-item:not(:last-child) {
    border-bottom: 1px solid #333;
  }
  
  .status-item:nth-child(3) {
    border-right: none;
  }
  
  .status-info {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .status-label {
    width: 70px;
    margin-bottom: 0;
    margin-right: 5px;
  }
  
  .status-value {
    flex: 1;
    margin-bottom: 0;
  }
  
  .status-bar {
    width: 100%;
    margin-top: 4px;
  }
}

/* 超小屏幕设备 (360px以下) */
@media (max-width: 360px) {
  .status-icon {
    font-size: 0.9rem;
    width: 20px;
    margin-right: 5px;
  }
  
  .status-label {
    font-size: 0.6rem;
    width: 60px;
  }
  
  .status-value {
    font-size: 0.75rem;
  }
}
</style> 