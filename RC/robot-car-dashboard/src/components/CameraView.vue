<template>
  <div class="camera-container">
    <div class="panel-header">
      <h2>Camera Live View</h2>
      <div class="camera-controls">
        <button @click="toggleCamera" class="control-button">
          {{ isActive ? 'Pause' : 'Resume' }}
        </button>
        <button @click="takeSnapshot" class="control-button snapshot-button" :disabled="!imageUrl">
          Capture
        </button>
      </div>
    </div>
    
    <div class="camera-view">
      <div v-if="isActive" class="camera-active">
        <img v-if="imageUrl" :src="imageUrl" alt="Camera View" class="camera-image" />
        <div v-else class="camera-placeholder">
          <div class="camera-loading">
            <div class="camera-loading-spinner"></div>
            <span>Waiting for camera data...</span>
          </div>
        </div>
        <div class="camera-overlay" v-if="imageUrl">
          <div class="camera-info">
            <span class="camera-resolution">1280x720</span>
            <span class="camera-fps">30 FPS</span>
          </div>
          <div class="camera-recording-indicator">LIVE</div>
        </div>
      </div>
      <div v-else class="camera-inactive">
        <div class="camera-inactive-message">Camera Paused</div>
      </div>
      
      <div v-if="snapshot" class="snapshot-preview">
        <div class="snapshot-header">
          <span>Snapshot</span>
          <button @click="closeSnapshot" class="close-button">×</button>
        </div>
        <img :src="snapshot" alt="Snapshot" class="snapshot-image" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRobotStore } from '../stores/robotStore';

export default {
  name: 'CameraView',
  setup() {
    const robotStore = useRobotStore();
    const isActive = ref(true);
    const imageUrl = ref(null);
    const snapshot = ref(null);
    
    // 监听摄像头数据变化
    watch(
      () => robotStore.camera.imageUrl,
      (newUrl) => {
        if (isActive.value && newUrl) {
          imageUrl.value = newUrl;
        }
      }
    );
    
    const toggleCamera = () => {
      isActive.value = !isActive.value;
      
      if (isActive.value) {
        // 恢复使用MQTT数据
        imageUrl.value = robotStore.camera.imageUrl;
      } else {
        // 暂停数据更新
        imageUrl.value = null;
      }
    };
    
    const takeSnapshot = () => {
      if (imageUrl.value) {
        snapshot.value = imageUrl.value;
      }
    };
    
    const closeSnapshot = () => {
      snapshot.value = null;
    };
    
    onMounted(() => {
      // 初始时使用现有的摄像头图像URL
      imageUrl.value = robotStore.camera.imageUrl;
    });
    
    return {
      isActive,
      imageUrl,
      snapshot,
      toggleCamera,
      takeSnapshot,
      closeSnapshot
    };
  }
};
</script>

<style scoped>
.camera-container {
  background-color: #111;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding: 10px 15px;
}

.panel-header h2 {
  margin: 0;
  color: #f0f0f0;
  font-size: 1.2rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.camera-controls {
  display: flex;
  gap: 10px;
}

.control-button {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.5px;
}

.control-button:hover {
  background-color: #333;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.control-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.control-button:disabled {
  background-color: #333;
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.snapshot-button {
  background-color: #3070cc;
}

.snapshot-button:hover:not(:disabled) {
  background-color: #2060bb;
}

.camera-view {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.camera-active, .camera-inactive {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e1e1e;
}

.camera-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #aaa;
}

.camera-loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #3070cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.camera-overlay {
  position: absolute;
  bottom: 15px;
  left: 15px;
  right: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.camera-info {
  display: flex;
  gap: 10px;
  font-size: 0.85rem;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  border-radius: 4px;
  color: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.camera-recording-indicator {
  background-color: rgba(204, 48, 48, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px rgba(204, 48, 48, 0.4);
  letter-spacing: 0.8px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.camera-inactive {
  background-color: #1e1e1e;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-inactive-message {
  font-size: 1.2rem;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
}

.snapshot-preview {
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 200px;
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  border: 1px solid #333;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.snapshot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #333;
  color: #f0f0f0;
  font-size: 0.9rem;
}

.close-button {
  background: none;
  border: none;
  color: #f0f0f0;
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-button:hover {
  color: #cc3030;
}

.snapshot-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .camera-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .control-button {
    flex: 1;
    text-align: center;
  }
  
  .snapshot-preview {
    width: 160px;
  }
  
  .snapshot-image {
    height: 120px;
  }
}

@media (max-width: 430px) {
  .panel-header {
    padding: 8px 12px;
  }
  
  .panel-header h2 {
    font-size: 1.1rem;
  }
  
  .control-button {
    padding: 5px 8px;
    font-size: 0.8rem;
  }
  
  .camera-info {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  
  .camera-recording-indicator {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  
  .camera-overlay {
    bottom: 10px;
    left: 10px;
    right: 10px;
  }
  
  .snapshot-preview {
    bottom: 10px;
    right: 10px;
    width: 140px;
  }
  
  .snapshot-image {
    height: 100px;
  }
}
</style> 