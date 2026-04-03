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

    // Log decoded token para debug
    console.log('[AUTH DEBUG] Decoded token:', {
      decodedKeys: Object.keys(decoded),
      decodedId: decoded.id,
      decodedEmail: decoded.email,
      decodedSub: decoded.sub,
      decodedUserId: decoded.user_id,
    });

    // Extrair user ID from JWT claims (custom 'id' field from auth.js, fallback to standard 'sub' ou 'user_id')
    let userId = decoded.id || decoded.sub || decoded.user_id;

    // Se não tem ID no token, buscar no banco pelo email
    if (!userId && decoded.email) {
      console.log('[AUTH DEBUG] userId não encontrado no token, buscando no banco...');
      try {
        const result = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [decoded.email]);
        if (result.rows[0]) {
          userId = result.rows[0].id;
          console.log('[AUTH DEBUG] userId encontrado no banco:', userId);
        }
      } catch (dbErr) {
        console.warn('[AUTH] Erro ao buscar user por email:', dbErr.message);
      }
    }

    console.log('[AUTH DEBUG] Final userId:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    // Adicionar dados do usuário ao request com explicit user ID
    req.user = {
      ...decoded,
      id: userId, // Ensure consistent access via req.user.id
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
