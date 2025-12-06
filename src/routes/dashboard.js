const express = require('express');
const router = express.Router();
const { getDashboardPage, getDashboardStats } = require('../controllers/dashboardController');
//const { authenticate, authorize } = require('../middleware/auth');

// Ruta para servir la página del dashboard (protegida)
router.get('/', getDashboardPage);

// Ruta para obtener las estadísticas del dashboard (protegida)
router.get('/stats', getDashboardStats);

module.exports = router;
