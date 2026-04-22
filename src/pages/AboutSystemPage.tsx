import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Layers,
  LineChart,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import logoImg from "@/img/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LOGIN_BG_URL = `${import.meta.env.BASE_URL}login.png`;

const heroHighlights = [
  {
    title: "Visão unificada",
    description: "Indicadores e painéis no mesmo ambiente, prontos para reuniões e comitês.",
  },
  {
    title: "Da métrica à narrativa",
    description: "IA explicativa ajuda a traduzir gráficos em linguagem clara para toda a equipe.",
  },
  {
    title: "Escala com o negócio",
    description: "Estrutura pensada para PMEs que precisam evoluir sem um exército de TI.",
  },
];

const capabilities = [
  {
    icon: BarChart3,
    title: "Dashboards executivos",
    text: "Painéis claros para acompanhar performance, metas e tendências no tempo certo.",
  },
  {
    icon: LineChart,
    title: "Decisões com contexto",
    text: "Histórico, comparativos e visualizações que sustentam prioridades e investimentos.",
  },
  {
    icon: BrainCircuit,
    title: "IA explicativa",
    text: "Respostas em linguagem natural sobre o que os dados estão mostrando — quando configurada.",
  },
  {
    icon: Layers,
    title: "Organização por empresa",
    text: "Estrutura alinhada a times, papéis e governança — ideal para apresentar governança a clientes.",
  },
  {
    icon: Shield,
    title: "Foco em segurança",
    text: "Fluxo de acesso e auditoria no centro do desenho, para ambientes corporativos sérios.",
  },
  {
    icon: Users,
    title: "Colaboração",
    text: "Menos versões de planilha e mais um ponto de verdade para vendas, financeiro e operações.",
  },
];

const steps = [
  {
    step: "01",
    title: "Conecte a visão",
    text: "Defina o que a empresa precisa enxergar: vendas, financeiro, operação ou indicadores mistos.",
  },
  {
    step: "02",
    title: "Monte os painéis",
    text: "Organize dashboards que contam a história do negócio — prontos para tela cheia em apresentações.",
  },
  {
    step: "03",
    title: "Apresente e evolua",
    text: "Use a mesma base na rotina e em reuniões com clientes ou diretoria; refine com feedback real.",
  },
];

export function AboutSystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barra superior — discreta para não competir com o hero em apresentação */}
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-3 items-center gap-2 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-white/80 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link to="/auth/login">
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Área de login</span>
                <span className="sm:hidden">Login</span>
              </Link>
            </Button>
          </div>
          <div className="flex justify-center">
            <Link
              to="/"
              className="rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-black/10 transition-opacity hover:opacity-95 sm:px-2.5 sm:py-1.5"
              aria-label="NeXora — início"
            >
              <img
                src={logoImg}
                alt=""
                className="mx-auto block h-7 w-auto max-w-[min(48vw,11rem)] object-contain object-center sm:h-8 sm:max-w-[13rem]"
              />
            </Link>
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90" asChild>
              <Link to="/auth/register" className="gap-1">
                Começar
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — impacto visual para abertura de apresentação */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-center pt-14">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${LOGIN_BG_URL})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/88 via-slate-950/82 to-slate-950"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-10 text-center sm:px-6 lg:px-8">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/95">
            Business Intelligence
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08]">
            Transforme dados em decisões que impressionam clientes e diretoria
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/80 sm:text-xl">
            O NeXora é a plataforma para centralizar indicadores, narrar resultados com clareza e usar IA
            explicativa no momento em que a equipe precisa entender — não só ver — os números.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" className="h-12 min-w-[200px] px-8 text-base shadow-lg shadow-primary/25" asChild>
              <Link to="/auth/register">Criar conta gratuita</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 min-w-[200px] border-white/25 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link to="/auth/login">Já sou cliente</Link>
            </Button>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 border-t border-white/10 pt-12 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <div key={item.title} className="text-left sm:text-center">
                <p className="text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proposta de valor — leitura rápida em slide */}
      <section className="border-b bg-muted/25 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Por que o NeXora</p>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Uma narrativa única para vendas, financeiro e operação
              </h2>
              <p className="text-lg text-muted-foreground">
                Em apresentações comerciais ou internas, o que mais pesa é consistência: uma única fonte de
                verdade, visual profissional e linguagem acessível — inclusive para quem não é analista.
              </p>
            </div>
            <Card className="border-border/80 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  O que muda na prática
                </CardTitle>
                <CardDescription>Argumentos prontos para sua próxima conversa com cliente ou sócio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Menos tempo caçando números em planilhas e e-mails.",
                  "Reuniões com telas que sustentam o discurso, não o contrário.",
                  "Evolução gradual: comece enxuto e amplie indicadores com maturidade.",
                  "IA explicativa como diferencial de clareza, não de buzzword.",
                ].map((line) => (
                  <div key={line} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-muted-foreground">{line}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Capacidades — grid para demo / deck */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Plataforma</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Capacidades que você pode mostrar com orgulho
            </h2>
            <p className="mt-4 text-muted-foreground">
              Estruture sua conversa em torno de pilares claros: visualização, decisão, IA, governança e time.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <Card
                key={title}
                className="group border-border/80 transition-shadow hover:shadow-md"
              >
                <CardHeader className="gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base leading-snug">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Jornada — storytelling em 3 atos */}
      <section className="border-y bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Jornada em três atos</h2>
            <p className="mt-3 text-muted-foreground">
              Roteiro simples para apresentações: do diagnóstico à operação contínua.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            {steps.map(({ step, title, text }) => (
              <div key={step}>
                <p className="font-mono text-sm font-bold text-primary">{step}</p>
                <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impacto — fechamento racional */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-6 w-6" aria-hidden />
                <span className="text-sm font-semibold uppercase tracking-wider">Impacto</span>
              </div>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Menos atrito operacional, mais confiança na mesa de decisão
              </h2>
              <p className="text-muted-foreground">
                O NeXora apoia empresas que precisam crescer com disciplina: priorizar o que medir, como
                apresentar e como evoluir o uso da informação — sem depender de soluções fechadas demais ou
                genéricas demais.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-primary/15 bg-primary/[0.06]">
                <CardContent className="flex flex-col gap-2 p-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <p className="font-semibold">Clareza</p>
                  <p className="text-sm text-muted-foreground">
                    Indicadores e narrativa alinhados — todos enxergam a mesma história.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/15 bg-primary/[0.06]">
                <CardContent className="flex flex-col gap-2 p-6">
                  <Zap className="h-6 w-6 text-primary" />
                  <p className="font-semibold">Velocidade</p>
                  <p className="text-sm text-muted-foreground">
                    Da pergunta à visualização em menos passos do que fluxos manuais tradicionais.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/15 bg-primary/[0.06] sm:col-span-2">
                <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:gap-6">
                  <LineChart className="h-8 w-8 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Cultura data-driven</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ferramentas que convidam o time a usar dados no cotidiano — o efeito compõe com o tempo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final — forte para fechar pitch */}
      <section className="bg-primary py-16 text-primary-foreground sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para apresentar o próximo nível da sua operação?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/85">
            Abra uma conta, explore os fluxos e use esta página como roteiro em reuniões com clientes,
            investidores ou diretoria.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 min-w-[220px] px-8 text-base font-semibold text-primary shadow-lg"
              asChild
            >
              <Link to="/auth/register">Criar conta</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 min-w-[220px] border-primary-foreground/40 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/auth/login">Acessar plataforma</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>NeXora — Business Intelligence com foco em pequenas e médias empresas.</p>
      </footer>
    </div>
  );
}
