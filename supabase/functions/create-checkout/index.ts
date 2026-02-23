import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    Deno.serve(async (req) => {
      if (req.method === "OPTIONS") {
          return new Response(null, { headers: corsHeaders });
            }

              try {
                  const supabaseClient = createClient(
                        Deno.env.get("SUPABASE_URL") ?? "",
                              Deno.env.get("SUPABASE_ANON_KEY") ?? "",
                                    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
                                        );

                                            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
                                                if (authError || !user) {
                                                      return new Response(JSON.stringify({ error: "Nao autenticado" }), {
                                                              status: 401,
                                                                      headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                            });
                                                                                }

                                                                                    const { priceId, planName } = await req.json();
                                                                                        if (!priceId) {
                                                                                              return new Response(JSON.stringify({ error: "priceId e obrigatorio" }), {
                                                                                                      status: 400,
                                                                                                              headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                                                                    });
                                                                                                                        }

                                                                                                                            const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16" });
                                                                                                                                const supabaseAdmin = createClient(
                                                                                                                                      Deno.env.get("SUPABASE_URL") ?? "",
                                                                                                                                            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
                                                                                                                                                );

                                                                                                                                                    const { data: existingSub } = await supabaseAdmin
                                                                                                                                                          .from("subscriptions")
                                                                                                                                                                .select("stripe_customer_id")
                                                                                                                                                                      .eq("user_id", user.id)
                                                                                                                                                                            .maybeSingle();

                                                                                                                                                                                let customerId = existingSub?.stripe_customer_id;

                                                                                                                                                                                    if (!customerId) {
                                                                                                                                                                                          const customer = await stripe.customers.create({
                                                                                                                                                                                                  email: user.email,
                                                                                                                                                                                                          metadata: { supabase_user_id: user.id },
                                                                                                                                                                                                                });
                                                                                                                                                                                                                      customerId = customer.id;
                                                                                                                                                                                                                            await supabaseAdmin.from("subscriptions").upsert({
                                                                                                                                                                                                                                    user_id: user.id,
                                                                                                                                                                                                                                            stripe_customer_id: customerId,
                                                                                                                                                                                                                                                    plan_name: planName,
                                                                                                                                                                                                                                                            status: "incomplete",
                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                          const origin = req.headers.get("origin") ?? "http://localhost:5173";
                                                                                                                                                                                                                                                                              const session = await stripe.checkout.sessions.create({
                                                                                                                                                                                                                                                                                    customer: customerId,
                                                                                                                                                                                                                                                                                          payment_method_types: ["card"],
                                                                                                                                                                                                                                                                                                line_items: [{ price: priceId, quantity: 1 }],
                                                                                                                                                                                                                                                                                                      mode: "subscription",
                                                                                                                                                                                                                                                                                                            success_url: `${origin}/dashboard/planos?session_id={CHECKOUT_SESSION_ID}&status=success`,
                                                                                                                                                                                                                                                                                                                  cancel_url: `${origin}/dashboard/planos?status=canceled`,
                                                                                                                                                                                                                                                                                                                        subscription_data: {
                                                                                                                                                                                                                                                                                                                                metadata: { supabase_user_id: user.id, plan_name: planName },
                                                                                                                                                                                                                                                                                                                                      },
                                                                                                                                                                                                                                                                                                                                            locale: "pt-BR",
                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                    return new Response(JSON.stringify({ url: session.url }), {
                                                                                                                                                                                                                                                                                                                                                          headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                                                                                                                                                                                                                                                                                                                status: 200,
                                                                                                                                                                                                                                                                                                                                                                    });
  } catch (error: unknown) {
                                                                                                                                                                                                                                                                                                                                                                                                                          console.error("Erro no create-checkout:", error);
                                                                                                                                                                                                                                                                                                                                                                                                                              return new Response(JSON.stringify({ error: (error as Error).message }), {
                                                                                                                                                                                                                                                                                                                                                                                    status: 500,
                                                                                                                                                                                                                                                                                                                                                                                          headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                                                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                                                                                                });