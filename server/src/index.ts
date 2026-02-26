import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO CENTRALIZADA (.env Recomendado!) ---
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || '8hF4DpG2v3JbT6sQ7kZ5wR1yU0cM9xN8';
const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE || 'https://devseguro.smartbr.app/api/ML';
const EXTERNAL_APP_TOKEN = process.env.EXTERNAL_APP_TOKEN || ''; // x-app-token se configurado


// --- SISTEMA DE CACHE INDEFINIDO ---
const globalCache: Record<string, any> = {};

// Log de requisições
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// --- PROXY PARA API EXTERNA ---
app.get('/api/proxy/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const forceRefresh = query.refresh === 'true';

    const targetUrl = new URL(`${EXTERNAL_API_BASE}/${endpoint}`);
    Object.keys(query).forEach(key => {
        if (key !== 'refresh') targetUrl.searchParams.append(key, query[key] as string);
    });

    const cacheKey = targetUrl.toString();

    if (!forceRefresh && globalCache[cacheKey]) {
        console.log(`[CACHE] Respondendo com dados cacheados para: ${endpoint}`);
        return res.json(globalCache[cacheKey]);
    }

    console.log(`[API REAL] Buscando: ${targetUrl.toString()}`);
    try {
        const headers: any = {
            'Authorization': `Bearer ${EXTERNAL_API_TOKEN}`,
            'Accept': 'application/json'
        };
        if (EXTERNAL_APP_TOKEN) headers['x-app-token'] = EXTERNAL_APP_TOKEN;

        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers
        });

        const rawText = await response.text();
        let data;

        // Tratar o caso de "Nenhum resultado encontrado" vindo como texto puro
        if (rawText.includes("Nenhum resultado encontrado")) {
            console.log(`[API] Sem resultados para: ${endpoint}`);
            const emptyData = { data: [] };
            globalCache[cacheKey] = emptyData;
            return res.json(emptyData);
        }

        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error("[ERROR] Falha ao processar JSON da API ML. Bruto:", rawText.substring(0, 100));
            if (!rawText || rawText.length < 2) return res.json({ data: [] });
            return res.status(500).json({ error: 'Erro ao processar resposta do servidor Oracle', raw: rawText });
        }

        globalCache[cacheKey] = data;
        res.json(data);

    } catch (error: any) {
        console.error(`[API ERROR] Falha na conexão: ${error.message}`);
        res.status(500).json({ error: 'Falha ao conectar na API SmartBR' });
    }
});

// --- MANTENDO ROTAS ORIGINAIS PARA COMPATIBILIDADE / FALLBACK ---
const HIERARCHY = {
    supervisors: [
        { id: 10, name: "CARLOS ALBERTO", team: "NORTE", vendors_count: 5 },
        { id: 11, name: "MARIA FERNANDA", team: "SUL", vendors_count: 8 },
        { id: 12, name: "ROBERTO SILVA", team: "CAPITAL", vendors_count: 12 },
    ],
    vendors: {
        12: [
            { id: 300, name: "SERGIO ARTHUR (DEMO)", status: "BOM", value: 12500.50 },
            { id: 8521, name: "TIAGO LUCAS", status: "BOM", value: 12500.50 },
        ],
        10: [{ id: 7001, name: "MARCOS SOUZA", status: "BOM", value: 9500.00 }],
        11: [{ id: 6001, name: "JULIANA LIMA", status: "BOM", value: 11200.00 }]
    }
};

app.get('/api/health', (req, res) => res.json({ status: 'ok', proxy: true }));

app.get('/api/hierarchy/gerentes', async (req, res) => {
    const { COD_CADRCA } = req.query;
    try {
        const url = new URL(`${EXTERNAL_API_BASE}/metafornecedor_cad_gerente`);
        if (COD_CADRCA && COD_CADRCA !== 'null') url.searchParams.append('COD_CADRCA', COD_CADRCA as string);

        const headers: any = { 'Authorization': `Bearer ${EXTERNAL_API_TOKEN}` };
        if (EXTERNAL_APP_TOKEN) headers['x-app-token'] = EXTERNAL_APP_TOKEN;

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        if (!data || !data.data) {
            return res.json([]);
        }
        const simplified = data.data.map((g: any) => ({
            id: g.CODGERENTE,
            name: (g.NOMEGERENTE || '').trim(),
            cod_cadrca: g.COD_CADRCA,
            codgerentesuperior: g.CODGERENTESUPERIOR
        }));
        res.json(simplified);
    } catch (e) {
        res.status(500).json({ error: 'Falha ao buscar gerentes reais' });
    }
});

