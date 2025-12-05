// routes/comments.js
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCommentsByPost,
  createComment,
  updateCommentStatus,
  deleteComment
} = require('../controllers/commentsController');

const router = express.Router();

// Middleware de validación
const validarErrores = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// GET /posts/:postId/comments - Obtener comentarios de un post (público)
router.get('/posts/:postId/comments',
  [
    param('postId').isUUID().withMessage('ID de post debe ser un UUID válido'),
    query('estado').optional().isIn(['pendiente', 'aprobado', 'rechazado']).withMessage('Estado inválido'),
    query('pagina').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50')
  ],
  validarErrores,
  getCommentsByPost
);

// POST /posts/:postId/comments - Crear comentario (público, pero con rate limiting)
router.post('/posts/:postId/comments',
  [
    param('postId').isUUID().withMessage('ID de post debe ser un UUID válido'),
    body('autor').trim().isLength({ min: 2, max: 50 }).withMessage('Autor debe tener entre 2 y 50 caracteres'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
    body('contenido').trim().isLength({ min: 10, max: 1000 }).withMessage('Contenido debe tener entre 10 y 1000 caracteres')
  ],
  validarErrores,
  createComment
);

// PUT /comments/:id/status - Actualizar estado de comentario (solo admin)
router.put('/comments/:id/status',
  authenticate,
  authorize('admin'),
  [
    param('id').isUUID().withMessage('ID de comentario debe ser un UUID válido'),
    body('estado').isIn(['pendiente', 'aprobado', 'rechazado']).withMessage('Estado inválido')
  ],
  validarErrores,
  updateCommentStatus
);

// DELETE /comments/:id - Eliminar comentario (solo admin)
router.delete('/comments/:id',
  authenticate,
  authorize('admin'),
  param('id').isUUID().withMessage('ID de comentario debe ser un UUID válido'),
  validarErrores,
  deleteComment
);

module.exports = router;