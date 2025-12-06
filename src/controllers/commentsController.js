// controllers/commentsController.js
const posts = require('./postsController').posts;
const { v4: uuidv4 } = require('uuid');
const { createTestTransporter } = require('../config/mailer');

// Base de datos simulada
let comments = [
  {
    id: uuidv4(),
    postId: posts[0].id, // Referencia al primer post
    autor: 'Usuario Anónimo',
    email: 'usuario@example.com',
    contenido: 'Excelente primer post!',
    estado: 'pendiente',
    fechaCreacion: new Date().toISOString()
  }
];

// Inicializamos el mailer al arrancar el controlador
let mailer;
createTestTransporter().then(result => {
  mailer = result;
}).catch(console.error);


// Obtener comentarios de un post
async function getCommentsByPost(req, res) {
  try {
    const { postId } = req.params;
    const { estado, pagina = 1, limite = 10 } = req.query;

    // Verificar que el post existe
    const postExists = posts.some(p => p.id === postId);
    if (!postExists) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    let resultados = comments.filter(c => c.postId === postId);

    // Filtrar por estado. Por defecto, solo se muestran los aprobados.
    if (estado) {
      resultados = resultados.filter(c => c.estado === estado);
    } else {
      resultados = resultados.filter(c => c.estado === 'aprobado');
    }

    // Ordenar por fecha (más recientes primero)
    resultados.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

    // Paginación
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);
    const inicio = (paginaNum - 1) * limiteNum;
    const paginados = resultados.slice(inicio, inicio + limiteNum);

    res.json({
      comments: paginados,
      meta: {
        total: resultados.length,
        pagina: paginaNum,
        limite: limiteNum,
        paginasTotal: Math.ceil(resultados.length / limiteNum)
      }
    });

  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Crear comentario
async function createComment(req, res) {
  try {
    const { postId } = req.params;
    const { autor, email, contenido } = req.body;

    // Verificar que el post existe
    const postExists = posts.some(p => p.id === postId);
    if (!postExists) {
      return res.status(404).json({
        error: 'Post no encontrado'
      });
    }

    const nuevoComment = {
      id: uuidv4(),
      postId,
      autor: autor.trim(),
      email: email ? email.trim() : null,
      contenido: contenido.trim(),
      estado: 'pendiente', // Comentarios nuevos necesitan aprobación
      fechaCreacion: new Date().toISOString(),
      likes: 0
    };

    comments.push(nuevoComment);

    res.status(201).json({
      message: 'Comentario enviado exitosamente',
      comment: nuevoComment
    });

  } catch (error) {
    console.error('Error creando comentario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Dar like a un comentario
async function likeComment(req, res) {
  try {
    const { id } = req.params;
    const comment = comments.find(c => c.id === id);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Si 'likes' no existe, lo inicializamos
    if (typeof comment.likes !== 'number') {
      comment.likes = 0;
    }

    comment.likes += 1;

    res.json({ message: 'Comentario likeado exitosamente.', comment });
  } catch (error) {
    console.error('Error al dar like al comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Actualizar estado de comentario (solo admin)
async function updateCommentStatus(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const comment = comments.find(c => c.id === id);

    if (!comment) {
      return res.status(404).json({
        error: 'Comentario no encontrado'
      });
    }

    // Validar estado
    const estadosValidos = ['pendiente', 'aprobado', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido',
        estadosValidos
      });
    }

    const estadoAnterior = comment.estado;
    comment.estado = estado;

    // Si el comentario se acaba de aprobar, enviar email
    if (estado === 'aprobado' && estadoAnterior !== 'aprobado' && comment.email) {
      if (mailer) {
        try {
          const info = await mailer.transporter.sendMail({
            from: '"Blog API" <no-reply@blog.com>',
            to: comment.email,
            subject: 'Tu comentario ha sido aprobado',
            text: `¡Hola ${comment.autor}!\n\nTu comentario "${comment.contenido.substring(0, 30)}..." ha sido aprobado y ya está visible públicamente.\n\nGracias por participar.`,
            html: `<p>¡Hola ${comment.autor}!</p><p>Tu comentario "<i>${comment.contenido.substring(0, 30)}...</i>" ha sido aprobado y ya está visible públicamente.</p><p>Gracias por participar.</p>`
          });

          console.log('Email de notificación enviado. Preview URL: %s', mailer.getTestMessageUrl(info));
        } catch (emailError) {
          console.error('Error al enviar el email de notificación:', emailError);
          // No bloqueamos la respuesta por un fallo en el email, pero lo registramos.
        }
      } else {
        console.warn('El servicio de correo no está inicializado. No se pudo enviar la notificación.');
      }
    }


    res.json({
      message: 'Estado del comentario actualizado',
      comment
    });

  } catch (error) {
    console.error('Error actualizando comentario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

// Eliminar comentario (solo admin)
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const indice = comments.findIndex(c => c.id === id);

    if (indice === -1) {
      return res.status(404).json({
        error: 'Comentario no encontrado'
      });
    }

    const commentEliminado = comments.splice(indice, 1)[0];

    res.json({
      message: 'Comentario eliminado exitosamente',
      comment: commentEliminado
    });

  } catch (error) {
    console.error('Error eliminando comentario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getCommentsByPost,
  createComment,
  updateCommentStatus,
  deleteComment,
  likeComment,
  comments
};