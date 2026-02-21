import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacidade = () => {
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

        <h1 className="text-3xl font-bold text-foreground mt-6">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Versão inicial (MVP). Ajustaremos com apoio jurídico conforme evolução do produto.
        </p>

        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Nós coletamos e armazenamos apenas os dados necessários para o funcionamento do sistema
            (ex.: usuários, agenda, clientes, serviços e registros financeiros do negócio).
          </p>
          <p>
            Não vendemos seus dados. Quando utilizarmos integrações (ex.: WhatsApp, pagamentos),
            você será informado e poderá configurar/autorizar.
          </p>
          <p>
            Você pode solicitar exportação ou exclusão de dados conforme aplicável.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacidade;
