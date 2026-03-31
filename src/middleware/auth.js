/**
 * Middleware de Autenticação JWT
 * Verifica se o token é válido e extrai dados do usuário
 */

import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
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

    // Extrair user ID from JWT claims (custom 'id' field from auth.js, fallback to standard 'sub' or 'user_id')
    const userId = decoded.id || decoded.sub || decoded.user_id;

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
