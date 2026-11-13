// Negocios de demostración de producción (ficticios; sus credenciales se muestran en admin-login.html).
// - Su página pública nunca se ofrece a Google (routes.js → isPageIndexable).
// - No participan en el programa de recomendación (referrals.js).
// Si se crea otra demo, añadir aquí su id.
const DEMO_BUSINESS_IDS = [1, 2, 3, 4, 5, 6, 9];

function isDemoBusiness(businessId) {
    return DEMO_BUSINESS_IDS.includes(Number(businessId));
}

module.exports = { DEMO_BUSINESS_IDS, isDemoBusiness };
