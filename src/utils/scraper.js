/**
 * Web Scraper para WebMotors e OLX
 * Busca veículos em múltiplas plataformas
 */

import puppeteer from 'puppeteer';

// ===== WEBMOTORS SCRAPER =====

export const searchWebMotors = async (query) => {
  let browser;
  try {
    // Parse da query
    const { make, model, priceMax, year, km } = parseQuery(query);

    console.log(`🔍 Buscando em WebMotors: ${query}`);

    // Inicializar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(10000);

    // Construir URL
    const url = buildWebMotorsUrl({ make, model, priceMax, year, km });

    console.log(`📍 Acessando: ${url}`);

    // Acessar página
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Aguardar carregamento de resultados
    await page.waitForSelector('.car-item, [data-test="vehicle-card"]', {
      timeout: 5000,
    }).catch(() => {
      console.log('⚠️ Seletor não encontrado, tentando alternativa...');
    });

    // Extrair dados dos carros
    const vehicles = await page.evaluate(() => {
      const items = document.querySelectorAll('.car-item, [data-test="vehicle-card"], .vehicle-item');
      const result = [];

      items.forEach((item, _index) => {
        try {
          // Tentar extrair dados (múltiplos seletores possíveis)
          const title = item.querySelector('h2, .title, .vehicle-title')?.textContent || '';
          const priceText = item.querySelector('.price, .vehicle-price, [class*="price"]')?.textContent || '';
          const kmText = item.querySelector('.km, .mileage, [class*="km"]')?.textContent || '';
          const image = item.querySelector('img')?.src || '';
          const link = item.querySelector('a')?.href || '';

          if (title && priceText) {
            result.push({
              title: title.trim(),
              price: extractPrice(priceText),
              km: extractNumber(kmText),
              image,
              link,
              platform: 'WebMotors',
            });
          }
        } catch (e) {
          console.error('Erro ao extrair item:', e);
        }
      });

      return result;
    });

    console.log(`✅ WebMotors: ${vehicles.length} carros encontrados`);

    return vehicles;
  } catch (error) {
    console.error('❌ Erro ao buscar WebMotors:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// ===== OLX SCRAPER =====

export const searchOLX = async (query) => {
  let browser;
  try {
    const { make, model } = parseQuery(query);

    console.log(`🔍 Buscando em OLX: ${query}`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(10000);

    // Construir URL
    const searchTerm = `${make} ${model}`.trim();
    const url = `https://www.olx.com.br/autos/carros?q=${encodeURIComponent(searchTerm)}`;

    console.log(`📍 Acessando: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Aguardar carregamento
    await page.waitForSelector('[data-testid="ad-item"], .ad, .listing-item', {
      timeout: 5000,
    }).catch(() => {
      console.log('⚠️ Seletor não encontrado');
    });

    const vehicles = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="ad-item"], .ad, .listing-item');
      const result = [];

      items.forEach((item) => {
        try {
          const title = item.querySelector('h2, .title, span')?.textContent || '';
          const priceText = item.querySelector('[class*="price"]')?.textContent || '';
          const image = item.querySelector('img')?.src || '';
          const link = item.querySelector('a')?.href || '';

          if (title && link) {
            result.push({
              title: title.trim(),
              price: extractPrice(priceText),
              km: 0,
              image,
              link,
              platform: 'OLX',
            });
          }
        } catch (e) {
          console.error('Erro ao extrair item:', e);
        }
      });

      return result;
    });

    console.log(`✅ OLX: ${vehicles.length} carros encontrados`);

    return vehicles;
  } catch (error) {
    console.error('❌ Erro ao buscar OLX:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Parse da query de busca
 * Exemplo: "BMW 3 series até 150K" → { make: "BMW", model: "3 series", priceMax: 150000 }
 */
function parseQuery(query) {
  const result = {
    make: '',
    model: '',
    priceMax: null,
    year: null,
    km: null,
  };

  // Extrair marca (primeira palavra)
  const words = query.toLowerCase().split(/\s+/);
  if (words.length > 0) {
    result.make = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }

  // Extrair modelo (palavras até "até")
  const atéIndex = query.toLowerCase().indexOf('até');
  if (atéIndex > -1) {
    const modelPart = query.substring(result.make.length, atéIndex).trim();
    result.model = modelPart;

    const priceStr = query.substring(atéIndex + 3).trim();
    result.priceMax = extractPrice(priceStr);
  } else {
    // Resto da string é modelo
    result.model = query.substring(result.make.length).trim();
  }

  return result;
}

/**
 * Extrair número de preço de uma string
 * "R$ 150.000" → 150000
 */
function extractPrice(text) {
  if (!text) return null;
  const match = text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
  if (match) {
    const normalized = match[1].replace(/\./g, '').replace(',', '.');
    return Math.round(parseFloat(normalized));
  }
  return null;
}

/**
 * Extrair números de uma string
 * "72.000 km" → 72000
 */
function extractNumber(text) {
  if (!text) return 0;
  const match = text.match(/(\d{1,3}(?:\.\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/\./g, ''), 10);
  }
  return 0;
}

/**
 * Construir URL WebMotors
 */
function buildWebMotorsUrl({ make, model, priceMax, year, _km }) {
  const params = new URLSearchParams();

  if (make) params.append('marca', make);
  if (model) params.append('modelo', model);
  if (priceMax) params.append('precoDe', '1');
  if (priceMax) params.append('precoAte', priceMax);
  if (year) params.append('anoAte', year);

  return `https://www.webmotors.com.br/api/search/car?${params.toString()}`;
}

/**
 * Buscar em múltiplas plataformas simultaneamente
 */
export const searchAllPlatforms = async (query) => {
  console.log(`\n🚀 Iniciando busca paralela: "${query}"\n`);

  try {
    // Buscar em paralelo
    const [webMotorsResults, olxResults] = await Promise.all([
      searchWebMotors(query).catch(() => []),
      searchOLX(query).catch(() => []),
    ]);

    // Combinar resultados
    const allVehicles = [...webMotorsResults, ...olxResults];

    // Remover duplicatas (mesmo link)
    const uniqueVehicles = Array.from(
      new Map(allVehicles.map(v => [v.link, v])).values(),
    );

    // Calcular score
    const vehiclesWithScore = uniqueVehicles.map(v => ({
      ...v,
      score: calculateScore(v, query),
    }));

    // Ordenar por score descente
    vehiclesWithScore.sort((a, b) => b.score - a.score);

    console.log(`\n✅ Total encontrado: ${vehiclesWithScore.length} carros\n`);

    return vehiclesWithScore;
  } catch (error) {
    console.error('❌ Erro ao buscar em plataformas:', error);
    return [];
  }
};

/**
 * Calcular score de oportunidade (0-100)
 */
function calculateScore(vehicle, query) {
  let score = 50; // Base

  // Bônus se título contém palavras-chave
  const queryWords = query.toLowerCase().split(/\s+/);
  queryWords.forEach(word => {
    if (vehicle.title.toLowerCase().includes(word)) {
      score += 5;
    }
  });

  // Bônus se tem imagem
  if (vehicle.image) score += 10;

  // Bônus se WebMotors (mais confiável)
  if (vehicle.platform === 'WebMotors') score += 10;

  // Capped at 100
  return Math.min(score, 100);
}

export default {
  searchWebMotors,
  searchOLX,
  searchAllPlatforms,
};
