import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  LineChart,
  Lock,
  PieChart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/components/ui/utils";

const LOGIN_BG_URL = `${import.meta.env.BASE_URL}login.png`;
const LOGO_URL = `${import.meta.env.BASE_URL}logo.png`;

const stats = [
  { value: "3×", label: "Mais rápido para montar uma visão executiva" },
  { value: "1", label: "Fonte única de verdade para o time" },
  { value: "IA", label: "Narrativa explicativa sobre os dados" },
  { value: "24/7", label: "Painéis prontos para reuniões e comitês" },
];

const bentoItems = [
  {
    icon: BarChart3,
    title: "Dashboards executivos",
    text: "Painéis claros para performance, metas e tendências — prontos para tela cheia em apresentações.",
    className: "md:col-span-2 md:row-span-1",
    accent: "from-violet-500/20 to-indigo-500/5",
  },
  {
    icon: BrainCircuit,
    title: "Relatórios com IA",
    text: "Gere múltiplos gráficos e KPIs a partir de uma pergunta em linguagem natural.",
    className: "md:col-span-1",
    accent: "from-fuchsia-500/20 to-purple-500/5",
  },
  {
    icon: LineChart,
    title: "Decisão com contexto",
    text: "Histórico, comparativos e visualizações que sustentam prioridades.",
    className: "md:col-span-1",
    accent: "from-cyan-500/20 to-blue-500/5",
  },
  {
    icon: Shield,
    title: "Governança e auditoria",
    text: "Papéis, permissões e trilha de ações para ambientes corporativos.",
    className: "md:col-span-1",
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    icon: Users,
    title: "Colaboração",
    text: "Menos planilhas paralelas. Um ponto de verdade para vendas, financeiro e operações.",
    className: "md:col-span-2",
    accent: "from-amber-500/15 to-orange-500/5",
  },
];

const journey = [
  {
    step: "01",
    title: "Defina a narrativa",
    text: "Escolha o que a empresa precisa enxergar: vendas, financeiro, operação ou indicadores mistos.",
  },
  {
    step: "02",
    title: "Monte os painéis",
    text: "Organize dashboards e relatórios IA que contam a história do negócio com clareza visual.",
  },
  {
    step: "03",
    title: "Apresente e evolua",
    text: "Use a mesma base na rotina e em reuniões com clientes ou diretoria; refine com feedback real.",
  },
];

const pillars = [
  { icon: Target, title: "Foco no que importa", text: "Indicadores alinhados à estratégia, não ruído." },
  { icon: Zap, title: "Velocidade operacional", text: "Da pergunta à visualização em poucos passos." },
  { icon: Lock, title: "Segurança by design", text: "Acesso controlado e sessões com expiração." },
];

