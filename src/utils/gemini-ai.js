/**
 * Gemini AI Utilities
 * Extração de filtros e geração de resumos
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extrai filtros de um texto em linguagem natural
 * Ex: "Civic 2020 automático até 80 mil" → {make: "Honda", model: "Civic", priceMax: 80000, ...}
 */
export async function extractFiltersFromText(text) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Você é um assistente especialista em classificados de carros.
Analise o seguinte texto e extraia os filtros de busca em JSON.

Texto: "${text}"

Retorne APENAS um JSON válido (sem markdown, sem explicações) com os seguintes campos (se não conseguir extrair, deixe null):
{
  "make": "marca do carro (ex: Honda, BMW, Toyota) ou null",
  "model": "modelo do carro ou null",
  "year_min": "ano mínimo (número) ou null",
  "year_max": "ano máximo (número) ou null",
  "price_min": "preço mínimo em reais (número) ou null",
  "price_max": "preço máximo em reais (número) ou null",
  "km_max": "quilometragem máxima (número) ou null",
  "discount_min": "desconto mínimo em % (número) ou null"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();

    // Parse JSON (remover possível markdown)
    let jsonStr = text_response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    }

    const filters = JSON.parse(jsonStr);

    // Converter para camelCase (nosso padrão)
    return {
      make: filters.make,
      model: filters.model,
      yearMin: filters.year_min,
      yearMax: filters.year_max,
      priceMin: filters.price_min,
      priceMax: filters.price_max,
      kmMax: filters.km_max,
      discountMin: filters.discount_min,
    };
  } catch (error) {
    console.error('❌ Erro ao extrair filtros com Gemini:', error);
    throw new Error('Não foi possível entender sua busca. Tente descrever melhor (ex: "Civic até 80 mil")');
  }
}

/**
 * Gera resumo inteligente dos resultados
 * Ex: "Encontrei 8 opções. Destaque: Honda Civic 2021 com apenas 15k km por R$ 75k"
 */
export async function summarizeResults(vehicles, originalQuery) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  if (vehicles.length === 0) {
    return 'Nenhum veículo encontrado com esses critérios. Tente ampliar os filtros.';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Top 3 veículos por score
    const topVehicles = vehicles.slice(0, 3);

    const vehiclesList = topVehicles
      .map(
        (v) =>
          `${v.make} ${v.model} ${v.year} | R$ ${v.price.toLocaleString()} | ${v.km.toLocaleString()} km | Score: ${v.score}`
      )
      .join('\n');

    const prompt = `Você é um especialista em vendas de carros.
Foram encontrados ${vehicles.length} veículos para: "${originalQuery}"

Top 3 opções:
${vehiclesList}

Gere um resumo curto, amigável e motivador (máx 2 linhas) destacando:
1. Quantidade de opções encontradas
2. Qual é a melhor opção (por score, km ou preço)
3. Um detalhe que torne a recomendação atrativa

Tom: profissional mas conversável. Sem emojis.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('❌ Erro ao gerar resumo com Gemini:', error);
    return `Encontrei ${vehicles.length} veículos! O melhor tem score ${vehicles[0]?.score || 0}.`;
  }
}

/**
 * Gera mensagem WhatsApp personalizada para busca salva com novidades
 * Ex: "🚗 Ótimas notícias! Encontrei 2 novos BMW M3 que combinam com sua busca..."
 */
export async function generateWhatsAppMessage(searchName, newVehicles, allVehicles) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  if (newVehicles.length === 0) {
    return `Olá! Segui monitorando sua busca "${searchName}" mas nenhuma novidade por enquanto. Continuo de olho! 👀`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Top 1-2 novos veículos
    const topNew = newVehicles.slice(0, 2);

    const vehiclesList = topNew
      .map((v) => `• ${v.make} ${v.model} ${v.year} — R$ ${v.price.toLocaleString()} | ${v.km.toLocaleString()} km`)
      .join('\n');

    const prompt = `Você é um concierge de vendas de carros via WhatsApp.
Uma pessoa monitorou a busca "${searchName}" e apareceram ${newVehicles.length} novo(s).

Novidades:
${vehiclesList}

Gere uma mensagem WhatsApp curta, entusiasmada e sem emojis:
- Comece com "Olá!"
- Diga quantos novos encontrou
- Destaque o melhor por score ou km
- Inclua o preço
- Termine com chamada à ação ("Quer mais detalhes?")
- Máx 3 linhas

Sem emojis. Tom: profissional mas amigável.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('❌ Erro ao gerar msg WhatsApp:', error);
    return `Olá! Encontrei ${newVehicles.length} novo(s) na sua busca. Quer conferir?`;
  }
}

/**
 * Check-in diário: "sem novidades" ou "achei X novos, recomendo Y"
 */
export async function generateCheckInMessage(searchName, hasNew, newVehicles) {
  if (!process.env.GEMINI_API_KEY) {
    return hasNew
      ? `Achei ${newVehicles.length} novo(s) em "${searchName}". Quer ver?`
      : `Sem novidades em "${searchName}" por enquanto. Continuo monitorando!`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = hasNew
      ? `Mensagem curta de check-in (1 linha): Achei ${newVehicles.length} novo(s) em "${searchName}". Qual a recomendação top?`
      : `Mensagem curta de check-in (1 linha): Sem novidades em "${searchName}" mas continuo de olho.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    return hasNew
      ? `Novidades em "${searchName}"!`
      : `Monitorando "${searchName}"...`;
  }
}
