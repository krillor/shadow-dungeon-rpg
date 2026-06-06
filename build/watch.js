/**
 * 暗影地牢 RPG - 开发监视脚本
 * 监听 src/ 目录变化，自动重新构建
 * 
 * 运行方式: node build/watch.js
 */

const fs = require('fs');
const path = require('path');
const { build } = require('./build');

const SRC_DIR = path.join(__dirname, '..', 'src');

console.log('👀 开发监视模式启动...');
console.log(`📁 监视目录: ${SRC_DIR}`);
console.log('📝 修改文件后将自动重新构建\n');

// 首次构建
build();

// 递归获取所有文件
function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// 监视文件变化
let isBuilding = false;
let pendingBuild = false;

function watchFiles() {
  const files = getAllFiles(SRC_DIR);
  
  files.forEach(file => {
    fs.watchFile(file, { interval: 500 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        const relPath = path.relative(SRC_DIR, file);
        console.log(`\n📝 文件变化: ${relPath}`);
        
        if (isBuilding) {
          pendingBuild = true;
          console.log('⏳ 构建中，稍后重试...');
          return;
        }
        
        isBuilding = true;
        try {
          build();
        } catch (e) {
          console.error('❌ 构建失败:', e.message);
        } finally {
          isBuilding = false;
          if (pendingBuild) {
            pendingBuild = false;
            console.log('🔄 执行挂起的构建...');
            build();
          }
        }
      }
    });
  });
  
  console.log(`👀 已监视 ${files.length} 个文件`);
}

// 启动监视
if (fs.existsSync(SRC_DIR)) {
  watchFiles();
} else {
  console.log('⚠️  src/ 目录不存在，请先创建模块化源码');
  console.log('   参考: docs/MODULARIZATION.md');
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 停止监视');
  process.exit(0);
});
