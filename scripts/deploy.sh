#!/bin/bash

# 🚀 自动化部署脚本
# 用法: ./scripts/deploy.sh [dev|build|preview|serve]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 获取本机IP地址
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        hostname -I | awk '{print $1}'
    else
        echo "localhost"
    fi
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_message "警告: 端口 $port 已被占用" $YELLOW
        return 1
    fi
    return 0
}

# 显示帮助信息
show_help() {
    echo "🚀 项目部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  dev      启动开发服务器"
    echo "  build    构建生产版本"
    echo "  preview  预览生产版本"
    echo "  serve    构建并预览"
    echo "  clean    清理构建文件"
    echo "  help     显示帮助信息"
    echo ""
}

# 启动开发服务器
start_dev() {
    print_message "🔧 启动开发服务器..." $BLUE
    
    if ! check_port 5173; then
        print_message "请先停止占用端口 5173 的进程" $RED
        exit 1
    fi
    
    local ip=$(get_local_ip)
    print_message "开发服务器将启动在:" $GREEN
    print_message "  本地访问: http://localhost:5173" $GREEN
    print_message "  内网访问: http://$ip:5173" $GREEN
    echo ""
    
    npm run dev
}

# 构建项目
build_project() {
    print_message "🏗️  构建生产版本..." $BLUE
    
    # 清理旧的构建文件
    if [ -d "dist" ]; then
        print_message "清理旧的构建文件..." $YELLOW
        rm -rf dist
    fi
    
    # 类型检查
    print_message "进行类型检查..." $BLUE
    npm run type-check
    
    # 代码规范检查
    print_message "进行代码规范检查..." $BLUE
    npm run lint
    
    # 构建
    npm run build
    
    if [ -d "dist" ]; then
        print_message "✅ 构建成功！构建文件位于 dist/ 目录" $GREEN
        
        # 显示构建文件大小
        print_message "📊 构建文件大小:" $BLUE
        du -sh dist/*
    else
        print_message "❌ 构建失败！" $RED
        exit 1
    fi
}

# 预览生产版本
preview_build() {
    print_message "👀 启动生产版本预览..." $BLUE
    
    if [ ! -d "dist" ]; then
        print_message "dist 目录不存在，请先运行构建" $RED
        exit 1
    fi
    
    if ! check_port 4173; then
        print_message "请先停止占用端口 4173 的进程" $RED
        exit 1
    fi
    
    local ip=$(get_local_ip)
    print_message "生产预览服务器将启动在:" $GREEN
    print_message "  本地访问: http://localhost:4173" $GREEN
    print_message "  内网访问: http://$ip:4173" $GREEN
    echo ""
    
    npm run preview
}

# 构建并预览
serve_project() {
    print_message "🚀 构建并启动预览服务器..." $BLUE
    build_project
    echo ""
    preview_build
}

# 清理构建文件
clean_project() {
    print_message "🧹 清理构建文件..." $BLUE
    npm run clean
    print_message "✅ 清理完成！" $GREEN
}

# 主函数
main() {
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        print_message "❌ 请在项目根目录运行此脚本" $RED
        exit 1
    fi
    
    # 检查 Node.js 和 npm
    if ! command -v node &> /dev/null; then
        print_message "❌ 未找到 Node.js，请先安装" $RED
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_message "❌ 未找到 npm，请先安装" $RED
        exit 1
    fi
    
    # 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        print_message "📦 安装依赖..." $BLUE
        npm install
    fi
    
    # 根据参数执行相应命令
    case "${1:-help}" in
        "dev")
            start_dev
            ;;
        "build")
            build_project
            ;;
        "preview")
            preview_build
            ;;
        "serve")
            serve_project
            ;;
        "clean")
            clean_project
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 运行主函数
main "$@"
