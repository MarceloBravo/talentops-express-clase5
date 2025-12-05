// controllers/postsController.js
const { v4: uuidv4 } = require('uuid');

// Base de datos simulada
let posts = [
  {
    id: uuidv4(),
    titulo: 'Bienvenido al Blog',
    contenido: 'Este es el primer post de nuestro blog...',
    autor: 'admin',
    etiquetas: ['bienvenida', 'blog'],
    estado: 'publicado',
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    visitas: 0
  }
];

// Obtener todos los posts
async function getPosts(req, res) {
  try {
    let resultados = [...posts];
    const {
      autor,
      estado,
      etiqueta,
      busqueda,
      ordenar = 'fechaCreacion',
      pagina = 1,
      limite = 10
    } = req.query;

    // Filtros
    if (autor) {
      resultados = resultados.filter(p => p.autor === autor);
    }

    if (estado) {
      resultados = resultados.filter(p => p.estado === estado);
    }

    if (etiqueta) {
      resultados = resultados.filter(p =>
        p.etiquetas.includes(etiqueta)
      );
    }

    // Búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      resultados = resultados.filter(p =>
        p.titulo.toLowerCase().includes(termino) ||
        p.contenido.toLowerCase().includes(termino)
      );
    }

    // Ordenamiento
    resultados.sort((a, b) => {
      switch (ordenar) {
        case 'titulo':
          return a.titulo.localeCompare(b.titulo);
        case 'visitas':
          return b.visitas - a.visitas;
        case 'fechaCreacion':
        default:
          return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
      }
    });

    // Paginación
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);
    const inicio = (paginaNum - 1) * limiteNum;
    const paginados = resultados.slice(inicio, inicio + limiteNum);

    res.json({
      posts: paginados,
      meta: {
        total: resultados.length,
        pagina: paginaNum,
        limite: limiteNum,
        paginasTotal: Math.ceil(resultados.length / limiteNum)
      },
      filtros: req.query
    });

  } catch (error) {
    console.error('Error obteniendo posts:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Obtener post por ID
async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    // Incrementar visitas
    post.visitas += 1;

    res.json(post);

  } catch (error) {
    console.error('Error obteniendo post:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Crear nuevo post
async function createPost(req, res) {
  try {
    const { titulo, contenido, etiquetas, estado } = req.body;
    const autor = req.user.username;

    const nuevoPost = {
      id: uuidv4(),
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      autor,
      etiquetas: etiquetas || [],
      estado: estado || 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      visitas: 0
    };

    posts.push(nuevoPost);

    res.status(201).json({
      message: 'Post creado exitosamente',
      post: nuevoPost
    });

  } catch (error) {
    console.error('Error creando post:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Actualizar post
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    // Verificar permisos (solo autor o admin pueden editar)
    if (post.autor !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'No tienes permisos para editar este post'
      });
    }

    const { titulo, contenido, etiquetas, estado } = req.body;

    // Actualizar campos
    if (titulo) post.titulo = titulo.trim();
    if (contenido) post.contenido = contenido.trim();
    if (etiquetas) post.etiquetas = etiquetas;
    if (estado) post.estado = estado;

    post.fechaActualizacion = new Date().toISOString();

    res.json({
      message: 'Post actualizado exitosamente',
      post
    });

  } catch (error) {
    console.error('Error actualizando post:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Eliminar post
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const indice = posts.findIndex(p => p.id === id);

    if (indice === -1) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    const post = posts[indice];

    // Verificar permisos
    if (post.autor !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar este post'
      });
    }

    posts.splice(indice, 1);

    res.json({
      message: 'Post eliminado exitosamente',
      post
    });

  } catch (error) {
    console.error('Error eliminando post:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};