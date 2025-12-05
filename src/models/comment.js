// Comment model
const Comment = {
  id: 'uuid',
  postId: 'uuid (foreign key)',
  autor: 'string (required)',
  contenido: 'string (required)',
  email: 'string (optional)',
  estado: 'enum: pendiente, aprobado, rechazado',
  fechaCreacion: 'datetime'
};