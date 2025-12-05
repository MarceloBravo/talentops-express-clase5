// Post model
const Post = {
  id: 'uuid',
  titulo: 'string (required)',
  contenido: 'string (required)',
  autor: 'string (required)',
  etiquetas: 'array',
  estado: 'enum: borrador, publicado, archivado',
  fechaCreacion: 'datetime',
  fechaActualizacion: 'datetime',
  visitas: 'number'
};

