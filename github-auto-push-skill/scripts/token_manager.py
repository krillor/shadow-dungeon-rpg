#!/usr/bin/env python3
"""
GitHub Token 管理模块
负责安全地存储和读取 GitHub Personal Access Token
"""

import os
import json
from pathlib import Path

# 配置文件路径
CONFIG_DIR = Path.home() / ".config" / "github-auto-push"
TOKEN_FILE = CONFIG_DIR / "token.enc"
REPO_CONFIG_FILE = CONFIG_DIR / "repo.json"


def ensure_config_dir():
    """确保配置目录存在"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    # 设置目录权限为仅用户可访问
    os.chmod(CONFIG_DIR, 0o700)


def save_token(token: str) -> bool:
    """
    保存 GitHub Token 到配置文件
    
    Args:
        token: GitHub Personal Access Token
        
    Returns:
        bool: 是否保存成功
    """
    try:
        ensure_config_dir()
        
        # 简单加密：使用 base64 编码（实际生产环境应使用更安全的加密方式）
        import base64
        encoded = base64.b64encode(token.encode()).decode()
        
        with open(TOKEN_FILE, 'w') as f:
            f.write(encoded)
        
        # 设置文件权限为仅用户可读写
        os.chmod(TOKEN_FILE, 0o600)
        return True
    except Exception as e:
        print(f"保存 Token 失败: {e}")
        return False


def get_token() -> str | None:
    """
    读取保存的 GitHub Token
    
    Returns:
        str | None: Token 字符串，如果不存在则返回 None
    """
    try:
        if not TOKEN_FILE.exists():
            return None
        
        import base64
        with open(TOKEN_FILE, 'r') as f:
            encoded = f.read().strip()
        
        return base64.b64decode(encoded.encode()).decode()
    except Exception as e:
        print(f"读取 Token 失败: {e}")
        return None


def save_repo_config(username: str, repo_name: str, branch: str = "main") -> bool:
    """
    保存仓库配置信息
    
    Args:
        username: GitHub 用户名
        repo_name: 仓库名称
        branch: 分支名称，默认为 main
        
    Returns:
        bool: 是否保存成功
    """
    try:
        ensure_config_dir()
        
        config = {
            "username": username,
            "repo_name": repo_name,
            "branch": branch,
            "remote_url": f"https://github.com/{username}/{repo_name}.git"
        }
        
        with open(REPO_CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        
        os.chmod(REPO_CONFIG_FILE, 0o600)
        return True
    except Exception as e:
        print(f"保存仓库配置失败: {e}")
        return False


def get_repo_config() -> dict | None:
    """
    读取仓库配置信息
    
    Returns:
        dict | None: 仓库配置字典，如果不存在则返回 None
    """
    try:
        if not REPO_CONFIG_FILE.exists():
            return None
        
        with open(REPO_CONFIG_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取仓库配置失败: {e}")
        return None


def clear_config() -> bool:
    """
    清除所有配置（Token 和仓库信息）
    
    Returns:
        bool: 是否清除成功
    """
    try:
        if TOKEN_FILE.exists():
            TOKEN_FILE.unlink()
        if REPO_CONFIG_FILE.exists():
            REPO_CONFIG_FILE.unlink()
        return True
    except Exception as e:
        print(f"清除配置失败: {e}")
        return False


def has_token() -> bool:
    """检查是否已保存 Token"""
    return TOKEN_FILE.exists() and get_token() is not None


def has_repo_config() -> bool:
    """检查是否已保存仓库配置"""
    return REPO_CONFIG_FILE.exists() and get_repo_config() is not None


if __name__ == "__main__":
    # 测试代码
    print("Token Manager 测试")
    print(f"配置目录: {CONFIG_DIR}")
    print(f"Token 文件: {TOKEN_FILE}")
    print(f"仓库配置: {REPO_CONFIG_FILE}")
