import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = Deno.env.get('WHATSAPP_CLOUD_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const pin = Deno.env.get('WHATSAPP_REGISTER_PIN')

  const missing: string[] = []
  if (!token) missing.push('WHATSAPP_CLOUD_TOKEN')
  if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID')
  if (!pin) missing.push('WHATSAPP_REGISTER_PIN')

  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: 'missing_secret', missing }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/register`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
      }
    )

    const metaBody = await metaRes.json().catch(() => ({}))

    const safeBody: Record<string, unknown> = { meta_status: metaRes.status }
    if (metaBody?.success === true) {
      safeBody.success = true
    } else if (metaBody?.error) {
      safeBody.error = {
        message: metaBody.error.message,
        code: metaBody.error.code,
      }
    } else {
      safeBody.success = metaRes.ok
    }

    return new Response(JSON.stringify(safeBody), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'request_failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
