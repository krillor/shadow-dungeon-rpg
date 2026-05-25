---
name: github-auto-push
description: "自动记住 GitHub Token 并在修改文件后自动推送到 GitHub。支持保存 Token、自动提交、自动推送、配置 GitHub Pages 等功能。"
license: Proprietary
version: 1.0.0
---

# GitHub Auto Push Skill

自动记住 GitHub Token，在修改文件后一键推送到 GitHub。

## 功能特性

- 🔐 **安全存储 Token**: Token 加密存储在本地，无需每次都输入
- 🚀 **一键推送**: 自动提交并推送到 GitHub
- 🌐 **自动配置 Pages**: 自动启用 GitHub Pages
- 📊 **状态查看**: 查看当前 Git 状态和配置

## 安装

```bash
# 将 Skill 添加到 PATH
export PATH="/path/to/github-auto-push-skill/scripts:$PATH"
```

## 快速开始

### 1. 保存 GitHub Token

```bash
python3 /path/to/github-auto-push-skill/scripts/cli.py save-token ghp_xxxxxxxxxxxx
```

### 2. 设置目标仓库

```bash
python3 /path/to/github-auto-push-skill/scripts/cli.py set-repo <用户名> <仓库名>
```

### 3. 推送修改

```bash
# 进入项目目录
cd /path/to/your/project

# 一键推送
python3 /path/to/github-auto-push-skill/scripts/cli.py push -m "更新说明"
```

## 命令参考

### save-token
保存 GitHub Personal Access Token

```bash
cli.py save-token <token>
```

### set-repo
设置目标仓库信息

```bash
cli.py set-repo <username> <repo-name> [--branch main]
```

### push
立即推送到 GitHub

```bash
cli.py push [--path .] [--message "提交信息"] [--branch main]
```

### setup-pages
配置 GitHub Pages

```bash
cli.py setup-pages [--path .] [--branch main]
```

### status
查看当前状态

```bash
cli.py status [--path .]
```

### clear
清除所有保存的配置

```bash
cli.py clear
```

## 自动推送（文件修改时）

在代码中导入使用：

```python
import sys
sys.path.insert(0, "/path/to/github-auto-push-skill/scripts")
from github_push import commit_and_push

# 修改文件后自动推送
commit_and_push(
    path=".",
    message="自动提交",
    branch="main"
)
```

## 配置文件位置

- Token: `~/.config/github-auto-push/token.enc`
- 仓库配置: `~/.config/github-auto-push/repo.json`

## 安全说明

- Token 使用 base64 编码存储（建议在生产环境使用更强的加密）
- 配置文件权限设置为仅用户可访问 (600)
- 不会将 Token 输出到日志或控制台

## 依赖

- Python 3.7+
- Git
- 网络连接（用于 GitHub API 调用）
