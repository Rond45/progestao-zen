import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ExclusaoDeDados = () => {
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

        <h1 className="text-3xl font-bold text-foreground mt-6">Exclusão de dados</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Instruções para solicitar a exclusão dos seus dados no ProGestão+, conforme a LGPD (Lei nº 13.709/2018).
        </p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Como solicitar</h2>
            <p>Envie um e-mail para <strong>contato@mrss.com.br</strong> com o assunto <strong>"Exclusão de dados"</strong>, informando o e-mail da conta cadastrada no ProGestão+.</p>
            <p>Para sua segurança, poderemos pedir uma confirmação de que você é o titular da conta antes de concluir a exclusão.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Prazo de resposta</h2>
            <p>Responderemos à sua solicitação em até <strong>15 (quinze) dias</strong>, conforme previsto na LGPD.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. O que é excluído</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cadastro do estabelecimento e dos usuários vinculados;</li>
              <li>Conexão do WhatsApp e os tokens de acesso fornecidos pela Meta;</li>
              <li>Conversas e mensagens do atendimento via WhatsApp;</li>
              <li>Clientes e agendamentos cadastrados.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. O que pode ser retido</h2>
            <p>Alguns dados podem ser mantidos pelo período exigido em lei, como <strong>registros fiscais e financeiros</strong> (por exemplo, pagamentos de assinatura), exclusivamente para cumprimento de obrigações legais e regulatórias.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Como desconectar o WhatsApp a qualquer momento</h2>
            <p><strong>No ProGestão+:</strong> acesse o menu <strong>WhatsApp IA</strong> e gerencie a conexão do seu número.</p>
            <p><strong>No app WhatsApp Business:</strong> vá em <strong>Configurações &gt; Conta &gt; Plataforma de negócios &gt; Desconectar conta</strong>.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Como revogar o acesso do app no Facebook</h2>
            <p>No Facebook, acesse <strong>Configurações &gt; Integrações comerciais</strong>, localize o ProGestão+ e remova o acesso.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Contato</h2>
            <p>Dúvidas sobre a exclusão de dados: <strong>contato@mrss.com.br</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExclusaoDeDados;
