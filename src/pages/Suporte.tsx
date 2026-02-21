import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";

const Suporte = () => {
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

        <h1 className="text-3xl font-bold text-foreground mt-6">Suporte</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Canal inicial de suporte (MVP).
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Fale com a equipe</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Por enquanto, o suporte é feito via WhatsApp/Telegram do responsável pelo produto.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            (Você pode colocar aqui um link/contato oficial quando decidir.)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Suporte;
