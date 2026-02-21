import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Termos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-foreground mt-6">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Versão inicial (MVP). Ajustaremos com apoio jurídico conforme evolução do produto.
        </p>

        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Ao usar o ProGestão+, você concorda em utilizar o sistema de forma lícita e responsável.
          </p>
          <p>
            O ProGestão+ é um software de gestão (SaaS) destinado a barbearias e salões de beleza.
            Ele não substitui orientações contábeis, jurídicas ou fiscais.
          </p>
          <p>
            Podemos atualizar estes Termos quando necessário. Em caso de mudanças relevantes,
            informaremos no próprio sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Termos;
