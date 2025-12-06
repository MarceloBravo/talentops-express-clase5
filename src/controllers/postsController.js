// controllers/postsController.js
const { processQueryDSL } = require('../utils/searchProcessor');

const { v4: uuidv4 } = require('uuid');

// Base de datos simulada
const categorias = {
  tecnologia: "Tecnología",
  viajes: "Viajes",
  deportes: "Deportes",
  entretenimiento: "Entretenimiento",
  videojuegos: "Videojuegos",
  politica: "Política",
  economia: "Economía",
  miscelaneo: "Miscelaneo"
}

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
    visitas: 0,
    categoria: categorias.miscelaneo
  }
];



// Obtener todos los posts
async function getPosts(req, res) {
  try {
    let resultados = [...posts];

    // Diferenciar entre búsqueda avanzada (POST) y búsqueda simple (GET)
    const isAdvancedSearch = req.method === 'POST' && req.body && Object.keys(req.body).length > 0;

    if (isAdvancedSearch) {
      // Búsqueda avanzada con Elasticsearch-like DSL
      resultados = processQueryDSL(resultados, req.body);
    } else {
      // Búsqueda y filtros simples desde query params (GET)
      const { autor, estado, etiqueta, categoria, busqueda, ordenar = 'fechaCreacion' } = req.query;

      if (autor) resultados = resultados.filter(p => p.autor === autor);
      if (estado) resultados = resultados.filter(p => p.estado === estado);
      if (etiqueta) resultados = resultados.filter(p => p.etiquetas.includes(etiqueta));
      if (categoria) resultados = resultados.filter(p => p.categoria === categoria);
      if (busqueda) {
        const termino = busqueda.toLowerCase();
        resultados = resultados.filter(p =>
          p.titulo.toLowerCase().includes(termino) ||
          p.contenido.toLowerCase().includes(termino)
        );
      }

      // Ordenamiento para GET
      resultados.sort((a, b) => {
        switch (ordenar) {
          case 'titulo': return a.titulo.localeCompare(b.titulo);
          case 'visitas': return b.visitas - a.visitas;
          case 'fechaCreacion':
          default: return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
        }
      });
    }

    // Paginación (se aplica a ambos tipos de búsqueda)
    const { pagina = 1, limite = 10 } = req.query;
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
      }
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
    const { titulo, contenido, etiquetas, estado, categoria } = req.body;
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
      visitas: 0,
      categoria: categoria || categorias.miscelaneo,
      likes: 0,
      likedBy: []
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

// Dar like/unlike a un post
async function likePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Asegurarse de que likedBy exista
    if (!post.likedBy) {
      post.likedBy = [];
    }

    const userIndex = post.likedBy.indexOf(userId);

    if (userIndex > -1) {
      // Usuario ya dio like, entonces quitarlo (unlike)
      post.likedBy.splice(userIndex, 1);
      post.likes = post.likedBy.length;
      res.json({ message: 'Like eliminado del post.', post });
    } else {
      // Usuario no ha dado like, entonces agregarlo
      post.likedBy.push(userId);
      post.likes = post.likedBy.length;
      res.json({ message: 'Post likeado exitosamente.', post });
    }
  } catch (error) {
    console.error('Error al dar like al post:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

    const { titulo, contenido, etiquetas, estado, categoria } = req.body;

    // Actualizar campos
    if (titulo) post.titulo = titulo.trim();
    if (contenido) post.contenido = contenido.trim();
    if (etiquetas) post.etiquetas = etiquetas;
    if (estado) post.estado = estado;
    if (categoria) post.categoria = categoria;

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
  deletePost,
  likePost,
  posts,
  categorias
};