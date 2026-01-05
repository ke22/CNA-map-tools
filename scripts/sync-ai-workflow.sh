#!/bin/bash
# sync-ai-workflow.sh - 同步 AI 工作流到所有分支

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 同步 AI 工作流到所有分支"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 获取当前分支
current_branch=$(git branch --show-current)
echo "📍 当前分支: $current_branch"
echo ""

# 切换到 main 并拉取最新
echo "📥 更新 main 分支..."
git checkout main
if [ $? -ne 0 ]; then
    echo "❌ 无法切换到 main 分支"
    exit 1
fi

git pull origin main 2>/dev/null || echo "⚠️  无法拉取远程 main（可能未设置远程）"
echo ""

# 获取所有本地分支（排除 main 和当前分支）
branches=$(git branch | grep -v "main" | grep -v "*" | sed 's/^[ ]*//')

if [ -z "$branches" ]; then
    echo "ℹ️  没有其他分支需要同步"
    git checkout $current_branch 2>/dev/null
    exit 0
fi

echo "📋 将同步以下分支："
echo "$branches" | sed 's/^/  - /'
echo ""

# 询问确认
read -p "继续同步？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    git checkout $current_branch 2>/dev/null
    exit 1
fi

# 遍历所有分支
success_count=0
fail_count=0

for branch in $branches; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 同步到分支: $branch"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    git checkout $branch 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️  无法切换到分支 $branch，跳过"
        ((fail_count++))
        continue
    fi
    
    # 合并 main（只合并基础设施文件）
    if git merge main --no-edit --no-ff 2>/dev/null; then
        echo "✅ $branch 已成功更新"
        ((success_count++))
    else
        echo "⚠️  $branch 有冲突，需要手动解决"
        echo "   运行以下命令解决冲突："
        echo "   git checkout $branch"
        echo "   git merge main"
        echo "   # 解决冲突后: git commit"
        git merge --abort 2>/dev/null
        ((fail_count++))
    fi
done

# 返回原分支
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 同步完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 成功: $success_count 个分支"
echo "⚠️  失败: $fail_count 个分支"
echo ""

# 尝试返回原分支
git checkout $current_branch 2>/dev/null || echo "⚠️  无法返回原分支 $current_branch"

echo ""
echo "💡 提示："
echo "  - 新创建的分支会自动包含 AI 工作流（从 main 创建）"
echo "  - 如果分支有冲突，需要手动解决后提交"
echo "  - 验证文件: test -f CLAUDE.md && echo '✅ 已同步'"

