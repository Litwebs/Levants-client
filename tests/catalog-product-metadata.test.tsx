import { beforeEach, expect, test, vi } from 'vitest';
import { getProductPresentation } from '@/api/catalogProducts';
const { get }=vi.hoisted(()=>({get:vi.fn()}));
vi.mock('@/api/client',()=>({default:{get}}));
beforeEach(()=>vi.clearAllMocks());
test.each(['direct','wrapped'])('uses the existing public %s envelope without modifying its fields',async shape=>{
 const product={id:'milk',description:'Whole milk',variants:[{id:'v',description:'One litre'}]};get.mockResolvedValue({data:shape==='direct'?product:{product}});
 expect(await getProductPresentation('milk')).toBe(product);expect(get).toHaveBeenCalledWith('/products/milk');expect(product.variants[0].description).toBe('One litre');
});
test.each([{}, {data:{}}, {data:{id:'another',description:'Wrong product'}}])('ignores missing or mismatched metadata %j',async response=>{get.mockResolvedValue(response);expect(await getProductPresentation('milk')).toBeNull();});
