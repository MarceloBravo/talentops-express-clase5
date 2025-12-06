/**
 * Interpreta y aplica una query con sintaxis Elasticsearch DSL a un array de datos.
 *
 * @param {Array<Object>} data El array de objetos a procesar.
 * @param {Object} dslQuery El objeto de la query DSL (ej. req.body).
 * @returns {Array<Object>} El array de datos filtrado y ordenado.
 */
function processQueryDSL(data, dslQuery) {
  let results = [...data];
  const { query, sort } = dslQuery;

  // 1. Aplicar la lógica de la query si existe
  if (query) {
    results = results.filter(doc => evaluateNode(doc, query));
  }

  // 2. Aplicar ordenamiento si existe
  if (sort) {
    // El sort puede ser un array de objetos: [{ "fecha": "desc" }, { "titulo": "asc" }]
    const sortCriteria = Array.isArray(sort) ? sort : [sort];
    
    results.sort((a, b) => {
      for (const criterion of sortCriteria) {
        const field = Object.keys(criterion)[0];
        const order = criterion[field] === 'desc' ? -1 : 1;
        
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
      }
      return 0;
    });
  }

  return results;
}

/**
 * Evalúa un documento contra un nodo de la query DSL.
 * @param {Object} doc - El documento (un post).
 * @param {Object} queryNode - El nodo de la query a evaluar.
 * @returns {boolean} - True si el documento cumple la condición.
 */
function evaluateNode(doc, queryNode) {
  const operator = Object.keys(queryNode)[0];
  const condition = queryNode[operator];

  switch (operator) {
    case 'bool':
      return evaluateBool(doc, condition);
    case 'match':
      return evaluateMatch(doc, condition);
    case 'term':
      return evaluateTerm(doc, condition);
    // Añadir más operadores como 'range', 'exists', etc. aquí.
    default:
      return true; // Operador desconocido, no se filtra.
  }
}

/**
 * Evalúa una cláusula 'bool'.
 */
function evaluateBool(doc, condition) {
  // 'must': todas las condiciones deben ser verdaderas (AND)
  if (condition.must) {
    if (!condition.must.every(node => evaluateNode(doc, node))) {
      return false;
    }
  }

  // 'filter': igual que 'must', pero se usa para filtros no puntuados.
  if (condition.filter) {
    if (!condition.filter.every(node => evaluateNode(doc, node))) {
      return false;
    }
  }

  // 'should': al menos una condición debe ser verdadera (OR)
  if (condition.should && condition.should.length > 0) {
    if (!condition.should.some(node => evaluateNode(doc, node))) {
      return false;
    }
  }

  // 'must_not': ninguna condición debe ser verdadera (NOT)
  if (condition.must_not) {
    if (condition.must_not.some(node => evaluateNode(doc, node))) {
      return false;
    }
  }
  
  // Si pasa todas las comprobaciones, es un match.
  return true;
}

/**
 * Evalúa una cláusula 'match' (búsqueda de texto flexible).
 */
function evaluateMatch(doc, condition) {
  const field = Object.keys(condition)[0];
  const queryValue = String(condition[field]).toLowerCase();
  const docValue = String(doc[field]).toLowerCase();

  return docValue.includes(queryValue);
}

/**
 * Evalúa una cláusula 'term' (búsqueda de término exacto).
 */
function evaluateTerm(doc, condition) {
  const field = Object.keys(condition)[0];
  const queryValue = condition[field];
  const docValue = doc[field];

  // Compara exactamente el valor. Útil para campos 'keyword' o numéricos.
  return docValue === queryValue;
}


module.exports = { processQueryDSL };
