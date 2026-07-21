import { describe, it, expect } from 'vitest';
import { parseWalmartSearchResults } from './walmartScraper';

const SAMPLE_HTML = `
<div class="search-result-gridview-item">
  <span class="product-title">Pechuga de Pollo 1kg</span>
  <span class="price">$89.50</span>
</div>
<div class="search-result-gridview-item">
  <span class="product-title">Arroz Blanco 900g</span>
  <span class="price">$25.00</span>
</div>
`;

describe('parseWalmartSearchResults', () => {
  it('extrae nombre, precio y gramaje de cada tarjeta de producto', () => {
    const results = parseWalmartSearchResults(SAMPLE_HTML);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ productNameRaw: 'Pechuga de Pollo 1kg', price: 89.50, packageSizeG: 1000 });
    expect(results[1]).toEqual({ productNameRaw: 'Arroz Blanco 900g', price: 25.00, packageSizeG: 900 });
  });

  it('ignora tarjetas sin precio o sin gramaje parseable', () => {
    const results = parseWalmartSearchResults('<div class="search-result-gridview-item"><span class="product-title">Producto sin unidades</span><span class="price">$10.00</span></div>');
    expect(results).toHaveLength(0);
  });
});
