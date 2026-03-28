const OpenAI = require('openai');

const baseURL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
const isOpenRouterBase = /openrouter\.ai/i.test(baseURL);
const apiKey = isOpenRouterBase
    ? (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)
    : (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);
const hasPlaceholderKey = !apiKey || /replace-me|your_key|your-api-key/i.test(apiKey);

if (!apiKey) {
    console.warn('Missing OPENAI_API_KEY/OPENROUTER_API_KEY in backend/.env.');
}

const client = new OpenAI({
    apiKey: apiKey || 'missing-key',
    baseURL,
    defaultHeaders: {
        // Optional but recommended by OpenRouter for app attribution.
        ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
        ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {})
    }
});

const parseModelList = () => {
    const envList = (process.env.AI_MODELS || '').split(',').map(m => m.trim()).filter(Boolean);
    if (envList.length > 0) return envList;

    const fallbacks = [
        process.env.AI_MODEL_PRIMARY,
        process.env.AI_MODEL_FAST,
        process.env.AI_MODEL_FALLBACK,
        process.env.AI_MODEL
    ].filter(Boolean);

    return [...new Set(fallbacks)];
};

const configuredModels = parseModelList();

const generateText = async ({ prompt, system, model, temperature = 0.2, maxTokens = 800 }) => {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt is required and must be a string.');
    }

    if (hasPlaceholderKey) {
        throw new Error('Missing valid OpenRouter key. Set OPENAI_API_KEY or OPENROUTER_API_KEY in backend/.env.');
    }

    const requestedModel = model || configuredModels[0] || 'openai/gpt-4.1-mini';
    const modelCandidates = [requestedModel, ...configuredModels.filter(m => m !== requestedModel)];

    let lastError;

    for (const candidate of modelCandidates) {
        try {
            const completion = await client.chat.completions.create({
                model: candidate,
                temperature,
                max_tokens: maxTokens,
                messages: [
                    ...(system ? [{ role: 'system', content: system }] : []),
                    { role: 'user', content: prompt }
                ]
            });

            const content = completion?.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty model response content.');

            return {
                model: candidate,
                content,
                usage: completion.usage || null
            };
        } catch (error) {
            lastError = error;
        }
    }

    const message = lastError?.message || 'Unknown AI provider error';
    throw new Error(`AI generation failed on all configured models. Last error: ${message}`);
};

module.exports = {
    client,
    configuredModels,
    generateText
};
