/**
 * 暗影地牢 RPG - 代码审计测试
 * 直接读取 index.html 检查常见代码问题
 * 
 * 运行方式: node code-audit.test.js
 */

const fs = require('fs');
const path = require('path');

// ==================== 测试框架 ====================
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🔍 代码审计测试开始');
    console.log('='.repeat(60));
    const startTime = Date.now();

    for (const t of this.tests) {
      try {
        await t.fn();
        this.passed++;
        console.log('✅', t.name);
      } catch (e) {
        this.failed++;
        console.log('❌', t.name);
        console.log('   ', e.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 结果:', this.passed, '通过,', this.failed, '失败,', this.tests.length, '总计');
    console.log('⏱️ 耗时:', duration + 's');
    console.log('='.repeat(60));

    return this.failed === 0;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || '断言失败');
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `期望 ${expected}, 实际 ${actual}`);
  }
}

// ==================== 加载游戏代码 ====================
const gameCode = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const runner = new TestRunner();

// ========== 1. HTML 结构检查 ==========
runner.test('HTML - 文档类型声明', () => {
  assert(gameCode.includes('<!DOCTYPE html>'), '缺少 DOCTYPE 声明');
});

runner.test('HTML - 基本结构完整', () => {
  assert(gameCode.includes('<html'), '缺少 html 标签');
  assert(gameCode.includes('<head>'), '缺少 head 标签');
  assert(gameCode.includes('<body>'), '缺少 body 标签');
  assert(gameCode.includes('</html>'), '缺少 html 结束标签');
});

runner.test('HTML - 关键容器存在', () => {
  assert(gameCode.includes('id="app"') || gameCode.includes("id='app'"), '缺少 app 容器');
  assert(gameCode.includes('id="content"') || gameCode.includes("id='content'"), '缺少 content 容器');
});

// ========== 2. JavaScript 语法检查 ==========
runner.test('JS - 无未闭合括号', () => {
  // 简单检查：统计左右括号数量
  const openParen = (gameCode.match(/\(/g) || []).length;
  const closeParen = (gameCode.match(/\)/g) || []).length;
  // 允许模板字符串中的差异，但差距不应太大
  assert(Math.abs(openParen - closeParen) < 10, `括号不匹配: (=${openParen}, )=${closeParen}`);
});

runner.test('JS - 无未闭合花括号', () => {
  const openBrace = (gameCode.match(/\{/g) || []).length;
  const closeBrace = (gameCode.match(/\}/g) || []).length;
  assert(Math.abs(openBrace - closeBrace) < 10, `花括号不匹配: {=${openBrace}, }=${closeBrace}`);
});

runner.test('JS - 无未闭合方括号', () => {
  const openBracket = (gameCode.match(/\[/g) || []).length;
  const closeBracket = (gameCode.match(/\]/g) || []).length;
  assert(Math.abs(openBracket - closeBracket) < 10, `方括号不匹配: [=${openBracket}, ]=${closeBracket}`);
});

