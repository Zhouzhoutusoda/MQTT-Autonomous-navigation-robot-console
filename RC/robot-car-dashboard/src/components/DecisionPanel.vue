<template>
  <div class="decision-panel">
    <div class="panel-header">
      <h2>Decision-making System</h2>
    </div>

    <div class="decision-content">
      <div class="decision-current">
        <div class="decision-label">Current Decision</div>
        <div class="decision-action">{{ decisions.currentAction || '--' }}</div>
        <div class="confidence-bar">
          <div class="confidence-level" :style="{ width: `${decisions.confidence}%` }"></div>
        </div>
      </div>
      
      <div class="decision-reasoning">
        <div class="decision-label">Decision Basis</div>
        <div class="reasoning-text">{{ getDecisionBasis }}</div>
      </div>
      
      <div class="decision-history">
        <div class="decision-label">Historical Decisions</div>
        <div class="history-list" v-if="historyItems.length > 0">
          <div v-for="(item, index) in historyItems" :key="index" class="history-item">
            <div class="history-time">{{ formatTime(item.timestamp) }}</div>
            <div class="history-action">{{ item.action || '--' }}</div>
          </div>
        </div>
        <div v-else class="no-history">
          No historical decisions
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, watch, ref, onMounted } from 'vue';
import { useRobotStore } from '../stores/robotStore';

export default {
  name: 'DecisionPanel',
  setup() {
    const robotStore = useRobotStore();
    
    // Track previous sensor states to detect changes
    const prevSensorStates = ref({
      magnetic: false,
      alcohol: false,
      vibration: false,
      frontObstacle: false, // For front obstacle < 14cm
      currentDecision: ''
    });
    
    // Get the most recent historical decisions
    const historyItems = computed(() => {
      return robotStore.history.decisions.slice(-5).reverse();
    });
    
    // Determine decision basis based on sensor values
    const getDecisionBasis = computed(() => {
      const sensors = robotStore.sensors;
      let basis = [];
      
      if (sensors.magnetic.detected) {
        basis.push("Magnetic Field (1)");
      }
      
      if (sensors.alcohol.detected) {
        basis.push("Alcohol Detected");
      }
      
      if (sensors.vibration.detected) {
        basis.push("Vibration/Shock (1)");
      }
      
      if (sensors.obstacle.front < 20) {
        basis.push(`Front Obstacle: ${sensors.obstacle.front.toFixed(1)}cm`);
      }
      
      if (sensors.lidarData && sensors.lidarData.length > 0) {
        const validPoints = sensors.lidarData.filter(d => d > 0 && !isNaN(d)).length;
        basis.push(`Lidar: ${validPoints} points`);
      }
      
      // Default case when no specific sensor is triggered
      if (basis.length === 0) {
        return "No active sensor inputs";
      }
      
      return basis.join(", ");
    });
    
    // Add a decision to history
    const addToHistory = (action, reasoning = null) => {
      robotStore.updateDecision({
        currentAction: action,
        confidence: 95,
        reasoning: reasoning
      });
    };
    
    // Initialize previous states
    onMounted(() => {
      prevSensorStates.value = {
        magnetic: robotStore.sensors.magnetic.detected,
        alcohol: robotStore.sensors.alcohol.detected,
        vibration: robotStore.sensors.vibration.detected,
        frontObstacle: robotStore.sensors.obstacle.front < 14,
        currentDecision: robotStore.decisions.currentAction
      };
      
      // Add initial decision
      addToHistory("SYSTEM_INITIALIZED", "System startup complete");
    });
    
    // Watch for magnetic sensor changes
    watch(
      () => robotStore.sensors.magnetic.detected,
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          const action = newValue ? "MAGNETIC_FIELD_DETECTED" : "MAGNETIC_FIELD_CLEARED";
          addToHistory(action, `Magnetic sensor: ${newValue ? '1' : '0'}`);
          prevSensorStates.value.magnetic = newValue;
        }
      }
    );
    
    // Watch for alcohol sensor changes
    watch(
      () => robotStore.sensors.alcohol.detected,
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          const action = newValue ? "ALCOHOL_DETECTED" : "ALCOHOL_CLEARED";
          addToHistory(action, `Alcohol sensor: ${newValue ? 'Detected' : 'Clear'}`);
          prevSensorStates.value.alcohol = newValue;
        }
      }
    );
    
    // Watch for vibration sensor changes
    watch(
      () => robotStore.sensors.vibration.detected,
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          const action = newValue ? "VIBRATION_DETECTED" : "VIBRATION_CLEARED";
          addToHistory(action, `Vibration sensor: ${newValue ? '1' : '0'}`);
          prevSensorStates.value.vibration = newValue;
        }
      }
    );
    
    // Watch for front obstacle < 14cm
    watch(
      () => robotStore.sensors.obstacle.front,
      (newValue, oldValue) => {
        const isCloseObstacle = newValue < 14;
        if (isCloseObstacle !== prevSensorStates.value.frontObstacle) {
          const action = isCloseObstacle ? "CLOSE_OBSTACLE_DETECTED" : "OBSTACLE_CLEARED";
          addToHistory(action, `Front distance: ${newValue.toFixed(1)}cm`);
          prevSensorStates.value.frontObstacle = isCloseObstacle;
        }
      }
    );
    
    // Watch for lidar data changes
    watch(
      () => robotStore.sensors.lidarData,
      (newData, oldData) => {
        if (newData && newData.length === 502) {
          // Only add to history if this is the first valid lidar data
          if (!oldData || oldData.length === 0) {
            addToHistory("LIDAR_DATA_RECEIVED", "Processing 3D point cloud");
          }
        }
      }
    );
    
    // Watch for current decision changes
    watch(
      () => robotStore.decisions.currentAction,
      (newValue, oldValue) => {
        // Only track external decision changes, not ones we just made
        if (newValue !== oldValue && 
            newValue !== "MAGNETIC_FIELD_DETECTED" && 
            newValue !== "MAGNETIC_FIELD_CLEARED" &&
            newValue !== "ALCOHOL_DETECTED" && 
            newValue !== "ALCOHOL_CLEARED" &&
            newValue !== "VIBRATION_DETECTED" && 
            newValue !== "VIBRATION_CLEARED" &&
            newValue !== "CLOSE_OBSTACLE_DETECTED" && 
            newValue !== "OBSTACLE_CLEARED" &&
            newValue !== "SYSTEM_INITIALIZED" &&
            newValue !== "LIDAR_DATA_RECEIVED") {
          
          addToHistory(`DECISION_CHANGED: ${newValue}`);
          prevSensorStates.value.currentDecision = newValue;
        }
      }
    );
    
    // Format timestamp to a more readable format
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    };
    
    return {
      decisions: robotStore.decisions,
      historyItems,
      formatTime,
      getDecisionBasis
    };
  }
};
</script>

