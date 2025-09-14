import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class LidarRenderService {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pointCloud = null;
    this.walls = null;
    this.initialized = false;
    this.maxLidarRange = 10; // Maximum lidar range (meters)
    this.verticalLayers = 5; // Vertical layers for 3D effect
    this.colorMode = 'distance'; // Color mode is fixed to distance
    this.wallHeight = 1.5; // Wall height in meters
    this.wallMaterial = null;
    this.previousPoints = []; // Store previous points for wall generation
    this.pointsBuffer = []; // Buffer to store received points
    this.lastTimestamp = 0; // Last received point timestamp
  }

  init(container) {
    if (!container) {
      console.error('Cannot initialize 3D rendering, container does not exist');
      return;
    }

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 12);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 30;

    // Add grid for reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Add car model (simple box)
    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff99 });
    const car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.y = 0.25; // Slightly raised to sit on the ground
    this.scene.add(car);

    // Add axes for reference
    const axesHelper = new THREE.AxesHelper(3);
    this.scene.add(axesHelper);

    // Prepare geometry for point cloud
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create empty point cloud object
    this.pointCloud = new THREE.Points(geometry, material);
    this.scene.add(this.pointCloud);

    // Create wall material
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });

    // Create walls group
    this.walls = new THREE.Group();
    this.scene.add(this.walls);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(container));

    this.initialized = true;
    this.animate();
  }

  onWindowResize(container) {
    if (!this.camera || !this.renderer || !container) return;

    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  /**
   * Process point cloud data in new format (x, y, timestamp)
   * @param {Object} data - Point data with x, y coordinates and timestamp
   * @returns {number} Count of valid points in buffer
   */
  updatePointCloud(data) {
    if (!this.initialized || !this.pointCloud) return 0;
    
    // Handle the new point cloud format
    if (data && typeof data === 'object' && 'x' in data && 'y' in data) {
      // Add point to buffer if it's valid
      if (!isNaN(data.x) && !isNaN(data.y)) {
        // Convert to 3D space (assuming y is distance forward, x is lateral distance)
        const point = {
          x: data.x,
          z: data.y,
          timestamp: data.timestamp || Date.now()
        };
        
        // Add to buffer
        this.pointsBuffer.push(point);
        this.lastTimestamp = Math.max(this.lastTimestamp, point.timestamp);
        
        // Remove old points (older than 5 seconds)
        const currentTime = Date.now();
        this.pointsBuffer = this.pointsBuffer.filter(p => 
          !p.timestamp || (currentTime - p.timestamp) < 5000
        );
      }
    } else if (Array.isArray(data) || (data && typeof data === 'object' && Array.isArray(data.ranges))) {
      // Legacy format handling (for backward compatibility)
      console.warn('Received legacy format data, please update to new point cloud format');
      return this.updatePointCloudLegacy(data);
    } else {
      console.warn('Invalid lidar data format', data);
      return 0;
    }
    
    // Render the current buffer of points
    this.renderPointBuffer();
    
    return this.pointsBuffer.length;
  }
  
  /**
   * Legacy method for backward compatibility
   * @param {Array|Object} data - Old format lidar data
   * @returns {number} Count of valid points rendered
   */
  updatePointCloudLegacy(data) {
    // Extract ranges array from data if it's an object
    let distanceArray;
    if (Array.isArray(data)) {
      distanceArray = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.ranges)) {
      distanceArray = data.ranges;
    } else {
      return 0;
    }
    
    // Validate data format
    if (distanceArray.length !== 502) {
      console.warn(`Invalid lidar data length: ${distanceArray.length}, expected 502 elements`);
      return 0;
    }

    // Clear existing buffer for legacy mode
    this.pointsBuffer = [];
    
    const angleStep = (2 * Math.PI) / distanceArray.length;
    let validPointCount = 0;
    
    // Convert distance array to 3D points
    distanceArray.forEach((distance, index) => {
      // Skip invalid readings
      if (isNaN(distance) || distance <= 0 || distance > this.maxLidarRange) return;
      
      validPointCount++;
      
      // Calculate angle (0 is front, scanning clockwise)
      const angle = index * angleStep;
      
      // Convert polar coordinates to cartesian
      const x = distance * Math.sin(angle);
      const z = distance * Math.cos(angle);
      
      // Add to buffer
      this.pointsBuffer.push({ x, z, timestamp: Date.now() });
    });
    
    // Render the points
    this.renderPointBuffer();
    
    return validPointCount;
  }
  
  /**
   * Render the current buffer of points
   */
  renderPointBuffer() {
    if (!this.initialized || !this.pointCloud || this.pointsBuffer.length === 0) return;
    
    const positions = [];
    const colors = [];
    const wallPoints = [];
    
    // Process each point in buffer
    this.pointsBuffer.forEach(point => {
      // Calculate distance from origin
      const distance = Math.sqrt(point.x * point.x + point.z * point.z);
      
      // Skip if distance is beyond max range
      if (distance > this.maxLidarRange) return;
      
      // Store point for wall generation
      wallPoints.push({ 
        x: point.x, 
        z: point.z, 
        distance, 
        angle: Math.atan2(point.x, point.z)
      });
      
      // Add points at different heights to create 3D effect
      for (let h = 0; h < this.verticalLayers; h++) {
        const y = 0.2 * h; // Small vertical spacing
        
        positions.push(point.x, y, point.z);
        
        // Distance-based color
        const normalizedDistance = Math.min(distance / this.maxLidarRange, 1);
        let r, g, b;
        
        // Using distance-based coloring
        if (normalizedDistance < 0.3) {
          // Red for close objects
          r = 1;
          g = normalizedDistance * 3;
          b = 0;
        } else if (normalizedDistance < 0.6) {
          // Yellow transitioning to green
          r = 2 - normalizedDistance * 3;
          g = 1;
          b = 0;
        } else {
          // Green to cyan for distant objects
          r = 0;
          g = 1;
          b = (normalizedDistance - 0.6) * 2.5;
        }
        
        colors.push(r, g, b);
      }
    });

    // Update geometry
    this.pointCloud.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    this.pointCloud.geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    
    this.pointCloud.geometry.computeBoundingSphere();
    
    // Generate walls from points if we have enough points
    if (wallPoints.length >= 3) {
      this.generateWalls(wallPoints);
    }
  }

  // Generate walls from lidar points
  generateWalls(points) {
    if (!this.initialized || !this.walls || points.length === 0) return;
    
    // Clear previous walls
    while (this.walls.children.length > 0) {
      const wall = this.walls.children[0];
      wall.geometry.dispose();
      this.walls.remove(wall);
    }
    
    // Group nearby points to form wall segments
    const wallSegments = this.groupPointsIntoWallSegments(points);
    
    // Create wall meshes for each segment
    wallSegments.forEach(segment => {
      if (segment.length < 3) return; // Need at least 3 points for a wall
      
      const wallGeometry = this.createWallGeometry(segment);
      const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
      this.walls.add(wallMesh);
    });
  }

  // Group points into wall segments
  groupPointsIntoWallSegments(points) {
    const segments = [];
    let currentSegment = [];
    const distanceThreshold = 0.5; // Maximum distance between points in the same wall
    
    // Sort points by angle for continuous processing
    const sortedPoints = [...points].sort((a, b) => a.angle - b.angle);
    
    sortedPoints.forEach((point, index) => {
      if (index === 0) {
        currentSegment.push(point);
        return;
      }
      
      const prevPoint = sortedPoints[index - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + 
        Math.pow(point.z - prevPoint.z, 2)
      );
      
      if (distance < distanceThreshold) {
        // Continue current segment
        currentSegment.push(point);
      } else {
        // Start new segment if current one has enough points
        if (currentSegment.length >= 3) {
          segments.push(currentSegment);
        }
        currentSegment = [point];
      }
    });
    
    // Add the last segment if it has enough points
    if (currentSegment.length >= 3) {
      segments.push(currentSegment);
    }
    
    return segments;
  }

  // Create wall geometry from a segment of points
  createWallGeometry(points) {
    const shape = new THREE.Shape();
    
    // Start with the first point
    shape.moveTo(points[0].x, points[0].z);
    
    // Add all points to the shape
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].z);
    }
    
    // Close the shape
    shape.lineTo(points[0].x, points[0].z);
    
    // Extrude the shape to create a wall
    const extrudeSettings = {
      steps: 1,
      depth: this.wallHeight,
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Rotate to make walls stand upright
    geometry.rotateX(Math.PI / 2);
    
    return geometry;
  }

  // Clear point cloud data
  clearPointCloud() {
    if (!this.initialized || !this.pointCloud) return;
    
    // Create empty buffers
    this.pointCloud.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([], 3)
    );
    
    this.pointCloud.geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute([], 3)
    );
    
    this.pointCloud.geometry.computeBoundingSphere();
    
    // Clear walls
    while (this.walls.children.length > 0) {
      const wall = this.walls.children[0];
      wall.geometry.dispose();
      this.walls.remove(wall);
    }
  }

  // Set vertical layers
  setVerticalLayers(layers) {
    if (layers >= 1 && layers <= 10) {
      this.verticalLayers = layers;
    }
    return this.verticalLayers;
  }

  animate() {
    if (!this.initialized) return;

    requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    this.initialized = false;
  }
}

// Create singleton
const lidarRenderService = new LidarRenderService();
export default lidarRenderService; 