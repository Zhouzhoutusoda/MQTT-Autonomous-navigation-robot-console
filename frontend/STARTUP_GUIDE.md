# Robot Car Dashboard Startup Guide

This guide will help you start and run the autonomous navigation robot dashboard project.

## System Requirements

- Node.js (v14 or higher)
- Modern browser (Chrome or Firefox recommended)

## Quick Start

Here are step-by-step commands for Windows PowerShell:

### 1. Navigate to the Project Directory

```powershell
cd C:\Users\legion\OneDrive\桌面\SAH\robot-car-dashboard
```

### 2. Install Dependencies

If this is your first time running the project, you need to install dependencies:

```powershell
npm install
```

### 3. Start the Frontend Application

```powershell
npm run dev
```

After successful startup, you will see output similar to:

```
 VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Access in Browser

Open http://localhost:5173/ in your browser to see the dashboard interface.

## Using Simulated Data

By default, the dashboard uses built-in simulated data without requiring an MQTT connection. You can see the "Using Simulated Data" status indicator at the bottom of the interface.

If you want to use an MQTT connection:

1. Install and run an MQTT broker (such as Mosquitto)
2. Click the "Switch to MQTT Data" button at the bottom of the interface
3. Click the "Connect" button to connect to the MQTT broker

## Troubleshooting

If you encounter issues during startup:

1. **PowerShell Command Errors**: Make sure to execute each command line by line, rather than using `&&` to connect multiple commands
2. **Cannot find package.json**: Ensure you are running commands in the correct directory
3. **Port in use**: If port 5173 is occupied, Vite will automatically select another port, check the console output

## Developer Notes

If you want to simulate MQTT messages, you can run:

```powershell
# Make sure the MQTT broker is running
node mqtt-simulator.js
```

Then switch to MQTT data mode in the application interface and connect. 