<style scoped>
.decision-panel {
  background-color: #111;
  border-radius: 12px;
  overflow: hidden;
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.panel-header {
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.panel-header h2 {
  margin: 0;
  color: #f0f0f0;
  font-size: 1.2rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.decision-content {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  gap: 15px;
  flex: 1;
  overflow: auto;
}

.decision-current, .decision-reasoning, .decision-history {
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.decision-current {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}

.decision-reasoning {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  min-height: 120px;
}

.decision-history {
  grid-row: 3 / 4;
  grid-column: 1 / 2;
  min-height: 150px;
}

.decision-label {
  color: #aaa;
  font-size: 0.85rem;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.decision-action {
  color: #45ff45;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 10px;
  text-shadow: 0 0 6px rgba(69, 255, 69, 0.6);
  letter-spacing: 0.5px;
}

.confidence-bar {
  width: 100%;
  height: 8px;
  background-color: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
}

.confidence-level {
  height: 100%;
  background: linear-gradient(90deg, #ff4545 0%, #ffaa00 50%, #45ff45 100%);
  transition: width 0.5s;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.4);
}

.reasoning-text {
  flex: 1;
  background-color: #222;
  border-radius: 5px;
  padding: 12px;
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-y: auto;
  white-space: pre-wrap;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  margin-top: 5px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #333;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: #222;
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  color: #aaa;
  font-size: 0.85rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.history-action {
  color: #f0f0f0;
  font-size: 0.9rem;
}

.no-history {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 0.9rem;
}

@media (max-width: 992px) {
  .decision-content {
    grid-template-columns: 1fr;
  }
  
  .decision-current {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
  }
  
  .decision-reasoning {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
  }
  
  .decision-history {
    grid-row: 3 / 4;
    grid-column: 1 / 2;
  }
}
</style> 