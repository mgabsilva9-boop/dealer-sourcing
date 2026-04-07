/**
 * Middleware de Autenticação JWT
 * Verifica se o token é válido e extrai dados do usuário
 */

import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar e decodificar token
    const jwtSecret = process.env.JWT_SECRET || 'SECRET_FALLBACK_UNSAFE_DEVELOPMENT_ONLY';
    const decoded = jwt.verify(token, jwtSecret);

    // Extrair user ID from JWT claims (custom 'id' field from auth.js, fallback to standard 'sub' ou 'user_id')
    let userId = decoded.id || decoded.sub || decoded.user_id;

    // Se não tem ID no token, buscar no banco pelo email
    if (!userId && decoded.email) {
      try {
        const result = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [decoded.email]);
        if (result.rows[0]) {
          userId = result.rows[0].id;
        }
      } catch (dbErr) {
        console.warn('[AUTH] Erro ao buscar user por email:', dbErr.message);
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    // VALIDAÇÃO CRÍTICA: dealership_id deve existir
    if (!decoded.dealership_id) {
      console.warn('[AUTH] Token missing dealership_id:', { userId, email: decoded.email });
      return res.status(401).json({ error: 'Token inválido: dealership_id ausente' });
    }

    // Adicionar dados do usuário ao request com explicit user ID
    req.user = {
      ...decoded,
      id: userId, // Ensure consistent access via req.user.id
      dealership_id: decoded.dealership_id, // Garantir acesso consistente
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }

    return res.status(401).json({ error: 'Token inválido' });
  }
};

export default authMiddleware;
