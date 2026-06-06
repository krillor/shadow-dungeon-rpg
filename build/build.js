/**
 * 暗影地牢 RPG - 构建脚本
 * 将模块化源码合并为单个 HTML 文件
 * 
 * 运行方式: node build/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_FILE = path.join(DIST_DIR, 'index.html');

// JS 文件读取顺序（必须按依赖关系排列）
const JS_FILES = [
  // 1. 核心基础设施
  'core/constants.js',
  'core/utils.js',
  'core/events.js',
  
  // 2. 数据定义（只读配置，无依赖）
  'data/heroes.js',
  'data/equipment.js',
  'data/skills.js',
  'data/stages.js',
  'data/zodiac.js',
  'data/roguelike.js',
  'data/synthesis.js',
  
  // 3. 游戏系统（有依赖顺序）
  'systems/save/indexeddb.js',
  'systems/save/localstorage.js',
  'systems/save/backup.js',
  'systems/save/index.js',
  
  'systems/hero/index.js',
  'systems/hero/equipment.js',
  'systems/hero/talent.js',
  
  'systems/battle/index.js',
  'systems/battle/ai.js',
  'systems/battle/visual.js',
  
  'systems/synthesis/index.js',
  'systems/synthesis/scrolls.js',
  'systems/synthesis/dice.js',
  
  'systems/roguelike/index.js',
  'systems/roguelike/battle.js',
  'systems/roguelike/rewards.js',
  
  'systems/zodiac/index.js',
  'systems/zodiac/shop.js',
  
  'systems/building/index.js',
  'systems/recruit/index.js',
  'systems/achievement/index.js',
  'systems/cloud/index.js',
  
  // 4. UI 组件（依赖系统层）
  'ui/components/toast.js',
  'ui/components/modal.js',
  'ui/components/hero-card.js',
  'ui/components/equip-card.js',
  
  // 5. UI 页面（依赖组件层）
  'ui/pages/town.js',
  'ui/pages/heroes.js',
  'ui/pages/team.js',
  'ui/pages/battle.js',
  'ui/pages/synthesis.js',
  'ui/pages/equipment.js',
  'ui/pages/roguelike.js',
  'ui/pages/zodiac.js',
  'ui/pages/cheats.js',
  
  // 6. 应用入口
  'app.js'
];

// CSS 文件读取顺序
const CSS_FILES = [
  'ui/styles/base.css',
  'ui/styles/components.css',
  'ui/styles/pages.css',
  'ui/styles/animations.css'
];

// HTML 模板
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="x5-orientation" content="portrait">
<meta name="screen-orientation" content="portrait">
<meta name="theme-color" content="#0a0a12">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="暗影地牢">
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<meta name="msapplication-TileColor" content="#0a0a12">
<meta name="description" content="暗影地牢 - 一款文字策略RPG，招募英雄、组建队伍、探索地牢、挑战竞技场">
<link rel="manifest" href="manifest.json">
<title>暗影地牢 - 文字策略RPG</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/pako@2/dist/pako.min.js"></script>
<style>
/* === CSS_PLACEHOLDER === */
</style>
</head>
<body>
<div id="app">
  <div id="content"></div>
</div>
<div id="modal-overlay" class="modal-overlay" onclick="if(event.target===this)closeModal()"></div>
<div id="modal-content" class="modal-content"></div>
<div id="toast-container"></div>
<script>
/* === JS_PLACEHOLDER === */
</script>
</body>
</html>`;

function readFile(filePath) {
  const fullPath = path.join(SRC_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn('⚠️  文件不存在，跳过:', filePath);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function build() {
  console.log('🔨 开始构建...\n');
  const startTime = Date.now();
  
  // 1. 合并 CSS
  console.log('📄 合并 CSS...');
  let cssContent = '';
  let cssCount = 0;
  for (const file of CSS_FILES) {
    const content = readFile(file);
    if (content) {
      cssContent += `\n/* ===== ${file} ===== */\n${content}\n`;
      cssCount++;
    }
  }
  console.log(`   ✅ ${cssCount} 个 CSS 文件`);
  
  // 2. 合并 JS
  console.log('📄 合并 JS...');
  let jsContent = '';
  let jsCount = 0;
  for (const file of JS_FILES) {
    const content = readFile(file);
    if (content) {
      jsContent += `\n// ===== ${file} =====\n${content}\n`;
      jsCount++;
    }
  }
  console.log(`   ✅ ${jsCount} 个 JS 文件`);
  
  // 3. 组装 HTML
  let html = HTML_TEMPLATE;
  html = html.replace('/* === CSS_PLACEHOLDER === */', cssContent);
  html = html.replace('/* === JS_PLACEHOLDER === */', jsContent);
  
  // 4. 输出
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.writeFileSync(DIST_FILE, html);
  
  const duration = Date.now() - startTime;
  const sizeKB = (html.length / 1024).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 构建完成!');
  console.log('='.repeat(50));
  console.log(`📦 输出: ${path.relative(ROOT_DIR, DIST_FILE)}`);
  console.log(`📊 大小: ${sizeKB} KB`);
  console.log(`⏱️  耗时: ${duration}ms`);
  console.log(`📄 CSS: ${cssCount} 个文件`);
  console.log(`📄 JS: ${jsCount} 个文件`);
  console.log('='.repeat(50));
}

// 如果直接运行此脚本
if (require.main === module) {
  build();
}

module.exports = { build, JS_FILES, CSS_FILES };
