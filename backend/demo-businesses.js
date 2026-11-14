// Negocios de demostración de producción (ficticios; sus credenciales se muestran en admin-login.html).
// - Su página pública nunca se ofrece a Google (routes.js → isPageIndexable).
// - No participan en el programa de recomendación (referrals.js).
// Si se crea otra demo, añadir aquí su id.
const DEMO_BUSINESS_IDS = [1, 2, 3, 4, 5, 6, 9];

function isDemoBusiness(businessId) {
    return DEMO_BUSINESS_IDS.includes(Number(businessId));
}

// Condición SQL para quedarse solo con negocios reales: ni demos ni cuentas de prueba
// (enlace o nombre con demo/prueba/test). alias = alias de la tabla businesses en la consulta.
function realBusinessSql(alias = 'b') {
    return `(${alias}.id NOT IN (${DEMO_BUSINESS_IDS.join(',')})
        AND COALESCE(${alias}.slug, '') NOT REGEXP '(^|-)(demo|prueba|pruebas|test)(-|$)'
        AND LOWER(COALESCE(${alias}.name, '')) NOT REGEXP '(^|[^a-z])(demo|prueba|pruebas|test)([^a-z]|$)')`;
}

module.exports = { DEMO_BUSINESS_IDS, isDemoBusiness, realBusinessSql };
