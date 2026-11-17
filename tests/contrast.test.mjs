import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';import{contrast,parseThemes}from'../contrast.mjs';
const themes=parseThemes(await fs.readFile(new URL('../theme.css',import.meta.url),'utf8'));
for(let [mode,c]of Object.entries(themes)){
 test(mode+' theme text meets WCAG AA 4.5:1 across UI surfaces',()=>{for(let fg of['fg','secondary','muted'])for(let bg of['bg','panel','surface','hover','selected','hud','input'])assert.ok(contrast(c[fg],c[bg])>=4.5,`${mode} ${fg}/${bg}: ${contrast(c[fg],c[bg]).toFixed(2)}`);assert.ok(contrast(c['accent-fg'],c.accent)>=4.5);assert.ok(contrast(c['danger-fg'],c['danger-bg'])>=4.5);});
 test(mode+' controls and focus indicators meet 3:1',()=>{for(let fg of['border','focus','accent'])for(let bg of['bg','panel','surface','input'])assert.ok(contrast(c[fg],c[bg])>=3,`${mode} ${fg}/${bg}: ${contrast(c[fg],c[bg]).toFixed(2)}`);});
}
