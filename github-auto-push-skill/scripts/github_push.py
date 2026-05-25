#!/usr/bin/env python3
"""
GitHub 自动推送主模块
提供自动提交和推送到 GitHub 的功能
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# 添加脚本目录到路径
sys.path.insert(0, str(Path(__file__).parent))
from token_manager import get_token, get_repo_config, has_token, has_repo_config


def run_command(cmd: list[str], cwd: str | None = None, check: bool = True) -> tuple[int, str, str]:
    """
    运行 shell 命令
    
    Args:
        cmd: 命令列表
        cwd: 工作目录
        check: 是否检查返回码
        
    Returns:
        tuple: (返回码, stdout, stderr)
    """
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False
        )
        if check and result.returncode != 0:
            print(f"命令失败: {' '.join(cmd)}")
            print(f"错误: {result.stderr}")
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        print(f"执行命令时出错: {e}")
        return 1, "", str(e)


def is_git_repo(path: str = ".") -> bool:
    """检查路径是否为 Git 仓库"""
    git_dir = Path(path) / ".git"
    return git_dir.exists() and git_dir.is_dir()


def init_git_repo(path: str = ".") -> bool:
    """初始化 Git 仓库"""
    returncode, _, _ = run_command(["git", "init"], cwd=path)
    if returncode == 0:
        # 配置 git 用户信息
        run_command(["git", "config", "user.email", "solo@example.com"], cwd=path, check=False)
        run_command(["git", "config", "user.name", "SOLO"], cwd=path, check=False)
    return returncode == 0


def get_git_status(path: str = ".") -> dict:
    """
    获取 Git 状态
    
    Returns:
        dict: 包含 modified, added, deleted, untracked 文件列表
    """
    status = {
        "modified": [],
        "added": [],
        "deleted": [],
        "untracked": [],
        "staged": [],
        "clean": False
    }
    
    returncode, stdout, _ = run_command(["git", "status", "--porcelain"], cwd=path, check=False)
    if returncode != 0:
        return status
    
    for line in stdout.strip().split('\n'):
        if not line:
            continue
        
        state = line[:2]
        filename = line[3:].strip()
        
        if state == " M":
            status["modified"].append(filename)
        elif state == "M ":
            status["staged"].append(filename)
        elif state == "A ":
            status["added"].append(filename)
        elif state == "D ":
            status["deleted"].append(filename)
        elif state == "??":
            status["untracked"].append(filename)
    
    status["clean"] = not any([
        status["modified"], status["added"], status["deleted"],
        status["untracked"], status["staged"]
    ])
    
    return status


def add_remote(path: str, username: str, repo_name: str, token: str) -> bool:
    """添加远程仓库"""
    remote_url = f"https://{token}@github.com/{username}/{repo_name}.git"
    
    # 检查是否已存在 origin
    returncode, stdout, _ = run_command(["git", "remote", "get-url", "origin"], cwd=path, check=False)
    
    if returncode == 0:
        # 更新 remote URL
        returncode, _, _ = run_command(
            ["git", "remote", "set-url", "origin", remote_url],
            cwd=path
        )
    else:
        # 添加 remote
        returncode, _, _ = run_command(
            ["git", "remote", "add", "origin", remote_url],
            cwd=path
        )
    
    return returncode == 0


def commit_and_push(
    path: str = ".",
    message: str = "Auto commit by github-auto-push",
    branch: str = "main"
) -> bool:
    """
    提交并推送到 GitHub
    
    Args:
        path: 仓库路径
        message: 提交信息
        branch: 分支名称
        
    Returns:
        bool: 是否成功
    """
    # 检查是否有 token
    token = get_token()
    if not token:
        print("❌ 未找到 GitHub Token，请先运行 save-token 命令")
        return False
    
    # 检查仓库配置
    repo_config = get_repo_config()
    if not repo_config:
        print("❌ 未找到仓库配置，请先运行 set-repo 命令")
        return False
    
    username = repo_config.get("username")
    repo_name = repo_config.get("repo_name")
    
    # 确保是 git 仓库
    if not is_git_repo(path):
        print("🔄 初始化 Git 仓库...")
        if not init_git_repo(path):
            print("❌ 初始化 Git 仓库失败")
            return False
    
    # 检查状态
    status = get_git_status(path)
    
    if status["clean"]:
        print("✅ 没有需要提交的更改")
        return True
    
    # 添加所有更改
    print("📝 添加文件到暂存区...")
    returncode, _, _ = run_command(["git", "add", "."], cwd=path)
    if returncode != 0:
        print("❌ 添加文件失败")
        return False
    
    # 提交
    print(f"💾 提交更改: {message}")
    returncode, _, _ = run_command(["git", "commit", "-m", message], cwd=path)
    if returncode != 0:
        print("❌ 提交失败")
        return False
    
    # 配置 remote
    print("🔗 配置远程仓库...")
    if not add_remote(path, username, repo_name, token):
        print("❌ 配置远程仓库失败")
        return False
    
    # 推送
    print(f"🚀 推送到 GitHub ({branch})...")
    returncode, stdout, stderr = run_command(
        ["git", "push", "-u", "origin", branch],
        cwd=path,
        check=False
    )
    
    if returncode == 0:
        print(f"✅ 成功推送到 https://github.com/{username}/{repo_name}")
        return True
    else:
        print(f"❌ 推送失败: {stderr}")
        return False


def setup_github_pages(branch: str = "main", path: str = ".") -> bool:
    """
    配置 GitHub Pages
    
    Args:
        branch: 要部署的分支
        path: 仓库路径
        
    Returns:
        bool: 是否成功
    """
    token = get_token()
    repo_config = get_repo_config()
    
    if not token or not repo_config:
        print("❌ 缺少 Token 或仓库配置")
        return False
    
    username = repo_config.get("username")
    repo_name = repo_config.get("repo_name")
    
    import urllib.request
    import json
    
    url = f"https://api.github.com/repos/{username}/{repo_name}/pages"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    data = json.dumps({
        "source": {
            "branch": branch,
            "path": "/"
        }
    }).encode()
    
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201, 204]:
                pages_url = f"https://{username}.github.io/{repo_name}/"
                print(f"✅ GitHub Pages 配置成功")
                print(f"🌐 访问地址: {pages_url}")
                return True
            else:
                print(f"⚠️ 响应状态: {response.status}")
                return True
    except urllib.error.HTTPError as e:
        if e.code == 409:
            # 可能已经配置过了
            pages_url = f"https://{username}.github.io/{repo_name}/"
            print(f"✅ GitHub Pages 已配置")
            print(f"🌐 访问地址: {pages_url}")
            return True
        else:
            print(f"❌ 配置失败: {e}")
            return False
    except Exception as e:
        print(f"❌ 配置失败: {e}")
        return False


def show_status(path: str = "."):
    """显示当前状态"""
    print("=" * 50)
    print("GitHub Auto Push 状态")
    print("=" * 50)
    
    # Token 状态
    if has_token():
        token = get_token()
        masked = token[:4] + "..." + token[-4:] if len(token) > 8 else "***"
        print(f"🔑 Token: {masked} (已保存)")
    else:
        print("🔑 Token: 未设置")
    
    # 仓库配置
    if has_repo_config():
        config = get_repo_config()
        print(f"📁 仓库: {config.get('username')}/{config.get('repo_name')}")
        print(f"🌿 分支: {config.get('branch', 'main')}")
    else:
        print("📁 仓库: 未设置")
    
    # Git 状态
    if is_git_repo(path):
        status = get_git_status(path)
        print(f"\n📊 Git 状态:")
        if status["clean"]:
            print("   ✅ 工作区干净")
        else:
            if status["modified"]:
                print(f"   📝 修改: {len(status['modified'])} 个文件")
            if status["staged"]:
                print(f"   ➕ 已暂存: {len(status['staged'])} 个文件")
            if status["untracked"]:
                print(f"   ❓ 未跟踪: {len(status['untracked'])} 个文件")
    else:
        print("\n📊 Git: 不是 Git 仓库")
    
    print("=" * 50)


def main():
    parser = argparse.ArgumentParser(description="GitHub 自动推送工具")
    parser.add_argument("command", choices=[
        "push", "status", "setup-pages"
    ], help="要执行的命令")
    parser.add_argument("--path", "-p", default=".", help="仓库路径")
    parser.add_argument("--message", "-m", default="Auto commit", help="提交信息")
    parser.add_argument("--branch", "-b", default="main", help="分支名称")
    
    args = parser.parse_args()
    
    if args.command == "push":
        commit_and_push(args.path, args.message, args.branch)
    elif args.command == "status":
        show_status(args.path)
    elif args.command == "setup-pages":
        setup_github_pages(args.branch, args.path)


if __name__ == "__main__":
    main()
