<template>
  <div class="map-container">
    <div class="panel-header">
      <h2>Maze Map</h2>
      <div class="map-controls">
        <button @click="resetMap" class="control-button">Reset Map</button>
        <div class="zoom-controls">
          <button @click="zoomIn" class="zoom-button">+</button>
          <button @click="zoomOut" class="zoom-button">−</button>
        </div>
      </div>
    </div>
    
    <div class="map-view" ref="mapContainer">
      <div 
        class="map-canvas" 
        :style="{ 
          transform: `scale(${zoom}) translate(${panPosition.x}px, ${panPosition.y}px)` 
        }"
        @mousedown="startPan"
        @mousemove="updatePan"
        @mouseup="endPan"
        @mouseleave="endPan"
      >
        <canvas ref="mapCanvas" width="600" height="600"></canvas>
        <div class="robot-position" :style="robotPositionStyle" v-if="hasMapData">
          <div class="robot-direction" :style="robotDirectionStyle"></div>
        </div>
        <div class="no-data-message" v-if="!hasMapData">
          No map data available
        </div>
      </div>
      
      <div class="map-info">
        <div class="map-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #1e1e1e;"></div>
            <span>Unexplored</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #45ff45;"></div>
            <span>Passable</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #cc3030;"></div>
            <span>Obstacle</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #ffaa00;"></div>
            <span>Target</span>
          </div>
        </div>
        
        <div class="map-stats">
          <div class="stat-item">
            <span class="stat-label">Exploration:</span>
            <span class="stat-value">{{ hasMapData ? `${explorationPercentage}%` : '--' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Map Size:</span>
            <span class="stat-value">{{ hasMapData ? `${mapWidth}×${mapHeight}` : '--' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRobotStore } from '../stores/robotStore';

export default {
  name: 'MazeMap',
  setup() {
    const robotStore = useRobotStore();
    const mapCanvas = ref(null);
    const mapContainer = ref(null);
    const ctx = ref(null);
    
    // Map properties
    const mapWidth = computed(() => robotStore.map.width);
    const mapHeight = computed(() => robotStore.map.height);
    const cellSize = ref(30);
    const mazeData = computed(() => robotStore.map.mazeData);
    
    // Check if we have map data
    const hasMapData = computed(() => {
      return mazeData.value && mazeData.value.length > 0;
    });
    
    // Zoom and pan controls
    const zoom = ref(1);
    const panPosition = reactive({ x: 0, y: 0 });
    const isPanning = ref(false);
    const panStart = reactive({ x: 0, y: 0 });
    
    // Robot position and angle
    const robotPosition = computed(() => robotStore.map.robotPosition);
    const robotDirection = computed(() => robotStore.map.robotDirection);
    
    // Calculate exploration percentage
    const explorationPercentage = computed(() => robotStore.map.explorationPercentage);
    
    // Robot position style
    const robotPositionStyle = computed(() => {
      return {
        left: `${robotPosition.value.x * cellSize.value}px`,
        top: `${robotPosition.value.y * cellSize.value}px`
      };
    });
    
    // Robot direction style
    const robotDirectionStyle = computed(() => {
      return {
        transform: `rotate(${robotDirection.value}deg)`
      };
    });
    
    // Convert lidar data to map data
    const updateMapFromLidarData = () => {
      // Get lidar data
      const lidarData = robotStore.sensors.lidarData;
      
      // Skip if no lidar data
      if (!lidarData || lidarData.length !== 502) {
        return;
      }
      
      // Initialize map data if not already initialized
      let newMazeData = [];
      if (!hasMapData.value) {
        // Create empty map
        for (let y = 0; y < mapHeight.value; y++) {
          newMazeData[y] = [];
          for (let x = 0; x < mapWidth.value; x++) {
            newMazeData[y][x] = 0; // Unexplored
          }
        }
      } else {
        // Clone existing map data
        newMazeData = mazeData.value.map(row => [...row]);
      }
      
      // Calculate center of the map for coordinate transformation
      const centerX = Math.floor(mapWidth.value / 2);
      const centerY = Math.floor(mapHeight.value / 2);
      
      // Set robot position to (0,0) in map coordinates, which is at the center of the map
      robotStore.updateRobotPosition({ x: centerX, y: centerY }, 0);
      
      // Process lidar data - convert polar coordinates to cartesian
      const angleStep = (2 * Math.PI) / lidarData.length;
      const maxRange = 10; // Maximum lidar range in meters
      const cellsPerMeter = 2; // Map resolution (cells per meter)
      
      // Process each lidar reading
      lidarData.forEach((distance, index) => {
        // Skip invalid readings
        if (isNaN(distance) || distance <= 0 || distance > maxRange) {
          return;
        }
        
        // Calculate angle (0 is front, scanning clockwise)
        const angle = index * angleStep;
        
        // Convert polar coordinates to cartesian
        // Note: We adjust coordinates to match grid system
        const x = Math.sin(angle) * distance * cellsPerMeter;
        const y = Math.cos(angle) * distance * cellsPerMeter;
        
        // Calculate grid cell coordinates relative to robot at (0,0)
        // Map coordinates: robot is at center (centerX, centerY)
        const gridX = Math.round(centerX + x);
        const gridY = Math.round(centerY - y); // Invert Y for grid coordinates
        
        // Check if coordinates are within map bounds
        if (gridX >= 0 && gridX < mapWidth.value && gridY >= 0 && gridY < mapHeight.value) {
          // Mark cell as obstacle
          newMazeData[gridY][gridX] = 2; // Obstacle
          
          // Mark cells between robot and obstacle as passable
          // Use Bresenham's line algorithm to find cells between robot and obstacle
          const cells = getLinePoints(centerX, centerY, gridX, gridY);
          
          // All cells except the last one (obstacle) are passable
          for (let i = 0; i < cells.length - 1; i++) {
            const [cellX, cellY] = cells[i];
            if (cellX >= 0 && cellX < mapWidth.value && cellY >= 0 && cellY < mapHeight.value) {
              // Only update if cell is unexplored (0)
              if (newMazeData[cellY][cellX] === 0) {
                newMazeData[cellY][cellX] = 1; // Passable
              }
            }
          }
        }
      });
      
      // Update maze data in store
      robotStore.updateMazeData(newMazeData);
    };
    
    // Bresenham's line algorithm to get points between two coordinates
    const getLinePoints = (x0, y0, x1, y1) => {
      const points = [];
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      
      while (true) {
        points.push([x0, y0]);
        
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
      
      return points;
    };
    
    // Draw the map
    const drawMap = () => {
      if (!ctx.value) return;
      
      ctx.value.clearRect(0, 0, mapCanvas.value.width, mapCanvas.value.height);
      
      // If no map data, don't draw
      if (!hasMapData.value) {
        // Draw message in center of canvas
        ctx.value.font = '14px Arial';
        ctx.value.fillStyle = '#666';
        ctx.value.textAlign = 'center';
        ctx.value.fillText('No map data available', mapCanvas.value.width / 2, mapCanvas.value.height / 2);
        return;
      }
      
      for (let y = 0; y < mapHeight.value; y++) {
        for (let x = 0; x < mapWidth.value; x++) {
          // Skip if coordinates are out of map data range
          if (!mazeData.value[y] || mazeData.value[y][x] === undefined) {
            continue;
          }
          
          const cellType = mazeData.value[y][x];
          
          // Set cell color
          switch (cellType) {
            case 0: // Unexplored
              ctx.value.fillStyle = '#1e1e1e';
              break;
            case 1: // Passable
              ctx.value.fillStyle = '#45ff45';
              break;
            case 2: // Obstacle
              ctx.value.fillStyle = '#cc3030';
              break;
            case 3: // Target
              ctx.value.fillStyle = '#ffaa00';
              break;
            default:
              ctx.value.fillStyle = '#1e1e1e';
          }
          
          // Draw cell
          ctx.value.fillRect(
            x * cellSize.value, 
            y * cellSize.value, 
            cellSize.value, 
            cellSize.value
          );
          
          // Draw cell border
          ctx.value.strokeStyle = '#111';
          ctx.value.strokeRect(
            x * cellSize.value, 
            y * cellSize.value, 
            cellSize.value, 
            cellSize.value
          );
        }
      }
      
      // Mark the origin (0,0) point with a special marker
      markOrigin();
    };
    
    // Mark the (0,0) origin point on the map
    const markOrigin = () => {
      if (!ctx.value || !hasMapData.value) return;
      
      // Calculate center of the map (where robot starts at (0,0))
      const centerX = Math.floor(mapWidth.value / 2);
      const centerY = Math.floor(mapHeight.value / 2);
      
      // Draw origin marker
      const x = centerX * cellSize.value + cellSize.value / 2;
      const y = centerY * cellSize.value + cellSize.value / 2;
      
      // Draw a crosshair to mark origin
      ctx.value.beginPath();
      ctx.value.strokeStyle = '#ffffff';
      ctx.value.lineWidth = 2;
      
      // Horizontal line
      ctx.value.moveTo(x - 10, y);
      ctx.value.lineTo(x + 10, y);
      
      // Vertical line
      ctx.value.moveTo(x, y - 10);
      ctx.value.lineTo(x, y + 10);
      
      ctx.value.stroke();
      
      // Draw (0,0) text
      ctx.value.font = '10px Arial';
      ctx.value.fillStyle = '#ffffff';
      ctx.value.textAlign = 'center';
      ctx.value.fillText('(0,0)', x, y + 20);
    };
    
    // Initialize the canvas
    const initCanvas = () => {
      if (!mapCanvas.value) return;
      
      ctx.value = mapCanvas.value.getContext('2d');
      
      // Set canvas size
      mapCanvas.value.width = mapWidth.value * cellSize.value;
      mapCanvas.value.height = mapHeight.value * cellSize.value;
      
      drawMap();
    };
    
    // Reset the map view
    const resetMap = () => {
      zoom.value = 1;
      panPosition.x = 0;
      panPosition.y = 0;
      
      // Clear map data
      const emptyMazeData = Array(mapHeight.value).fill().map(() => Array(mapWidth.value).fill(0));
      robotStore.updateMazeData(emptyMazeData);
      
      // Reset robot position to center (0,0)
      const centerX = Math.floor(mapWidth.value / 2);
      const centerY = Math.floor(mapHeight.value / 2);
      robotStore.updateRobotPosition({ x: centerX, y: centerY }, 0);
    };
    
    // Zoom controls
    const zoomIn = () => {
      if (zoom.value < 2) {
        zoom.value += 0.1;
      }
    };
    
    const zoomOut = () => {
      if (zoom.value > 0.5) {
        zoom.value -= 0.1;
      }
    };
    
    // Pan controls
    const startPan = (e) => {
      isPanning.value = true;
      panStart.x = e.clientX - panPosition.x;
      panStart.y = e.clientY - panPosition.y;
    };
    
    const updatePan = (e) => {
      if (!isPanning.value) return;
      
      panPosition.x = e.clientX - panStart.x;
      panPosition.y = e.clientY - panStart.y;
    };
    
    const endPan = () => {
      isPanning.value = false;
    };
    
    // Watch for map data changes
    watch(
      () => robotStore.map.mazeData,
      () => {
        drawMap();
      }
    );
    
    // Watch for lidar data changes
    watch(
      () => robotStore.sensors.lidarData,
      (newData) => {
        if (newData && newData.length === 502) {
          updateMapFromLidarData();
        }
      },
      { deep: true }
    );
    
    // Watch for robot position changes
    watch(
      [() => robotStore.map.robotPosition, () => robotStore.map.robotDirection],
      () => {
        // The position is handled by CSS via computed properties
      }
    );
    
    onMounted(() => {
      initCanvas();
      
      // Redraw on window resize
      window.addEventListener('resize', initCanvas);
      
      // Initial map update if lidar data is already available
      if (robotStore.sensors.lidarData.length > 0) {
        updateMapFromLidarData();
      }
      
      // Set initial robot position to center (0,0)
      const centerX = Math.floor(mapWidth.value / 2);
      const centerY = Math.floor(mapHeight.value / 2);
      robotStore.updateRobotPosition({ x: centerX, y: centerY }, 0);
    });
    
    onUnmounted(() => {
      window.removeEventListener('resize', initCanvas);
    });
    
    return {
      mapCanvas,
      mapContainer,
      mapWidth,
      mapHeight,
      zoom,
      panPosition,
      robotPositionStyle,
      robotDirectionStyle,
      explorationPercentage,
      hasMapData,
      resetMap,
      zoomIn,
      zoomOut,
      startPan,
      updatePan,
      endPan
    };
  }
};
</script>

<style scoped>
.map-container {
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

.map-controls {
  display: flex;
  gap: 10px;
  align-items: center;
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

.zoom-controls {
  display: flex;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.zoom-button {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none;
  border-right: 1px solid #333;
  padding: 6px 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.zoom-button:last-child {
  border-right: none;
}

.zoom-button:hover {
  background-color: #333;
}

.map-view {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #0a0a0a;
  display: flex;
  flex-direction: column;
}

.map-canvas {
  position: relative;
  transform-origin: center;
  transition: transform 0.1s ease;
  cursor: grab;
}

.map-canvas:active {
  cursor: grabbing;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 1.2rem;
  text-align: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.robot-position {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: #3070cc;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  margin-left: 15px; /* cellSize / 2 */
  margin-top: 15px; /* cellSize / 2 */
  z-index: 10;
  box-shadow: 0 0 12px #3070cc;
}

.robot-direction {
  position: absolute;
  width: 0;
  height: 0;
  top: 0;
  left: 10px; /* center */
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 15px solid #fff;
  transform-origin: center 15px;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}

.map-info {
  background-color: rgba(30, 30, 30, 0.8);
  border-top: 1px solid #333;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.2);
}

.map-legend {
  display: flex;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #aaa;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.map-stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  font-size: 0.85rem;
  color: #aaa;
}

.stat-label {
  margin-right: 5px;
}

.stat-value {
  color: #f0f0f0;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .map-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .map-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .map-stats {
    width: 100%;
    justify-content: space-between;
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
  
  .map-legend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }
  
  .legend-item {
    font-size: 0.75rem;
  }
  
  .stat-item {
    font-size: 0.75rem;
  }
}
</style> 