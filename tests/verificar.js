'use strict';
const assert=require('node:assert/strict');
const {DEFAULTS,exact,solve,compareBase}=require('../app.js');
function near(actual,expected,tol=1e-8){assert.ok(Math.abs(actual-expected)<tol,`${actual} ≠ ${expected}`)}
const rows=solve(DEFAULTS),last=rows.at(-1);
assert.equal(rows.length,11);near(rows[0].vEuler,0);near(rows[1].vEuler,10.38);near(rows[1].yEuler,0);near(rows[2].vEuler,18.684);near(rows[2].yEuler,20.76);
near(last.vEuler,46.32727993344);near(last.yEuler,574.7272006656);near(last.vExact,44.8760988000198);near(last.yExact,589.239012);
const x=exact({...DEFAULTS,mass:1200,thrust:18000,drag:120,v0:2,y0:150},8);assert.ok(x.y>150 && x.v>2);
const nonIntegral=solve({...DEFAULTS,time:5,step:2});near(nonIntegral.at(-1).t,5);assert.equal(nonIntegral.length,4);
assert.throws(()=>solve({...DEFAULTS,mass:0}),/masa/i);
assert.throws(()=>solve({...DEFAULTS,thrust:9000}),/empuje/i);
assert.throws(()=>solve({...DEFAULTS,step:0}),/positivos/i);
const compare=compareBase();assert.equal(compare.length,3);assert.ok(compare[2].final.errorV<compare[1].final.errorV);assert.ok(compare[1].final.errorV<compare[0].final.errorV);
console.log('OK: 15 comprobaciones de cálculos, condiciones, paso final y convergencia.');