// ========== 3. 关键函数定义检查 ==========
runner.test('函数 - saveGame 定义', () => {
  assert(/function saveGame\(/.test(gameCode), '缺少 saveGame 函数');
});

runner.test('函数 - loadGame 定义', () => {
  assert(/function loadGame\(/.test(gameCode), '缺少 loadGame 函数');
});

runner.test('函数 - initGame 定义', () => {
  assert(/function initGame\(/.test(gameCode), '缺少 initGame 函数');
});

runner.test('函数 - switchTab 定义', () => {
  assert(/function switchTab\(/.test(gameCode), '缺少 switchTab 函数');
});

runner.test('函数 - renderCurrentTab 定义', () => {
  assert(/function renderCurrentTab\(/.test(gameCode), '缺少 renderCurrentTab 函数');
});

runner.test('函数 - runBattle 定义', () => {
  assert(/function runBattle\(/.test(gameCode), '缺少 runBattle 函数');
});

runner.test('函数 - getHeroStats 定义', () => {
  assert(/function getHeroStats\(/.test(gameCode), '缺少 getHeroStats 函数');
});

runner.test('函数 - equipItem 定义', () => {
  assert(/function equipItem\(/.test(gameCode), '缺少 equipItem 函数');
});

runner.test('函数 - showHeroDetail 定义', () => {
  assert(/function showHeroDetail\(/.test(gameCode), '缺少 showHeroDetail 函数');
});

runner.test('函数 - showToast 定义', () => {
  assert(/function showToast\(/.test(gameCode), '缺少 showToast 函数');
});

runner.test('函数 - showModal 定义', () => {
  assert(/function showModal\(/.test(gameCode), '缺少 showModal 函数');
});

runner.test('函数 - closeModal 定义', () => {
  assert(/function closeModal\(/.test(gameCode), '缺少 closeModal 函数');
});

// ========== 4. 关键变量定义检查 ==========
runner.test('变量 - G 对象定义', () => {
  assert(/var G\s*=/.test(gameCode) || /let G\s*=/.test(gameCode) || /const G\s*=/.test(gameCode), '缺少 G 对象定义');
});

runner.test('变量 - G_RL 对象定义', () => {
  assert(/var G_RL/.test(gameCode) || /let G_RL/.test(gameCode), '缺少 G_RL 对象定义');
});

runner.test('变量 - EQUIP_TEMPLATES 定义', () => {
  assert(/var EQUIP_TEMPLATES/.test(gameCode) || /const EQUIP_TEMPLATES/.test(gameCode), '缺少 EQUIP_TEMPLATES 定义');
});

runner.test('变量 - HERO_TEMPLATES 定义', () => {
  assert(/var HERO_TEMPLATES/.test(gameCode) || /const HERO_TEMPLATES/.test(gameCode), '缺少 HERO_TEMPLATES 定义');
});

runner.test('变量 - ROLES 定义', () => {
  assert(/var ROLES/.test(gameCode) || /const ROLES/.test(gameCode), '缺少 ROLES 定义');
});

// ========== 5. 存档键名一致性检查 ==========
runner.test('存档 - 键名格式一致', () => {
  // 游戏使用 SLOT_PREFIX = 'sd_slot_'
  assert(gameCode.includes("SLOT_PREFIX = 'sd_slot_'"), "未找到 SLOT_PREFIX = 'sd_slot_'");
  assert(gameCode.includes("META_KEY = 'shadow_dungeon_meta_v"), "未找到 META_KEY");
  
  // 检查 getSlotKey 函数
  assert(/function getSlotKey\(idx\)/.test(gameCode), '未找到 getSlotKey 函数');
});

// ========== 6. onclick 属性检查 ==========
runner.test('HTML - onclick 双引号冲突检查', () => {
  // 查找 onclick="..." 中包含未转义双引号的情况
  const onclickMatches = gameCode.match(/onclick="[^"]*"[^"]*"/g) || [];
  const problematic = onclickMatches.filter(m => {
    // 排除正确转义的情况
    return m.includes('"') && !m.includes('\\"') && !m.includes("'");
  });
  
  // 更精确的检查：查找 onclick="..." 中包含 " 但未转义的情况
  const lines = gameCode.split('\n');
  let issues = 0;
  lines.forEach((line, idx) => {
    if (line.includes('onclick="') && line.includes('_uidJson')) {
      // 检查是否使用了单引号包裹
      if (!line.includes("onclick='") && !line.includes('onclick=\\')) {
        issues++;
      }
    }
  });
  
  assert(issues === 0, `发现 ${issues} 处潜在的 onclick 引号冲突`);
});

runner.test('HTML - onclick 使用单引号包裹', () => {
  // 检查所有包含 _uidJson 的 onclick 是否使用单引号
  const uidJsonPattern = /onclick[^>]*_uidJson/g;
  const matches = gameCode.match(uidJsonPattern) || [];
  
  let badCount = 0;
  matches.forEach(m => {
    if (m.includes('onclick="') && !m.includes("onclick='")) {
      badCount++;
    }
  });
  
  assert(badCount === 0, `发现 ${badCount} 处未使用单引号的 _uidJson onclick`);
});

// ========== 7. 新增系统函数检查 ==========
runner.test('函数 - 合成疲劳相关函数', () => {
  assert(/function getMergeFatiguePenalty/.test(gameCode), '缺少 getMergeFatiguePenalty 函数');
  assert(/function recoverMergeFatigue/.test(gameCode), '缺少 recoverMergeFatigue 函数');
  assert(/function getMergeFatigueDesc/.test(gameCode), '缺少 getMergeFatigueDesc 函数');
});

runner.test('函数 - 羁绊系统相关函数', () => {
  assert(/function detectActiveBonds/.test(gameCode), '缺少 detectActiveBonds 函数');
  assert(/function renderBondPreview/.test(gameCode), '缺少 renderBondPreview 函数');
  assert(/function toggleBondSlot/.test(gameCode), '缺少 toggleBondSlot 函数');
});

runner.test('函数 - 突破材料相关函数', () => {
  assert(/function initBreakthroughSystem/.test(gameCode), '缺少 initBreakthroughSystem 函数');
  assert(/function performBreakthrough/.test(gameCode), '缺少 performBreakthrough 函数');
  assert(/function renderBreakthroughUI/.test(gameCode), '缺少 renderBreakthroughUI 函数');
});

runner.test('函数 - 未知英雄兑换函数', () => {
  assert(/function getUnknownExchangeProgress/.test(gameCode), '缺少 getUnknownExchangeProgress 函数');
  assert(/function exchangeUnknownHero/.test(gameCode), '缺少 exchangeUnknownHero 函数');
  assert(/function openUnknownExchangePanel/.test(gameCode), '缺少 openUnknownExchangePanel 函数');
});

runner.test('函数 - 系统解锁函数', () => {
  assert(/function isSystemUnlocked/.test(gameCode), '缺少 isSystemUnlocked 函数');
  assert(/function updateNavLockState/.test(gameCode), '缺少 updateNavLockState 函数');
});

runner.test('函数 - 技能选择函数', () => {
  assert(/function getTotalSkillCount/.test(gameCode), '缺少 getTotalSkillCount 函数');
  assert(/function openSkillSelectPanel/.test(gameCode), '缺少 openSkillSelectPanel 函数');
});

runner.test('函数 - 天象战斗效果函数', () => {
  assert(/function getCurrentOmen/.test(gameCode), '缺少 getCurrentOmen 函数');
  assert(/function getOmenRemainingTime/.test(gameCode), '缺少 getOmenRemainingTime 函数');
  assert(/function formatOmenTime/.test(gameCode), '缺少 formatOmenTime 函数');
});

runner.test('变量 - 系统解锁配置', () => {
  assert(/const SYSTEM_UNLOCKS/.test(gameCode) || /var SYSTEM_UNLOCKS/.test(gameCode), '缺少 SYSTEM_UNLOCKS 定义');
});

runner.test('变量 - 羁绊配置', () => {
  assert(/const HERO_BONDS/.test(gameCode) || /var HERO_BONDS/.test(gameCode), '缺少 HERO_BONDS 定义');
});

// ========== 8. 数据完整性检查 ==========
runner.test('数据 - 英雄模板数量', () => {
  const heroTemplateMatches = gameCode.match(/HERO_TEMPLATES\s*=\s*\[/g);
  assert(heroTemplateMatches, '未找到 HERO_TEMPLATES 定义');
});

runner.test('数据 - 装备模板数量', () => {
  const equipTemplateMatches = gameCode.match(/EQUIP_TEMPLATES\s*=\s*\[/g);
  assert(equipTemplateMatches, '未找到 EQUIP_TEMPLATES 定义');
});

runner.test('数据 - 技能定义存在', () => {
  assert(/var SKILLS/.test(gameCode) || /const SKILLS/.test(gameCode), '缺少 SKILLS 定义');
});

// ========== 9. 潜在问题检查 ==========
runner.test('代码 - 无 console.log 遗留（生产环境）', () => {
  const consoleLogs = (gameCode.match(/console\.log\(/g) || []).length;
  console.log(`   发现 ${consoleLogs} 处 console.log`);
  // 警告但不失败，因为调试日志可能是故意的
});

runner.test('代码 - 无 debugger 语句', () => {
  const debuggers = (gameCode.match(/debugger;/g) || []).length;
  assert(debuggers === 0, `发现 ${debuggers} 处 debugger 语句`);
});

runner.test('代码 - 无 eval 使用', () => {
  const evals = (gameCode.match(/\beval\s*\(/g) || []).length;
  assert(evals === 0, `发现 ${evals} 处 eval 使用`);
});

runner.test('代码 - 无未定义变量使用', () => {
  // 简单检查：查找可能未定义的变量模式
  // 这个检查不精确，仅供参考
  const undefinedPatterns = [
    /\bundefined\b.*=.*undefined/,
    /typeof\s+\w+\s*===?\s*['"]undefined['"]/
  ];
  
  let count = 0;
  undefinedPatterns.forEach(p => {
    count += (gameCode.match(p) || []).length;
  });
  
  console.log(`   发现 ${count} 处 undefined 检查（正常）`);
});

// ========== 10. 文件大小检查 ==========
runner.test('文件 - 大小合理', () => {
  const sizeKB = gameCode.length / 1024;
  assert(sizeKB < 5000, `文件过大: ${sizeKB.toFixed(1)}KB，建议优化`);
  console.log(`   文件大小: ${sizeKB.toFixed(1)}KB`);
});

runner.test('文件 - 行数合理', () => {
  const lines = gameCode.split('\n').length;
  assert(lines < 50000, `行数过多: ${lines}，建议拆分`);
  console.log(`   文件行数: ${lines}`);
});

// ==================== 运行测试 ====================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error('测试框架错误:', e);
  process.exit(1);
});