function fadeUp(delay = 0, reduceMotion: boolean) {
  if (reduceMotion) {
    return { initial: {}, whileInView: {}, viewport: { once: true } };
  }
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/30 via-violet-500/10 to-cyan-500/20 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          <span className="ml-2 text-xs font-medium text-white/50">NeXora · Painel Comercial</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { label: "Faturamento", value: "R$ 431K", trend: "+12%" },
            { label: "Ticket médio", value: "R$ 8,2K", trend: "+4%" },
            { label: "Conversão", value: "18,4%", trend: "+2,1%" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/45">{kpi.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">{kpi.value}</p>
              <p className="mt-0.5 text-xs font-medium text-emerald-400">{kpi.trend}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-white/70">Vendas por região</p>
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div className="flex h-24 items-end gap-2">
              {[62, 88, 45, 74, 95, 58].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-violet-400/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
            <PieChart className="mb-2 h-8 w-8 text-cyan-400/80" />
            <p className="text-center text-xs text-white/55">Mix por categoria</p>
            <div className="mt-2 h-14 w-14 rounded-full border-[6px] border-violet-500 border-r-cyan-400 border-b-transparent border-l-fuchsia-400" />
          </div>
        </div>
        <div className="border-t border-white/10 bg-violet-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-xs text-violet-200/90">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            IA: &quot;Sudeste lidera faturamento; Nordeste acelerou 18% no trimestre.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

export function AboutSystemPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-border/70 bg-background/90 px-3.5 text-sm font-medium shadow-sm backdrop-blur-sm transition-all hover:-translate-y-px hover:border-primary/35 hover:bg-primary/5 hover:text-primary hover:shadow-md sm:px-4"
            asChild
          >
            <Link to="/auth/login">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          </Button>

          <Link
            to="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-label="NeXora"
          >
            <img
              src={LOGO_URL}
              alt="NeXora"
              className="h-14 w-auto max-w-[min(84vw,18rem)] object-contain sm:h-[4.25rem] sm:max-w-[20rem] md:h-20 md:max-w-[24rem]"
            />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle className="h-9 w-9 rounded-full border border-border/70 bg-background/90 shadow-sm backdrop-blur-sm hover:bg-primary/5" />
            <Button
              size="sm"
              className="inline-flex h-9 gap-1.5 rounded-full bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-lg hover:shadow-primary/40 sm:px-5"
              asChild
            >
              <Link to="/auth/register">
                Começar
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen pt-14 sm:pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-50"
          style={{ backgroundImage: `url(${LOGIN_BG_URL})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(91,91,214,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(91,91,214,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_50%,transparent_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-24 h-[480px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pt-24">
          <motion.div {...fadeUp(0, !!reduceMotion)}>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Business Intelligence · IA
            </p>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Inteligência que{" "}
              <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                impressiona
              </span>{" "}
              na primeira tela
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              O NeXora centraliza indicadores, transforma dados em narrativas claras e coloca IA
              explicativa no centro da decisão — para PMEs que precisam de impacto sem complexidade
              enterprise.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="h-12 rounded-full bg-gradient-to-r from-primary via-violet-600 to-indigo-600 px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
                asChild
              >
                <Link to="/auth/register">Criar conta gratuita</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-border/80 bg-background/80 px-8 text-base font-medium shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                asChild
              >
                <Link to="/auth/login">Acessar plataforma</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Sem cartão para começar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Painéis prontos em minutos
              </span>
            </div>
          </motion.div>

          <motion.div
            className="lg:justify-self-end"
            {...fadeUp(0.12, !!reduceMotion)}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto grid max-w-7xl divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {stats.map((item, index) => (
            <motion.div
              key={item.label}
              className="px-6 py-10 text-center sm:py-12"
              {...fadeUp(index * 0.06, !!reduceMotion)}
            >
              <p className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{item.value}</p>
              <p className="mx-auto mt-2 max-w-[12rem] text-sm leading-relaxed text-muted-foreground">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Proposta */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
            <motion.div {...fadeUp(0, !!reduceMotion)}>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Por que NeXora</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Da planilha solta ao painel que sustenta o discurso
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Em reuniões com clientes, investidores ou diretoria, consistência visual e narrativa
                única pesam mais que dezenas de gráficos desconectados. O NeXora foi desenhado para
                esse momento.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Uma fonte de verdade para vendas, financeiro e operações.",
                  "Relatórios IA que respondem em linguagem natural.",
                  "Governança com papéis, permissões e auditoria.",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-muted-foreground">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1"
              {...fadeUp(0.1, !!reduceMotion)}
            >
              {pillars.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="border-t border-border/60 bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-2xl text-center" {...fadeUp(0, !!reduceMotion)}>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Plataforma</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo o que você precisa para apresentar com orgulho
            </h2>
            <p className="mt-4 text-muted-foreground">
              Visualização, IA, governança e colaboração — em uma experiência coesa.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(160px,auto)]">
            {bentoItems.map((item, index) => (
              <motion.div
                key={item.title}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:shadow-lg",
                  item.className
                )}
                {...fadeUp(index * 0.05, !!reduceMotion)}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
                    item.accent
                  )}
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Jornada */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="max-w-2xl" {...fadeUp(0, !!reduceMotion)}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Jornada em três atos</h2>
            <p className="mt-4 text-muted-foreground">
              Um roteiro claro para implementar, apresentar e evoluir o uso de dados na empresa.
            </p>
          </motion.div>

          <div className="relative mt-14">
            <div
              className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block"
              aria-hidden
            />
            <div className="grid gap-8 md:grid-cols-3">
              {journey.map((item, index) => (
                <motion.div
                  key={item.step}
                  className="relative rounded-2xl border border-border/80 bg-card p-8 shadow-sm"
                  {...fadeUp(index * 0.08, !!reduceMotion)}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-indigo-700"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]"
          aria-hidden
        />
        <motion.div
          className="relative z-10 mx-auto max-w-3xl px-4 text-center text-primary-foreground sm:px-6"
          {...fadeUp(0, !!reduceMotion)}
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Pronto para elevar a conversa com dados?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/85">
            Crie sua conta, explore os painéis e use esta página como referência nas suas próximas
            apresentações.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 min-w-[220px] bg-white px-8 text-base font-semibold text-primary shadow-xl hover:bg-white/95"
              asChild
            >
              <Link to="/auth/register">Começar agora</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 min-w-[220px] border-white/40 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link to="/auth/login">Já tenho conta</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>NeXora — Business Intelligence para PMEs que decidem com clareza.</p>
          <div className="flex gap-6">
            <Link to="/auth/login" className="transition-colors hover:text-foreground">
              Login
            </Link>
            <Link to="/auth/register" className="transition-colors hover:text-foreground">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
