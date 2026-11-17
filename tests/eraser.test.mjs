import{test}from'node:test';import assert from'node:assert/strict';
const e=await import('../eraser.mjs');
const style={color:'#ffffff',width:2,opacity:1,filled:false,points:[]};
test('eraser detects nearby line segments, not just vertices',()=>{let s={...style,type:'line',x1:10,y1:10,x2:100,y2:10};assert.ok(e.touchesShape(s,50,12,3));assert.equal(e.touchesShape(s,50,30,3),false);});
test('unfilled shapes erase only at their border, filled shapes also erase inside',()=>{let s={...style,type:'rectangle',x1:10,y1:10,x2:100,y2:100};assert.equal(e.touchesShape(s,50,50,3),false);assert.ok(e.touchesShape({...s,filled:true},50,50,3));assert.ok(e.touchesShape(s,11,50,3));});
test('ellipse and triangle hit tests respect their actual outlines',()=>{let s={...style,type:'ellipse',x1:10,y1:10,x2:90,y2:90};assert.ok(e.touchesShape(s,50,10,2));assert.equal(e.touchesShape(s,10,10,2),false);s.type='triangle';assert.equal(e.touchesShape(s,10,10,2),false);assert.ok(e.touchesShape({...s,filled:true},50,60,2));});
