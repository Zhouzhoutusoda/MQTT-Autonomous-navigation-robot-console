<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRobotStore } from './stores/robotStore';
import mqttService from './services/mqttService';
import SystemStatus from './components/SystemStatus.vue';
import SensorDataPanel from './components/SensorDataPanel.vue';
import LidarVisualization from './components/LidarVisualization.vue';
import DecisionPanel from './components/DecisionPanel.vue';
import CameraView from './components/CameraView.vue';
import MazeMap from './components/MazeMap.vue';

export default {
  name: 'App',
  components: {
    SystemStatus,
    SensorDataPanel,
    LidarVisualization,
    DecisionPanel,
    CameraView,
    MazeMap
  },
  setup() {
    const robotStore = useRobotStore();
    const mqttConnected = ref(false);
    const isPanelCollapsed = ref(true); // Default collapsed MQTT panel
    
    // MQTT connection configuration
    const mqttConfig = reactive({
      host: '0.0.0.0', // Default empty, prompt user to fill
      port: 8083,
      protocol: 'ws',
      path: '/mqtt',
      username: 'default_user',
      password: '0000'
    });
    
    const currentYear = computed(() => {
      return new Date().getFullYear();
    });
    
    const connectMqtt = () => {
      // Use user-configured MQTT parameters to connect
      mqttService.connect({
        host: mqttConfig.value.host,
        port: mqttConfig.value.port,
        protocol: mqttConfig.value.protocol,
        path: mqttConfig.value.path
      });
    };
    
    // Toggle panel collapse state
    const togglePanel = () => {
      isPanelCollapsed.value = !isPanelCollapsed.value;
      // Dispatch event to notify LidarVisualization component to update size
      document.dispatchEvent(new CustomEvent('mqttPanelToggle'));
    };

    onMounted(() => {
      // Monitor connection status
      const unsub = robotStore.$subscribe((mutation, state) => {
        // Update detection logic, check "Online" status
        if (state.systemStatus.connectionStatus === 'Connected' || 
            state.systemStatus.connectionStatus === 'Online') {
          mqttConnected.value = true;
        } else if (state.systemStatus.connectionStatus === 'Disconnected' || 
                   state.systemStatus.connectionStatus === 'Offline' ||
                   state.systemStatus.connectionStatus === 'Error' || 
                   state.systemStatus.connectionStatus === 'Connection failed') {
          mqttConnected.value = false;
        }
      });

      // Connect to MQTT by default
      connectMqtt();
    });
    
    onUnmounted(() => {
      // Cleanup
      mqttService.disconnect();
    });
    
    return {
      mqttConnected,
      currentYear,
      connectMqtt,
      mqttConfig,
      isPanelCollapsed,
      togglePanel
    };
  }
};
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="logo">
        <span class="logo-icon">🤖</span>
        <span class="logo-text">Autonomous Navigation Robot Console</span>
      </div>
      <SystemStatus />
    </div>
    
    <!-- Redesigned MQTT configuration panel -->
    <div class="mqtt-config-panel" :class="{'panel-collapsed': isPanelCollapsed}">
      <div class="panel-header">
        <h3>MQTT Connection</h3>
        <button @click="togglePanel" class="collapse-button">
          <i class="fas" :class="{'fa-chevron-up': !isPanelCollapsed, 'fa-chevron-down': isPanelCollapsed}"></i>
          {{ isPanelCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>
      
      <!-- Show full configuration when expanded -->
      <div class="panel-content" v-if="!isPanelCollapsed">
        <div class="connection-status">
          Status: <span :class="{'status-connected': mqttConnected, 'status-disconnected': !mqttConnected}">
            {{ mqttConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
        <div class="form-group">
          <label>Server:</label>
          <input v-model="mqttConfig.host" placeholder="Enter MQTT server IP (e.g. 192.168.1.100)" />
        </div>
        <div class="form-group">
          <label>Port:</label>
          <input type="number" v-model.number="mqttConfig.port" />
        </div>
        <div class="form-group">
          <label>Protocol:</label>
          <select v-model="mqttConfig.protocol">
            <option value="ws">WebSocket (ws)</option>
            <option value="wss">WebSocket Secure (wss)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Path:</label>
          <input v-model="mqttConfig.path" />
        </div>
        <div class="form-group">
          <label>Username:</label>
          <input v-model="mqttConfig.username" />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="password" v-model="mqttConfig.password" />
        </div>
        <button @click="connectMqtt" :disabled="!mqttConfig.host">Connect to MQTT Server</button>
      </div>
      
      <!-- Only show status indicator when collapsed (redesigned) -->
      <div class="status-indicator-collapsed" v-if="isPanelCollapsed">
        <span :class="{'status-dot-connected': mqttConnected, 'status-dot-disconnected': !mqttConnected}"></span>
        <span class="status-text-collapsed">{{ mqttConnected ? 'Connected' : 'Disconnected' }}</span>
        <button v-if="!mqttConnected" @click="connectMqtt" class="connect-button-small">Connect</button>
      </div>
    </div>
    
    <div class="app-content">
      <div class="content-row main-row">
        <div class="left-panel">
          <div class="panel-section upper-section">
            <SensorDataPanel />
          </div>
          <div class="panel-section lower-section">
            <MazeMap />
          </div>
        </div>
        
        <div class="center-panel">
          <LidarVisualization />
        </div>
        
        <div class="right-panel">
          <div class="panel-section upper-section">
            <CameraView />
          </div>
          <div class="panel-section lower-section">
            <DecisionPanel />
          </div>
        </div>
      </div>
    </div>
    
    <div class="app-footer">
      <div class="connection-status">
        <!-- MQTT connection status -->
        <div class="status-group">
          <div v-if="mqttConnected" class="status-indicator connected">
            <span class="status-dot"></span>
            <span class="status-text">MQTT Connected</span>
          </div>
          <div v-else class="status-indicator disconnected">
            <span class="status-dot"></span>
            <span class="status-text">MQTT Disconnected</span>
            <button @click="connectMqtt" class="connect-button">Connect</button>
          </div>
        </div>
      </div>
      
      <div class="copyright">© {{ currentYear }} Autonomous Navigation Robot System</div>
    </div>
  </div>
</template>

<style>
/* Import fonts and icons */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Roboto', sans-serif;
}

body {
  background-color: #000;
  color: #f0f0f0;
  overflow-y: auto; /* 确保页面可以滚动 */
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 改为最小高度，允许内容增长 */
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  padding: 15px;
  background-color: #000;
}

.app-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  position: sticky; /* 在小屏幕上保持头部可见 */
  top: 0;
  z-index: 1000;
  background-color: #000;
  padding: 5px 0;
}

.logo {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.logo-icon {
  font-size: 2rem;
  margin-right: 10px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: #f0f0f0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
}

.app-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 15px;
  margin-bottom: 15px;
  overflow: visible; /* 确保内容可见且可滚动 */
  transition: all 0.3s ease;
}

.content-row {
  display: flex;
  gap: 15px;
}

.main-row {
  flex: 1;
  min-height: 0; /* 防止Flex布局溢出 */
}

.left-panel, .right-panel {
  width: 28%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.center-panel {
  flex: 1;
  min-height: 400px; /* 设置最小高度确保3D渲染区域有足够大小 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-section {
  flex: 1;
  min-height: 0; /* Fix Flex layout overflow issue */
  border-radius: 8px;
  overflow: hidden; /* 确保内容不溢出 */
}

.upper-section {
  flex: 1;
}

.lower-section {
  flex: 1;
}

.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #333;
  position: sticky; /* 在小屏幕上保持底部可见 */
  bottom: 0;
  background-color: #000;
  z-index: 1000;
  padding: 10px 0;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-group {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.connected .status-dot {
  background-color: #45ff45;
  box-shadow: 0 0 5px #45ff45;
}

.disconnected .status-dot {
  background-color: #ff4545;
  box-shadow: 0 0 5px rgba(255, 69, 69, 0.5);
}

.status-text {
  font-size: 0.85rem;
  color: #aaa;
}

.connect-button {
  background-color: #3070cc;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
  letter-spacing: 0.5px;
}

.connect-button:hover {
  background-color: #2060bb;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.connect-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.connect-button-small {
  background-color: #3070cc;
  color: white;
  border: none;
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.3s;
  letter-spacing: 0.5px;
}

.connect-button-small:hover {
  background-color: #2060bb;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.connect-button-small:active {
  transform: translateY(0);
  box-shadow: none;
}

.copyright {
  font-size: 0.85rem;
  color: #666;
}

/* 优化响应式布局 */
/* 大屏设备 (1200px以上) - 默认布局 */

/* 中等屏幕设备 (992px - 1199px) */
@media (max-width: 1199px) {
  .app-container {
    padding: 12px;
  }
  
  .left-panel, .right-panel {
    width: 30%;
  }
  
  .center-panel {
    min-height: 380px;
  }
  
  .content-row {
    gap: 12px;
  }
}

/* 小屏设备 (768px - 991px) */
@media (max-width: 991px) {
  .app-container {
    padding: 10px;
    height: auto; /* 允许容器高度自适应内容 */
  }
  
  .logo-text {
    font-size: 1.3rem;
  }
  
  .main-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .left-panel, .center-panel, .right-panel {
    width: 100%;
  }
  
  .left-panel, .right-panel {
    flex-direction: column;
    height: auto;
  }
  
  .panel-section {
    min-height: 300px; /* 增加高度，确保内容可见 */
    margin-bottom: 10px; /* 添加底部间距 */
  }
  
  .center-panel {
    order: -1; /* 移到顶部 */
    min-height: 350px;
    margin-bottom: 10px;
  }
  
  .connection-status {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 平板设备 (576px - 767px) */
@media (max-width: 767px) {
  .app-container {
    padding: 8px;
    overflow-y: auto; /* 确保可滚动 */
  }
  
  .logo-icon {
    font-size: 1.7rem;
  }
  
  .logo-text {
    font-size: 1.2rem;
  }
  
  .left-panel, .right-panel {
    flex-direction: column;
    gap: 15px; /* 增加面板间距 */
  }
  
  .panel-section {
    min-height: 300px; /* 确保足够高度显示内容 */
    margin-bottom: 15px; /* 增加底部间距 */
  }
  
  .center-panel {
    min-height: 300px;
    margin-bottom: 15px;
  }
  
  .app-footer {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-group {
    width: 100%;
    justify-content: center;
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .copyright {
    text-align: center;
    width: 100%;
  }
}

/* 手机设备 (575px以下) */
@media (max-width: 575px) {
  .app-container {
    padding: 5px;
    height: auto; /* 允许容器高度自适应内容 */
    overflow-y: auto; /* 确保在手机上可滚动 */
  }
  
  .app-header {
    margin-bottom: 8px;
  }
  
  .logo {
    margin-bottom: 8px;
  }
  
  .logo-icon {
    font-size: 1.5rem;
  }
  
  .logo-text {
    font-size: 1.1rem;
  }
  
  .content-row {
    gap: 12px; /* 增加间距 */
  }
  
  .panel-section {
    min-height: 300px; /* 确保内容可见 */
    margin-bottom: 12px; /* 确保面板之间有足够的间距 */
  }
  
  .center-panel {
    min-height: 300px;
    margin-bottom: 12px;
  }
  
  .connect-button {
    width: 100%;
    margin: 5px 0;
    margin-left: 0;
  }
  
  /* 添加固定底部边距，确保所有内容可见 */
  .app-content {
    margin-bottom: 60px;
  }
}

/* 超小屏幕设备 (360px以下) */
@media (max-width: 360px) {
  .panel-section {
    min-height: 280px; /* 稍微降低高度适应小屏幕 */
  }
  
  .center-panel {
    min-height: 250px;
  }
  
  .status-indicator {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 5px;
  }
  
  .status-dot {
    margin-right: 0;
    margin-bottom: 5px;
  }
}

/* MQTT配置面板样式 */
.mqtt-config-panel {
  background-color: #1e2130;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  max-height: 600px; /* 设置最大高度 */
  overflow: hidden;
  width: 100%;
  z-index: 100; /* 确保面板在其他元素之上 */
}

.panel-collapsed {
  padding: 10px;
  max-height: 40px; /* 折叠时的高度调整 */
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.panel-header h3 {
  margin: 0;
  color: #4fd1c5;
  border-bottom: 1px solid #4fd1c5;
  padding-bottom: 5px;
  font-size: 1rem;
}

.collapse-button {
  background-color: #4fd1c5;
  color: #1a202c;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
}

.collapse-button:hover {
  background-color: #38b2ac;
  transform: translateY(-1px);
}

.collapse-button i {
  font-size: 0.8rem;
}

.panel-content {
  margin-bottom: 10px;
  overflow-y: auto; /* 允许面板内容滚动 */
  max-height: 500px; /* 设置内容最大高度 */
}

.connection-status {
  margin-bottom: 10px;
  font-size: 14px;
  color: #e2e8f0;
}

.status-connected {
  color: #68d391;
  font-weight: bold;
}

.status-disconnected {
  color: #fc8181;
  font-weight: bold;
}

.form-group {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.form-group label {
  flex: 0 0 80px;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  flex: 1;
  min-width: 0; /* 确保输入框能够收缩 */
  background-color: #2d3748;
  border: 1px solid #4a5568;
  color: #e2e8f0;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.mqtt-config-panel button {
  background-color: #4fd1c5;
  color: #1a202c;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
  font-size: 0.9rem;
}

.mqtt-config-panel button:hover {
  background-color: #38b2ac;
}

.mqtt-config-panel button:disabled {
  background-color: #718096;
  cursor: not-allowed;
}

/* 重新设计的折叠状态指示器 */
.status-indicator-collapsed {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
  height: 20px; /* 固定高度 */
  overflow: hidden; /* 确保内容不溢出 */
}

.status-dot-connected {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: #45ff45;
  box-shadow: 0 0 5px #45ff45;
}

.status-dot-disconnected {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: #ff4545;
  box-shadow: 0 0 5px rgba(255, 69, 69, 0.5);
}

.status-text-collapsed {
  flex: 1;
  font-size: 0.85rem;
  color: #aaa;
}

.connect-button-small {
  background-color: #3070cc;
  color: white;
  border: none;
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.3s;
  letter-spacing: 0.5px;
}

.connect-button-small:hover {
  background-color: #2060bb;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.connect-button-small:active {
  transform: translateY(0);
  box-shadow: none;
}

/* 响应式 MQTT 面板 */
@media (max-width: 767px) {
  .mqtt-config-panel {
    padding: 10px;
    max-height: none; /* 展开状态移除最大高度限制 */
  }
  
  .panel-content {
    max-height: none; /* 移除内容最大高度限制 */
    overflow-y: visible; /* 允许内容完整显示 */
  }
  
  .panel-header h3 {
    font-size: 0.9rem;
  }
  
  .form-group {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 15px; /* 增加表单项之间的间距 */
  }
  
  .form-group label {
    flex: none;
    margin-bottom: 4px;
    font-size: 0.8rem;
    width: 100%; /* 标签占满宽度 */
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    font-size: 0.8rem;
    margin-top: 4px; /* 增加输入框与标签的间距 */
  }
  
  .mqtt-config-panel button {
    width: 100%;
    font-size: 0.8rem;
    margin-top: 10px; /* 增加按钮与表单的间距 */
  }
  
  .panel-collapsed {
    max-height: 30px; /* 小屏幕上进一步降低高度 */
    padding: 5px 10px;
  }
  
  .status-indicator-collapsed {
    height: 18px;
  }
  
  .status-dot-connected,
  .status-dot-disconnected {
    width: 8px;
    height: 8px;
    margin-right: 5px;
  }
  
  .status-text-collapsed {
    font-size: 0.75rem;
  }
}

@media (max-width: 575px) {
  .panel-collapsed {
    padding: 8px;
    max-height: 50px;
  }
  
  .panel-header {
    margin-bottom: 8px;
  }
  
  /* 展开时调整样式 */
  .mqtt-config-panel:not(.panel-collapsed) {
    position: relative;
    z-index: 2000; /* 确保面板在其他元素之上 */
    padding-bottom: 20px; /* 增加底部内边距 */
  }
  
  /* 确保连接按钮可见 */
  .mqtt-config-panel:not(.panel-collapsed) button {
    margin-top: 15px;
    padding: 10px 16px; /* 增大按钮的可点击区域 */
  }
}

/* 超小屏幕调整 */
@media (max-width: 360px) {
  .mqtt-config-panel {
    padding: 8px;
  }
  
  .panel-content {
    padding: 0 5px;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  .mqtt-config-panel:not(.panel-collapsed) button {
    margin-top: 12px;
    margin-bottom: 5px;
  }
}
</style>
