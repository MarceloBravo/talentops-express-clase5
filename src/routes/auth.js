// routes/auth.js
const express = require('express');
const { findUserByCredentials, generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// POST /auth/login
router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Username requerido'),
    body('password').notEmpty().withMessage('Password requerido')
  ],
  async (req, res) => {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { username, password } = req.body;

      // Verificar credenciales
      const user = findUserByCredentials(username, password);

      if (!user) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          code: 'AUTH_INVALID_CREDENTIALS'
        });
      }

      // Generar token
      const token = generateToken(user);

      // Responder sin contraseña
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      res.json({
        message: 'Login exitoso',
        user: userResponse,
        token,
        expiresIn: '24h'
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// POST /auth/verify - Verificar token
router.post('/verify', (req, res) => {
  // El middleware authenticate ya verifica el token
  // Si llega aquí, el token es válido
  res.json({
    valid: true,
    user: req.user
  });
});

module.exports = router;