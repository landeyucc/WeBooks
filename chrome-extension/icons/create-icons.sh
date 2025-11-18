#!/bin/bash

# 创建Chrome扩展图标脚本
# 使用ImageMagick或类似工具从SVG生成PNG图标

# 检查是否安装了ImageMagick
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick未安装。请先安装ImageMagick:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: 下载并安装 ImageMagick"
    exit 1
fi

echo "正在生成Chrome扩展图标..."

# 生成不同尺寸的图标
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png

echo "图标生成完成！"
echo "生成的图标文件:"
echo "  - icons/icon16.png (16x16)"
echo "  - icons/icon48.png (48x48)"
echo "  - icons/icon128.png (128x128)"