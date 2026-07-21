export interface ScrapedProduct {
  productNameRaw: string;
  price: number;
  packageSizeG: number;
}

export interface Scraper {
  supermarket: 'walmart' | 'costco';
  searchProduct(query: string): Promise<ScrapedProduct[]>;
}
