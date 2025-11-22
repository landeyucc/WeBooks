# ========================================
# Docker 部署脚本
# ========================================

#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose是否安装
check_dependencies() {
    print_info "检查Docker依赖..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    print_success "Docker依赖检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."
    
    directories=(
        "logs"
        "logs/nginx"
        "uploads"
        "backups"
        "data/postgres"
        "data/redis"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_info "创建目录: $dir"
        fi
    done
    
    print_success "目录创建完成"
}

# 设置环境变量文件
setup_env() {
    print_info "设置环境变量..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "已复制.env.example为.env，请根据实际需要修改配置"
        else
            print_error "未找到.env.example文件"
            exit 1
        fi
    else
        print_info ".env文件已存在，跳过创建"
    fi
    
    print_success "环境变量设置完成"
}

# 生成强密码
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# 更新.env文件中的敏感信息
update_env_secrets() {
    print_info "更新环境变量中的敏感信息..."
    
    if [ -f ".env" ]; then
        # 生成新的密码
        DB_PASSWORD=$(generate_password)
        JWT_SECRET=$(generate_password)
        NEXTAUTH_SECRET=$(generate_password)
        
        # 替换.env文件中的默认值
        sed -i.bak "s/your_secure_database_password_here/$DB_PASSWORD/g" .env
        sed -i.bak "s/your-super-secret-jwt-key-at-least-32-characters-long/$JWT_SECRET/g" .env
        sed -i.bak "s/your-nextauth-secret-at-least-32-characters-long/$NEXTAUTH_SECRET/g" .env
        
        # 删除备份文件
        rm -f .env.bak
        
        print_success "环境变量已更新"
        print_warning "请保存以下重要信息用于后续访问:"
        echo "数据库密码: $DB_PASSWORD"
        echo "JWT密钥: $JWT_SECRET"
        echo "NextAuth密钥: $NEXTAUTH_SECRET"
    fi
}

# 构建并启动服务
deploy() {
    print_info "开始部署服务..."
    
    # 停止并删除现有容器
    docker-compose down --remove-orphans
    
    # 构建并启动服务
    docker-compose up --build -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services
    
    print_success "服务部署完成!"
}

# 检查服务状态
check_services() {
    print_info "检查服务状态..."
    
    services=("webooks_app" "webooks_db" "webooks_redis")
    
    for service in "${services[@]}"; do
        if docker-compose ps --services --filter "status=running" | grep -q "$(echo $service | cut -d'_' -f2)"; then
            print_success "$service 服务运行正常"
        else
            print_error "$service 服务可能存在问题"
        fi
    done
}

# 查看服务日志
view_logs() {
    print_info "显示服务日志..."
    docker-compose logs -f --tail=100
}

# 清理数据
clean_data() {
    print_warning "这将删除所有数据，继续吗? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "清理Docker数据..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "数据清理完成"
    else
        print_info "取消数据清理"
    fi
}

# 显示帮助信息
show_help() {
    echo "Webooks Docker 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy    部署服务（默认）"
    echo "  logs      查看服务日志"
    echo "  clean     清理所有数据"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy    # 完整部署"
    echo "  $0 logs      # 查看日志"
    echo "  $0 clean     # 清理数据"
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            check_dependencies
            create_directories
            setup_env
            update_env_secrets
            deploy
            ;;
        "logs")
            view_logs
            ;;
        "clean")
            clean_data
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"