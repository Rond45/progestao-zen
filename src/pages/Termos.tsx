import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TERMOS_VERSAO, DATA_PUBLICACAO } from "@/lib/legalVersions";

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
          Versão {TERMOS_VERSAO} — Última atualização: {DATA_PUBLICACAO}
        </p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Quem somos</h2>
            <p>O ProGestão+ é um software de gestão na modalidade SaaS (software como serviço) destinado a barbearias, salões de beleza e estabelecimentos similares. O serviço é operado por <strong>MR Solution</strong>, inscrita no CNPJ nº <strong>58.254.166/0001-14</strong>, doravante denominada "ProGestão+", "nós" ou "plataforma".</p>
            <p>Contato oficial: <strong>contato@mrss.com.br</strong></p>
            <p>Ao criar uma conta, contratar um plano ou utilizar qualquer funcionalidade do ProGestão+, você ("Usuário", "Contratante" ou "você") declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a Política de Privacidade, que é parte integrante deste documento.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Objeto do serviço</h2>
            <p>O ProGestão+ oferece ferramentas de gestão que podem incluir, conforme o plano contratado: agenda e agendamento, cadastro de clientes, controle de serviços e preços, controle financeiro, gestão de profissionais, controle de estoque e produtos, relatórios e atendimento automatizado via WhatsApp com inteligência artificial.</p>
            <p>As funcionalidades disponíveis variam conforme o plano assinado (Básico, Pro ou Premium). O ProGestão+ é uma ferramenta de apoio à gestão e <strong>não substitui orientação contábil, jurídica, fiscal ou profissional especializada</strong>.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Cadastro e conta</h2>
            <p>3.1. Para utilizar o ProGestão+, o Usuário deve fornecer informações verdadeiras, completas e atualizadas.</p>
            <p>3.2. O Usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso (login e senha), respondendo por todas as atividades realizadas em sua conta.</p>
            <p>3.3. O Usuário deve notificar imediatamente o ProGestão+, pelo e-mail contato@mrss.com.br, em caso de uso não autorizado de sua conta.</p>
            <p>3.4. O cadastro é pessoal e intransferível. É vedado compartilhar acesso de forma que burle os limites do plano contratado (por exemplo, o limite de profissionais).</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Período de teste gratuito</h2>
            <p>4.1. O ProGestão+ oferece um período de teste gratuito de <strong>14 (quatorze) dias</strong>, durante o qual o Usuário tem acesso às funcionalidades para avaliação.</p>
            <p>4.2. Ao término do período de teste, o acesso será <strong>bloqueado automaticamente</strong> caso o Usuário não contrate um plano pago.</p>
            <p>4.3. O período de teste é concedido uma única vez por estabelecimento/usuário.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Planos, pagamento e renovação</h2>
            <p>5.1. Após o período de teste, a continuidade do uso depende da contratação de um dos planos pagos, nos valores vigentes informados na plataforma.</p>
            <p>5.2. O Usuário pode optar por pagamento via <strong>cartão de crédito</strong> (assinatura com renovação automática mensal) ou via <strong>Pix</strong> (pagamento manual mensal).</p>
            <p>5.3. <strong>Pagamento via cartão:</strong> a cobrança é recorrente e automática a cada período mensal, até que o Usuário cancele.</p>
            <p>5.4. <strong>Pagamento via Pix:</strong> o acesso é liberado por 30 (trinta) dias a cada pagamento confirmado. O Usuário é responsável por realizar o novo pagamento antes do vencimento para manter o acesso. Não havendo pagamento até a data de vencimento, o acesso será <strong>bloqueado automaticamente</strong> até a regularização.</p>
            <p>5.5. Os valores dos planos podem ser reajustados. Alterações de preço serão comunicadas previamente e, quando aplicável, exigirão novo aceite do Usuário para a continuidade do serviço.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Cancelamento e reembolso</h2>
            <p>6.1. O Usuário pode cancelar sua assinatura a qualquer momento.</p>
            <p>6.2. Em caso de cancelamento, o acesso é mantido até o <strong>final do período já pago</strong>, não havendo bloqueio imediato.</p>
            <p>6.3. <strong>Política de não reembolso:</strong> considerando que o ProGestão+ oferece 14 dias de teste gratuito completo, permitindo ampla avaliação do serviço antes de qualquer cobrança, <strong>não há reembolso de valores já pagos</strong> após a confirmação do pagamento, seja via cartão ou Pix.</p>
            <p>6.4. Não há fidelidade ou multa por cancelamento.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Atendimento via WhatsApp e inteligência artificial</h2>
            <p>7.1. O ProGestão+ pode oferecer, conforme o plano, atendimento automatizado via WhatsApp por meio de inteligência artificial, conectado ao número de WhatsApp indicado pelo Usuário.</p>
            <p>7.2. <strong>Isenção de responsabilidade sobre o WhatsApp/Meta:</strong> o WhatsApp é um serviço de titularidade da Meta Platforms, Inc., alheio ao ProGestão+. O Usuário reconhece e concorda que:</p>
            <p>a) A conexão do número ao ProGestão+ ocorre por meio de tecnologia de integração, e o funcionamento depende de condições impostas pela Meta/WhatsApp, fora do controle do ProGestão+;</p>
            <p>b) O ProGestão+ <strong>não se responsabiliza</strong> por bloqueios, suspensões, banimentos, limitações ou instabilidades que a Meta/WhatsApp venha a impor ao número do Usuário, ainda que decorrentes do uso automatizado;</p>
            <p>c) É recomendável que o Usuário utilize um número comercial dedicado, e não seu número pessoal, para a integração;</p>
            <p>d) O ProGestão+ não garante a entrega, o recebimento ou o tempo de resposta das mensagens, que dependem da infraestrutura de terceiros.</p>
            <p>7.3. As respostas geradas por inteligência artificial são automatizadas e podem conter imprecisões. O Usuário é responsável por revisar e supervisionar os agendamentos e informações prestados aos seus próprios clientes.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Responsabilidades do Usuário</h2>
            <p>8.1. O Usuário é o <strong>controlador</strong> dos dados que insere na plataforma, incluindo os dados de seus próprios clientes, e é responsável por obter as autorizações necessárias e por utilizá-los em conformidade com a legislação, especialmente a Lei Geral de Proteção de Dados (LGPD).</p>
            <p>8.2. O Usuário compromete-se a não utilizar a plataforma para fins ilícitos, fraudulentos, ou que violem direitos de terceiros.</p>
            <p>8.3. O Usuário é responsável pela veracidade das informações cadastradas e pela correta configuração do sistema (serviços, horários, preços, profissionais).</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">9. Disponibilidade e limitação de responsabilidade</h2>
            <p>9.1. O ProGestão+ empenha-se para manter o serviço disponível, mas não garante funcionamento ininterrupto ou livre de falhas, podendo haver interrupções para manutenção, atualizações ou por causas alheias ao seu controle (falhas de terceiros, provedores, internet).</p>
            <p>9.2. Na máxima extensão permitida em lei, o ProGestão+ não se responsabiliza por lucros cessantes, perda de dados decorrente de uso indevido, ou danos indiretos resultantes do uso ou da impossibilidade de uso da plataforma.</p>
            <p>9.3. O ProGestão+ realiza esforços de segurança e backup, mas recomenda que o Usuário mantenha seus próprios registros de informações críticas.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">10. Propriedade intelectual</h2>
            <p>10.1. Todo o software, marca, design, código e conteúdo do ProGestão+ são de propriedade da MR Solution, sendo vedada reprodução, cópia, engenharia reversa ou uso não autorizado.</p>
            <p>10.2. Os dados inseridos pelo Usuário permanecem de titularidade do Usuário.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">11. Alterações dos Termos</h2>
            <p>11.1. Estes Termos podem ser atualizados a qualquer momento. Alterações relevantes serão comunicadas na plataforma e, quando cabível, exigirão novo aceite.</p>
            <p>11.2. O uso continuado do serviço após alterações implica concordância com os Termos atualizados.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">12. Foro e legislação aplicável</h2>
            <p>12.1. Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>
            <p>12.2. Fica eleito o foro da comarca de Ji-Paraná, Estado de Rondônia, para dirimir eventuais controvérsias, salvo disposição legal em contrário aplicável a relações de consumo.</p>
          </section>

          <p className="italic pt-4 border-t border-border">Ao marcar a opção "Li e concordo com os Termos de Uso e a Política de Privacidade" no momento do cadastro, o Usuário manifesta seu aceite livre, informado e inequívoco a este documento.</p>
        </div>
      </div>
    </div>
  );
};

export default Termos;
