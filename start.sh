#!/bin/bash

echo "========================================"
echo "   MQTT自主导航机器人控制台"
echo "========================================"
echo

echo "正在安装依赖..."
npm run install-all

echo
echo "启动所有服务..."
echo "- 后端MQTT桥接器"
echo "- 前端Vue仪表板"
echo "- 数据模拟器"
echo
echo "前端访问地址: http://localhost:5173"
echo "按 Ctrl+C 停止所有服务"
echo

npm run dev