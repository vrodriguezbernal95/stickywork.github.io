// Servicio para integración con Claude API (Anthropic)
const Anthropic = require('@anthropic-ai/sdk');

// Inicializar el cliente de Anthropic
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Genera un reporte de negocio usando Claude API
 * @param {Object} data - Datos del negocio y período
 * @param {string} data.businessName - Nombre del negocio
 * @param {number} data.month - Mes del reporte (1-12)
 * @param {number} data.year - Año del reporte
 * @param {Object} data.stats - Estadísticas del período
 * @param {Array} data.feedback - Comentarios y encuestas de clientes (opcional)
 * @returns {Promise<Object>} - Reporte generado por IA
 */
async function generateBusinessReport(data) {
    const startTime = Date.now();

    try {
        // Construir el prompt
        const prompt = buildPrompt(data);

        // Llamar a Claude API
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 (más reciente)
            max_tokens: 4096,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        // Extraer el contenido de la respuesta
        const responseText = message.content[0].text;

        // Parsear la respuesta JSON
        const report = parseClaudeResponse(responseText);

        // Calcular tiempo de generación
        const generationTime = Date.now() - startTime;

        // Calcular tokens usados (input + output)
        const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

        return {
            success: true,
            report,
            metadata: {
                model: message.model,
                tokensUsed,
                generationTimeMs: generationTime,
                stopReason: message.stop_reason
            }
        };

    } catch (error) {
        console.error('Error en Claude API:', error);
        throw new Error(`Error generando reporte con IA: ${error.message}`);
    }
}

/**
 * Construye el prompt para Claude
 */
function buildPrompt(data) {
    const { businessName, month, year, stats, feedback } = data;

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const monthName = monthNames[month - 1];

    // Construir sección de feedback si existe
    let feedbackSection = '';
    if (feedback && feedback.length > 0) {
        feedbackSection = `\n## Comentarios y Encuestas de Clientes:\n`;
        feedback.forEach((item, index) => {
            feedbackSection += `\n### Comentario ${index + 1}:\n`;
            if (item.rating) feedbackSection += `- Valoración: ${item.rating}/5 estrellas\n`;
            if (item.comment) feedbackSection += `- Comentario: "${item.comment}"\n`;
            if (item.date) feedbackSection += `- Fecha: ${item.date}\n`;
        });
    }

    return `Eres un consultor de negocios experto especializado en análisis de rendimiento empresarial.

Tu tarea es generar un reporte ejecutivo completo para "${businessName}" correspondiente al mes de ${monthName} ${year}.

# Datos del Negocio:

## Estadísticas del Período (${monthName} ${year}):
- Total de reservas: ${stats.totalBookings || 0}
- Reservas completadas: ${stats.completedBookings || 0}
- Reservas canceladas: ${stats.cancelledBookings || 0}
- Tasa de completitud: ${stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
- Tasa de cancelación: ${stats.totalBookings > 0 ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%

## Servicios Más Solicitados:
${stats.topServices && stats.topServices.length > 0
    ? stats.topServices.map((s, i) => `${i + 1}. ${s.name}: ${s.count} reservas`).join('\n')
    : 'No hay datos suficientes'}
${feedbackSection}

# Tu Tarea:

Genera un reporte ejecutivo en formato JSON con la siguiente estructura EXACTA:

{
    "executiveSummary": "Un resumen ejecutivo de 2-3 párrafos que destaque los puntos clave del mes, logros principales y situación general del negocio",
    "insights": [
        "Insight importante 1 (observación profunda sobre tendencias o patrones)",
        "Insight importante 2",
        "Insight importante 3"
    ],
    "strengths": [
        "Fortaleza 1 detectada",
        "Fortaleza 2 detectada",
        "Fortaleza 3 detectada"
    ],
    "weaknesses": [
        "Debilidad 1 o área de mejora",
        "Debilidad 2 o área de mejora",
        "Debilidad 3 o área de mejora"
    ],
    "feedbackAnalysis": "Análisis profundo de los comentarios de clientes (si existen). Si no hay feedback, indicar que no hay suficientes datos para análisis",
    "recommendations": [
        "Recomendación específica y accionable 1",
        "Recomendación específica y accionable 2",
        "Recomendación específica y accionable 3",
        "Recomendación específica y accionable 4"
    ],
    "economicImpact": "Análisis del impacto económico estimado basado en las reservas completadas vs canceladas. Mencionar oportunidades de ingreso",
    "actionPlan": [
        {
            "priority": "Alta",
            "action": "Acción específica 1",
            "expectedImpact": "Impacto esperado de implementar esta acción"
        },
        {
            "priority": "Media",
            "action": "Acción específica 2",
            "expectedImpact": "Impacto esperado"
        },
        {
            "priority": "Baja",
            "action": "Acción específica 3",
            "expectedImpact": "Impacto esperado"
        }
    ]
}

IMPORTANTE:
- Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después
- Sé específico y práctico en tus recomendaciones
- Basa tus insights en los datos proporcionados
- Usa un tono profesional pero cercano
- Las recomendaciones deben ser accionables e implementables
- Si los datos son insuficientes, menciónalo claramente

Genera el reporte ahora:`;
}

/**
 * Parsea la respuesta de Claude y extrae el JSON
 */
function parseClaudeResponse(responseText) {
    try {
        // Intentar parsear directamente
        const parsed = JSON.parse(responseText);
        return parsed;
    } catch (e) {
        // Si falla, intentar extraer JSON de un bloque de código
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }

        // Si aún falla, intentar encontrar el JSON en el texto
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
            return JSON.parse(jsonStr);
        }

        throw new Error('No se pudo parsear la respuesta de Claude');
    }
}

/**
 * Verifica si la API key está configurada
 */
function isConfigured() {
    return !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'tu_api_key_aqui');
}

module.exports = {
    generateBusinessReport,
    isConfigured
};
