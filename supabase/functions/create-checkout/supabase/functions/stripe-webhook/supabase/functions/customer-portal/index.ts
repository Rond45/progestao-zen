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

                                                                                    const supabaseAdmin = createClient(
                                                                                          Deno.env.get("SUPABASE_URL") ?? "",
                                                                                                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
                                                                                                    );

                                                                                                        const { data: subscription } = await supabaseAdmin
                                                                                                              .from("subscriptions")
                                                                                                                    .select("stripe_customer_id")
                                                                                                                          .eq("user_id", user.id)
                                                                                                                                .maybeSingle();

                                                                                                                                    if (!subscription?.stripe_customer_id) {
                                                                                                                                          return new Response(JSON.stringify({ error: "Sem assinatura ativa" }), {
                                                                                                                                                  status: 404,
                                                                                                                                                          headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                                                                                                                });
                                                                                                                                                                    }

                                                                                                                                                                        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16" });
                                                                                                                                                                            const origin = req.headers.get("origin") ?? "http://localhost:5173";

                                                                                                                                                                                const portalSession = await stripe.billingPortal.sessions.create({
                                                                                                                                                                                      customer: subscription.stripe_customer_id,
                                                                                                                                                                                            return_url: `${origin}/dashboard/planos`,
                                                                                                                                                                                                });

                                                                                                                                                                                                    return new Response(JSON.stringify({ url: portalSession.url }), {
                                                                                                                                                                                                          headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                                                                                                                                                                status: 200,
                                                                                                                                                                                                                    });
                                                                                                                                                                                                                      } catch (error) {
                                                                                                                                                                                                                                          console.error("Erro no customer-portal:", error);
                                                                                                                                                                                                                                              return new Response(JSON.stringify({ error: (error as Error).message }), {
                                                                                                                                                                                                                                    status: 500,
                                                                                                                                                                                                                                          headers: { ...corsHeaders, "Content-Type": "application/json" },
                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                });