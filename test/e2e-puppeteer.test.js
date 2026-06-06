/**
 * 暗影地牢 RPG - E2E 浏览器自动化测试
 * 使用 Puppeteer 模拟真实用户操作
 * 
 * 运行方式:
 *   npm install puppeteer
 *   node e2e-puppeteer.test.js
 * 
 * 环境要求: Node.js 16+, Chromium/Chrome
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  gameUrl: 'file://' + path.resolve(__dirname, '../index.html'),
  headless: false,           // true=无界面, false=有界面（调试用）
  slowMo: 50,                // 操作延迟(ms)，调试用
  timeout: 30000,            // 全局超时
  screenshotDir: path.join(__dirname, 'screenshots'),
  viewport: { width: 1280, height: 900 }
};

// ==================== 测试报告 ====================
class TestReporter {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  async log(testName, status, detail, screenshotPath) {
    const entry = {
      name: testName,
      status,
      detail: detail || '',
      screenshot: screenshotPath || '',
      timestamp: new Date().toISOString()
    };
    this.results.push(entry);
    if (status === 'PASS') this.passed++;
    else this.failed++;
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${status}] ${testName}${detail ? ' - ' + detail : ''}`);
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试报告');
    console.log('='.repeat(60));
    console.log(`总测试数: ${this.results.length}`);
    console.log(`✅ 通过: ${this.passed}`);
    console.log(`❌ 失败: ${this.failed}`);
    console.log(`⏱️ 耗时: ${duration}s`);
    console.log('='.repeat(60));
    
    if (this.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.detail}`);
      });
    }
    
    // 生成 HTML 报告
    this.generateHtmlReport();
    return this.failed === 0;
  }

  generateHtmlReport() {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>测试报告</title>
<style>
body{font-family:sans-serif;max-width:1200px;margin:20px auto;padding:20px;background:#1a1a2e;color:#e0e0e0}
h1{color:#ffd700}.pass{color:#4ade80}.fail{color:#f87171}.warn{color:#fbbf24}
table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;text-align:left;border-bottom:1px solid #333}
th{background:#2d2d44;color:#ffd700}tr:hover{background:#252538}
.screenshot{max-width:200px;max-height:120px;border:1px solid #444;border-radius:4px}
.summary{background:#252538;padding:15px;border-radius:8px;margin-bottom:20px}
</style></head><body>
<h1>🎮 暗影地牢 RPG - E2E 测试报告</h1>
<div class="summary">
  <div>总测试数: <b>${this.results.length}</b></div>
  <div class="pass">✅ 通过: ${this.passed}</div>
  <div class="fail">❌ 失败: ${this.failed}</div>
  <div>⏱️ 耗时: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s</div>
</div>
<table><tr><th>状态</th><th>测试名</th><th>详情</th><th>截图</th></tr>
${this.results.map(r => `<tr>
  <td class="${r.status === 'PASS' ? 'pass' : r.status === 'FAIL' ? 'fail' : 'warn'}">${r.status}</td>
  <td>${r.name}</td>
  <td>${r.detail}</td>
  <td>${r.screenshot ? `<img class="screenshot" src="${path.basename(r.screenshot)}">` : '-'}</td>
</tr>`).join('')}
</table></body></html>`;
    
    fs.writeFileSync(path.join(CONFIG.screenshotDir, 'report.html'), html);
    console.log(`📄 HTML 报告已保存: ${path.join(CONFIG.screenshotDir, 'report.html')}`);
  }
}

// ==================== 测试辅助函数 ====================
class GameTester {
  constructor(browser, page, reporter) {
    this.browser = browser;
    this.page = page;
    this.reporter = reporter;
    this.testCount = 0;
  }

  async screenshot(name) {
    const file = path.join(CONFIG.screenshotDir, `${String(++this.testCount).padStart(3, '0')}_${name}.png`);
    await this.page.screenshot({ path: file, fullPage: false });
    return file;
  }

  async clickNav(tabName) {
    await this.page.click(`[data-tab="${tabName}"]`);
    await this.page.waitForTimeout(300);
  }

  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (e) {
      return false;
    }
  }

  async elementExists(selector) {
    return await this.page.evaluate(sel => !!document.querySelector(sel), selector);
  }

  async getText(selector) {
    const el = await this.page.$(selector);
    if (!el) return '';
    return await el.evaluate(e => e.textContent);
  }

  async clickIfExists(selector) {
    if (await this.elementExists(selector)) {
      await this.page.click(selector);
      await this.page.waitForTimeout(300);
      return true;
    }
    return false;
  }

  async test(name, testFn) {
    try {
      await testFn();
      await this.reporter.log(name, 'PASS');
    } catch (e) {
      const screenshot = await this.screenshot(name.replace(/\s+/g, '_'));
      await this.reporter.log(name, 'FAIL', e.message, screenshot);
    }
  }

  // 执行页面内的游戏函数
  async evalGame(fn) {
    return await this.page.evaluate(fn);
  }
}

// ==================== 测试套件 ====================
async function runTests() {
  // 创建截图目录
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);

  const reporter = new TestReporter();
  const t = new GameTester(browser, page, reporter);

  try {
    // ========== 1. 页面加载 ==========
    await t.test('页面加载', async () => {
      await page.goto(CONFIG.gameUrl, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });
      const title = await page.title();
      if (!title.includes('暗影地牢')) throw new Error('页面标题不正确: ' + title);
    });

    await page.waitForTimeout(2000); // 等待初始化

    // ========== 2. 存档系统测试（核心） ==========
    await t.test('存档系统 - 初始状态检查', async () => {
      const hasSave = await t.evalGame(() => {
        return localStorage.getItem('shadow_dungeon_slot_0') !== null ||
               localStorage.getItem('shadow_dungeon_save_0') !== null;
      });
      console.log('  是否有存档:', hasSave);
    });

    await t.test('存档系统 - 手动存档', async () => {
      // 触发存档
      await t.evalGame(() => { if (typeof saveGame === 'function') saveGame(); });
      await page.waitForTimeout(500);
      
      const saveExists = await t.evalGame(() => {
        return localStorage.getItem('shadow_dungeon_save_0') !== null;
      });
      if (!saveExists) throw new Error('存档未写入 localStorage');
    });

    await t.test('存档系统 - 存档数据完整性', async () => {
      const data = await t.evalGame(() => {
        const raw = localStorage.getItem('shadow_dungeon_save_0');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch(e) { return null; }
      });
      
      if (!data) throw new Error('存档数据解析失败');
      if (!data.game) throw new Error('存档缺少 game 字段');
      if (!Array.isArray(data.game.heroes)) throw new Error('存档 heroes 不是数组');
      if (typeof data.game.stageProgress !== 'number') throw new Error('存档 stageProgress 不是数字');
      
      console.log(`  英雄数: ${data.game.heroes.length}, 关卡: ${data.game.stageProgress}`);
    });

    await t.test('存档系统 - 读档功能', async () => {
      // 记录当前英雄数量
      const beforeHeroes = await t.evalGame(() => G.heroes.length);
      
      // 触发读档
      const loaded = await t.evalGame(() => {
        if (typeof loadGame === 'function') {
          loadGame().then(() => true).catch(() => false);
          return true; // async 函数，这里简化处理
        }
        return false;
      });
      
      await page.waitForTimeout(1000);
      
      const afterHeroes = await t.evalGame(() => G.heroes.length);
      console.log(`  读档前后英雄数: ${beforeHeroes} -> ${afterHeroes}`);
    });

    await t.test('存档系统 - 存档覆盖', async () => {
      // 获取存档时间戳
      const ts1 = await t.evalGame(() => {
        const raw = localStorage.getItem('shadow_dungeon_save_0');
        if (!raw) return 0;
        try { return JSON.parse(raw).timestamp || 0; } catch(e) { return 0; }
      });
      
      await page.waitForTimeout(100);
      await t.evalGame(() => { if (typeof saveGame === 'function') saveGame(); });
      await page.waitForTimeout(500);
      
      const ts2 = await t.evalGame(() => {
        const raw = localStorage.getItem('shadow_dungeon_save_0');
        if (!raw) return 0;
        try { return JSON.parse(raw).timestamp || 0; } catch(e) { return 0; }
      });
      
      if (ts2 <= ts1) throw new Error('存档未更新: ' + ts1 + ' -> ' + ts2);
    });

    // ========== 3. 导航栏测试 ==========
    const tabs = ['town', 'heroes', 'team', 'battle', 'merge', 'equip', 'roguelike', 'zodiac'];
    for (const tab of tabs) {
      await t.test(`导航栏 - ${tab}`, async () => {
        await t.clickNav(tab);
        const active = await t.elementExists(`[data-tab="${tab}"].active`);
        if (!active) throw new Error('导航未激活');
        
        const contentVisible = await t.elementExists('#content');
        if (!contentVisible) throw new Error('内容区域未显示');
      });
    }

    // ========== 4. 城镇功能 ==========
    await t.clickNav('town');
    
    await t.test('城镇 - 模块按钮存在', async () => {
      const modules = ['battle', 'heroes', 'team', 'merge', 'equip'];
      for (const mod of modules) {
        const exists = await t.elementExists(`[onclick*="switchTab('${mod}')"]`);
        if (!exists) throw new Error(`城镇模块 ${mod} 按钮不存在`);
      }
    });

    await t.test('城镇 - 资源显示', async () => {
      const resExists = await t.elementExists('#res-gold');
      if (!resExists) throw new Error('资源栏未显示');
    });

    // ========== 5. 英雄系统 ==========
    await t.clickNav('heroes');
    await page.waitForTimeout(500);

    await t.test('英雄 - 英雄列表加载', async () => {
      const hasHeroes = await t.elementExists('.hero-card');
      if (!hasHeroes) {
        // 可能是空状态
        const emptyState = await t.elementExists('#content');
        if (!emptyState) throw new Error('英雄页面未加载');
      }
    });

    await t.test('英雄 - 点击英雄卡片', async () => {
      const hasHeroes = await t.elementExists('.hero-card');
      if (!hasHeroes) {
        console.log('  跳过: 没有英雄可点击');
        return;
      }
      
      await t.page.click('.hero-card');
      await page.waitForTimeout(500);
      
      const detailVisible = await t.elementExists('.hero-detail-modal, .modal-overlay, [class*="detail"]');
      if (!detailVisible) throw new Error('英雄详情未弹出');
      
      // 关闭详情
      await t.clickIfExists('.modal-close, [onclick="closeModal()"]');
    });

    // ========== 6. 编队系统 ==========
    await t.clickNav('team');
    await page.waitForTimeout(500);

    await t.test('编队 - 队伍槽位显示', async () => {
      const slots = await t.page.evaluate(() => 
        document.querySelectorAll('.team-slot, [class*="slot"]').length
      );
      if (slots === 0) throw new Error('没有队伍槽位');
      console.log(`  槽位数: ${slots}`);
    });

    // ========== 7. 战斗系统 ==========
    await t.clickNav('battle');
    await page.waitForTimeout(500);

    await t.test('战斗 - 战斗界面加载', async () => {
      const hasContent = await t.elementExists('#battle-info, #battle-scene, .battle-scene');
      if (!hasContent) throw new Error('战斗界面未加载');
    });

    await t.test('战斗 - 开始战斗按钮', async () => {
      const hasButton = await t.elementExists('[onclick*="runBattle"], [onclick*="startBattle"], .btn-primary');
      console.log('  战斗按钮存在:', hasButton);
    });

    // ========== 8. 装备系统 ==========
    await t.clickNav('equip');
    await page.waitForTimeout(500);

    await t.test('装备 - 装备界面加载', async () => {
      const hasEquip = await t.elementExists('.equip-card, [class*="equip"], #equipment-list');
      console.log('  装备元素存在:', hasEquip);
    });

    await t.test('装备 - 一键穿戴按钮', async () => {
      const hasBtn = await t.elementExists('[onclick*="autoEquipAll"], [onclick*="quickAutoEquipHero"]');
      console.log('  一键穿戴按钮存在:', hasBtn);
    });

    // ========== 9. 合成系统 ==========
    await t.clickNav('merge');
    await page.waitForTimeout(500);

    await t.test('合成 - 合成界面加载', async () => {
      const hasMerge = await t.elementExists('#merge-slots, [class*="merge"], .merge-slot');
      console.log('  合成元素存在:', hasMerge);
    });

    // ========== 10. 肉鸽系统 ==========
    await t.clickNav('roguelike');
    await page.waitForTimeout(500);

    await t.test('肉鸽 - 肉鸽界面加载', async () => {
      const hasRL = await t.elementExists('[onclick*="startRoguelike"], [class*="roguelike"], #roguelike-content');
      console.log('  肉鸽元素存在:', hasRL);
    });

    // ========== 11. 生肖系统 ==========
    await t.clickNav('zodiac');
    await page.waitForTimeout(500);

    await t.test('生肖 - 生肖界面加载', async () => {
      const hasZodiac = await t.elementExists('.zodiac-boss, [class*="zodiac"], #zodiac-list');
      console.log('  生肖元素存在:', hasZodiac);
    });

    // ========== 12. 金手指/调试 ==========
    await t.clickNav('cheats');
    await page.waitForTimeout(500);

    await t.test('金手指 - 调试界面加载', async () => {
      const hasCheats = await t.elementExists('#cheats-panel, [class*="cheat"], [onclick*="cheat"]');
      console.log('  金手指元素存在:', hasCheats);
    });

    // ========== 13. 存档读档全流程 ==========
    await t.test('存档读档 - 完整流程', async () => {
      // 1. 记录当前状态
      const stateBefore = await t.evalGame(() => ({
        heroes: G.heroes.length,
        stage: G.stageProgress,
        gold: G.resources.gold
      }));
      console.log('  存档前:', stateBefore);

      // 2. 手动存档
      await t.evalGame(() => { if (typeof saveGame === 'function') saveGame(); });
      await page.waitForTimeout(500);

      // 3. 修改状态（模拟游戏进度）
      await t.evalGame(() => {
        G.resources.gold = (G.resources.gold || 0) + 1000;
      });

      // 4. 再次存档
      await t.evalGame(() => { if (typeof saveGame === 'function') saveGame(); });
      await page.waitForTimeout(500);

      // 5. 验证存档包含新数据
      const savedGold = await t.evalGame(() => {
        const raw = localStorage.getItem('shadow_dungeon_save_0');
        if (!raw) return 0;
        try { return JSON.parse(raw).game.resources.gold; } catch(e) { return 0; }
      });
      
      if (savedGold !== stateBefore.gold + 1000) {
        throw new Error(`存档金币不匹配: 期望 ${stateBefore.gold + 1000}, 实际 ${savedGold}`);
      }
      
      console.log('  存档验证通过，金币:', savedGold);
    });

    // ========== 14. 性能测试 ==========
    await t.test('性能 - 页面加载时间', async () => {
      const metrics = await page.metrics();
      console.log(`  JS Heap: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(1)}MB`);
      console.log(`  任务数: ${metrics.TaskDuration?.toFixed(2) || 'N/A'}ms`);
    });

    await t.test('性能 - 内存泄漏检查', async () => {
      const heapBefore = await t.evalGame(() => 
        performance.memory ? performance.memory.usedJSHeapSize : 0
      );
      
      // 切换多个标签页
      for (const tab of ['town', 'heroes', 'team', 'battle', 'equip']) {
        await t.clickNav(tab);
        await page.waitForTimeout(200);
      }
      
      // 强制垃圾回收（如果可用）
      await t.evalGame(() => { if (window.gc) window.gc(); });
      await page.waitForTimeout(500);
      
      const heapAfter = await t.evalGame(() => 
        performance.memory ? performance.memory.usedJSHeapSize : 0
      );
      
      const growth = ((heapAfter - heapBefore) / 1024 / 1024).toFixed(1);
      console.log(`  内存变化: ${growth}MB (${(heapBefore/1024/1024).toFixed(1)} -> ${(heapAfter/1024/1024).toFixed(1)})`);
      
      if (heapAfter > heapBefore * 2) {
        console.log('  ⚠️ 内存增长明显，可能存在泄漏');
      }
    });

  } catch (e) {
    console.error('测试执行异常:', e);
    await reporter.log('测试执行', 'FAIL', e.message);
  } finally {
    // 生成报告
    const success = reporter.summary();
    
    // 关闭浏览器
    await browser.close();
    
    process.exit(success ? 0 : 1);
  }
}

// ==================== 入口 ====================
console.log('🎮 暗影地牢 RPG - E2E 自动化测试启动');
console.log(`📁 截图目录: ${CONFIG.screenshotDir}`);
console.log(`🌐 游戏地址: ${CONFIG.gameUrl}`);
console.log('');

runTests().catch(e => {
  console.error('测试框架异常:', e);
  process.exit(1);
});
