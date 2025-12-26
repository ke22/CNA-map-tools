#!/bin/bash
# 检查服务器状态的脚本

echo "🔍 检查端口 8000 状态..."
echo ""

PID=$(lsof -ti:8000 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ 端口 8000 未被占用"
    echo "可以启动服务器：./START_SERVER.sh"
else
    echo "⚠️  端口 8000 已被占用"
    echo ""
    echo "进程信息："
    ps -p $PID -o pid,comm,args 2>/dev/null || echo "无法获取进程信息"
    echo ""
    echo "PID: $PID"
    echo ""
    echo "要停止这个进程吗？"
    echo "运行: kill $PID"
    echo "或者强制停止: kill -9 $PID"
fi
