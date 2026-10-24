import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getStockShortages} from '../src/lib/stockShortages.ts';
const shortage={variantId:'v',productId:'p',productName:'Whole Milk',variantName:'2L',requested:3,available:2};
const error=shortages=>({body:{error:{code:'INSUFFICIENT_STOCK'},data:{shortages}}});
test('structured API shortage survives error transport',()=>assert.deepEqual(getStockShortages(error([shortage])),[shortage]));
test('zero availability is retained',()=>assert.equal(getStockShortages(error([{...shortage,available:0}]))[0].available,0));
test('multiple shortages retain their identities',()=>assert.equal(getStockShortages(error([shortage,{...shortage,variantId:'other'}])).length,2));
test('malformed or unrelated errors cannot create customer stock claims',()=>{
  for(const value of [null,new Error('Network'),{body:{error:{code:'OTHER'}}}])assert.deepEqual(getStockShortages(value),[]);
  assert.deepEqual(getStockShortages(error([null,{}, {...shortage,available:-1},{...shortage,available:5}])),[]);
});
