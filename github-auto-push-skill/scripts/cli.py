#!/usr/bin/env python3
"""
GitHub Auto Push Skill CLI
命令行接口，处理用户命令
"""

import sys
import argparse
from pathlib import Path

# 添加脚本目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from token_manager import (
    save_token, get_token, save_repo_config, get_repo_config,
    has_token, has_repo_config, clear_config
)
from github_push import commit_and_push, setup_github_pages, show_status


def cmd_save_token(args):
    """保存 Token 命令"""
    token = args.token
    
    # 验证 token 格式
    if not token.startswith(("ghp_", "github_pat_")):
        print("⚠️ 警告: Token 格式似乎不正确，GitHub Token 应以 'ghp_' 或 'github_pat_' 开头")
        response = input("是否继续保存? (y/N): ")
        if response.lower() != 'y':
            return
    
    if save_token(token):
        print("✅ Token 已保存")
        print("🔒 存储位置: ~/.config/github-auto-push/token.enc")
    else:
        print("❌ 保存失败")


def cmd_set_repo(args):
    """设置仓库命令"""
    if save_repo_config(args.username, args.repo_name, args.branch):
        print("✅ 仓库配置已保存")
        print(f"   用户: {args.username}")
        print(f"   仓库: {args.repo_name}")
        print(f"   分支: {args.branch}")
        print(f"   URL: https://github.com/{args.username}/{args.repo_name}")
    else:
        print("❌ 保存失败")


def cmd_push(args):
    """推送命令"""
    message = args.message or f"Update {args.path}"
    success = commit_and_push(args.path, message, args.branch)
    sys.exit(0 if success else 1)


def cmd_setup_pages(args):
    """配置 GitHub Pages"""
    success = setup_github_pages(args.branch, args.path)
    sys.exit(0 if success else 1)


def cmd_status(args):
    """状态命令"""
    show_status(args.path)


def cmd_clear(args):
    """清除配置命令"""
    if clear_config():
        print("✅ 所有配置已清除")
    else:
        print("❌ 清除失败")


def main():
    parser = argparse.ArgumentParser(
        prog="github-auto-push",
        description="GitHub 自动推送 Skill - 记住 Token，自动推送修改"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # save-token 命令
    token_parser = subparsers.add_parser("save-token", help="保存 GitHub Token")
    token_parser.add_argument("token", help="GitHub Personal Access Token")
    token_parser.set_defaults(func=cmd_save_token)
    
    # set-repo 命令
    repo_parser = subparsers.add_parser("set-repo", help="设置目标仓库")
    repo_parser.add_argument("username", help="GitHub 用户名")
    repo_parser.add_argument("repo_name", help="仓库名称")
    repo_parser.add_argument("--branch", "-b", default="main", help="分支名称 (默认: main)")
    repo_parser.set_defaults(func=cmd_set_repo)
    
    # push 命令
    push_parser = subparsers.add_parser("push", help="立即推送到 GitHub")
    push_parser.add_argument("--path", "-p", default=".", help="仓库路径 (默认: 当前目录)")
    push_parser.add_argument("--message", "-m", help="提交信息")
    push_parser.add_argument("--branch", "-b", default="main", help="分支名称")
    push_parser.set_defaults(func=cmd_push)
    
    # setup-pages 命令
    pages_parser = subparsers.add_parser("setup-pages", help="配置 GitHub Pages")
    pages_parser.add_argument("--path", "-p", default=".", help="仓库路径")
    pages_parser.add_argument("--branch", "-b", default="main", help="分支名称")
    pages_parser.set_defaults(func=cmd_setup_pages)
    
    # status 命令
    status_parser = subparsers.add_parser("status", help="查看状态")
    status_parser.add_argument("--path", "-p", default=".", help="仓库路径")
    status_parser.set_defaults(func=cmd_status)
    
    # clear 命令
    clear_parser = subparsers.add_parser("clear", help="清除所有配置")
    clear_parser.set_defaults(func=cmd_clear)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        # 显示当前状态
        print("\n" + "=" * 50)
        show_status()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
