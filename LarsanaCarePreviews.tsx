import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileSignature,
  FileText,
  Filter,
  Gauge,
  HeartPulse,
  Home,
  LineChart,
  Lock,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Search,
  Send,
  MessageCircle,
  Mail,
  Shield,
  ShieldCheck,
  Star,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

/** Tabelas de Valores Integrais 2026 — V1-2026 (uso interno Larsana Care) */
const PRICING_V1_2026 = [
  {
    id: "A",
    label: "Tabela 1 · Região A",
    cities: "Mauá · Ribeirão Pires · Rio Grande da Serra · Diadema",
    n1: 100,
    n2: 130,
    n3: 150,
  },
  {
    id: "B",
    label: "Tabela 2 · Região B",
    cities: "Santo André · São Bernardo do Campo",
    n1: 130,
    n2: 150,
    n3: 170,
  },
  {
    id: "C",
    label: "Tabela 3 · Região C",
    cities: "São Caetano do Sul · São Paulo (Capital)",
    n1: 150,
    n2: 180,
    n3: 200,
  },
] as const;

const LRS_PROF_CONTRACT_PREVIEW = `CONTRATO Nº LRS-PROF.FISIO-2026-0002
CONTRATO DE PARCERIA PARA INTERMEDIAÇÃO DE SERVIÇOS DE FISIOTERAPIA

Pelo presente instrumento particular, de um lado:

PLATAFORMA: DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA., pessoa jurídica de direito privado, inscrita no CNPJ nº 65.974.822/0001-19, com sede em Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul-SP, 09531-190, neste ato representada por sua sócia administradora Marina Silva Batista, inscrita no CPF nº 389.273.408-92 e CREFITO nº 03/277681-F, detentora da marca Larsana Care — INTERMEDIADORA DE SERVIÇOS DE SAÚDE.

PROFISSIONAL PARCEIRO (ANEXO I):
Nome: Aline Giseli Olimpio Donoso · CPF: 401.775.788-07 · CREFITO3: 269110-F
Endereço: Rua Minas Gerais, 206 — São Jorge, Santo André/SP — CEP 09111-700

CLÁUSULA 1 – DO OBJETO
O presente contrato tem como objeto a prestação, pela PLATAFORMA, de serviços de agenciamento, intermediação e gestão operacional, conectando o PROFISSIONAL PARCEIRO a pacientes interessados em atendimento fisioterapêutico domiciliar. A PLATAFORMA não realiza diretamente os atendimentos.

CLÁUSULA 2 – DOS SERVIÇOS DA PLATAFORMA
Gestão administrativa, uso da marca Larsana Care, captação de pacientes, definição de valores operacionais, cobrança, recebimento, sugestão de agenda e supervisão técnica. O PROFISSIONAL PARCEIRO não possui autorização para negociar valores sem alinhamento prévio com a PLATAFORMA.

CLÁUSULA 3 – DA NATUREZA DA RELAÇÃO E AUTONOMIA
Relação estritamente civil e comercial. Autonomia técnica, sem subordinação, controle de jornada ou exclusividade.`;

const PP_SIGN_FLOW = [
  { step: "1", label: "Documentos", sub: "Antecedentes · CREFITO · certificados", done: true },
  { step: "2", label: "Termos & LGPD", sub: "Aceite digital (sem Gov.br)", done: true },
  { step: "3", label: "Contrato gerado", sub: "LRS-PROF.FISIO-2026-0002 + ANEXO I", done: true },
  { step: "4", label: "Assinatura do contrato", sub: "Aceite digital do PDF · pendente", done: false, active: true },
  { step: "5", label: "Aprovação Larsana", sub: "Gestão valida credenciamento", done: false },
  { step: "6", label: "Parceiro ativo", sub: "Wallet Asaas · demandas liberadas", done: false },
];

type PreviewProps = {
  platformName?: string;
  primaryColor?: string;
};

type PreviewComponent = ComponentType<PreviewProps>;

const TEAL = "#0D9488";
const TEAL_DARK = "#0F4F4A";
const TEAL_DEEP = "#073B38";
const MINT = "#5EEAD4";
const BG = "#F4F8F8";

export const LARSANA_PROPOSAL_KEY = "sagitta/plataforma-fisioterapia-domiciliar-larsana-care";

export const isLarsanaProposal = (proposalKey?: string | null) =>
  proposalKey === LARSANA_PROPOSAL_KEY ||
  Boolean(proposalKey?.includes("plataforma-fisioterapia-domiciliar-larsana-care"));

/* =================== ATOMS =================== */

const Frame = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`flex h-full w-full min-h-[480px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
  >
    {children}
  </div>
);

const MobileFrame = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`flex h-full w-full flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-white ${className}`}
    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
  >
    {children}
  </div>
);

const TopBar = ({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) => (
  <div
    className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5"
    style={{ background: TEAL_DEEP }}
  >
    <div className="flex items-center gap-2.5">
      <div className="grid h-7 w-7 place-items-center rounded-md text-white shadow-inner" style={{ background: TEAL }}>
        <HeartPulse className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="text-[12px] font-semibold leading-none text-white">{title}</div>
        {sub && <div className="mt-0.5 text-[9px] text-teal-200/80">{sub}</div>}
      </div>
    </div>
    <div className="flex items-center gap-3 text-teal-100/80">
      {action}
      <Bell className="h-3.5 w-3.5" />
      <div className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[9px] font-bold text-white">RM</div>
    </div>
  </div>
);

const SideNav = ({ active }: { active: string }) => {
  const items = [
    { k: "Painel", icon: Gauge },
    { k: "Pacientes", icon: Users },
    { k: "Demandas", icon: MapPin },
    { k: "Profissionais", icon: Stethoscope },
    { k: "Ciclos", icon: Calendar },
    { k: "Financeiro", icon: Wallet },
    { k: "Relatórios", icon: FileText },
    { k: "Configurações", icon: Lock },
  ];
  return (
    <aside className="hidden md:flex w-40 flex-col gap-0.5 border-r border-slate-200 bg-slate-50/70 px-2 py-3">
      {items.map(({ k, icon: I }) => {
        const on = k === active;
        return (
          <div
            key={k}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${on ? "font-semibold text-white" : "text-slate-600"}`}
            style={on ? { background: TEAL } : undefined}
          >
            <I className="h-3.5 w-3.5" />
            {k}
          </div>
        );
      })}
      <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-2 text-[9px] leading-snug text-teal-800">
        <ShieldCheck className="mr-1 inline h-3 w-3" />
        LGPD ativa · trilha 5 anos
      </div>
    </aside>
  );
};

