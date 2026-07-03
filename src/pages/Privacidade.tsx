import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PRIVACIDADE_VERSAO, DATA_PUBLICACAO } from "@/lib/legalVersions";

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
          Versão {PRIVACIDADE_VERSAO} — Última atualização: {DATA_PUBLICACAO}
        </p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>Esta Política de Privacidade descreve como o <strong>ProGestão+</strong>, operado por <strong>MR Solution</strong>, CNPJ <strong>58.254.166/0001-14</strong>, coleta, utiliza, armazena e protege dados pessoais, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).</p>
          <p>Contato do responsável pelo tratamento de dados: <strong>contato@mrss.com.br</strong></p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Definições importantes</h2>
            <p><strong>Titular:</strong> a pessoa a quem os dados pessoais se referem.</p>
            <p><strong>Controlador:</strong> quem decide sobre o tratamento dos dados.</p>
            <p><strong>Operador:</strong> quem trata os dados em nome do controlador.</p>
            <p><strong>Papel do ProGestão+:</strong> Em relação aos dados de cadastro do próprio assinante (dono do estabelecimento), o ProGestão+ atua como <strong>controlador</strong>. Em relação aos dados que o assinante insere sobre seus próprios clientes finais, o assinante é o <strong>controlador</strong> desses dados, e o ProGestão+ atua como <strong>operador</strong>, tratando-os conforme as instruções do assinante e para viabilizar o funcionamento do serviço.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Quais dados coletamos</h2>
            <p><strong>2.1. Dados do assinante (dono do estabelecimento):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome, e-mail, telefone;</li>
              <li>Dados do estabelecimento (nome, tipo, endereço, horários);</li>
              <li>Dados de pagamento processados por meio de parceiro (Mercado Pago) — o ProGestão+ não armazena dados completos de cartão;</li>
              <li>Registros de acesso e uso da plataforma.</li>
            </ul>
            <p><strong>2.2. Dados dos clientes finais (inseridos pelo assinante):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome, telefone e histórico de agendamentos/serviços dos clientes atendidos pelo estabelecimento.</li>
            </ul>
            <p><strong>2.3. Dados de comunicação via WhatsApp:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Conteúdo das conversas de atendimento realizadas pela funcionalidade de inteligência artificial, para viabilizar agendamentos e o próprio atendimento.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Para que usamos os dados</h2>
            <p>Utilizamos os dados para: viabilizar o funcionamento das funcionalidades contratadas; processar pagamentos e controlar assinaturas; realizar o atendimento automatizado via WhatsApp; enviar comunicações relativas ao serviço (avisos de vencimento, suporte); cumprir obrigações legais; e melhorar a plataforma.</p>
            <p>O tratamento tem como bases legais, conforme o caso: a execução do contrato, o cumprimento de obrigação legal, o legítimo interesse e o consentimento do titular.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Compartilhamento de dados</h2>
            <p>O ProGestão+ <strong>não vende</strong> dados pessoais. Os dados podem ser compartilhados apenas com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Provedores de infraestrutura e processamento</strong> necessários ao funcionamento (por exemplo, provedor de hospedagem/banco de dados e o processador de pagamentos Mercado Pago);</li>
              <li><strong>Provedor de inteligência artificial</strong>, exclusivamente para gerar as respostas do atendimento automatizado;</li>
              <li><strong>Autoridades</strong>, quando exigido por lei ou ordem judicial.</li>
            </ul>
            <p>Esses parceiros tratam os dados conforme suas próprias políticas e obrigações legais.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Armazenamento e segurança</h2>
            <p>5.1. Os dados são armazenados em servidores com medidas de segurança técnicas e administrativas destinadas a protegê-los contra acesso não autorizado, perda ou alteração.</p>
            <p>5.2. O acesso aos dados é restrito e controlado por autenticação e por regras de segurança da plataforma.</p>
            <p>5.3. Nenhum sistema é totalmente imune a riscos; o ProGestão+ empenha-se em adotar boas práticas de segurança, mas não pode garantir segurança absoluta.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Direitos do titular</h2>
            <p>Nos termos da LGPD, o titular pode, a qualquer momento, solicitar: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos ou desatualizados; anonimização ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamento; e revogação do consentimento.</p>
            <p>As solicitações podem ser feitas pelo e-mail <strong>contato@mrss.com.br</strong>. Observa-se que, quando o ProGestão+ atua como operador dos dados de clientes finais, as solicitações desses clientes devem ser direcionadas ao estabelecimento (assinante), que é o controlador desses dados.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Retenção e eliminação</h2>
            <p>7.1. Os dados são mantidos enquanto a conta estiver ativa e pelo período necessário ao cumprimento de obrigações legais.</p>
            <p>7.2. Em caso de encerramento da conta, os dados poderão ser eliminados ou anonimizados, ressalvadas as hipóteses de guarda obrigatória previstas em lei.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Dados de crianças e adolescentes</h2>
            <p>O ProGestão+ não é destinado ao cadastro direto de menores como usuários da plataforma. Eventuais dados de clientes finais menores, inseridos pelo estabelecimento, são de responsabilidade do assinante, que deve obter o consentimento dos responsáveis quando aplicável.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">9. Cookies e tecnologias</h2>
            <p>A plataforma pode utilizar cookies e tecnologias similares essenciais ao funcionamento e à autenticação. O uso continuado implica concordância com essas tecnologias necessárias.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">10. Alterações desta Política</h2>
            <p>Esta Política pode ser atualizada. Alterações relevantes serão comunicadas na plataforma e, quando cabível, exigirão novo aceite.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">11. Contato</h2>
            <p>Dúvidas ou solicitações relativas a esta Política e ao tratamento de dados: <strong>contato@mrss.com.br</strong>.</p>
          </section>

          <p className="italic pt-4 border-t border-border">Ao marcar a opção "Li e concordo com os Termos de Uso e a Política de Privacidade" no momento do cadastro, o Usuário manifesta seu aceite livre, informado e inequívoco a este documento.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacidade;
