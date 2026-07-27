import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, tgToken, tgChatId, test } = body as {
      orderId?: number;
      tgToken?: string;
      tgChatId?: string;
      test?: boolean;
    };

    if (!tgToken || !tgChatId) {
      return new Response(JSON.stringify({ error: 'Missing Telegram credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let message: string;

    if (test) {
      message = '✅ *Coffee Busra* Telegram connection test successful!';
    } else if (orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, table_num, items, total, note, lat, lng, created_at')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const items = (order.items as Array<{ qty: number; displayName?: string; name: string; price: number }>)
        .map((i) => `  • ${i.qty}× ${i.displayName || i.name} — $${(i.price * i.qty).toFixed(2)}`)
        .join('\n');

      const mapLink = order.lat != null && order.lng != null
        ? `📍 Location: https://www.google.com/maps?q=${order.lat},${order.lng}`
        : '📍 Location: not provided';

      message = [
        `🛒 *New Order #${order.id}*`,
        `🍽️ Table: ${order.table_num}`,
        '',
        items,
        '',
        `💰 Total: $${order.total.toFixed(2)}`,
        order.note ? `📝 Note: ${order.note}` : '',
        mapLink,
      ].filter(Boolean).join('\n');
    } else {
      return new Response(JSON.stringify({ error: 'Provide orderId or test=true' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      return new Response(JSON.stringify({ error: `Telegram API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