const Pill = ({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "warn" | "success" | "danger" | "info" | "neutral";
}) => {
  const map: Record<string, string> = {
    brand: `bg-teal-50 text-teal-700 border-teal-200`,
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
};

const KPI = ({
  label,
  value,
  delta,
  icon: Icon,
  positive = true,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  positive?: boolean;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3">
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="grid h-6 w-6 place-items-center rounded-md" style={{ background: `${TEAL}14` }}>
        <Icon className="h-3 w-3" style={{ color: TEAL }} />
      </div>
    </div>
    <div className="text-[18px] font-bold leading-none text-slate-900">{value}</div>
    {delta && (
      <div className={`mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold ${positive ? "text-emerald-600" : "text-amber-600"}`}>
        <ArrowUpRight className="h-2.5 w-2.5" /> {delta}
      </div>
    )}
  </div>
);

const StatusBar = () => (
  <div className="flex items-center justify-between px-4 pt-2 text-[10px] font-semibold text-slate-700">
    <span>9:41</span>
    <span className="flex items-center gap-1">
      <span>●●●</span>
      <span>5G</span>
    </span>
  </div>
);

/* =================== sc1 — Dashboard operacional =================== */

const Sc1Dashboard: PreviewComponent = ({ platformName = "Larsana Care" }) => (
  <Frame>
    <TopBar title={platformName} sub="Painel administrativo · Maio/2026" />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Painel" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-slate-900">Operação de hoje</div>
            <div className="text-[10px] text-slate-500">14 pacientes ativos · 3 regiões · 8 fisioterapeutas em campo</div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>Período: 01–22 mai</span>
            <span className="rounded bg-white px-2 py-0.5 font-semibold text-slate-700 border border-slate-200">Mês atual</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <KPI label="Pacientes ativos" value="14" delta="9 com ciclo aberto" icon={Users} />
          <KPI label="Profissionais" value="11" delta="8 fisios · 3 estagiárias" icon={Stethoscope} />
          <KPI label="Faturamento" value="R$ 7.950" delta="margem R$ 2.035" icon={Wallet} />
          <KPI label="Ciclos a cobrar" value="6" delta="3 vencem em 7d" icon={Calendar} positive={false} />
        </div>

        <div className="mt-2 grid grid-cols-12 gap-2">
          <div className="col-span-7 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-900">Atendimentos por região</div>
              <Pill tone="brand">3 regiões</Pill>
            </div>
            {[
              { r: "Região A · Mauá / RGS", p: 11, v: "R$ 6.240", w: 78 },
              { r: "Região B · SBC / Santo André", p: 2, v: "R$ 1.200", w: 18 },
              { r: "Região C · São Caetano", p: 1, v: "R$ 510", w: 7 },
            ].map((row) => (
              <div key={row.r} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-700">{row.r}</span>
                  <span className="text-slate-500">
                    {row.p} pacientes · <span className="font-semibold" style={{ color: TEAL }}>{row.v}</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${row.w}%`, background: `linear-gradient(90deg, ${TEAL}, ${MINT})` }} />
                </div>
              </div>
            ))}
            <div className="mt-3 grid grid-cols-12 items-end gap-1">
              {[42, 56, 38, 64, 51, 70, 48, 62, 78, 56, 68, 84].map((h, i) => (
                <div key={i} className="col-span-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${h * 0.55}px`, background: i === 11 ? TEAL : `${TEAL}55` }}
                  />
                  <span className="text-[8px] text-slate-400">{"JFMAMJJASOND"[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 flex flex-col gap-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-900">Alertas operacionais</div>
                <Pill tone="warn">4 itens</Pill>
              </div>
              {[
                { t: "Proposta aguardando família — Edith B. (3 dias)", tone: "info" as const, label: "Workflow" },
                { t: "Cobrança pendente — Ciclo 25 Jessica", tone: "warn" as const, label: "Cobrar" },
                { t: "Prontuário 24h — sessão sem registro", tone: "danger" as const, label: "Crefito" },
                { t: "Repasse a liberar — Ciclo 01 Vilson (NF)", tone: "warn" as const, label: "Financeiro" },
              ].map((a) => (
                <div key={a.t} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-[10px] text-slate-700">{a.t}</span>
                  <Pill tone={a.tone}>{a.label}</Pill>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 p-3" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
              <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Próximo fechamento</div>
              <div className="text-[15px] font-bold text-white">Ciclo Manoel F. · 28/05</div>
              <div className="mt-1 text-[10px] text-teal-50/90">8 sessões · R$ 910 pago · repasse ao fim do ciclo</div>
              <button className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[9px] font-semibold text-white">
                Abrir ciclo <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc1DashboardMobile: PreviewComponent = ({ platformName = "Larsana Care" }) => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
      <StatusBar />
      <div className="mt-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-white/15"><HeartPulse className="h-3.5 w-3.5" /></div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Admin · Maio</div>
          <div className="text-[13px] font-bold">{platformName}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { l: "Pacientes", v: "14", s: "9 ativos" },
          { l: "Faturamento", v: "R$ 7,9k", s: "+12% mês" },
          { l: "Profissionais", v: "11", s: "8 em campo" },
          { l: "Ciclos abertos", v: "6", s: "3 vencem 7d" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg bg-white/10 p-2 ring-1 ring-white/15">
            <div className="text-[9px] text-teal-100/80">{k.l}</div>
            <div className="text-[15px] font-bold">{k.v}</div>
            <div className="text-[8px] text-teal-100/70">{k.s}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Alertas</div>
      {[
        { t: "Cobrar Ciclo 25 Jessica", tone: "warn" as const },
        { t: "Docs Danielle pendentes", tone: "danger" as const },
        { t: "Maria dos Anjos · pausa", tone: "neutral" as const },
      ].map((a) => (
        <div key={a.t} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
          <span className="text-[10px] text-slate-700">{a.t}</span>
          <Pill tone={a.tone}>Ver</Pill>
        </div>
      ))}
    </div>
  </MobileFrame>
);

/* =================== sc2 — Mapa de demandas =================== */

const demands = [
  { name: "Manoel F.", level: "Nível 2", addr: "Itapark, Mauá", dist: "4,2 km", x: 22, y: 28 },
  { name: "Edith B.", level: "Nível 2", addr: "Centro, SBC", dist: "8,1 km", x: 58, y: 46 },
  { name: "Vilson B.", level: "Nível 3", addr: "Matriz, Mauá", dist: "2,8 km", x: 38, y: 64 },
  { name: "Severina R.", level: "Nível 1", addr: "Jd. Primavera, Mauá", dist: "1,1 km", x: 28, y: 18 },
];

const Sc2Mapa: PreviewComponent = () => (
  <Frame>
    <TopBar title="Demandas domiciliares" sub="Matching por proximidade · Região A" action={<Pill tone="success">3 novas</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Demandas" />
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 overflow-hidden" style={{ background: `linear-gradient(135deg, #ECFEFF, #F0F9F8)` }}>
          <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 6 0 L 0 0 0 6" fill="none" stroke={TEAL} strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            <path d="M0 60 Q 30 40 60 55 T 100 50" stroke={TEAL} strokeWidth="0.6" fill="none" opacity="0.4" />
            <path d="M 20 0 L 25 100" stroke={TEAL} strokeWidth="0.4" fill="none" opacity="0.3" />
          </svg>
          {demands.map((d, i) => (
            <div
              key={d.name}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${d.y}%`, left: `${d.x}%` }}
            >
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full" style={{ background: `${TEAL}33` }} />
                <div className="relative flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-md ring-1 ring-teal-100">
                  <MapPin className="h-3 w-3" style={{ color: TEAL }} />
                  <span className="text-[9px] font-bold text-slate-800">{d.dist}</span>
                  <span className="text-[8px] text-slate-500">· {d.level}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-white/95 px-2 py-1 text-[9px] text-slate-600 shadow-sm">
            <Navigation className="h-3 w-3" style={{ color: TEAL }} />
            Mauá · raio 12 km · matching automático
          </div>
          <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-md bg-white p-1.5 shadow-sm">
            <button className="rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 h-5 w-5">+</button>
            <button className="rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 h-5 w-5">−</button>
          </div>
        </div>
        <div className="w-64 border-l border-slate-200 bg-white p-2 space-y-1.5 overflow-y-auto">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[10px] font-semibold text-slate-700">Fila de demandas</span>
            <Filter className="h-3 w-3 text-slate-400" />
          </div>
          {demands.map((d) => (
            <div key={d.name} className="rounded-lg border border-slate-200 p-2 hover:border-teal-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-900">{d.name}</span>
                <Pill tone="brand">{d.level}</Pill>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                <MapPin className="h-2.5 w-2.5" /> {d.addr} · {d.dist}
              </div>
              <div className="mt-1.5 flex gap-1">
                <button className="flex-1 rounded py-1 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
                  Aceitar
                </button>
                <button className="rounded border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-600">
                  Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Frame>
);

const Sc2MapaMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Profissional</div>
          <div className="text-[13px] font-bold">Demandas perto</div>
        </div>
        <Navigation className="h-4 w-4" />
      </div>
    </div>
    <div className="relative h-40 m-3 rounded-xl overflow-hidden ring-1 ring-teal-100" style={{ background: `linear-gradient(135deg, #ECFEFF, #F0F9F8)` }}>
      {demands.slice(0, 3).map((d, i) => (
        <div key={d.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${30 + i * 18}%`, left: `${25 + i * 22}%` }}>
          <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-bold shadow ring-1 ring-teal-100">
            <MapPin className="h-2.5 w-2.5" style={{ color: TEAL }} /> {d.dist}
          </div>
        </div>
      ))}
    </div>
    <div className="flex-1 overflow-hidden px-3 pb-3 space-y-2">
      {demands.slice(0, 3).map((d) => (
        <div key={d.name} className="rounded-lg border border-slate-200 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-900">{d.name}</span>
            <Pill tone="brand">{d.level}</Pill>
          </div>
          <div className="text-[9px] text-slate-500">{d.addr} · {d.dist}</div>
          <button className="mt-1.5 w-full rounded-md py-1.5 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
            Aceitar demanda
          </button>
        </div>
      ))}
    </div>
  </MobileFrame>
);

/* =================== sc3 — Workflow de avaliação inicial =================== */

/** Caso demo sc3 — Edith · Região B · Nível 2 (V1-2026) */
const SC3_DEMO = {
  level: 2 as const,
  sessions: 8,
  regionId: "B" as const,
  pricePerSession: 150,
  get cycleTotal() {
    return this.sessions * this.pricePerSession;
  },
};

const evalWorkflowSteps = [
  { label: "Avaliação feita", sub: "26/05 · 1º atendimento registrado", done: true },
  {
    label: "Proposta enviada à família",
    sub: `Plano ${SC3_DEMO.sessions} sessões · Nível ${SC3_DEMO.level} · R$ ${SC3_DEMO.cycleTotal.toLocaleString("pt-BR")} · 26/05`,
    done: true,
  },
  { label: "Em análise", sub: "Família tem até 5 dias úteis · restam 2 dias", done: true, active: true },
  { label: "Resposta da família", sub: "Aguardando SIM ou NÃO", done: false },
  {
    label: "1º ciclo, desistência ou taxa",
    sub: "SIM → termos + ciclo · SIM+desistência → R$ 100 + repasse % · NÃO → R$ 50",
    done: false,
  },
];

/** Repasse por sessão exibido no app PP (tabela PP — não é valor integral do paciente) */
const REPASSE_PP_POR_NIVEL = [
  { level: 1, label: "Nível 1", repasse: 80 },
  { level: 2, label: "Nível 2", repasse: 90 },
  { level: 3, label: "Nível 3", repasse: 100 },
];

const sc3RegionPricing = PRICING_V1_2026.find((r) => r.id === SC3_DEMO.regionId)!;

const Sc3Paciente: PreviewComponent = () => (
  <Frame>
    <TopBar title="Workflow de avaliação" sub="Edith Battistioli · rastreio visível ao fisio e gestão" action={<Pill tone="info">Em análise</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Pacientes" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">EB</div>
            <div>
              <div className="text-[12px] font-bold text-slate-900">Edith Battistioli</div>
              <div className="text-[10px] text-slate-500">73 anos · Centro, SBC · Prof. Fernanda P.</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Pill tone="info">Aguardando família</Pill>
            <Pill tone="brand">Região B · Nível {SC3_DEMO.level}</Pill>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rastreio · estilo Correios</div>
              <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="space-y-0">
              {evalWorkflowSteps.map((step, i) => (
                <div key={step.label} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full text-[8px] font-bold ${
                        step.done ? "text-white" : "border border-slate-200 text-slate-400"
                      } ${step.active ? "ring-2 ring-teal-300" : ""}`}
                      style={step.done ? { background: TEAL } : undefined}
                    >
                      {step.done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                    </div>
                    {i < evalWorkflowSteps.length - 1 && (
                      <div className="my-0.5 w-px flex-1 min-h-[20px]" style={{ background: step.done ? TEAL : "#E2E8F0" }} />
                    )}
                  </div>
                  <div className={`pb-3 ${step.active ? "rounded-md bg-teal-50/80 px-1 -mx-1" : ""}`}>
                    <div className={`text-[10px] font-bold ${step.active ? "text-teal-900" : "text-slate-800"}`}>{step.label}</div>
                    <div className="text-[9px] text-slate-500">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-[9px] text-amber-900">
              Fisioterapeuta vê este status no app — sem precisar perguntar à gestão.
            </div>
          </div>
          <div className="col-span-7 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dados clínicos</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Diagnóstico principal", "AVC isquêmico hemisfério E (CID I63.5)"],
                ["Comorbidades", "HAS · DM2 controlado"],
                ["Mobilidade", "Cadeirante · transfere com auxílio"],
                ["Responsável legal", "Mariana Aragão (filha)"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-md bg-slate-50 p-2">
                  <div className="text-[9px] uppercase tracking-wide text-slate-500">{l}</div>
                  <div className="mt-0.5 text-[10px] text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nível do paciente · {sc3RegionPricing.label}</div>
              <div className="mb-1 text-[8px] text-slate-500">V1-2026 · valor integral/sessão cobrado do paciente</div>
              <div className="mt-1 flex gap-1.5">
                {[
                  { n: "Nível 1", p: sc3RegionPricing.n1, level: 1 },
                  { n: "Nível 2", p: sc3RegionPricing.n2, level: 2 },
                  { n: "Nível 3", p: sc3RegionPricing.n3, level: 3 },
                ].map((n) => (
                  <div
                    key={n.n}
                    className={`flex-1 rounded-md border p-1.5 text-center ${n.level === SC3_DEMO.level ? "border-transparent text-white shadow-sm" : "border-slate-200 text-slate-600"}`}
                    style={n.level === SC3_DEMO.level ? { background: TEAL } : undefined}
                  >
                    <div className="text-[10px] font-bold">{n.n}</div>
                    <div className={`text-[8px] ${n.level === SC3_DEMO.level ? "text-teal-50" : "text-slate-400"}`}>
                      R$ {n.p}/sessão
                    </div>
                  </div>
                ))}
                <div className="flex-1 rounded-md border border-dashed border-slate-200 p-1.5 text-center text-slate-500">
                  <div className="text-[10px] font-bold">Social</div>
                  <div className="text-[8px]">negociado</div>
                </div>
              </div>
              <div className="mt-1.5 rounded-md border border-teal-100 bg-teal-50/80 px-2 py-1 text-[9px] text-teal-900">
                Ciclo proposto: <b>{SC3_DEMO.sessions} × R$ {SC3_DEMO.pricePerSession}</b> = <b>R$ {SC3_DEMO.cycleTotal.toLocaleString("pt-BR")}</b>
                {" "}· repasse Bronze 70% ≈ R$ {Math.round(SC3_DEMO.cycleTotal * 0.7).toLocaleString("pt-BR")} (após encerrar ciclo)
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plano terapêutico</div>
                {[
                  { k: "Região", v: "B · Centro, SBC" },
                  { k: "Nível", v: `Nível ${SC3_DEMO.level} · R$ ${SC3_DEMO.pricePerSession}/sessão` },
                  { k: "Ciclo proposto", v: `${SC3_DEMO.sessions} sessões · R$ ${SC3_DEMO.cycleTotal.toLocaleString("pt-BR")}` },
                  { k: "Frequência", v: "2x semana (sugerida)" },
                  { k: "Profissional", v: "Fernanda P. · Bronze 70%" },
                  { k: "Se NÃO", v: "Cobrança R$ 50 · 30 dias" },
                  { k: "Se SIM + desistência", v: "R$ 100 · repasse 70/75/80%" },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0 text-[10px]">
                    <span className="text-slate-500">{row.k}</span>
                    <span className="font-semibold text-slate-800">{row.v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-900">
                  <FileSignature className="h-3 w-3" /> Termo de adesão · Diretrizes · LGPD
                </div>
                <div className="mt-1 text-[9px] text-amber-800">
                  Liberado após <b>SIM</b> da família — aceite digital (v2026.1 · sem Gov.br) antes do 1º ciclo e pagamento.
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[9px] font-semibold text-amber-800 opacity-70"
                >
                  Aguardando resposta da família
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc3PacienteMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[10px] font-bold">EB</div>
        <div>
          <div className="text-[12px] font-bold">Edith Battistioli</div>
          <div className="text-[9px] text-teal-100/80">Workflow · 2 dias restantes</div>
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      {evalWorkflowSteps.slice(0, 4).map((step, i) => (
        <div key={step.label} className={`rounded-lg border p-2.5 ${step.active ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-2">
            <div className={`grid h-5 w-5 place-items-center rounded-full text-[8px] ${step.done ? "text-white" : "border border-slate-200 text-slate-400"}`} style={step.done ? { background: TEAL } : undefined}>
              {step.done ? "✓" : i + 1}
            </div>
            <div className="text-[10px] font-semibold text-slate-800">{step.label}</div>
          </div>
          <div className="mt-1 pl-7 text-[9px] text-slate-500">{step.sub}</div>
        </div>
      ))}
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5 text-[9px] text-teal-900">
        <div className="font-semibold">Região B · Nível {SC3_DEMO.level}</div>
        <div>{SC3_DEMO.sessions} sessões · R$ {SC3_DEMO.cycleTotal.toLocaleString("pt-BR")} (V1-2026)</div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
        <div className="text-[10px] font-semibold text-amber-900">Termo · após SIM</div>
        <div className="mt-0.5 text-[9px] text-amber-800">Aceite digital antes do 1º ciclo (sem Gov.br)</div>
      </div>
    </div>
  </MobileFrame>
);

/* =================== sc4 — Ciclo de atendimentos =================== */

const sessions = [
  { n: 1, d: "19/05", ok: true, who: "Aline D." },
  { n: 2, d: "22/05", ok: true, who: "Aline D." },
  { n: 3, d: "25/05", ok: true, who: "Aline D." },
  { n: 4, d: "28/05", ok: false, who: "Aline D." },
  { n: 5, d: "01/06", ok: false, who: "Aline D." },
  { n: 6, d: "03/06", ok: false, who: "Aline D." },
  { n: 7, d: "08/06", ok: false, who: "Aline D." },
  { n: 8, d: "10/06", ok: false, who: "Aline D." },
];

const Sc4Ciclo: PreviewComponent = () => (
  <Frame>
    <TopBar title="Ciclo 02 · Severina R." sub="Pacote 8 sessões · Nível 1 · LRS-CIC-2026-0042" action={<Pill tone="warn">Em andamento</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Ciclos" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Progresso</div>
            <div className="mt-1 text-[18px] font-bold text-slate-900">3 / 8</div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: "37.5%", background: TEAL }} />
            </div>
            <div className="mt-1.5 text-[9px] text-slate-500">5 sessões restantes · próximas 14 dias</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Pagamento</div>
            <div className="mt-1 text-[18px] font-bold text-slate-900">R$ 800</div>
            <div className="mt-1 text-[9px] text-slate-500">PIX confirmado · 15/06 · capital de giro</div>
            <div className="mt-1.5 flex gap-1"><Pill tone="success">Pago antecipado</Pill><Pill tone="neutral">Repasse ao fim</Pill></div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Profissional</div>
            <div className="mt-1 text-[12px] font-bold text-slate-900">Aline Damasceno</div>
            <div className="text-[9px] text-slate-500">CREFITO 387211-F · Bronze · 70%</div>
            <div className="mt-1.5 text-[10px] font-semibold text-amber-700">R$ 560 · libera após 8/8 sessões</div>
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-900">Cronograma de sessões</div>
            <Pill tone="info">Frequência 2x semana</Pill>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {sessions.map((s) => (
              <div
                key={s.n}
                className={`rounded-md border p-2 text-center ${s.ok ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
              >
                <div className="text-[8px] font-semibold text-slate-500">SESSÃO {s.n}</div>
                <div className="text-[10px] font-bold text-slate-800">{s.d}</div>
                {s.ok ? (
                  <CheckCircle2 className="mx-auto mt-1 h-3 w-3 text-emerald-600" />
                ) : (
                  <Clock className="mx-auto mt-1 h-3 w-3 text-slate-400" />
                )}
                <div className="mt-0.5 text-[7px] text-slate-500">{s.who}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[9px] text-amber-800">
              ⚠ Pagamento antecipado obrigatório no fechamento — bloqueia próximo ciclo se em aberto.
            </div>
            <div className="rounded-md border border-teal-200 bg-teal-50 p-2 text-[9px] text-teal-800">
              ✓ Renovação automática prevista — 12/06 (Ciclo 03)
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc4CicloMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3">
        <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Ciclo 02</div>
        <div className="text-[13px] font-bold">Severina R. · 8 sessões</div>
        <div className="mt-2 h-1.5 rounded-full bg-white/15">
          <div className="h-full rounded-full" style={{ width: "37.5%", background: MINT }} />
        </div>
        <div className="mt-1 text-[9px] text-teal-100/80">3 de 8 realizadas · R$ 800 pago</div>
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-1.5" style={{ background: BG }}>
      {sessions.slice(0, 5).map((s) => (
        <div key={s.n} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
          <div className={`grid h-7 w-7 place-items-center rounded-md ${s.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {s.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-800">Sessão {s.n} · {s.d}</div>
            <div className="text-[8px] text-slate-500">{s.who} · {s.ok ? "evolução anexada" : "agendada"}</div>
          </div>
          <ChevronRight className="h-3 w-3 text-slate-400" />
        </div>
      ))}
    </div>
  </MobileFrame>
);

/* =================== sc5 — Prontuário =================== */

const Sc5Prontuario: PreviewComponent = () => (
  <Frame>
    <TopBar title="Evolução clínica" sub="Prontuário CREFITO · Severina R. · Ciclo 02" action={<Pill tone="brand">Gov.br</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Pacientes" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">SR</div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">Severina Rosa</div>
                <div className="text-[9px] text-slate-500">73 anos · Nível 1</div>
              </div>
            </div>
            <div className="space-y-1 text-[9px] text-slate-600">
              <div className="flex items-center justify-between border-t border-slate-100 pt-1"><span>Hipótese</span><span className="font-semibold text-slate-800">Lombalgia crônica</span></div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1"><span>Início</span><span className="font-semibold text-slate-800">12/03/2026</span></div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1"><span>Profissional</span><span className="font-semibold text-slate-800">Dra. Marina · Ouro</span></div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1"><span>CREFITO</span><span className="font-semibold text-slate-800">277681-F</span></div>
            </div>
            <div className="mt-2 rounded-md bg-slate-50 p-2">
              <div className="text-[9px] font-semibold text-slate-500">Escala dor (EVA)</div>
              <div className="mt-1 flex items-end gap-1">
                {[8, 8, 7, 6, 6, 5, 4, 4].map((v, i) => (
                  <div key={i} className="flex-1">
                    <div className="rounded-t" style={{ height: `${v * 4}px`, background: i === 7 ? TEAL : `${TEAL}55` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-8 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-slate-900">Linha do tempo · evoluções</div>
              <div className="flex items-center gap-1">
                <Pill tone="warn">Alerta 24h</Pill>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
                  <Plus className="h-3 w-3" /> Nova evolução
                </button>
              </div>
            </div>
            <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[9px] text-amber-900">
              Sessão realizada sem registro em 24h gera alerta · prazo contratual de evolução: <b>7 dias úteis</b> (Termos LRS-PROF).
            </div>
            <div className="space-y-2">
              {[
                { d: "25/05/2026 · Sessão 03", t: "BEG. Algia (8→6/10) em MID. Dry needling em pontos gatilho + liberação miofascial paraespinhais. Finalizo sem intercorrências.", sig: true },
                { d: "22/05/2026 · Sessão 02", t: "Cinesioterapia ativa-assistida MMII. Treino de equilíbrio. Paciente refere melhora subjetiva.", sig: true },
                { d: "19/05/2026 · Sessão 01", t: "Avaliação inicial. EVA 8/10. Limitação flexão tronco. Plano: 8 sessões 2x/sem.", sig: true },
              ].map((e, i) => (
                <div key={i} className="rounded-md border border-slate-200 p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-semibold text-slate-800">{e.d}</div>
                    {e.sig && <Pill tone="success">Assinado · Gov.br</Pill>}
                  </div>
                  <div className="mt-1 text-[10px] leading-relaxed text-slate-600">{e.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc5ProntuarioMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[10px] font-bold">SR</div>
        <div>
          <div className="text-[12px] font-bold">Severina Rosa</div>
          <div className="text-[9px] text-teal-100/80">Ciclo 02 · Sessão 03</div>
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      {[
        { d: "25/05 · Sessão 03", t: "EVA 8→6. Dry needling MID + liberação miofascial." },
        { d: "22/05 · Sessão 02", t: "Cinesioterapia MMII. Melhora subjetiva." },
        { d: "19/05 · Sessão 01", t: "Avaliação inicial. EVA 8/10." },
      ].map((e, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="text-[10px] font-semibold text-slate-800">{e.d}</div>
          <div className="mt-1 text-[9px] text-slate-600">{e.t}</div>
          <Pill tone="success">Assinado Gov.br</Pill>
        </div>
      ))}
      <button className="w-full rounded-lg py-2 text-[10px] font-semibold text-white" style={{ background: TEAL }}>
        + Registrar evolução
      </button>
    </div>
  </MobileFrame>
);

/* =================== sc6 — Cobrança antecipada e repasse pós-ciclo =================== */

const Sc6Financeiro: PreviewComponent = () => (
  <Frame>
    <TopBar title="Cobrança antecipada · Asaas" sub="Repasse ao profissional após encerrar o ciclo · Mai/2026" action={<Pill tone="success">Conciliado</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Financeiro" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="grid grid-cols-4 gap-2">
          <KPI label="Recebido (mês)" value="R$ 7.950" delta="+12% vs abr" icon={Wallet} />
          <KPI label="A repassar" value="R$ 2.180" delta="3 ciclos fechados" icon={CreditCard} />
          <KPI label="Margem Larsana" value="R$ 2.035" delta="25,6% líquida" icon={TrendingUp} />
          <KPI label="A vencer 7d" value="R$ 3.310" delta="6 ciclos" icon={Clock} positive={false} />
        </div>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-900">Ciclos · recebido e repasse pós-encerramento</div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500"><Search className="h-3 w-3" /> filtrar</div>
          </div>
          <div className="overflow-hidden rounded-md border border-slate-100">
            <div className="grid grid-cols-12 bg-slate-50 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-3">Paciente</div>
              <div className="col-span-1">Ciclo</div>
              <div className="col-span-2">Profissional</div>
              <div className="col-span-2">Valor</div>
              <div className="col-span-2">Repasse</div>
              <div className="col-span-2">Status</div>
            </div>
            {[
              { p: "Jessica Alves", c: "24", prof: "Aline D. · 70%", v: "R$ 1.200", r: "R$ 840", s: "Repassado", tone: "success" as const },
              { p: "Manoel Francisco", c: "02", prof: "Aline D. · 70%", v: "R$ 910", r: "R$ 637", s: "Em ciclo", tone: "info" as const },
              { p: "Edith Battistioli", c: "01", prof: "Fernanda P. · 75%", v: "R$ 1.200", r: "R$ 900", s: "Aguard. NF", tone: "warn" as const },
              { p: "Severina Rosa", c: "02", prof: "Marina B. · 80%", v: "R$ 800", r: "R$ 640", s: "Repassado", tone: "success" as const },
              { p: "Vilson Bozzato", c: "05", prof: "Nathaly C. · 70%", v: "R$ 1.040", r: "—", s: "Cobrar PIX", tone: "danger" as const },
            ].map((row) => (
              <div key={row.p} className="grid grid-cols-12 items-center border-t border-slate-100 px-2 py-1.5 text-[10px]">
                <div className="col-span-3 font-semibold text-slate-800">{row.p}</div>
                <div className="col-span-1 text-slate-600">#{row.c}</div>
                <div className="col-span-2 text-slate-600">{row.prof}</div>
                <div className="col-span-2 font-semibold text-slate-900">{row.v}</div>
                <div className="col-span-2 font-semibold" style={{ color: TEAL }}>{row.r}</div>
                <div className="col-span-2"><Pill tone={row.tone}>{row.s}</Pill></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
          <div>
            <div className="text-[10px] font-semibold text-teal-900">Exportação contabilidade DELUMA · Mai/2026</div>
            <div className="text-[9px] text-teal-700">XLSX · 18 ciclos · NF profissional + recibo paciente vinculados</div>
          </div>
          <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
            <Download className="h-3 w-3" /> Baixar pacote
          </button>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc6FinanceiroMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
      <StatusBar />
      <div className="mt-3 text-[9px] uppercase tracking-wider text-teal-100/80">Financeiro · Mai</div>
      <div className="text-[18px] font-bold">R$ 7.950</div>
      <div className="text-[10px] text-teal-100/80">recebido · margem R$ 2.035</div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-1.5" style={{ background: BG }}>
      {[
        { p: "Jessica Alves · #24", v: "R$ 1.200", tone: "success" as const, s: "Pago" },
        { p: "Manoel F. · #02", v: "R$ 910", tone: "info" as const, s: "Agendado" },
        { p: "Edith B. · #01", v: "R$ 1.200", tone: "warn" as const, s: "Pendente" },
        { p: "Vilson B. · #05", v: "R$ 1.040", tone: "danger" as const, s: "Vencendo" },
      ].map((r) => (
        <div key={r.p} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
          <div>
            <div className="text-[10px] font-bold text-slate-800">{r.p}</div>
            <div className="text-[9px] text-slate-500">{r.v} · repasse pós-ciclo</div>
          </div>
          <Pill tone={r.tone}>{r.s}</Pill>
        </div>
      ))}
    </div>
  </MobileFrame>
);

/* =================== sc7 — Credenciamento profissional =================== */

const Sc7Profissional: PreviewComponent = () => (
  <Frame>
    <TopBar
      title="Credenciamento · Profissional parceiro"
      sub="LRS-PROF.FISIO-2026-0002 · Aline Giseli Donoso"
      action={<Pill tone="warn">Aguardando assinatura</Pill>}
    />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Profissionais" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3 rounded-lg border border-slate-200 bg-white p-3 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: `linear-gradient(135deg, ${TEAL}, ${MINT})` }}>
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div className="mt-2 text-[11px] font-bold text-slate-900">Aline G. Donoso</div>
            <div className="text-[9px] text-slate-500">CREFITO 269110-F</div>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <Pill tone="brand">Bronze · 70%</Pill>
            </div>
            <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-2 text-left text-[8px] text-slate-600">
              Repasse sobre o <b>valor do ciclo</b> pago pelo paciente (tabela V1-2026), não sobre tabela de repasse isolada.
            </div>
          </div>
          <div className="col-span-4 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fluxo de assinatura PP</div>
            <div className="space-y-1">
              {PP_SIGN_FLOW.map((s) => (
                <div
                  key={s.step}
                  className={`flex gap-2 rounded-md border px-2 py-1.5 ${s.active ? "border-teal-300 bg-teal-50" : "border-slate-100"}`}
                >
                  <div
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[8px] font-bold ${s.done ? "text-white" : s.active ? "border border-teal-400 text-teal-700" : "border border-slate-200 text-slate-400"}`}
                    style={s.done ? { background: TEAL } : undefined}
                  >
                    {s.done ? "✓" : s.step}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-800">{s.label}</div>
                    <div className="text-[8px] text-slate-500">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2 w-full rounded-md py-1.5 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
              Reenviar contrato para aceite digital
            </button>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              <button className="flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 py-1.5 text-[8px] font-semibold text-emerald-800">
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </button>
              <button className="flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 py-1.5 text-[8px] font-semibold text-slate-700">
                <Mail className="h-3 w-3" /> E-mail
              </button>
            </div>
            <div className="mt-1 text-[7px] text-slate-500 leading-snug">
              Link pré-preenchido (ANEXO I) · entregue em 27/05 14:32 · leitura confirmada
            </div>
          </div>
          <div className="col-span-5 flex flex-col rounded-lg border border-slate-200 bg-white p-3 min-h-0">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-900">
                <FileSignature className="h-3 w-3" /> Preview · Contrato LRS-PROF
              </div>
              <Pill tone="neutral">PDF · modelo assinado</Pill>
            </div>
            <pre className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-100 bg-slate-50 p-2 font-sans text-[7.5px] leading-relaxed text-slate-700 max-h-[220px]">
              {LRS_PROF_CONTRACT_PREVIEW}
            </pre>
            <div className="mt-1.5 flex gap-1">
              <button className="flex-1 rounded-md border border-slate-200 py-1 text-[8px] font-semibold text-slate-700">Baixar PDF</button>
              <button className="flex-1 rounded-md py-1 text-[8px] font-semibold text-white" style={{ background: TEAL }}>
                Registrar aceite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc7ProfissionalMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white text-center" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
      <StatusBar />
      <div className="mx-auto mt-3 grid h-14 w-14 place-items-center rounded-full bg-white/15">
        <Stethoscope className="h-6 w-6" />
      </div>
      <div className="mt-2 text-[12px] font-bold">Aline Donoso</div>
      <div className="text-[9px] text-teal-100/80">LRS-PROF.FISIO-2026-0002</div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-1.5" style={{ background: BG }}>
      {[
        "Antecedentes criminais",
        "Carteirinha CREFITO ativa",
        "Contrato LRS-PROF · assinatura pendente",
        "Termos · aceite digital OK",
        "Wallet após aprovação",
      ].map((d) => (
        <div key={d} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
          <span className="text-[10px] text-slate-700">{d}</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      ))}
    </div>
  </MobileFrame>
);

/* =================== sc8 — Repasses Bronze/Prata/Ouro =================== */

const tiers = [
  { tier: "Bronze", pct: 70, sub: "Entrada padrão", ex: "Marcela · Aline · Nathaly", color: "#B45309" },
  { tier: "Prata", pct: 75, sub: "+6 meses de casa", ex: "Evolução automática", color: "#64748B" },
  { tier: "Ouro", pct: 80, sub: "PJ / especialista", ex: "Marina Batista · Dra. Lou", color: "#B7791F" },
];

const Sc8Repasses: PreviewComponent = () => (
  <Frame>
    <TopBar title="Precificação e repasse" sub="Painel admin · valores paciente + comissionamento PP" />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Profissionais" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="mb-2 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[9px] text-teal-900">
          Visão <b>gestão</b> — no app do profissional (sc13) só aparece repasse PP, sem valor integral do paciente.
        </div>
        <div className="mb-2 rounded-lg border border-slate-200 bg-white p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[10px] font-semibold text-slate-800">Valores integrais por sessão · V1-2026 (cobrados do paciente)</div>
            <Pill tone="neutral">3 regiões × 3 níveis</Pill>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PRICING_V1_2026.map((t) => (
              <div key={t.id} className="rounded-md border border-slate-100 p-1.5 text-[8px]">
                <div className="font-bold text-teal-800">{t.label}</div>
                <div className="text-slate-500 leading-tight">{t.cities}</div>
                <div className="mt-1 grid grid-cols-3 gap-0.5 text-center font-semibold text-slate-800">
                  <span>R${t.n1}</span><span>R${t.n2}</span><span>R${t.n3}</span>
                </div>
                <div className="grid grid-cols-3 gap-0.5 text-center text-[7px] text-slate-400">
                  <span>N1</span><span>N2</span><span>N3</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tiers.map((t) => (
            <div key={t.tier} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold" style={{ color: t.color }}>{t.tier}</div>
                <Pill tone="neutral">{t.sub}</Pill>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <div className="text-[32px] font-bold leading-none text-slate-900">{t.pct}<span className="text-[14px] text-slate-500">%</span></div>
                <div className="ml-1 pb-1 text-[9px] text-slate-500">repasse<br />profissional</div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
              </div>
              <div className="mt-2 text-[9px] text-slate-500">Profissionais: <span className="font-semibold text-slate-700">{t.ex}</span></div>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-[11px] font-semibold text-slate-900">Simulador · Região B N1 · 8 sessões = R$ 1.040</div>
            {tiers.map((t) => (
              <div key={t.tier} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0 text-[10px]">
                <span className="text-slate-700">{t.tier}</span>
                <span className="font-semibold text-slate-800">R$ {Math.round(1040 * t.pct / 100)}</span>
                <span className="text-slate-500">Larsana R$ {Math.round(1040 * (100 - t.pct) / 100)}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-800">
              <Lock className="h-3.5 w-3.5" /> Taxa de agenciamento
            </div>
            <div className="mt-1 text-[10px] text-rose-700 leading-relaxed">
              1º mês de paciente novo captado pela plataforma: retenção Larsana de <b>40%</b>. A partir do 2º mês,
              repasse normal pela tabela Bronze/Prata/Ouro sobre o valor do ciclo. A tabela de repasse ao PP é distinta
              dos valores integrais cobrados do paciente (V1-2026).
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-700 px-2 py-1 text-[9px] font-semibold text-white">
              Repasse liberado ao encerrar o ciclo (sem split no pagamento)
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc8RepassesMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 text-[12px] font-bold">Comissionamento</div>
      <div className="text-[9px] text-teal-100/80">Bronze · Prata · Ouro</div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      {tiers.map((t) => (
        <div key={t.tier} className="rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold" style={{ color: t.color }}>{t.tier}</div>
            <div className="text-[15px] font-bold text-slate-900">{t.pct}%</div>
          </div>
          <div className="text-[9px] text-slate-500">{t.sub}</div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[9px] text-rose-700">
        1º mês de paciente novo: Larsana retém 40% (taxa agenciamento).
      </div>
    </div>
  </MobileFrame>
);

/* =================== sc9 — App profissional · agenda =================== */

const Sc9Agenda: PreviewComponent = () => (
  <Frame>
    <TopBar title="Minha agenda" sub="App profissional · 22 mai · 3 visitas" action={<Pill tone="brand">Em rota</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Ciclos" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-900">Roteiro do dia</div>
              <Pill tone="info">22 km · 4h estimadas</Pill>
            </div>
            <div className="space-y-1.5">
              {[
                { t: "09:20", p: "Jessica Alves", loc: "Jd Primavera, Mauá · 1,2 km", ciclo: "Ciclo 25 · S5/8", tone: "brand" as const, status: "Próximo" },
                { t: "10:20", p: "Maria dos Anjos", loc: "Jd Primavera, Mauá · +800m", ciclo: "PAUSA · revisar plano", tone: "warn" as const, status: "Alerta" },
                { t: "14:00", p: "Vilson Bozzato", loc: "B. Matriz, Mauá · 4,1 km", ciclo: "Ciclo 05 · S3/8", tone: "brand" as const, status: "Programado" },
                { t: "15:30", p: "Edith Battistioli", loc: "Centro, SBC · 8,2 km", ciclo: "Ciclo 01 · S1/8", tone: "info" as const, status: "Avaliação" },
              ].map((a) => (
                <div key={a.p} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
                  <div className="w-12 text-center">
                    <div className="text-[11px] font-bold text-slate-900">{a.t}</div>
                    <div className="text-[8px] text-slate-500">60 min</div>
                  </div>
                  <div className="flex-1 border-l border-slate-100 pl-2">
                    <div className="text-[10px] font-bold text-slate-900">{a.p}</div>
                    <div className="flex items-center gap-1 text-[8px] text-slate-500">
                      <MapPin className="h-2.5 w-2.5" /> {a.loc}
                    </div>
                    <div className="text-[9px]" style={{ color: TEAL }}>{a.ciclo}</div>
                  </div>
                  <Pill tone={a.tone}>{a.status}</Pill>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-4 space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Próximo atendimento</div>
              <div className="mt-1 text-[14px] font-bold text-slate-900">Jessica Alves</div>
              <div className="text-[10px] text-slate-500">09:20 · Ciclo 25 · sessão 5/8</div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <button className="rounded-md py-1.5 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
                  Check-in
                </button>
                <button className="rounded-md border border-slate-200 py-1.5 text-[9px] font-semibold text-slate-700">
                  Rota
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-teal-800">Avaliação · Edith B.</div>
              <div className="mt-1 text-[10px] font-bold text-teal-900">Em análise pela família</div>
              <div className="text-[9px] text-teal-700">Proposta enviada · 2 de 5 dias · aguardando resposta</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[9px] text-amber-800">
              ⏱ Carga semanal: <b>28h / 30h</b> — restam apenas 2h disponíveis nesta semana.
            </div>
            <div className="rounded-lg border p-2.5" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})`, borderColor: TEAL_DEEP }}>
              <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Repasse estimado (semana)</div>
              <div className="text-[13px] font-bold text-white">R$ 1.890</div>
              <div className="text-[9px] text-teal-50/90">Só valores PP · sem preço do paciente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc9AgendaMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
      <StatusBar />
      <div className="mt-3">
        <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Quinta · 22 mai</div>
        <div className="text-[14px] font-bold">3 atendimentos · Mauá</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-md bg-white/10 p-1.5">
            <div className="text-[11px] font-bold">3</div>
            <div className="text-[8px] text-teal-100/80">Visitas</div>
          </div>
          <div className="rounded-md bg-white/10 p-1.5">
            <div className="text-[11px] font-bold">22 km</div>
            <div className="text-[8px] text-teal-100/80">Rota</div>
          </div>
          <div className="rounded-md bg-white/10 p-1.5">
            <div className="text-[11px] font-bold">R$ 410</div>
            <div className="text-[8px] text-teal-100/80">Estimado</div>
          </div>
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      {[
        { t: "09:20", p: "Jessica Alves", loc: "Jd Primavera · 1,2 km", c: "Ciclo 25 · S5" },
        { t: "10:20", p: "Maria dos Anjos", loc: "Jd Primavera · 800 m", c: "PAUSA · revisar" },
        { t: "14:00", p: "Vilson Bozzato", loc: "B. Matriz · 4,1 km", c: "Ciclo 05 · S3" },
      ].map((a) => (
        <div key={a.p} className="rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-900">{a.t} · {a.p}</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
          </div>
          <div className="flex items-center gap-1 text-[8px] text-slate-500">
            <MapPin className="h-2.5 w-2.5" /> {a.loc}
          </div>
          <div className="mt-0.5 text-[9px] font-semibold" style={{ color: TEAL }}>{a.c}</div>
        </div>
      ))}
      <button className="w-full rounded-lg py-2 text-[10px] font-semibold text-white" style={{ background: TEAL }}>
        Check-in no domicílio
      </button>
    </div>
  </MobileFrame>
);

/* =================== sc10 — Relatórios & conformidade =================== */

const Sc10Relatorios: PreviewComponent = () => (
  <Frame>
    <TopBar title="Relatórios & conformidade" sub="CREFITO · LGPD · Auditoria" action={<Pill tone="brand">PDF/XLSX</Pill>} />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Relatórios" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="mb-2 grid grid-cols-4 gap-2">
          <KPI label="Prontuários assinados" value="184" delta="100% Gov.br" icon={FileSignature} />
          <KPI label="Comparecimentos" value="312" delta="98% confirmados" icon={UserCheck} />
          <KPI label="Acessos LGPD" value="48" delta="trilha completa" icon={Shield} />
          <KPI label="Profissionais ≤ 30h" value="11/11" delta="dentro do limite" icon={Clock} />
        </div>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-7 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-[11px] font-semibold text-slate-900">Catálogo de relatórios</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { t: "Pacote contabilidade DELUMA", i: Download, d: "XLSX/CSV · NF + recibo por ciclo · margem" },
                { t: "Prontuários por período", i: FileText, d: "PDF · CREFITO · evoluções por sessão" },
                { t: "Comparecimento assinado", i: UserCheck, d: "XLSX · responsável + check-in GPS" },
                { t: "Horas semanais por profissional", i: Clock, d: "XLSX · controle 30h/semana" },
                { t: "Faturamento & repasses", i: Wallet, d: "PDF + XLSX · recebido vs repasse pós-ciclo" },
                { t: "Ciclos abertos e renovações", i: ClipboardList, d: "XLSX · projeção próximos 30d" },
                { t: "Auditoria de acessos (LGPD)", i: Shield, d: "PDF · trilha 5 anos por usuário" },
              ].map((r) => (
                <div key={r.t} className="flex items-start gap-2 rounded-md border border-slate-200 p-2 hover:border-teal-300">
                  <div className="grid h-7 w-7 place-items-center rounded-md" style={{ background: `${TEAL}14` }}>
                    <r.i className="h-3.5 w-3.5" style={{ color: TEAL }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-800">{r.t}</div>
                    <div className="text-[8px] text-slate-500">{r.d}</div>
                  </div>
                  <Download className="h-3 w-3 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-900">Trilha de acesso · últimos 7d</div>
                <Pill tone="brand">LGPD</Pill>
              </div>
              {[
                { u: "Roger M.", a: "Exportou faturamento mai", t: "há 2h" },
                { u: "Marina B.", a: "Visualizou prontuário Severina", t: "há 5h" },
                { u: "Aline D.", a: "Registrou evolução Jessica", t: "ontem" },
                { u: "Sistema", a: "Gerou relatório CREFITO mensal", t: "01 mai" },
              ].map((l, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0 text-[9px]">
                  <div>
                    <span className="font-semibold text-slate-700">{l.u}</span> <span className="text-slate-500">{l.a}</span>
                  </div>
                  <span className="text-slate-400">{l.t}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
              <Shield className="h-4 w-4 text-teal-100" />
              <div className="mt-1 text-[11px] font-bold">Conformidade Larsana</div>
              <div className="text-[9px] text-teal-100/90">Aceite digital de termos (sem Gov.br) · retenção 5 anos · histórico de versões aceitas.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc10RelatoriosMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 text-[12px] font-bold">Relatórios</div>
      <div className="text-[9px] text-teal-100/80">CREFITO · LGPD · auditoria</div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-1.5" style={{ background: BG }}>
      {[
        { t: "Pacote contabilidade DELUMA", i: Download },
        { t: "Prontuários por período", i: FileText },
        { t: "Comparecimento assinado", i: UserCheck },
        { t: "Horas semanais", i: Clock },
        { t: "Faturamento & repasses", i: Wallet },
        { t: "Trilha LGPD", i: Shield },
      ].map((r) => (
        <div key={r.t} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-md" style={{ background: `${TEAL}14` }}>
            <r.i className="h-3.5 w-3.5" style={{ color: TEAL }} />
          </div>
          <div className="flex-1 text-[10px] font-semibold text-slate-800">{r.t}</div>
          <Download className="h-3 w-3 text-slate-400" />
        </div>
      ))}
    </div>
  </MobileFrame>
);

/* =================== sc11 — App paciente / responsável =================== */

const PatientBottomNav = ({ active }: { active: "home" | "cycle" | "pay" | "profile" }) => {
  const items = [
    { k: "home" as const, label: "Início", icon: Home },
    { k: "cycle" as const, label: "Ciclo", icon: Calendar },
    { k: "pay" as const, label: "Pagar", icon: CreditCard },
    { k: "profile" as const, label: "Perfil", icon: Users },
  ];
  return (
    <div className="flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2">
      {items.map(({ k, label, icon: Icon }) => {
        const on = k === active;
        return (
          <div key={k} className="flex flex-col items-center gap-0.5">
            <Icon className="h-4 w-4" style={{ color: on ? TEAL : "#94A3B8" }} />
            <span className={`text-[8px] font-semibold ${on ? "text-teal-700" : "text-slate-400"}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

const Sc11AppPaciente: PreviewComponent = () => (
  <Frame>
    <TopBar
      title="App do Paciente · Larsana Care"
      sub="Acompanhamento domiciliar · pagamento de ciclo · NPS"
      action={<Pill tone="success">iOS + Android</Pill>}
    />
    <div className="flex flex-1 overflow-hidden" style={{ background: BG }}>
      <div className="flex w-[340px] shrink-0 flex-col border-r border-slate-200 bg-white p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preview mobile</div>
        <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border-[6px] border-slate-900 shadow-xl">
          <Sc11AppPacienteMobile />
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-3">
        <div className="mb-2 grid grid-cols-4 gap-2">
          <KPI label="Responsáveis ativos" value="14" delta="9 com ciclo aberto" icon={Users} />
          <KPI label="Pagamentos no app" value="87%" delta="+32% vs WhatsApp" icon={CreditCard} />
          <KPI label="Inadimplência" value="6%" delta="−4 pp no mês" icon={TrendingUp} positive />
          <KPI label="NPS médio" value="9,2" delta="pós-ciclo automático" icon={Star} />
        </div>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-7 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-900">Jornada do responsável · Manoel Francisco</div>
              <Pill tone="brand">Elza Aparecida · titular</Pill>
            </div>
            <div className="space-y-2">
              {[
                { step: "1", t: "Termo de adesão · Diretrizes · LGPD", d: "Aceite digital no app (checkbox · v2026.1 · sem Gov.br)", ok: true },
                { step: "2", t: "Plano terapêutico visível", d: "2x/semana · Dra. Aline · Nível 2 · Região A", ok: true },
                { step: "3", t: "Pagamento antecipado Ciclo 2", d: "R$ 1.040 · PIX confirmado · sem cartão", ok: true },
                { step: "4", t: "Acompanhamento sessão a sessão", d: "3/8 realizadas · próxima 28/05 09:20", ok: false },
                { step: "5", t: "NPS ao fechar ciclo", d: "Avaliação mútua paciente ↔ profissional", ok: false },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-2 rounded-md border border-slate-100 p-2">
                  <div
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${s.ok ? "text-white" : "border border-slate-200 text-slate-500"}`}
                    style={s.ok ? { background: TEAL } : undefined}
                  >
                    {s.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.step}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-800">{s.t}</div>
                    <div className="text-[9px] text-slate-500">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 space-y-2">
            <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3">
              <div className="text-[10px] font-semibold text-teal-900">Pagamento do ciclo · Ciclo 2</div>
              <div className="mt-1 text-[22px] font-bold text-slate-900">R$ 1.040,00</div>
              <div className="text-[9px] text-slate-600">8 sessões · Nível 2 · Região A · Mauá</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button className="rounded-md py-2 text-[9px] font-semibold text-white" style={{ background: TEAL }}>
                  PIX instantâneo
                </button>
                <button className="rounded-md border border-slate-200 bg-white py-2 text-[9px] font-semibold text-slate-700">
                  Boleto
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[8px] text-teal-800">
                <ShieldCheck className="h-3 w-3" /> Pagamento antecipado · repasse ao profissional só após o ciclo
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1.5 text-[10px] font-semibold text-slate-900">Próximas sessões domiciliares</div>
              {[
                { d: "28/05 · 09:20", p: "Sessão 4/8 · Itapark, Mauá" },
                { d: "30/05 · 09:20", p: "Sessão 5/8 · Itapark, Mauá" },
              ].map((s) => (
                <div key={s.d} className="flex items-center gap-2 border-b border-slate-100 py-1.5 last:border-0 text-[9px]">
                  <Calendar className="h-3 w-3" style={{ color: TEAL }} />
                  <div>
                    <div className="font-semibold text-slate-800">{s.d}</div>
                    <div className="text-slate-500">{s.p}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
              <div className="text-[10px] font-bold">Avalie ao final do ciclo</div>
              <div className="mt-1 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= 4 ? "fill-amber-300 text-amber-300" : "text-white/40"}`} />
                ))}
              </div>
              <div className="mt-1 text-[9px] text-teal-100/90">NPS mútuo: responsável avalia o profissional e vice-versa.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc11AppPacienteMobile: PreviewComponent = () => (
  <MobileFrame className="rounded-none min-h-[520px]">
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
      <StatusBar />
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-teal-100/80">Responsável · Elza</div>
          <div className="text-[14px] font-bold">Manoel Francisco</div>
          <div className="text-[9px] text-teal-100/80">Nível 2 · Região A · Mauá</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-[10px] font-bold">MF</div>
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold text-slate-900">Ciclo 2 · 8 sessões</div>
          <Pill tone="warn">3/8</Pill>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
          <div className="h-full w-[37.5%] rounded-full" style={{ background: TEAL }} />
        </div>
        <div className="mt-1 text-[9px] text-slate-500">Profissional: Dra. Aline Donoso · CREFITO 269110-F</div>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-teal-800">Pagamento antecipado</div>
        <div className="mt-0.5 text-[18px] font-bold text-slate-900">R$ 1.040,00</div>
        <div className="text-[8px] text-slate-600">Obrigatório para manter o tratamento · vence 15/06</div>
        <button className="mt-2 w-full rounded-lg py-2 text-[10px] font-semibold text-white" style={{ background: TEAL }}>
          Pagar com PIX
        </button>
        <button className="mt-1 w-full rounded-lg border border-teal-200 bg-white py-1.5 text-[9px] font-semibold text-teal-800">
          Pagar com boleto
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <div className="text-[10px] font-semibold text-slate-900">Próxima visita domiciliar</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md" style={{ background: `${TEAL}14` }}>
            <Home className="h-4 w-4" style={{ color: TEAL }} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-800">28/05 · 09:20</div>
            <div className="text-[8px] text-slate-500">Itapark, Mauá · sessão 4 de 8</div>
          </div>
        </div>
        <div className="mt-2 flex gap-1">
          <button className="flex-1 rounded-md border border-slate-200 py-1.5 text-[9px] font-semibold text-slate-700">
            <Phone className="mr-1 inline h-3 w-3" /> Larsana
          </button>
          <button className="flex-1 rounded-md py-1.5 text-[9px] font-semibold text-white" style={{ background: TEAL_DARK }}>
            Ver evolução
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5">
        <div className="text-[9px] font-semibold text-violet-900">Reembolso convênio (informativo)</div>
        <div className="mt-0.5 text-[11px] font-bold text-slate-900">Estimativa ~65% · ≈ R$ 676</div>
        <div className="mt-0.5 text-[7px] text-violet-800">Unimed empresarial · não garante reembolso</div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <div className="text-[9px] text-slate-500">Última evolução liberada</div>
        <div className="mt-0.5 text-[10px] leading-snug text-slate-700">
          25/05: exercícios de marcha com andador, algia 6/10 — Dra. Aline
        </div>
      </div>
    </div>
    <PatientBottomNav active="pay" />
  </MobileFrame>
);

/* =================== sc12 — Tabelas V1-2026 =================== */

const PricingMatrix = ({ compact }: { compact?: boolean }) => (
  <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${compact ? "" : "p-3"}`}>
    {!compact && (
      <div className="mb-2 flex items-center justify-between px-3 pt-3">
        <div>
          <div className="text-[11px] font-bold text-slate-900">Tabelas de Valores Integrais 2026</div>
          <div className="text-[9px] text-slate-500">VERSÃO V1-2026 · uso interno Larsana Care</div>
        </div>
        <Pill tone="brand">Precificação paciente</Pill>
      </div>
    )}
    <table className="w-full text-[9px]">
      <thead>
        <tr className="bg-slate-50 text-left text-[8px] uppercase tracking-wider text-slate-500">
          <th className="px-2 py-1.5">Região</th>
          <th className="px-2 py-1.5">Cidades</th>
          <th className="px-2 py-1.5 text-center">Nível 1</th>
          <th className="px-2 py-1.5 text-center">Nível 2</th>
          <th className="px-2 py-1.5 text-center">Nível 3</th>
        </tr>
      </thead>
      <tbody>
        {PRICING_V1_2026.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-2 py-1.5 font-bold text-teal-800">{row.label}</td>
            <td className="px-2 py-1.5 text-slate-600 leading-tight">{row.cities}</td>
            <td className="px-2 py-1.5 text-center font-semibold">R$ {row.n1}</td>
            <td className="px-2 py-1.5 text-center font-semibold">R$ {row.n2}</td>
            <td className="px-2 py-1.5 text-center font-semibold">R$ {row.n3}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {!compact && (
      <div className="mx-3 mb-3 mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-[9px] text-amber-900">
        <b>Repasse ao profissional:</b> percentual Bronze 70% · Prata 75% · Ouro 80% sobre o valor do ciclo pago pelo
        paciente. Tabela de repasse PP (V1-2026) refere-se ao valor repassado, não ao valor integral cobrado.
      </div>
    )}
  </div>
);

const Sc12Tabelas: PreviewComponent = () => (
  <Frame>
    <TopBar
      title="Tabelas de valores e repasse"
      sub="V1-2026 · configuração administrativa"
      action={<Pill tone="success">Vigente</Pill>}
    />
    <div className="flex flex-1 overflow-hidden">
      <SideNav active="Configurações" />
      <div className="flex-1 overflow-hidden p-3" style={{ background: BG }}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8">
            <PricingMatrix />
          </div>
          <div className="col-span-4 space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-semibold text-slate-900">Exemplo · Ciclo 8 sessões</div>
              <div className="mt-2 space-y-1 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Edith · Região B · N1</span>
                  <span className="font-bold">8 × R$ 130</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1">
                  <span className="text-slate-700">Valor integral paciente</span>
                  <span className="font-bold text-slate-900">R$ 1.040</span>
                </div>
                <div className="flex justify-between text-teal-800">
                  <span>Repasse Bronze (70%)</span>
                  <span className="font-bold">R$ 728</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Margem Larsana</span>
                  <span>R$ 312</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-[9px] text-slate-600">
              <div className="font-semibold text-slate-800">Cidades mapeadas</div>
              <div className="mt-1 leading-relaxed">
                Mauá · Ribeirão Pires · RGS · Diadema · Santo André · SBC · São Caetano · SP Capital
              </div>
            </div>
            <div className="rounded-lg p-3 text-white text-[9px]" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
              Nova versão da tabela exige publicação no painel; ciclos futuros usam a versão vigente na data de cobrança.
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc12TabelasMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 text-[12px] font-bold">Tabelas V1-2026</div>
      <div className="text-[9px] text-teal-100/80">Valores integrais · 3 regiões</div>
    </div>
    <div className="flex-1 overflow-hidden p-2" style={{ background: BG }}>
      <PricingMatrix compact />
      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[9px] text-amber-900">
        Repasse PP: Bronze 70% · Prata 75% · Ouro 80% sobre o ciclo pago.
      </div>
    </div>
  </MobileFrame>
);

/* =================== sc13 — App PP · só repasse =================== */

const Sc13AppPpRepasse: PreviewComponent = () => (
  <Frame>
    <TopBar title="App profissional · Meus ganhos" sub="Tabela de repasse PP — valores do paciente ocultos" />
    <div className="flex flex-1 items-center justify-center p-4" style={{ background: BG }}>
      <div className="w-[300px] overflow-hidden rounded-[1.75rem] border-[6px] border-slate-900 shadow-xl">
        <Sc13AppPpRepasseMobile />
      </div>
      <div className="ml-6 max-w-sm space-y-2">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-[10px] text-teal-900">
          Política Larsana: o PP vê apenas <b>repasse por sessão</b> (ex. R$ 80 / 90 / 100 conforme nível e tabela PP vigente).
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-[9px] text-slate-600">
          Bronze 70% · Prata 75% · Ouro 80% aplicam-se sobre o <b>valor do ciclo</b> na visão admin (sc8/sc12), não nesta tela.
        </div>
      </div>
    </div>
  </Frame>
);

const Sc13AppPpRepasseMobile: PreviewComponent = () => (
  <MobileFrame className="rounded-none min-h-[480px]">
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
      <StatusBar />
      <div className="mt-3 text-[12px] font-bold">Meus ganhos</div>
      <div className="text-[9px] text-teal-100/80">Repasse por sessão · tabela PP</div>
    </div>
    <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: BG }}>
      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Seu nível de repasse</div>
        <div className="mt-1 flex gap-1">
          {REPASSE_PP_POR_NIVEL.map((n) => (
            <div
              key={n.level}
              className={`flex-1 rounded-md p-1.5 text-center ${n.level === 2 ? "text-white shadow-sm" : "border border-slate-200 text-slate-700"}`}
              style={n.level === 2 ? { background: TEAL } : undefined}
            >
              <div className="text-[9px] font-bold">{n.label}</div>
              <div className={`text-[11px] font-bold ${n.level === 2 ? "" : "text-slate-900"}`}>R$ {n.repasse}</div>
              <div className={`text-[7px] ${n.level === 2 ? "text-teal-50" : "text-slate-400"}`}>/sessão</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-teal-900">Próximo repasse (ciclo)</span>
          <Pill tone="brand">Bronze 70%</Pill>
        </div>
        <div className="mt-1 text-[20px] font-bold text-slate-900">R$ 728,00</div>
        <div className="text-[8px] text-teal-800">8 sessões × R$ 90 (Nível 2) · liberado ao encerrar ciclo</div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[8px] text-amber-900">
        <Lock className="mr-1 inline h-3 w-3" />
        Valor cobrado do paciente e margem Larsana não são exibidos neste app.
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <div className="text-[9px] font-semibold text-slate-800">Esta semana</div>
        <div className="mt-1 text-[14px] font-bold text-slate-900">R$ 410,00</div>
        <div className="text-[8px] text-slate-500">3 visitas confirmadas · repasse PP</div>
      </div>
    </div>
  </MobileFrame>
);

/* =================== sc14 — Cartão visita + fluxos Marina =================== */

const Sc14CartaoFluxos: PreviewComponent = () => (
  <Frame>
    <TopBar title="Experiência família · Marina" sub="Cartão visita · desistência · convênio informativo" />
    <div className="flex flex-1 overflow-hidden p-3 gap-2" style={{ background: BG }}>
      <div className="w-[280px] shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Cartão de visita digital</div>
        <div className="mt-2 overflow-hidden rounded-xl text-white" style={{ background: `linear-gradient(145deg, ${TEAL_DEEP}, ${TEAL})` }}>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-[11px] font-bold">AD</div>
              <div>
                <div className="text-[11px] font-bold">Aline G. Donoso</div>
                <div className="text-[8px] text-teal-100/90">Fisioterapeuta · CREFITO 269110-F</div>
              </div>
            </div>
            <div className="mt-3 rounded-md bg-white/10 p-2 text-[8px] leading-relaxed text-teal-50">
              Visita domiciliar Larsana Care · paciente Manoel F. · 28/05 09:20
            </div>
            <div className="mt-2 flex gap-1">
              <button className="flex-1 rounded-md bg-white/15 py-1 text-[8px] font-semibold">Compartilhar</button>
              <button className="flex-1 rounded-md bg-white py-1 text-[8px] font-semibold text-teal-900">Ligar Larsana</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] font-semibold text-slate-900">Desistência pós-SIM</div>
          <div className="mt-2 space-y-1 text-[9px]">
            {[
              ["Família confirma plano", "SIM · 27/05"],
              ["Desiste antes do 1º ciclo", "Motivo: mudança de cidade"],
              ["Cobrança automática", "R$ 100,00 (1 sessão)"],
              ["Repasse PP Bronze", "R$ 70,00 (70%)"],
              ["Larsana", "R$ 30,00"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span className="text-slate-500">{l}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[8px] text-slate-500">Distinto de NÃO na avaliação → taxa R$ 50</div>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
          <div className="text-[10px] font-semibold text-violet-900">Reembolso convênio (informativo)</div>
          <div className="mt-1 text-[9px] text-violet-800">Unimed · plano empresarial · fisioterapia domiciliar</div>
          <div className="mt-2 text-[22px] font-bold text-slate-900">~65%</div>
          <div className="text-[8px] text-violet-700">Estimativa sobre R$ 1.040 do ciclo ≈ R$ 676 — sem garantia</div>
          <div className="mt-2 rounded border border-violet-200 bg-white/60 p-1.5 text-[7px] text-violet-900">
            Apenas orientativo. Larsana não garante reembolso. Consulte seu plano.
          </div>
        </div>
        <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] font-semibold text-slate-900">SUB · substituição (resumo)</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {["Aviso 24h", "PP reserva notificado", "Família aceita no app", "PPSUB registrado", "Repasse avulso"].map((t) => (
              <Pill key={t} tone="neutral">{t}</Pill>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

const Sc14CartaoFluxosMobile: PreviewComponent = () => (
  <MobileFrame>
    <div className="px-4 pb-3 pt-2 text-white" style={{ background: TEAL_DEEP }}>
      <StatusBar />
      <div className="mt-3 text-[12px] font-bold">Cartão do profissional</div>
    </div>
    <div className="flex-1 p-3 space-y-2" style={{ background: BG }}>
      <div className="rounded-xl p-3 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-[10px] font-bold">AD</div>
          <div>
            <div className="text-[11px] font-bold">Aline Donoso</div>
            <div className="text-[8px] text-teal-100/80">CREFITO 269110-F</div>
          </div>
        </div>
        <div className="mt-2 text-[9px] text-teal-50">Visita 28/05 · 09:20 · Mauá</div>
      </div>
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5 text-[9px] text-violet-900">
        <div className="font-semibold">Reembolso convênio (~65%)</div>
        <div className="mt-0.5 text-[8px]">Estimativa informativa · não vinculante</div>
      </div>
    </div>
  </MobileFrame>
);

/* =================== Registry =================== */

const desktopPreviewMap: Record<string, PreviewComponent> = {
  sc1: Sc1Dashboard,
  sc2: Sc2Mapa,
  sc3: Sc3Paciente,
  sc4: Sc4Ciclo,
  sc5: Sc5Prontuario,
  sc6: Sc6Financeiro,
  sc7: Sc7Profissional,
  sc8: Sc8Repasses,
  sc9: Sc9Agenda,
  sc10: Sc10Relatorios,
  sc11: Sc11AppPaciente,
  sc12: Sc12Tabelas,
  sc13: Sc13AppPpRepasse,
  sc14: Sc14CartaoFluxos,
};

const mobilePreviewMap: Record<string, PreviewComponent> = {
  sc1: Sc1DashboardMobile,
  sc2: Sc2MapaMobile,
  sc3: Sc3PacienteMobile,
  sc4: Sc4CicloMobile,
  sc5: Sc5ProntuarioMobile,
  sc6: Sc6FinanceiroMobile,
  sc7: Sc7ProfissionalMobile,
  sc8: Sc8RepassesMobile,
  sc9: Sc9AgendaMobile,
  sc10: Sc10RelatoriosMobile,
  sc11: Sc11AppPacienteMobile,
  sc12: Sc12TabelasMobile,
  sc13: Sc13AppPpRepasseMobile,
  sc14: Sc14CartaoFluxosMobile,
};

export const getLarsanaDesktopPreview = (id?: string) => (id ? desktopPreviewMap[id] : undefined);
export const getLarsanaMobilePreview = (id?: string) => (id ? mobilePreviewMap[id] : undefined);

export const larsanaBrand = {
  primary: TEAL,
  dark: TEAL_DARK,
  accent: MINT,
};

export const LARSANA_PREVIEW_INDEX = [
  { id: "sc1", title: "Dashboard operacional Larsana", description: "KPIs, fila de avaliações, repasses pós-ciclo e alertas — substitui planilhas centrais." },
  { id: "sc2", title: "Mapa de demandas domiciliares", description: "Demandas por proximidade, nível e aceite do fisioterapeuta parceiro." },
  { id: "sc3", title: "Workflow de avaliação inicial", description: "Rastreio Correios, proposta com tabela V1-2026 (Região × Nível) e termos após SIM da família." },
  { id: "sc4", title: "Gestão de ciclos de atendimento", description: "Pagamento antecipado PIX/boleto; repasse ao profissional só após encerrar o ciclo." },
  { id: "sc5", title: "Prontuário e evolução clínica", description: "Alerta em 24h se sessão sem registro; prazo contratual de 7 dias úteis." },
  { id: "sc6", title: "Cobrança antecipada e repasse pós-ciclo", description: "PIX/boleto, repasse pós-ciclo e exportação DELUMA com NF e recibo vinculados." },
  { id: "sc7", title: "Credenciamento e contrato LRS-PROF", description: "Fluxo de assinatura do PP + preview LRS-PROF.FISIO-2026-0002 (Aline Donoso)." },
  { id: "sc8", title: "Precificação V1-2026 e repasses", description: "Tabelas Região A/B/C (valores paciente) + Bronze/Prata/Ouro 70/75/80% sobre o ciclo." },
  { id: "sc12", title: "Tabelas de valores V1-2026", description: "Matriz oficial Região × Nível e simulador ciclo vs repasse profissional." },
  { id: "sc9", title: "App profissional · agenda", description: "Agenda, status da avaliação para a família e aviso de repasse liberado." },
  { id: "sc10", title: "Relatórios e conformidade", description: "Pacote contabilidade DELUMA (NF + recibos), faturamento, Crefito e trilha LGPD." },
  { id: "sc11", title: "App do paciente — pagamento antecipado", description: "Aceite digital de termos (sem Gov.br), pagamento PIX/boleto e acompanhamento." },
  { id: "sc13", title: "App PP · só repasse", description: "Ganhos por nível (R$ 80/90/100) — sem valor integral do paciente." },
  { id: "sc14", title: "Cartão visita e fluxos Marina", description: "Cartão digital, desistência pós-SIM (R$ 100) e estimativa convênio." },
];