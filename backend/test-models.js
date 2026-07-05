require('dotenv').config();

async function run() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('No GEMINI_API_KEY found in .env');
            return;
        }
        
        console.log('Fetching available models...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (!response.ok) {
            console.error('Failed to fetch models:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text);
            return;
        }

        const data = await response.json();
        
        if (data.models && data.models.length > 0) {
            console.log('Available models for generateContent:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log('No models found or unexpected response structure:', data);
        }
    } catch (e) {
        console.error('Error fetching models:', e);
    }
}

run();
