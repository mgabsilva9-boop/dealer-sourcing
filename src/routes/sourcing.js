/**
 * Rotas de Sourcing (Busca Inteligente)
 * Busca de veículos em múltiplas plataformas
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Dados mockados de sourcing (em produção, viriam de API real)
const SOURCING_DATA = [
  { id: 1, platform: "WebMotors", make: "Ram", model: "1500 Laramie", year: 2024, price: 395000, fipe: 430000, discount: -8.1, km: 15000, location: "Sao Paulo, SP", score: 92, time: "2h atras", phone: "(11) 98765-4321", url: "https://webmotors.com.br/anuncio/123456", kmRating: "Baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
  { id: 2, platform: "OLX", make: "BMW", model: "M2", year: 2023, price: 480000, fipe: 595000, discount: -19.3, km: 11000, location: "Campinas, SP", score: 98, time: "45min atras", phone: "(19) 99432-1098", url: "https://olx.com.br/autos/bmw-m2-987654", kmRating: "Muito baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
  { id: 3, platform: "Marketplace", make: "Toyota", model: "Hilux SRX", year: 2024, price: 258000, fipe: 298000, discount: -13.4, km: 20000, location: "Ribeirao Preto, SP", score: 87, time: "3h atras", phone: "(16) 99876-5432", url: "https://facebook.com/marketplace/456789", kmRating: "Media", owners: 2, accidents: 0, serviceHistory: "Parcial", bodyCondition: "Bom" },
  { id: 4, platform: "Mercado Livre", make: "Toyota", model: "SW4 Diamond", year: 2023, price: 305000, fipe: 340000, discount: -10.3, km: 25000, location: "Curitiba, PR", score: 71, time: "5h atras", phone: "(41) 98234-5678", url: "https://mercadolivre.com.br/MLB-321654", kmRating: "Media", owners: 2, accidents: 1, serviceHistory: "Sem registros", bodyCondition: "Regular" },
  { id: 5, platform: "WebMotors", make: "Ram", model: "2500 Laramie", year: 2024, price: 410000, fipe: 475000, discount: -13.7, km: 8000, location: "Goiania, GO", score: 95, time: "1h atras", phone: "(62) 99123-4567", url: "https://webmotors.com.br/anuncio/789012", kmRating: "Muito baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
  { id: 6, platform: "WebMotors", make: "Ford", model: "F-150 Raptor", year: 2024, price: 380000, fipe: 420000, discount: -9.5, km: 5000, location: "Brasilia, DF", score: 94, time: "30min atras", phone: "(61) 99876-5432", url: "https://webmotors.com.br/anuncio/654321", kmRating: "Muito baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
  { id: 7, platform: "OLX", make: "Hyundai", model: "Creta GLS", year: 2023, price: 125000, fipe: 155000, discount: -19.4, km: 35000, location: "Rio de Janeiro, RJ", score: 76, time: "1h atras", phone: "(21) 99876-5432", url: "https://olx.com.br/autos/hyundai-creta", kmRating: "Media", owners: 1, accidents: 0, serviceHistory: "Parcial", bodyCondition: "Bom" },
];

// GET - Listar todos os sourcing
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { make, model, priceMin, priceMax, kmMax, discountMin } = req.query;

    let results = [...SOURCING_DATA];

    // Filtrar por make (marca)
    if (make && make.trim()) {
      results = results.filter(v => v.make.toLowerCase().includes(make.toLowerCase()));
    }

    // Filtrar por model
    if (model && model.trim()) {
      results = results.filter(v => v.model.toLowerCase().includes(model.toLowerCase()));
    }

    // Filtrar por faixa de preço
    if (priceMin) {
      results = results.filter(v => v.price >= Number(priceMin));
    }
    if (priceMax) {
      results = results.filter(v => v.price <= Number(priceMax));
    }

    // Filtrar por km máximo
    if (kmMax) {
      results = results.filter(v => v.km <= Number(kmMax));
    }

    // Filtrar por desconto mínimo
    if (discountMin) {
      results = results.filter(v => v.discount <= Number(discountMin));
    }

    // Ordenar por score (melhor primeiro)
    results.sort((a, b) => b.score - a.score);

    res.json({
      total: results.length,
      results: results,
    });
  } catch (error) {
    console.error('Erro ao buscar sourcing:', error);
    res.status(500).json({ error: 'Erro ao buscar sourcing' });
  }
});

// GET - Listar todos (sem filtros)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    // Ordenar por score
    const sorted = [...SOURCING_DATA].sort((a, b) => b.score - a.score);

    res.json({
      total: sorted.length,
      results: sorted,
    });
  } catch (error) {
    console.error('Erro ao listar sourcing:', error);
    res.status(500).json({ error: 'Erro ao listar sourcing' });
  }
});

// GET - Obter um sourcing específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = SOURCING_DATA.find(v => v.id === Number(id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Erro ao buscar sourcing:', error);
    res.status(500).json({ error: 'Erro ao buscar sourcing' });
  }
});

// POST - Adicionar sourcing aos favoritos/interessados (para user)
router.post('/:id/interested', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = SOURCING_DATA.find(v => v.id === Number(id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Em produção, salvaria em DB
    res.json({
      message: 'Veículo marcado como interessante',
      vehicle: vehicle,
    });
  } catch (error) {
    console.error('Erro ao marcar como interessado:', error);
    res.status(500).json({ error: 'Erro ao marcar como interessado' });
  }
});

export default router;
