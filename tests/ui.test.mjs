import{test}from'node:test';import assert from'node:assert/strict';
const ui=await import('../ui.mjs');
test('UI preferences normalize corrupt storage and clamp panel width',()=>{assert.deepEqual(ui.normalizePreferences({theme:'unknown',sidebarWidth:999,collapsed:'yes'}),{theme:'dark',sidebarWidth:360,collapsed:false});assert.equal(ui.normalizePreferences({theme:'light',sidebarWidth:50,collapsed:true}).sidebarWidth,180);assert.equal(ui.normalizePreferences({theme:'light'}).theme,'light');});
test('a desktop sidebar preference cannot consume a mobile canvas',()=>{assert.equal(ui.effectiveSidebarWidth(360,375),195);assert.equal(ui.effectiveSidebarWidth(360,320),140);assert.ok(320-ui.effectiveSidebarWidth(360,320)>=180);assert.equal(ui.effectiveSidebarWidth(360,1280),360);});
