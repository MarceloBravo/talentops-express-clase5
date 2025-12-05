// routes/posts.js
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postsController');

const router = express.Router();

// Middleware de validación para errores
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

// GET /posts - Listar posts (público)
router.get('/',
  [
    query('pagina').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
    query('ordenar').optional().isIn(['titulo', 'visitas', 'fechaCreacion']).withMessage('Ordenamiento inválido')
  ],
  validarErrores,
  getPosts
);

// GET /posts/:id - Obtener post específico (público)
router.get('/:id',
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  validarErrores,
  getPostById
);

// POST /posts - Crear post (requiere autenticación)
router.post('/',
  authenticate,
  authorize('author', 'admin'),
  [
    body('titulo').trim().isLength({ min: 3, max: 200 }).withMessage('Título debe tener entre 3 y 200 caracteres'),
    body('contenido').trim().isLength({ min: 10 }).withMessage('Contenido debe tener al menos 10 caracteres'),
    body('etiquetas').optional().isArray({ max: 10 }).withMessage('Máximo 10 etiquetas'),
    body('estado').optional().isIn(['borrador', 'publicado', 'archivado']).withMessage('Estado inválido')
  ],
  validarErrores,
  createPost
);

// PUT /posts/:id - Actualizar post (requiere autenticación y permisos)
router.put('/:id',
  authenticate,
  authorize('author', 'admin'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido'),
    body('titulo').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Título debe tener entre 3 y 200 caracteres'),
    body('contenido').optional().trim().isLength({ min: 10 }).withMessage('Contenido debe tener al menos 10 caracteres'),
    body('etiquetas').optional().isArray({ max: 10 }).withMessage('Máximo 10 etiquetas'),
    body('estado').optional().isIn(['borrador', 'publicado', 'archivado']).withMessage('Estado inválido')
  ],
  validarErrores,
  updatePost
);

// DELETE /posts/:id - Eliminar post (requiere autenticación y permisos)
router.delete('/:id',
  authenticate,
  authorize('author', 'admin'),
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  validarErrores,
  deletePost
);

module.exports = router;