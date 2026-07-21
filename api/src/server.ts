import 'dotenv/config';
import { app } from './app';
import { scheduleSupermarketScraping } from './scraping/cron';

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`api listening on :${port}`));
scheduleSupermarketScraping();
