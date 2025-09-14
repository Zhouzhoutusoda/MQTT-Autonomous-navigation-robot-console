<template>
  <div class="sensor-panel">
    <div class="panel-header">
      <h2>Sensors</h2>
    </div>
    
    <div class="sensor-grid">
      <!-- Ultrasound sensor -->
      <div class="sensor-card">
        <div class="sensor-header">
          <div class="sensor-icon ultrasound-icon">
            <i class="fas fa-broadcast-tower"></i>
          </div>
          <h3>Ultrasound</h3>
        </div>
        <div class="sensor-content">
          <div class="ultrasound-display">
            <div class="ultrasound-value">{{ sensors.obstacle.front > 0 ? `${sensors.obstacle.front.toFixed(0)} cm` : '--' }}</div>
          </div>
          <div class="sensor-values ultrasound-values">
            <div>Front: {{ sensors.obstacle.front > 0 ? `${sensors.obstacle.front.toFixed(0)} cm` : '--' }}</div>
            <div>Left: {{ sensors.obstacle.left > 0 ? `${sensors.obstacle.left.toFixed(0)} cm` : '--' }}</div>
            <div>Right: {{ sensors.obstacle.right > 0 ? `${sensors.obstacle.right.toFixed(0)} cm` : '--' }}</div>
            <div>Back: {{ sensors.obstacle.back > 0 ? `${sensors.obstacle.back.toFixed(0)} cm` : '--' }}</div>
          </div>
        </div>
      </div>
      
      <!-- Magnetic sensor -->
      <div class="sensor-card">
        <div class="sensor-header">
          <div class="sensor-icon magnetic-icon">
            <i class="fas fa-magnet"></i>
          </div>
          <h3>Magnetic</h3>
        </div>
        <div class="sensor-content">
          <div class="magnetic-display">
            <div class="binary-indicator" :class="{ active: sensors.magnetic.detected }">
              {{ sensors.magnetic.detected ? 'YES' : 'NO' }}
            </div>
          </div>
          <div class="sensor-values magnetic-values">
            <div>Detected: {{ sensors.magnetic.detected ? 'Yes' : 'No' }}</div>
          </div>
        </div>
      </div>
      
      <!-- Alcohol sensor -->
      <div class="sensor-card">
        <div class="sensor-header">
          <div class="sensor-icon alcohol-icon">
            <i class="fas fa-wine-bottle"></i>
          </div>
          <h3>Alcohol</h3>
        </div>
        <div class="sensor-content">
          <div class="alcohol-display">
            <div class="binary-indicator" :class="{ active: sensors.alcohol.detected }">
              {{ sensors.alcohol.level > 0 ? (sensors.alcohol.detected ? 'YES' : 'NO') : '--' }}
            </div>
          </div>
          <div class="sensor-values alcohol-values">
            <div>Detected: {{ sensors.alcohol.level > 0 ? (sensors.alcohol.detected ? 'Yes' : 'No') : '--' }}</div>
          </div>
        </div>
      </div>
      
      <!-- Vibration sensor -->
      <div class="sensor-card">
        <div class="sensor-header">
          <div class="sensor-icon vibration-icon">
            <i class="fas fa-wave-square"></i>
          </div>
          <h3>Vibration</h3>
        </div>
        <div class="sensor-content">
          <div class="vibration-display">
            <div class="binary-indicator" :class="{ active: sensors.vibration.detected }">
              {{ sensors.vibration.detected ? 'YES' : 'NO' }}
            </div>
          </div>
          <div class="sensor-values vibration-values">
            <div>Detected: {{ sensors.vibration.detected ? 'Yes' : 'No' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRobotStore } from '../stores/robotStore';

export default {
  name: 'SensorDataPanel',
  setup() {
    const robotStore = useRobotStore();
    
    return {
      sensors: robotStore.sensors
    };
  }
};
</script>

<style scoped>
.sensor-panel {
  background-color: #111;
  border-radius: 12px;
  overflow: hidden;
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.panel-header {
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.panel-header h2 {
  margin: 0;
  color: #f0f0f0;
  font-size: 1.2rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.sensor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  overflow: auto;
}

.sensor-card {
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.sensor-card:hover {
  transform: translateY(-2px);
}

.sensor-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.sensor-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-right: 10px;
  flex-shrink: 0;
  font-size: 0.9rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ultrasound-icon {
  background-color: #cc3030;
}

.magnetic-icon {
  background-color: #3070cc;
}

.alcohol-icon {
  background-color: #cc7a30;
}

.vibration-icon {
  background-color: #30cc70;
}

.sensor-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #f0f0f0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.sensor-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.sensor-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.8rem;
  color: #aaa;
}

/* 障碍物传感器样式 */
.ultrasound-display, .magnetic-display, .alcohol-display, .vibration-display {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.ultrasound-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: #f0f0f0;
  text-align: center;
  width: 100%;
  padding: 5px 0;
  text-shadow: 0 0 10px rgba(204, 48, 48, 0.7);
}

/* 磁场传感器样式 */
/* 所有传感器的通用显示样式已定义在上面的 .ultrasound-display, .magnetic-display, .alcohol-display, .vibration-display 中 */

/* 振动传感器样式 */
.vibration-display {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

/* 二值指示器样式 */
.binary-indicator {
  width: 80px;
  height: 40px;
  border-radius: 6px;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
  font-size: 1rem;
  font-weight: 600;
  margin: 10px auto;
  transition: all 0.3s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.binary-indicator.active {
  background-color: #45ff45;
  color: #111;
  box-shadow: 0 0 15px rgba(69, 255, 69, 0.7);
}

.magnetic-display .binary-indicator.active {
  background-color: #3070cc;
  box-shadow: 0 0 15px rgba(48, 112, 204, 0.7);
}

.alcohol-display .binary-indicator.active {
  background-color: #cc7a30;
  box-shadow: 0 0 15px rgba(204, 122, 48, 0.7);
}

.vibration-display .binary-indicator.active {
  background-color: #ff4545;
  box-shadow: 0 0 15px rgba(255, 69, 69, 0.7);
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .sensor-card {
    padding: 8px;
  }
  
  .sensor-icon {
    width: 26px;
    height: 26px;
    font-size: 0.85rem;
    margin-right: 8px;
  }
  
  .sensor-values {
    gap: 4px;
    font-size: 0.75rem;
  }
}

@media (max-width: 1200px) {
  .sensor-values {
    grid-template-columns: 1fr 1fr;
  }
  
  .sensor-grid {
    gap: 8px;
  }
}

/* Tablet Layout */
@media (max-width: 992px) {
  .sensor-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .sensor-card {
    height: auto;
  }
}

/* Mobile Layout - iPhone 15 Pro and similar */
@media (max-width: 430px) {
  .sensor-panel {
    padding: 10px;
  }
  
  .panel-header {
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  
  .panel-header h2 {
    font-size: 1.1rem;
  }
  
  .sensor-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .sensor-card {
    display: flex;
    flex-direction: row;
    padding: 10px;
    height: auto;
    align-items: center;
  }
  
  .sensor-header {
    flex-direction: column;
    align-items: center;
    margin-bottom: 0;
    margin-right: 12px;
    width: 40px;
  }
  
  .sensor-icon {
    margin-right: 0;
    margin-bottom: 6px;
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .sensor-header h3 {
    font-size: 0.7rem;
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    text-align: center;
    white-space: normal;
    max-height: 60px;
    line-height: 1.2;
    letter-spacing: 0.5px;
  }
  
  .sensor-content {
    flex: 1;
    flex-direction: row;
    align-items: center;
  }
  
  .ultrasound-display, .magnetic-display, .alcohol-display, .vibration-display {
    flex: 1;
    height: auto;
    margin-top: 0;
    margin-right: 10px;
    min-height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ultrasound-display {
    flex-wrap: wrap;
    justify-content: space-evenly;
  }
  
  .ultrasound-value {
    margin: 3px;
  }
  
  .sensor-values {
    width: 80px;
    margin-top: 0;
    grid-template-columns: 1fr;
    font-size: 0.7rem;
    gap: 4px;
  }
  
  .magnetic-display {
    margin: 0 auto;
  }
}

/* Ultra small screens */
@media (max-width: 320px) {
  .sensor-card {
    flex-direction: column;
    padding: 8px;
  }
  
  .sensor-header {
    flex-direction: row;
    width: 100%;
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .sensor-header h3 {
    writing-mode: horizontal-tb;
    transform: none;
    max-height: none;
    font-size: 0.8rem;
  }
  
  .sensor-icon {
    margin-right: 8px;
    margin-bottom: 0;
  }
  
  .sensor-content {
    flex-direction: column;
  }
  
  .ultrasound-display, .magnetic-display, .alcohol-display, .vibration-display {
    margin-right: 0;
    margin-bottom: 6px;
    width: 100%;
  }
  
  .sensor-values {
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }
}
</style> 