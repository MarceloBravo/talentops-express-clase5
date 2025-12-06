### Ejercicio: Extiende la API del blog agregando: 
- sistema de categorías para posts, 
- búsqueda avanzada con Elasticsearch-like queries, 
- notificaciones por email cuando se aprueban comentarios, 
- sistema de likes/votes para posts y comentarios, y 
- un dashboard administrativo con estadísticas.

# -----------------------------------------------------------------------------------------

### Instalación de librerías

npm install

### Ejecución

Para ejecutar la aplicación en modo de desarrollo, utiliza el siguiente comando:

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`.

### Rutas Disponibles

A continuación se muestra una tabla con las rutas disponibles en la API:

| Método | Ruta                                   | Descripción                                     | Autenticación Requerida |
|--------|----------------------------------------|-------------------------------------------------|-------------------------|
| POST   | /api/auth/login                        | Iniciar sesión para obtener un token.           | No                      |
| POST   | /api/auth/verify                       | Verificar la validez de un token.               | Sí                      |
| GET    | /api/posts                             | Listar todos los posts.                         | No                      |
| POST   | /api/posts                             | Crear un nuevo post.                            | Sí (autor, admin)       |
| POST   | /api/posts/search                      | Buscar posts.                                   | No                      |
| GET    | /api/posts/:id                         | Obtener un post específico por su ID.           | No                      |
| PUT    | /api/posts/:id                         | Actualizar un post existente.                   | Sí (autor, admin)       |
| DELETE | /api/posts/:id                         | Eliminar un post.                               | Sí (autor, admin)       |
| POST   | /api/posts/:id/like                    | Dar "like" o "unlike" a un post.                | Sí                      |
| GET    | /api/posts/:postId/comments            | Obtener los comentarios de un post.             | No                      |
| POST   | /api/posts/:postId/comments            | Crear un nuevo comentario en un post.           | No                      |
| POST   | /api/comments/:id/like                 | Dar "like" a un comentario.                     | No                      |
| PUT    | /api/comments/:id/status               | Actualizar el estado de un comentario.          | Sí (admin)              |
| DELETE | /api/comments/:id                      | Eliminar un comentario.                         | Sí (admin)              |
| GET    | /admin                                 | Obtener la página del dashboard administrativo. | No                      |
| GET    | /api/dashboard/stats                   | Obtener las estadísticas para el dashboard.     | No                      |