app.get('/api/hierarchy/supervisors', async (req, res) => {
    const { COD_CADRCA, CODGERENTE } = req.query;
    try {
        const url = new URL(`${EXTERNAL_API_BASE}/metafornecedor_cad_supervisor`);
        if (COD_CADRCA && COD_CADRCA !== 'null') url.searchParams.append('COD_CADRCA', COD_CADRCA as string);
        if (CODGERENTE && CODGERENTE !== 'null') url.searchParams.append('CODGERENTE', CODGERENTE as string);

        const headers: any = { 'Authorization': `Bearer ${EXTERNAL_API_TOKEN}` };
        if (EXTERNAL_APP_TOKEN) headers['x-app-token'] = EXTERNAL_APP_TOKEN;

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        if (!data || !data.data) {
            return res.json([]);
        }
        const simplified = data.data.map((s: any) => ({
            id: s.CODSUPERVISOR,
            name: (s.NOME || '').trim(),
            team: s.REGIONAL || 'SMART',
            vendors_count: '?',
            cod_cadrca: s.COD_CADRCA,
            codgerente: s.CODGERENTE
        }));
        res.json(simplified);
    } catch (e) {
        res.status(500).json({ error: 'Falha ao buscar supervisores reais' });
    }
});

app.get('/api/hierarchy/vendors/:supervisor_id', async (req, res) => {
    const { supervisor_id } = req.params;
    const { COD_CADRCA } = req.query;
    try {
        const url = new URL(`${EXTERNAL_API_BASE}/metafornecedor_cad_vendedor`);
        url.searchParams.append('CODSUPERVISOR', supervisor_id);
        if (COD_CADRCA && COD_CADRCA !== 'null') url.searchParams.append('COD_CADRCA', COD_CADRCA as string);

        const headers: any = { 'Authorization': `Bearer ${EXTERNAL_API_TOKEN}` };
        if (EXTERNAL_APP_TOKEN) headers['x-app-token'] = EXTERNAL_APP_TOKEN;

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        if (!data || !data.data) {
            return res.json([]);
        }
        const simplified = data.data.map((v: any) => ({
            id: v.CODUSUR,
            name: (v.NOME || '').trim(),
            status: 'ATIVO',
            value: 0
        }));
        res.json(simplified);
    } catch (e) {
        res.status(500).json({ error: 'Falha ao buscar vendedores reais' });
    }
});

// --- SERVINDO O FRONTEND (PWA) ---
let frontendPath = path.join(__dirname, '../../frontend/dist');

// Fallback caso rodando do root
if (!fs.existsSync(frontendPath)) {
    frontendPath = path.join(process.cwd(), 'frontend/dist');
}
if (!fs.existsSync(frontendPath)) {
    frontendPath = path.join(process.cwd(), '../frontend/dist');
}

if (fs.existsSync(frontendPath)) {
    console.log(`[SERVE] Módulo PWA ativo! Servindo estáticos de: ${frontendPath}`);
    app.use(express.static(frontendPath));

    // Rota curinga para SPA (tudo que não for API cai no index.html)
    app.get(/.*/, (req, res, next) => {
        if (req.url.startsWith('/api')) return next();
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    console.warn(`[WARN] Frontend não encontrado em: ${frontendPath}`);
    console.warn(`[DIAGNOSTICS] __dirname: ${__dirname} | cwd: ${process.cwd()}`);

    app.use((req, res) => {
        if (req.url.startsWith('/api')) {
            res.status(404).json({ error: 'Endpoint da API não encontrado' });
            return;
        }
        res.status(404).send(`<h2>SmartVendas API Operando.</h2><p>Porém, o painel Front-end (PWA) não foi localizado no servidor. Certifique-se de que o comando 'npm run build' do frontend foi executado e que a pasta 'dist' está acessível.</p>`);
    });
}

app.listen(port, () => {
    console.log(`\n🚀 SERVIDOR PROXY SMART: http://localhost:${port}`);
    console.log(`🔑 Token centralizado e Cache Indefinido Ativos.`);
});
