import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

Deno.serve(async (req) => {
    const { vendedor_id } = await req.json();

    console.log(`Sincronizando dados para vendedor: ${vendedor_id}`);

    // Simulação de chamada ao ERP
    // No mundo real, aqui haveria um fetch('https://erp.api/vendas?vendedor_id=' + vendedor_id)
    const mockERP_Data = {
        stats: {
            valor_total: Math.floor(Math.random() * 20000),
            positivacao: Math.floor(Math.random() * 100),
            mix: Math.floor(Math.random() * 50),
        },
        fornecedores: [
            { id: 101, nome: 'FORNECEDOR A', valor: 5000 + Math.random() * 5000, positivados: 10, mix: 40, progresso: 60 },
            { id: 102, nome: 'FORNECEDOR B', valor: 3000 + Math.random() * 2000, positivados: 5, mix: 20, progresso: 30 },
        ]
    };

    try {
        // 1. Upsert stats
        await supabase
            .from('vendedor_stats')
            .upsert({
                vendedor_id,
                codempresa: 1,
                valor_total: mockERP_Data.stats.valor_total,
                positivacao: mockERP_Data.stats.positivacao,
                mix: mockERP_Data.stats.mix,
                updated_at: new Date()
            }, { onConflict: 'vendedor_id' });

        // 2. Upsert fornecedores list
        for (const sup of mockERP_ERP_Data.fornecedores) {
            await supabase
                .from('vendedor_fornecedores')
                .upsert({
                    vendedor_id,
                    fornecedor_id: sup.id,
                    nome_fornecedor: sup.nome,
                    valor: sup.valor,
                    positivados: sup.positivados,
                    mix: sup.mix,
                    progresso: sup.progresso,
                    updated_at: new Date()
                }, { onConflict: 'vendedor_id,fornecedor_id' });
        }

        return new Response(JSON.stringify({ status: 'Success', message: 'Sincronização concluída!' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({ status: 'Error', error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
