// Version: 1.5.0-RC1 (undefined.map fix deployed)
import { useState, useEffect, useCallback, useMemo } from "react";
import { authAPI, vehiclesAPI, searchAPI, healthAPI, APIError, inventoryAPI, crmAPI, expensesAPI, sourcingAPI, ipvaAPI, financialAPI, savedSearchesAPI } from "./api.js";
import { StatusPillGroup, statusConfig } from "./components/StatusPills.jsx";
import { CostsList } from "./components/CostCards.jsx";

const C = {
  bg: "#f0f4f8", surface: "#ffffff", surfaceAlt: "#f9fafb",
  border: "#e8eaed", borderLight: "#f0f1f3",
  accent: "#1d4ed8", accentLight: "#eff6ff",
  text: "#1a1d23", textMid: "#5f6773", textDim: "#9ca3ae",
  green: "#16a34a", greenBg: "#f0fdf4",
  yellow: "#d97706", yellowBg: "#fffbeb",
  red: "#dc2626", redBg: "#fef2f2",
  blue: "#2563eb", blueBg: "#eff6ff",
  purple: "#7c3aed", cyan: "#0891b2",
  header: "#0f172a", headerBorder: "#1e293b", headerText: "#f1f5f9", headerMuted: "#94a3b8",
};
const FONT = "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif";
const IMGS = {
  "Ford Ka": "https://loremflickr.com/400/260/ford,ka,hatch?lock=11",
  "VW Gol 1.0": "https://loremflickr.com/400/260/volkswagen,gol,hatch?lock=22",
  "Ram 1500 Classic": "https://loremflickr.com/400/260/ram,1500,classic,truck?lock=10",
  "BMW M3 Red Frozen": "https://loremflickr.com/400/260/bmw,m3,f80,red?lock=33",
  "Ram 2500 Laramie": "https://loremflickr.com/400/260/ram,2500,laramie,truck?lock=60",
  "BMW M3 Competition": "https://loremflickr.com/400/260/bmw,m3,g80,competition?lock=44",
};

const USERS = [
  { id: "admin", label: "ThreeON Admin", user: "admin@threeon.com", pass: "", desc: "Acesso total (dados + códigos)", icon: "T", role: "ADMIN", dealership: "all" },
  { id: "dono", label: "BrossMotors - Dono", user: "dono@brossmotors.com", pass: "", desc: "Acesso BrossMotors e BMCars", icon: "B", role: "DONO", dealership: "all" },
  { id: "loja_b", label: "BMCars - Gerente", user: "lojab@brossmotors.com", pass: "", desc: "Acesso apenas BMCars", icon: "L", role: "GERENTE", dealership: "BMCars" },
];

// ─── REAL DATA FROM SPREADSHEET ─────────────────────────────────────
const INIT_VEHICLES = [
  { id: 1, make: "Ford", model: "Ka", year: 2020, purchasePrice: 52948, salePrice: 68000, fipePrice: 62000, status: "available", mileage: 72000, daysInStock: 35, location: "BrossMotors", costs: { "Compra do veiculo": 52948, "Funilaria": 600, "Mercado": 270, "Documentacao": 764, "Combustivel": 47, "Comissao": 400 }, motor: "1.0L 3-cil", potencia: "75 cv", features: "Ar condicionado, vidros elétricos" },
  { id: 2, make: "VW", model: "Gol 1.0", year: 2022, purchasePrice: 53000, salePrice: 71000, fipePrice: 68000, status: "available", mileage: 56000, daysInStock: 28, location: "BrossMotors", costs: { "Compra do veiculo": 53000, "Funilaria": 200, "Cartorio": 67, "Documentacao": 400, "Combustivel": 235, "Comissao": 300 }, motor: "1.0L 3-cil", potencia: "82 cv", features: "Direção hidráulica, airbag" },
  { id: 3, make: "Ram", model: "1500 Classic", year: 2023, purchasePrice: 260000, salePrice: 315000, fipePrice: 310000, status: "available", mileage: 42000, daysInStock: 52, location: "BrossMotors", costs: { "Compra do veiculo": 260000, "Combustivel": 220, "Lavagem": 800 }, motor: "5.7L V8", potencia: "395 cv", features: "Cabine dupla, 4x4, ar digital" },
  { id: 4, make: "BMW", model: "M3", year: 2021, purchasePrice: 325000, salePrice: 420000, fipePrice: 400000, status: "available", mileage: 37000, daysInStock: 18, location: "BrossMotors", costs: { "Compra do veiculo": 325000, "Viagem": 3229, "Peca": 2500, "Vistoria": 80, "Lavagem": 1000, "Martelinho": 100, "Combustivel": 200, "Pecas ambar": 1840, "Webmotors": 220 }, motor: "3.0L Twin-turbo", potencia: "503 cv", features: "Teto panorâmico, bose sound, interior premium" },
  { id: 5, make: "Ram", model: "2500 Laramie", year: 2021, purchasePrice: 290000, salePrice: 375000, fipePrice: 360000, status: "available", mileage: 52000, daysInStock: 41, location: "BrossMotors", costs: { "Compra do veiculo": 290000, "Viagem": 418, "Combustivel": 807, "Veloci": 800, "Vistoria": 80, "Comida": 113, "Lavagem": 1000, "Cautelar": 600 }, motor: "6.7L Diesel", potencia: "385 cv", features: "Cabine dupla, 4x4, suspensão a ar" },
];

const INIT_CRM = [
  { id: 1, name: "José Augusto Ferreira", phone: "(16) 99234-5678", email: "jose@email.com", interest: "Ram 1500 Classic", status: "lead", type: "Colecionador", notes: "Interessado em RAM 1500. Visitou showroom em Jan/2026." },
  { id: 2, name: "Marcos Henrique Lima", phone: "(19) 98765-4321", email: "marcos@email.com", interest: "BMW M3", status: "active", type: "Empresário", notes: "CEO de startup. Procura carro premium para uso executivo." },
  { id: 3, name: "Carla Beatriz Santos", phone: "(11) 97654-3210", email: "carla@email.com", interest: "Toyota SW4", status: "prospect", type: "Executiva", notes: "Interesse em SW4 Diamond. Lead qualificado de Facebook." },
];

const INIT_EXPENSES = [];

const SOURCING = [
  { id: 1, platform: "WebMotors", make: "Ram", model: "1500 Laramie", year: 2024, price: 395000, fipe: 430000, discount: -8.1, km: 15000, location: "Sao Paulo, SP", score: 92, time: "2h atras", phone: "(11) 98765-4321", url: "https://webmotors.com.br/anuncio/123456", kmRating: "Baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
  { id: 2, platform: "OLX", make: "BMW", model: "M2", year: 2023, price: 480000, fipe: 595000, discount: -19.3, km: 11000, location: "Campinas, SP", score: 98, time: "45min atras", phone: "(19) 99432-1098", url: "https://olx.com.br/autos/bmw-m2-987654", kmRating: "Muito baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
  { id: 3, platform: "Marketplace", make: "Toyota", model: "Hilux SRX", year: 2024, price: 258000, fipe: 298000, discount: -13.4, km: 20000, location: "Ribeirao Preto, SP", score: 87, time: "3h atras", phone: "(16) 99876-5432", url: "https://facebook.com/marketplace/456789", kmRating: "Media", owners: 2, accidents: 0, serviceHistory: "Parcial", bodyCondition: "Bom" },
  { id: 4, platform: "Mercado Livre", make: "Toyota", model: "SW4 Diamond", year: 2023, price: 305000, fipe: 340000, discount: -10.3, km: 25000, location: "Curitiba, PR", score: 71, time: "5h atras", phone: "(41) 98234-5678", url: "https://mercadolivre.com.br/MLB-321654", kmRating: "Media", owners: 2, accidents: 1, serviceHistory: "Sem registros", bodyCondition: "Regular" },
  { id: 5, platform: "WebMotors", make: "Ram", model: "2500 Laramie", year: 2024, price: 410000, fipe: 475000, discount: -13.7, km: 8000, location: "Goiania, GO", score: 95, time: "1h atras", phone: "(62) 99123-4567", url: "https://webmotors.com.br/anuncio/789012", kmRating: "Muito baixa", owners: 1, accidents: 0, serviceHistory: "Completo (concess.)", bodyCondition: "Excelente" },
];

const WA_MSGS = [
  { from: "vendedor", text: "Boa tarde! Recebi uma Hilux SRX 2024, 15mil km. Cliente quer trocar por uma SW4.", time: "14:32" },
  { from: "bot", text: "Processando dados da Hilux SRX 2024...\n\nFIPE: R$ 298.000\nMedia WebMotors: R$ 289.500\nTendencia: -1.2% mes\n12 anuncios similares", time: "14:32" },
  { from: "bot", text: "Sugestao de compra: R$ 262.000 - R$ 275.000\n\n- FIPE -7% a -12% (margem segura)\n- 3 anuncios abaixo de R$ 270K\n- Giro medio: 22 dias", time: "14:33" },
  { from: "vendedor", text: "Cliente quer R$ 285 mil. Fecha?", time: "14:35" },
  { from: "bot", text: "ALERTA — R$ 285K = FIPE -4.4%\nMargem a FIPE: R$ 9.200 (3.1%)\n\nRecomendacao: NAO FECHAR.\nContraproposta: R$ 268.000", time: "14:35" },
  { from: "vendedor", text: "Topou 272 mil. Cadastra?", time: "14:41" },
  { from: "bot", text: "Cadastrado.\nToyota Hilux SRX 2024\nCompra: R$ 272.000 | FIPE: -8.7%\nMargem projetada: R$ 22.200 (7.2%)", time: "14:41" },
];

// ─── HELPERS ────────────────────────────────────────────────────────
const fmt = (v) => v ? `R$ ${(v / 1000).toFixed(0)}K` : "—";
const fmtFull = (v) => v ? `R$ ${v.toLocaleString("pt-BR")}` : "—";
const sColor = (s) => s >= 90 ? C.green : s >= 75 ? C.yellow : C.red;
const sLabel = (s) => s >= 90 ? "Excelente" : s >= 75 ? "Bom" : "Risco";
var totalCosts = function(v) { var co = v.costs || {}; var keys = Object.keys(co); var sum = 0; for (var i = 0; i < keys.length; i++) { sum += Number(co[keys[i]]) || 0; } return sum; };
const vProfit = (v) => (v.soldPrice || v.salePrice || 0) - totalCosts(v);
const vMargin = (v) => { const sale = v.soldPrice || v.salePrice || 0; return sale > 0 ? ((vProfit(v) / sale) * 100).toFixed(1) : "0.0"; };
const cR = (vehicles) => vehicles.filter(v => v.status === "sold").reduce((a, v) => a + (Number(v.soldPrice || v.salePrice) || 0), 0);
const cCost = (vehicles) => vehicles.reduce((a, v) => a + totalCosts(v), 0);

const statusMap = { available: { label: "Disponivel", color: C.green, bg: C.greenBg }, reserved: { label: "Reservado", color: C.yellow, bg: C.yellowBg }, sold: { label: "Vendido", color: C.blue, bg: C.blueBg }, maintenance: { label: "Recondicionamento", color: C.red, bg: C.redBg }, documentation: { label: "Documentacao", color: C.purple, bg: "#f5f3ff" }, transit: { label: "Em Transito", color: C.cyan, bg: "#ecfeff" } };
const expStatusMap = { paid: { label: "Pago", color: C.green, bg: C.greenBg }, pending: { label: "Pendente", color: C.yellow, bg: C.yellowBg }, urgent: { label: "Urgente", color: C.red, bg: C.redBg }, overdue: { label: "Atrasado", color: C.red, bg: C.redBg } };
const catColors = { Financiamento: C.purple, IPVA: C.red, Aluguel: C.blue, Seguro: C.cyan, Operacional: C.textMid };

// ─── ATOMS (no ...rest, no IIFE) ────────────────────────────────────
function Card({ children, style, onClick }) { return <div onClick={onClick} style={{ background: C.surface, borderRadius: 12, border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s, border-color 0.2s", cursor: onClick ? "pointer" : "default", ...style }} onMouseEnter={onClick ? function(e) { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)"; } : undefined} onMouseLeave={onClick ? function(e) { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)"; } : undefined}>{children}</div>; }
function Stat({ label, value, sub, accent }) { return <Card style={{ padding: "24px 26px", borderLeft: accent ? "4px solid " + C.accent : "4px solid transparent", background: accent ? C.accentLight : "#ffffff", transition: "all 0.2s" }} onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(29,78,216,0.12)"; }} onMouseLeave={function(e) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)"; }}><div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 700, color: accent ? C.accent : C.text, lineHeight: 1.1 }}>{value}</div>{sub && <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>{sub}</div>}</Card>; }
function Tag({ children, color, bg }) { return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: color, background: bg, letterSpacing: 0.3 }}>{children}</span>; }
function MiniBar({ label, value }) { var w = label === "Muito baixa" ? 95 : label === "Baixa" ? 80 : label === "Media" ? 55 : 30; var c = label === "Muito baixa" || label === "Baixa" ? C.green : label === "Media" ? C.yellow : C.red; return <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: C.textMid, width: 28, textAlign: "right" }}>{value}</span><div style={{ flex: 1, height: 4, background: C.borderLight, borderRadius: 2 }}><div style={{ width: w + "%", height: "100%", background: c, borderRadius: 2 }} /></div></div>; }

function MiniDonut({ segments, size = 80 }) {
  var safeSegments = segments || [];
  var grad = safeSegments.map(function(s) {
    var acc = 0;
    for (var i = 0; i < safeSegments.indexOf(s); i++) acc += safeSegments[i].pct;
    var next = acc + s.pct;
    return s.color + " " + acc + "% " + next + "%";
  }).join(", ");
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "conic-gradient(" + grad + ")" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: size * 0.55, height: size * 0.55, background: "#fff", borderRadius: "50%" }} />
    </div>
  );
}

function BarChart({ data, height = 120 }) {
  var safeData = data || [];
  var max = Math.max.apply(null, safeData.map(function(d) { return d.value; }).concat([1]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: height }}>
      {safeData.map(function(d, i) {
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 9, color: C.textDim }}>{d.label2 || ""}</div>
            <div style={{ width: "100%", height: (d.value / max) * (height - 24), background: d.color || C.accent, borderRadius: "3px 3px 0 0", minHeight: 4 }} />
            <div style={{ fontSize: 9, color: C.textDim, textAlign: "center" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function EditField({ label, value, onChange, type }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));
  var save = function() { setEditing(false); onChange(type === "number" ? Number(temp) || value : temp); };
  var displayValue = type === "number" ? (label.toLowerCase().includes("km") ? (Number(value) || 0).toLocaleString("pt-BR") + " km" : fmtFull(value)) : value;
  if (!editing) { return <div onClick={function() { setTemp(String(value)); setEditing(true); }} style={{ cursor: "pointer", padding: "7px 10px", borderRadius: 6, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: C.textDim }}>{label}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{displayValue}</span></div>; }
  return <div style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + C.accent, background: C.accentLight, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: C.textDim }}>{label}</span><div style={{ display: "flex", gap: 4 }}><input autoFocus value={temp} onChange={function(e) { setTemp(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") save(); }} type={type || "text"} style={{ width: type === "number" ? 100 : 140, padding: "4px 8px", border: "1px solid " + C.border, borderRadius: 4, fontSize: 13, fontFamily: FONT, outline: "none" }} /><button onClick={save} style={{ padding: "4px 10px", background: C.accent, color: "#fff", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>OK</button><button onClick={function() { setEditing(false); }} style={{ padding: "4px 8px", background: "none", color: C.textDim, border: "1px solid " + C.border, borderRadius: 4, fontSize: 11, cursor: "pointer" }}>X</button></div></div>;
}

// ─── LOGIN ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  var tryLogin = async function() {
    setLoading(true);
    setError("");
    try {
      // Tentar login na API
      const result = await authAPI.login(emailInput.trim(), passInput);
      // Se sucesso, usar dados do usuário retornado com dealership_id
      if (result.user && result.user.id) {
        const user = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          dealership_id: result.user.dealership_id,
          label: result.user.name,
          access: "all"
        };
        onLogin(user);
      } else {
        setError("Resposta do servidor inválida");
      }
    } catch (err) {
      // CRÍTICO: NÃO permitir fallback local
      // Se API falhar, retornar erro claro ao usuário
      console.error('[LOGIN] Erro ao conectar com servidor:', err);
      setError('Erro ao conectar com servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>B</span></div>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>BrossMotors</h1>
      <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 36px" }}>Dealer Sourcing Bot</p>
      <Card style={{ padding: 32, width: 360 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6, fontWeight: 500 }}>Email</label>
          <input value={emailInput} onChange={function(e) { setEmailInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") tryLogin(); }} placeholder="Seu email" style={{ width: "100%", padding: "10px 14px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 14, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6, fontWeight: 500 }}>Senha</label>
          <input type="password" value={passInput} onChange={function(e) { setPassInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") tryLogin(); }} placeholder="Sua senha" style={{ width: "100%", padding: "10px 14px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 14, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
        </div>
        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12, fontWeight: 500 }}>{error}</div>}
        <button onClick={tryLogin} disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? C.textDim : C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Conectando..." : "Entrar"}</button>
      </Card>
    </div>
  );
}

// ─── VEHICLE FORM ───────────────────────────────────────────────────
function VehicleForm({ onAdd, onCancel }) {
  const [f, setF] = useState(function() {
    var defaults = { make: "", model: "", year: 2024, salePrice: 0, mileage: 0, location: "BrossMotors", motor: "", potencia: "", features: "", compra: 0, viagem: 0, combustivel: 0, documentacao: 0, funilaria: 0, lavagem: 0, vistoria: 0, comissao: 0 };
    var saved = localStorage.getItem("vehicleFormDraft");
    if (!saved) return defaults;
    try {
      var parsed = JSON.parse(saved);
      // Restaurar apenas campos que existem em defaults (ignora campos obsoletos como fipePrice)
      var restored = Object.assign({}, defaults);
      for (var key in defaults) {
        if (key in parsed) restored[key] = parsed[key];
      }
      return restored;
    } catch (e) {
      console.error("Erro ao restaurar rascunho:", e);
      return defaults;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showCostsDetail, setShowCostsDetail] = useState(false);
  var totalCosts = (Number(f.compra) || 0) + (Number(f.documentacao) || 0) + (Number(f.funilaria) || 0) + (Number(f.combustivel) || 0) + (Number(f.viagem) || 0) + (Number(f.lavagem) || 0) + (Number(f.vistoria) || 0) + (Number(f.comissao) || 0);
  var inp = { width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" };
  var lbl = { fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };
  var validate = function() {
    var errs = {};
    if (!f.make || f.make.trim() === "") errs.make = "Marca é obrigatória";
    if (!f.model || f.model.trim() === "") errs.model = "Modelo é obrigatório";
    var year = Number(f.year);
    if (year < 1900 || year > new Date().getFullYear() + 1) errs.year = "Ano inválido (1900-" + (new Date().getFullYear() + 1) + ")";
    if (Number(f.compra) <= 0) errs.compra = "Compra deve ser > 0";
    if (Number(f.viagem) < 0) errs.viagem = "Viagem não pode ser negativo";
    if (Number(f.combustivel) < 0) errs.combustivel = "Combustível não pode ser negativo";
    if (Number(f.documentacao) < 0) errs.documentacao = "Documentação não pode ser negativo";
    if (Number(f.funilaria) < 0) errs.funilaria = "Funilaria não pode ser negativo";
    if (Number(f.lavagem) < 0) errs.lavagem = "Lavagem não pode ser negativo";
    if (Number(f.vistoria) < 0) errs.vistoria = "Vistoria não pode ser negativo";
    if (Number(f.comissao) < 0) errs.comissao = "Comissão não pode ser negativo";
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };
  var submit = async function() {
    if (!validate()) { setError("Por favor, corrija os erros acima"); return; }
    setLoading(true);
    setError("");
    try {
      var costs = { "Compra do veiculo": Number(f.compra) || 0 };
      if (Number(f.viagem)) costs["Viagem"] = Number(f.viagem);
      if (Number(f.combustivel)) costs["Combustivel"] = Number(f.combustivel);
      if (Number(f.documentacao)) costs["Documentacao"] = Number(f.documentacao);
      if (Number(f.funilaria)) costs["Funilaria"] = Number(f.funilaria);
      if (Number(f.lavagem)) costs["Lavagem"] = Number(f.lavagem);
      if (Number(f.vistoria)) costs["Vistoria"] = Number(f.vistoria);
      if (Number(f.comissao)) costs["Comissao"] = Number(f.comissao);
      var vehicleData = {
        make: f.make,
        model: f.model,
        year: Number(f.year),
        purchasePrice: Number(f.compra) || 0,
        salePrice: Number(f.salePrice) || 0,
        mileage: Number(f.mileage) || 0,
        location: f.location,
        status: "available",
        motor: f.motor,
        potencia: f.potencia,
        features: f.features,
        costs: costs
      };
      try {
        var result = await inventoryAPI.create(vehicleData);

        // Validar resposta
        if (!result || !result.vehicle) {
          throw new Error('Resposta inválida do servidor: ' + JSON.stringify(result));
        }

        // SUCESSO: dados persistidos no banco
        onAdd(result.vehicle);
        setError(""); // Limpar erros anteriores
        localStorage.removeItem("vehicleFormDraft"); // Limpar rascunho

      } catch (apiErr) {
        // ERRO: NÃO criar localmente
        console.error('[VehicleForm] API Error:', apiErr);

        // Diferenciar tipos de erro
        if (apiErr instanceof APIError) {
          if (apiErr.status === 400) {
            // Validação no servidor
            setError('Dados inválidos: ' + apiErr.message);
          } else if (apiErr.status === 401) {
            // Problema de autenticação
            setError('Sessão expirada. Por favor, faça login novamente.');
            localStorage.clear();
            window.location.href = '/';
          } else if (apiErr.status === 500) {
            // Erro interno do servidor
            setError('Erro no servidor. Tente novamente em alguns minutos.');
          } else {
            setError('Erro: ' + apiErr.message);
          }
        } else {
          // Erro de rede ou timeout
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        }

        // IMPORTANTE: NÃO adicionar veículo localmente
        // Dados devem ser persistidos no banco ou falha total
      }
    } catch (err) {
      console.error('[VehicleForm] Unexpected error:', err);
      setError('Erro inesperado: ' + (err.message || 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };
  var set = function(key, val) {
    var newF = Object.assign({}, f);
    newF[key] = val;
    setF(newF);
    localStorage.setItem("vehicleFormDraft", JSON.stringify(newF));
    // Clear the validation error for this field
    if (validationErrors[key]) {
      var newErrors = Object.assign({}, validationErrors);
      delete newErrors[key];
      setValidationErrors(newErrors);
    }
  };
  return <Card style={{ padding: 22, marginBottom: 16 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.5fr 1fr", gap: 12, marginBottom: 12 }}>
      <div><label style={lbl}>Marca</label><input value={f.make} onChange={function(e) { set("make", e.target.value); }} style={Object.assign({}, inp, validationErrors.make ? { borderColor: C.red } : {})} placeholder="Ford, BMW, Ram..." />{validationErrors.make && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.make}</div>}</div>
      <div><label style={lbl}>Modelo</label><input value={f.model} onChange={function(e) { set("model", e.target.value); }} style={Object.assign({}, inp, validationErrors.model ? { borderColor: C.red } : {})} placeholder="Ka, M3, 1500..." />{validationErrors.model && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.model}</div>}</div>
      <div><label style={lbl}>Ano</label><input type="number" value={f.year} onChange={function(e) { set("year", e.target.value); }} style={Object.assign({}, inp, validationErrors.year ? { borderColor: C.red } : {})} />{validationErrors.year && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.year}</div>}</div>
      <div><label style={lbl}>Loja</label><select value={f.location} onChange={function(e) { set("location", e.target.value); }} style={Object.assign({}, inp, { cursor: "pointer" })}><option>BrossMotors</option><option>BMCars</option></select></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
      <div><label style={lbl}>Compra do veiculo</label><input type="number" value={f.compra} onChange={function(e) { set("compra", e.target.value); }} style={Object.assign({}, inp, validationErrors.compra ? { borderColor: C.red } : {})} />{validationErrors.compra && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.compra}</div>}</div>
      <div><label style={lbl}>Preco de Venda</label><input type="number" value={f.salePrice} onChange={function(e) { set("salePrice", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Km</label><input type="number" value={f.mileage} onChange={function(e) { set("mileage", e.target.value); }} style={inp} /></div>
    </div>
    <div style={{ padding: 12, background: C.surfaceAlt, borderRadius: 8, border: "1px solid " + C.border, marginBottom: 12, cursor: "pointer" }} onClick={function() { setShowCostsDetail(!showCostsDetail); }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><label style={Object.assign({}, lbl, { marginBottom: 0 })}>Custos Gerais</label><div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 4 }}>{totalCosts > 0 ? "R$ " + totalCosts.toLocaleString("pt-BR") : "—"}</div></div>
        <div style={{ fontSize: 20, color: C.textDim }}>{showCostsDetail ? "−" : "+"}</div>
      </div>
      {showCostsDetail && <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + C.border, fontSize: 12 }}>
        {f.compra > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Compra do veiculo</span><span>R$ {Number(f.compra).toLocaleString("pt-BR")}</span></div>}
        {f.documentacao > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Documentacao</span><span>R$ {Number(f.documentacao).toLocaleString("pt-BR")}</span></div>}
        {f.funilaria > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Funilaria</span><span>R$ {Number(f.funilaria).toLocaleString("pt-BR")}</span></div>}
        {f.combustivel > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Combustivel</span><span>R$ {Number(f.combustivel).toLocaleString("pt-BR")}</span></div>}
        {f.viagem > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Viagem</span><span>R$ {Number(f.viagem).toLocaleString("pt-BR")}</span></div>}
        {f.lavagem > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Lavagem</span><span>R$ {Number(f.lavagem).toLocaleString("pt-BR")}</span></div>}
        {f.vistoria > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: C.textMid }}><span>Vistoria</span><span>R$ {Number(f.vistoria).toLocaleString("pt-BR")}</span></div>}
        {f.comissao > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 0, color: C.textMid }}><span>Comissao</span><span>R$ {Number(f.comissao).toLocaleString("pt-BR")}</span></div>}
      </div>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
      <div><label style={lbl}>Documentacao</label><input type="number" value={f.documentacao} onChange={function(e) { set("documentacao", e.target.value); }} style={Object.assign({}, inp, validationErrors.documentacao ? { borderColor: C.red } : {})} />{validationErrors.documentacao && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.documentacao}</div>}</div>
      <div><label style={lbl}>Funilaria</label><input type="number" value={f.funilaria} onChange={function(e) { set("funilaria", e.target.value); }} style={Object.assign({}, inp, validationErrors.funilaria ? { borderColor: C.red } : {})} />{validationErrors.funilaria && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.funilaria}</div>}</div>
      <div><label style={lbl}>Combustivel</label><input type="number" value={f.combustivel} onChange={function(e) { set("combustivel", e.target.value); }} style={Object.assign({}, inp, validationErrors.combustivel ? { borderColor: C.red } : {})} />{validationErrors.combustivel && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.combustivel}</div>}</div>
      <div><label style={lbl}>Viagem</label><input type="number" value={f.viagem} onChange={function(e) { set("viagem", e.target.value); }} style={Object.assign({}, inp, validationErrors.viagem ? { borderColor: C.red } : {})} />{validationErrors.viagem && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.viagem}</div>}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
      <div><label style={lbl}>Lavagem</label><input type="number" value={f.lavagem} onChange={function(e) { set("lavagem", e.target.value); }} style={Object.assign({}, inp, validationErrors.lavagem ? { borderColor: C.red } : {})} />{validationErrors.lavagem && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.lavagem}</div>}</div>
      <div><label style={lbl}>Vistoria</label><input type="number" value={f.vistoria} onChange={function(e) { set("vistoria", e.target.value); }} style={Object.assign({}, inp, validationErrors.vistoria ? { borderColor: C.red } : {})} />{validationErrors.vistoria && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.vistoria}</div>}</div>
      <div><label style={lbl}>Comissao</label><input type="number" value={f.comissao} onChange={function(e) { set("comissao", e.target.value); }} style={Object.assign({}, inp, validationErrors.comissao ? { borderColor: C.red } : {})} />{validationErrors.comissao && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>{validationErrors.comissao}</div>}</div>
      <div><label style={lbl}>Motor / Features</label><input value={f.motor} onChange={function(e) { set("motor", e.target.value); }} style={inp} placeholder="2.8L Diesel..." /></div>
    </div>
    {error && <div style={{ padding: 12, background: C.redBg, border: "1px solid " + C.red, borderRadius: 8, color: C.red, fontSize: 12, fontWeight: 500, marginBottom: 12 }}>{error}</div>}
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={submit} disabled={loading || Object.keys(validationErrors).length > 0} style={{ padding: "10px 24px", background: (loading || Object.keys(validationErrors).length > 0) ? C.textDim : C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (loading || Object.keys(validationErrors).length > 0) ? "default" : "pointer", opacity: (loading || Object.keys(validationErrors).length > 0) ? 0.5 : 1 }}>{loading ? "Adicionando..." : "Adicionar ao Estoque"}</button>
      <button onClick={onCancel} disabled={loading} style={{ padding: "10px 24px", background: C.redBg, color: C.red, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1 }}>Cancelar</button>
    </div>
  </Card>;
}

// ─── CRM ────────────────────────────────────────────────────────────
function CrmTab({ customers, setCustomers }) {
  const [selC, setSelC] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", cpf: "", vehicleBought: "", purchaseDate: "", purchaseValue: 0, notes: "", style: "", region: "", collector: false, birthday: "", profession: "", referral: "", contactPref: "WhatsApp" });
  var inp = { width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" };
  var lbl = { fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };

  if (selC) {
    var c = customers.find(function(x) { return x.id === selC; });
    if (!c) { setSelC(null); return null; }
    var updC = function(field, val) {
      setCustomers(function(p) { return p.map(function(x) { return x.id === c.id ? Object.assign({}, x, { [field]: val }) : x; }); });
      (async function() {
        try {
          await crmAPI.update(c.id, { [field]: val });
        } catch (err) {
          console.error('Erro ao atualizar cliente:', err);
        }
      })();
    };
    return <div>
      <button onClick={function() { setSelC(null); }} style={{ background: C.surface, border: "1px solid " + C.border, color: C.textMid, padding: "7px 16px", borderRadius: 8, cursor: "pointer", marginBottom: 18, fontSize: 12 }}>Voltar</button>
      <Card style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{c.name}</h2>
            <div style={{ fontSize: 13, color: C.textDim }}>{c.phone} | {c.email}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>CPF: {c.cpf}{c.profession ? " | " + c.profession : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {c.collector && <Tag color={C.purple} bg="#f5f3ff">Colecionador</Tag>}
            <Tag color={C.accent} bg={C.accentLight}>Cliente</Tag>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Veiculo</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.vehicleBought}</div></Card>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Data</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.purchaseDate ? new Date(c.purchaseDate).toLocaleDateString("pt-BR") : "---"}</div></Card>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Valor</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: C.green }}>{c.purchaseValue ? fmtFull(c.purchaseValue) : "---"}</div></Card>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>Perfil do Cliente</div>
            <EditField label="Estilo" value={c.style || ""} onChange={function(v) { updC("style", v); }} />
            <EditField label="Regiao" value={c.region || ""} onChange={function(v) { updC("region", v); }} />
            <EditField label="Profissao" value={c.profession || ""} onChange={function(v) { updC("profession", v); }} />
            <EditField label="Aniversario" value={c.birthday || ""} onChange={function(v) { updC("birthday", v); }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textDim }}>Colecionador</span>
              <button onClick={function() { updC("collector", !c.collector); }} style={{ padding: "4px 14px", borderRadius: 6, border: "1px solid " + (c.collector ? C.purple : C.border), background: c.collector ? "#f5f3ff" : "transparent", color: c.collector ? C.purple : C.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c.collector ? "Sim" : "Nao"}</button>
            </div>
          </Card>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>Contato & Origem</div>
            <EditField label="Telefone" value={c.phone || ""} onChange={function(v) { updC("phone", v); }} />
            <EditField label="Email" value={c.email || ""} onChange={function(v) { updC("email", v); }} />
            <EditField label="Como chegou" value={c.referral || ""} onChange={function(v) { updC("referral", v); }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textDim }}>Contato preferido</span>
              <select value={c.contactPref || "WhatsApp"} onChange={function(e) { updC("contactPref", e.target.value); }} style={{ padding: "4px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, cursor: "pointer", background: C.surface }}>
                <option>WhatsApp</option><option>Telefone</option><option>Email</option><option>Presencial</option>
              </select>
            </div>
          </Card>
        </div>
        <Card style={{ padding: 16, background: C.surfaceAlt }}>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Observacoes</div>
          <textarea value={c.notes || ""} onChange={function(e) { updC("notes", e.target.value); }} style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box", resize: "vertical", background: C.surface, lineHeight: 1.6 }} />
        </Card>
        <button onClick={async function() { if (confirm("Tem certeza que deseja deletar este cliente?")) { try { await crmAPI.delete(c.id); setCustomers(function(p) { return p.filter(function(x) { return x.id !== c.id; }); }); setSelC(null); } catch (err) { alert("Erro ao deletar: " + (err instanceof APIError ? err.message : err.message)); } } }} style={{ width: "100%", padding: "12px 16px", background: C.redBg, color: C.red, border: "1px solid " + C.red, borderRadius: 8, cursor: "pointer", marginTop: 16, fontSize: 13, fontWeight: 600 }}>Deletar Cliente</button>
      </Card>
    </div>;
  }

  var addC = function() {
    if (!form.name) return;
    (async function() {
      try {
        var customerData = { name: form.name, phone: form.phone, email: form.email, cpf: form.cpf, vehicleBought: form.vehicleBought, purchaseDate: form.purchaseDate, purchaseValue: Number(form.purchaseValue) || 0, notes: form.notes, style: form.style, region: form.region, collector: form.collector, birthday: form.birthday, profession: form.profession, referral: form.referral, contactPref: form.contactPref };
        var result = await crmAPI.create(customerData);
        if (result && result.customer) {
          setCustomers(function(p) { return p.concat([result.customer]); });
          setForm({ name: "", phone: "", email: "", cpf: "", vehicleBought: "", purchaseDate: "", purchaseValue: 0, notes: "", style: "", region: "", collector: false, birthday: "", profession: "", referral: "", contactPref: "WhatsApp" });
          setAdding(false);
        }
      } catch (err) {
        alert("Erro ao adicionar cliente: " + (err instanceof APIError ? err.message : err.message));
      }
    })();
  };

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Clientes --- {customers.length}</h2>
      <button onClick={function() { setAdding(!adding); }} style={{ padding: "8px 18px", background: adding ? C.redBg : C.accent, color: adding ? C.red : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{adding ? "Cancelar" : "+ Novo Cliente"}</button>
    </div>
    {adding && <Card style={{ padding: 22, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div><label style={lbl}>Nome</label><input value={form.name} onChange={function(e) { setForm(Object.assign({}, form, { name: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Telefone</label><input value={form.phone} onChange={function(e) { setForm(Object.assign({}, form, { phone: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Email</label><input value={form.email} onChange={function(e) { setForm(Object.assign({}, form, { email: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>CPF</label><input value={form.cpf} onChange={function(e) { setForm(Object.assign({}, form, { cpf: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Profissao</label><input value={form.profession} onChange={function(e) { setForm(Object.assign({}, form, { profession: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Regiao</label><input value={form.region} onChange={function(e) { setForm(Object.assign({}, form, { region: e.target.value })); }} style={inp} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><label style={lbl}>Estilo</label><input value={form.style} onChange={function(e) { setForm(Object.assign({}, form, { style: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Veiculo</label><input value={form.vehicleBought} onChange={function(e) { setForm(Object.assign({}, form, { vehicleBought: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Data</label><input type="date" value={form.purchaseDate} onChange={function(e) { setForm(Object.assign({}, form, { purchaseDate: e.target.value })); }} style={inp} /></div>
        <div><label style={lbl}>Valor</label><input type="number" value={form.purchaseValue} onChange={function(e) { setForm(Object.assign({}, form, { purchaseValue: e.target.value })); }} style={inp} /></div>
      </div>
      <button onClick={addC} style={{ padding: "10px 24px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }} onMouseEnter={function(e) { e.currentTarget.style.background = "#1e40af"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(29,78,216,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={function(e) { e.currentTarget.style.background = C.accent; e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,78,216,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}>Salvar</button>
    </Card>}
    <div style={{ display: "grid", gap: 8 }}>
      {customers.map(function(c) { return <Card key={c.id} onClick={function() { setSelC(c.id); }} style={{ padding: "16px 20px", cursor: "pointer", display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 0.8fr", alignItems: "center", gap: 12 }}>
        <div><div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div><div style={{ fontSize: 11, color: C.textDim }}>{c.phone} | {c.region || "---"}</div></div>
        <div style={{ fontSize: 12, color: C.textDim }}>{c.style || "---"}</div>
        <div style={{ fontSize: 13 }}>{c.vehicleBought}</div>
        <div style={{ fontSize: 13, color: C.textDim }}>{c.purchaseDate ? new Date(c.purchaseDate).toLocaleDateString("pt-BR") : "---"}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{c.purchaseValue ? fmtFull(c.purchaseValue) : "---"}</div>
          {c.collector && <div style={{ fontSize: 10, color: C.purple, fontWeight: 600 }}>Colecionador</div>}
        </div>
      </Card>; })}
    </div>
  </div>;
}

// ─── MAIN ───────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [dealer, setDealer] = useState("all");
  const [selV, setSelV] = useState(null);
  const [imgErr, setImgErr] = useState({});
  const [vehicles, setVehicles] = useState(INIT_VEHICLES);
  const [customers, setCustomers] = useState(INIT_CRM);
  const [expenses, setExpenses] = useState(INIT_EXPENSES);
  const [showCosts, setShowCosts] = useState(false);
  const [invFilter, setInvFilter] = useState("active");
  const [addingV, setAddingV] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [invView, setInvView] = useState("lista");
  const [finSub, setFinSub] = useState("overview");
  const [balMonth, setBalMonth] = useState("2026-02");
  const [expForm, setExpForm] = useState({ category: "Operacional", description: "", amount: 0, status: "pending", date: new Date().toISOString().split("T")[0], customCategory: "" });
  const [loaded, setLoaded] = useState(false);
  const [sourcing, setSourcing] = useState([]);
  const [sourcingFilters, setSourcingFilters] = useState({ make: "", model: "", priceMin: "", priceMax: "", kmMax: "", discountMin: "" });
  const [sourcingLoading, setSourcingLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ oldPass: "", newPass: "", confirmPass: "" });
  const [changePassMsg, setChangePassMsg] = useState("");
  const [customLogo, setCustomLogo] = useState(localStorage.getItem('customLogo') || null);
  const [newCostKey, setNewCostKey] = useState("");
  const [newCostVal, setNewCostVal] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [stockError, setStockError] = useState("");
  const [ipvaList, setIpvaList] = useState([]);
  const [ipvaSummary, setIpvaSummary] = useState(null);
  const [ipvaLoading, setIpvaLoading] = useState(false);
  const [showIpvaForm, setShowIpvaForm] = useState(null);
  const [ipvaFormVehicleId, setIpvaFormVehicleId] = useState('');
  const [ipvaFormState, setIpvaFormState] = useState('SP');
  const [ipvaFormYear, setIpvaFormYear] = useState(new Date().getFullYear());
  const [finData, setFinData] = useState(null);
  const [finMonth, setFinMonth] = useState(new Date().getMonth() + 1);
  const [finYear, setFinYear] = useState(new Date().getFullYear());
  const [finMonthlyData, setFinMonthlyData] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [selectedSavedSearch, setSelectedSavedSearch] = useState(null);
  const [aiSearchInput, setAiSearchInput] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState(null);

  // Restaurar sessão ao carregar a página (se houver token no localStorage)
  // BONUS FIX: Implementa cleanup flag para evitar setState after unmount (race condition)
  useEffect(function() {
    var isMounted = true; // Flag para evitar setState após unmount

    async function restoreSession() {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          // Sem token → usuário não está logado
          if (isMounted) setUser(null);
          return;
        }

        // Validar se token ainda é válido (chamando /auth/me)
        const response = await authAPI.me();

        if (!response || !response.id) {
          // Token inválido/expirado → remover e logout
          localStorage.removeItem('token');
          if (isMounted) setUser(null);
          return;
        }

        // Token válido → restaurar user
        if (isMounted) {
          setUser({
            id: response.id,
            name: response.name,
            email: response.email,
            dealership_id: response.dealership_id,
            label: response.name,
            access: "all"
          });
        }
      } catch (error) {
        console.error('[useEffect.restoreSession] Error:', error);
        if (isMounted) {
          // Erro na validação → assumir logout (token inválido/expirado)
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    }

    restoreSession(); // Disparar uma vez

    // Cleanup: sinalizar que component foi unmounted
    return function cleanup() {
      isMounted = false;
    };
  }, []); // Dependencies array vazio = disparar só uma vez

  // Carregar vehicles, customers e expenses do backend
  // OTIMIZAÇÃO: Usar Promise.all para paralelizar 6 requisições
  useEffect(function() {
    if (!user) return;
    (async function() {
      try {
        // ✅ FASE 1: Paralelizar 5 requisições (sourcing carrega lazy na aba)
        const [vehiclesData, customersData, expensesData, ipvaListData, ipvaSummaryData] =
          await Promise.all([
            inventoryAPI.list().catch(() => ({})),
            crmAPI.list().catch(() => ({})),
            expensesAPI.list().catch(() => ({})),
            ipvaAPI.list().catch(() => []),
            ipvaAPI.summary().catch(() => null)
          ]);

        // Vehicles
        let loadedVehicles = vehiclesData && vehiclesData.vehicles && vehiclesData.vehicles.length > 0 ? vehiclesData.vehicles : INIT_VEHICLES;
        // Recuperar imagens e drafts do localStorage (otimizado)
        loadedVehicles = loadedVehicles.map(function(v) {
          var imgKey = "vehicle_img_" + v.id;
          var draftKey = "vehicle_draft_" + v.id;
          var savedImg = localStorage.getItem(imgKey);
          var savedDraft = localStorage.getItem(draftKey);
          var updated = Object.assign({}, v);
          if (savedImg) updated.imageUrl = savedImg;
          if (savedDraft) {
            try {
              var draft = JSON.parse(savedDraft);
              updated = Object.assign({}, updated, draft);
            } catch (e) { console.error("Erro ao restaurar draft:", e); }
          }
          return updated;
        });
        setVehicles(loadedVehicles);

        // Customers
        if (customersData && customersData.customers && customersData.customers.length > 0) {
          setCustomers(customersData.customers);
        } else {
          setCustomers(INIT_CRM);
        }

        // Expenses
        if (expensesData && expensesData.expenses && expensesData.expenses.length > 0) {
          setExpenses(expensesData.expenses);
        } else {
          setExpenses(INIT_EXPENSES);
        }

        // IPVA
        if (ipvaListData && ipvaListData.length > 0) {
          setIpvaList(ipvaListData);
        }
        if (ipvaSummaryData) {
          setIpvaSummary(ipvaSummaryData);
        }

        setLoaded(true);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setStockError('Não foi possível carregar dados. Verifique se o servidor está rodando.');
        setLoaded(true);
      }
    })();
  }, [user]);

  // Lazy load sourcing + saved searches quando user entra na aba sourcing
  useEffect(function() {
    if (tab === 'sourcing') {
      // Carregar buscas salvas se ainda não carregadas
      if (savedSearches.length === 0) {
        (async function() {
          try {
            const result = await savedSearchesAPI.list();
            if (result && result.searches) {
              setSavedSearches(result.searches);
            }
          } catch (err) {
            console.error('Erro ao carregar buscas salvas:', err);
          }
        })();
      }

      // Carregar sourcing se ainda não carregados
      if (sourcing.length === 0 && !sourcingLoading) {
        searchSourcing();
      }
    }
  }, [tab]);

  // Toast helper function
  var showToast = function(message, type, duration) {
    type = type || 'success';
    duration = duration || 3000;
    var id = Math.random().toString(36).substr(2, 9);
    var toast = { id: id, message: message, type: type };
    setToasts(function(prev) { return prev.concat([toast]); });
    setTimeout(function() {
      setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    }, duration);
  };

  var searchSourcing = function() {
    setSourcingLoading(true);
    (async function() {
      try {
        const filters = {};
        if (sourcingFilters.make) filters.make = sourcingFilters.make;
        if (sourcingFilters.model) filters.model = sourcingFilters.model;
        if (sourcingFilters.priceMin) filters.priceMin = Number(sourcingFilters.priceMin);
        if (sourcingFilters.priceMax) filters.priceMax = Number(sourcingFilters.priceMax);
        if (sourcingFilters.kmMax) filters.kmMax = Number(sourcingFilters.kmMax);
        if (sourcingFilters.discountMin) filters.discountMin = Number(sourcingFilters.discountMin);
        const result = await sourcingAPI.search(filters);
        if (result && result.results) {
          setSourcing(result.results);
        }
      } catch (err) {
        console.error('Erro ao buscar sourcing:', err);
      }
      setSourcingLoading(false);
    })();
  };

  var performAiSearch = function() {
    setAiSearchLoading(true);
    (async function() {
      try {
        const result = await savedSearchesAPI.aiSearch(aiSearchInput);
        setAiSearchResult(result);
      } catch (err) {
        showToast("Erro: " + (err instanceof APIError ? err.message : err.message), "error");
        console.error('AI Search error:', err);
      }
      setAiSearchLoading(false);
    })();
  };

  var upd = useCallback(function(id, field, val) {
    var vehicleToSend = null;

    // Atualizar localmente e capturar veículo atualizado
    setVehicles(function(prev) {
      var next = prev.map(function(v) {
        // Comparação robusta de IDs: converter ambos para string para comparação
        var vIdStr = String(v.id);
        var idStr = String(id);
        if (vIdStr !== idStr) return v;

        vehicleToSend = Object.assign({}, v, { [field]: val });
        return vehicleToSend;
      });
      if (!vehicleToSend) {
      }
      return next;
    });
    if (selV && String(selV.id) === String(id)) {
      setSelV(function(p) {
        var update = {};
        update[field] = val;
        // Se editar salePrice e o carro tem soldPrice definido, sincronizar
        if (field === 'salePrice' && p.soldPrice != null) {
          update.soldPrice = val;
        }
        return Object.assign({}, p, update);
      });
    }
    // Auto-save no localStorage
    if (vehicleToSend) {
      localStorage.setItem("vehicle_draft_" + id, JSON.stringify(vehicleToSend));
    }
    // Enviar apenas o campo alterado para o backend (evita validações cruzadas de preço)
    if (vehicleToSend) {
      var payload = {};
      payload[field] = val;
      (async function() {
        try {
          const res = await inventoryAPI.update(id, payload);
          if (res && res.vehicle) {
            setVehicles(function(prev) {
              return prev.map(function(v) {
                var vIdStr = String(v.id);
                var idStr = String(id);
                return vIdStr === idStr ? Object.assign({}, v, res.vehicle) : v;
              });
            });
            if (selV && String(selV.id) === String(id)) {
              setSelV(function(p) {
                return Object.assign({}, p, res.vehicle);
              });
            }
            // Limpar draft após salvar com sucesso
            localStorage.removeItem("vehicle_draft_" + id);
            // Mostrar feedback apenas para mudanças de status (drag-drop)
            if (field === 'status') {
              var statusLabel = kColumnMap[val] ? kColumnMap[val].label : val;
              showToast(`Status alterado para: ${statusLabel}`, 'success');
            }
          }
        } catch (err) {
          console.error('❌ Erro ao atualizar veículo:', err);
          showToast(`Erro ao atualizar ${field}`, 'error');
        }
      })();
    }
  }, [selV]);



  var updCost = useCallback(function(id, costField, val) {
    var vehicleToSend = null;
    setVehicles(function(prev) {
      var next = prev.map(function(v) {
        if (v.id !== id) return v;
        var newCosts = Object.assign({}, v.costs || {}, { [costField]: val });
        var updates = { costs: newCosts };
        if (costField === "Compra do veiculo") updates.purchasePrice = val;
        vehicleToSend = Object.assign({}, v, updates);
        return vehicleToSend;
      });
      return next;
    });
    // Enviar para backend com dados corretos
    if (vehicleToSend) {
      (async function() {
        try {
          const res = await inventoryAPI.update(id, vehicleToSend);
          if (res && res.vehicle) {
            setVehicles(function(prev) {
              return prev.map(function(v) {
                return v.id === id ? Object.assign({}, v, res.vehicle) : v;
              });
            });
            if (selV && selV.id === id) {
              setSelV(function(p) {
                return Object.assign({}, p, res.vehicle);
              });
            }
            showToast('Custo adicionado com sucesso!', 'success');
          }
        } catch (err) {
          console.error('Erro ao atualizar custos:', err);
          showToast('Erro ao salvar custo', 'error');
        }
      })();
    }
  }, [selV]);

  var renameCost = useCallback(function(id, oldKey, newKey) {
    if (!newKey || newKey === oldKey) return;
    var vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    var newCosts = Object.assign({}, vehicle.costs || {});
    var val = newCosts[oldKey];
    delete newCosts[oldKey];
    newCosts[newKey] = val;
    setVehicles(p => p.map(v => v.id === id ? Object.assign({}, v, { costs: newCosts }) : v));
    if (selV && selV.id === id) setSelV(v => Object.assign({}, v, { costs: newCosts }));
    (async () => {
      try { await inventoryAPI.update(id, Object.assign({}, vehicle, { costs: newCosts })); }
      catch (err) { console.error(err); }
    })();
  }, [vehicles, selV]);

  var deleteCost = useCallback(function(id, key) {
    var vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    var newCosts = Object.assign({}, vehicle.costs || {});
    delete newCosts[key];
    setVehicles(p => p.map(v => v.id === id ? Object.assign({}, v, { costs: newCosts }) : v));
    if (selV && selV.id === id) setSelV(v => Object.assign({}, v, { costs: newCosts }));
    (async () => {
      try {
        await inventoryAPI.update(id, Object.assign({}, vehicle, { costs: newCosts }));
        showToast('Custo deletado com sucesso!', 'success');
      }
      catch (err) {
        console.error(err);
        showToast('Erro ao deletar custo', 'error');
      }
    })();
  }, [vehicles, selV]);

  var updateStatus = useCallback(async function(id, newStatus) {
    var vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    var updates = {
      status: newStatus,
      statusChangedAt: new Date().toISOString(),
      statusChangedBy: user.name || "Sistema"
    };
    var updatedVehicle = Object.assign({}, vehicle, updates);
    setVehicles(p => p.map(v => v.id === id ? updatedVehicle : v));
    if (selV && selV.id === id) {
      setSelV(updatedVehicle);
    }
    try {
      const res = await inventoryAPI.update(id, updates);
      if (res && res.vehicle) {
        setVehicles(p => p.map(v => v.id === id ? Object.assign({}, v, res.vehicle) : v));
        if (selV && selV.id === id) {
          setSelV(Object.assign({}, selV, res.vehicle));
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  }, [vehicles, selV, user]);

  const loadFinancialMonthly = async function() {
    try {
      const result = await financialAPI.monthly(finYear, String(finMonth).padStart(2, '0'));
      setFinMonthlyData(result.vehicles || []);
    } catch (err) {
      console.error('Erro ao carregar financeiro mensal:', err);
    }
  };

  // ✅ HOOKS SECTION: All useMemo must be BEFORE any conditional returns
  // plData: P&L calculation memoized to prevent recalculation
  const plData = useMemo(() => {
    const soldVehicles = vehicles.filter(v => v.status === "sold");
    const grossRevenue = soldVehicles.reduce((a, v) => a + (v.soldPrice || v.salePrice || 0), 0);
    const totalVehicleCosts = soldVehicles.reduce((a, v) => a + totalCosts(v), 0);
    const generalExpenses = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const grossProfit = grossRevenue - totalVehicleCosts;
    const netProfit = grossProfit - generalExpenses;

    return {
      grossRevenue,
      totalVehicleCosts,
      generalExpenses,
      grossProfit,
      netProfit,
    };
  }, [vehicles, expenses]);

  // ✅ CALCULATE VARIABLES BEFORE USING IN useMemo
  var canSwitch = user && user.access === "all";
  var allF = !user || dealer === "all" ? (vehicles || []) : (vehicles || []).filter(function(v) { return v.location === dealer; });
  var activeV = (allF || []).filter(function(v) { return v.status !== "sold"; });
  var soldV = (allF || []).filter(function(v) { return v.status === "sold"; });
  var dispV = invFilter === "sold" ? (soldV || []) : invFilter === "active" ? (activeV || []) : (allF || []);
  var kPipeline = ["maintenance", "available", "reserved", "sold"];
  var kColumnMap = { maintenance: { label: "Recondicionamento", color: C.red }, available: { label: "Disponível", color: C.green }, reserved: { label: "Reservado", color: C.yellow }, sold: { label: "Vendido", color: C.blue } };

  // listaContent: Memoized list of vehicle cards to prevent unnecessary re-renders
  var listaContent = useMemo(function() {
    return (dispV || []).map(function(v) {
      var margin = vMargin(v);
      var st = statusMap[v.status] || statusMap.available;
      var imgKey = v.make + " " + v.model;
      return <Card key={v.id} onClick={function() { setSelV(v); }} style={{ cursor: "pointer", overflow: "hidden", opacity: v.status === "sold" ? 0.7 : 1 }}>
        <div style={{ width: "100%", height: "250px", background: "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", aspectRatio: "16 / 9" }}>
          {!imgErr[v.id] ? <img src={v.imageUrl || IMGS[imgKey] || IMGS[v.make + " " + v.model + " " + v.year] || ""} alt="" onError={function() { setImgErr(function(p) { return Object.assign({}, p, { [v.id]: true }); }); }} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} /> : <span style={{ fontSize: 12, color: C.textDim }}>Sem foto</span>}
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
            <div style={{ background: st.color, color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{st.label}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{v.make} {v.model}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{v.year} • {(v.mileage || 0).toLocaleString()} km</div>
            <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginTop: 4 }}>R$ {(v.salePrice || 0).toLocaleString("pt-BR")}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid " + C.border }}>
            <div style={{ fontSize: 11, color: C.textDim }}>Custo: <span style={{ color: C.text, fontWeight: 600 }}>{fmt(totalCosts(v))}</span></div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: margin >= 25 ? C.green : margin >= 15 ? C.yellow : C.red, fontWeight: 700, fontSize: 13 }}>{margin}% margem</div>
              <div style={{ fontSize: 11, color: vProfit(v) >= 0 ? C.green : C.red, marginTop: 2 }}>{fmt(vProfit(v))}</div>
            </div>
          </div>
        </div>
      </Card>;
    });
  }, [dispV, imgErr, statusMap]);

  // kanbanContent: Memoized kanban board columns to prevent unnecessary re-renders
  var kanbanContent = useMemo(function() {
    var safeKPipeline = kPipeline || [];
    var safeAllF = allF || [];
    var safeVehicles = vehicles || [];
    return safeKPipeline.map(function(status) {
      var col = kColumnMap[status];
      var statusVehicles = safeAllF.filter(function(v) { return v.status === status; });
      return <div key={status} onDragOver={function(e) { e.preventDefault(); setDragOverCol(status); }} onDragLeave={function() { setDragOverCol(null); }} onDrop={async function(e) {
        e.preventDefault();
        var vehicleId = e.dataTransfer.getData('vehicleId');

        if (vehicleId) {
          var origVehicle = safeVehicles.find(function(v) { return String(v.id) === vehicleId; });

          if (origVehicle && origVehicle.status === status) {
            setDragOverCol(null);
            setDraggingId(null);
            return;
          }

          setDragOverCol(null);
          setDraggingId(null);
          moveVehicleToStatus(vehicleId, status);
        }
      }} style={{ background: C.surface, border: dragOverCol === status ? "2px dashed " + C.accent : "1px solid " + C.border, borderRadius: 10, overflow: "hidden", transition: "border 0.2s ease" }}>
        <div style={{ background: col.color, color: "#fff", padding: "12px 14px", fontWeight: 600, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{col.label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>({statusVehicles.length})</span>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
          {statusVehicles.length === 0 && <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", opacity: 0.5, marginTop: 20 }}>Vazio</div>}
          {statusVehicles.map(function(v) {
            var imgKey = v.make + " " + v.model;
            var statusIdx = kPipeline.indexOf(v.status);
            return <div key={v.id} draggable={true} onDragStart={function(e) { e.dataTransfer.setData('vehicleId', String(v.id)); setDraggingId(v.id); }} onDragEnd={function() { setDraggingId(null); setDragOverCol(null); }} onClick={function() { setSelV(v); }} style={{ cursor: "grab", opacity: draggingId === v.id ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
              <Card style={{ cursor: "pointer", padding: 10, borderLeft: "4px solid " + col.color, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ width: "150px", height: "150px", background: "linear-gradient(45deg, #e5e7eb, #d1d5db)", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1 / 1", margin: "0 auto" }}>
                  {!imgErr[v.id] ? <img src={v.imageUrl || IMGS[imgKey] || ""} alt="" onError={function() { setImgErr(function(p) { return Object.assign({}, p, { [v.id]: true }); }); }} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} /> : <span style={{ fontSize: 11, color: C.textDim }}>Sem foto</span>}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v.make} {v.model}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{v.year} | {(v.mileage || 0).toLocaleString()} km</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMid, paddingTop: 6, borderTop: "1px solid " + C.border }}>
                  <span><strong style={{ color: vMargin(v) >= 25 ? C.green : vMargin(v) >= 15 ? C.yellow : C.red }}>{vMargin(v)}%</strong></span>
                  <span style={{ color: v.daysInStock > 45 ? C.red : v.daysInStock > 30 ? C.yellow : C.green }}><strong>{v.daysInStock}d</strong></span>
                </div>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4 }}>
                  {statusIdx > 0 && <button onClick={function(e) { e.stopPropagation(); moveVehicle(v.id, -1); }} style={{ padding: "4px 8px", background: C.border, color: C.text, border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>←</button>}
                  {statusIdx < kPipeline.length - 1 && <button onClick={function(e) { e.stopPropagation(); moveVehicle(v.id, 1); }} style={{ padding: "4px 8px", background: C.accent, color: "#fff", border: "none", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>→</button>}
                </div>
              </Card>
            </div>;
          })}
        </div>
      </div>;
    });
  }, [allF, imgErr, kPipeline, kColumnMap, draggingId]);

  if (!user) return <LoginScreen onLogin={function(u) { setUser(u); if (u.access !== "all") setDealer(u.access); }} />;
  var totalStock = activeV.reduce(function(a, v) { return a + totalCosts(v); }, 0);
  var totalProfit = soldV.reduce(function(a, v) { return a + vProfit(v); }, 0);
  var avail = activeV.filter(function(v) { return v.status === "available"; }).length;

  var now = new Date();
  var weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  var expThisWeek = expenses.filter(function(e) { var d = new Date(e.due); return e.status !== "paid" && d <= weekEnd; });
  var expThisWeekTotal = expThisWeek.reduce(function(a, e) { return a + e.value; }, 0);
  var thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  var lastMonth = (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()) + "-" + String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, "0");
  var profitThisMonth = soldV.filter(function(v) { return v.soldDate && v.soldDate.startsWith(thisMonth); }).reduce(function(a, v) { return a + vProfit(v); }, 0);
  var profitLastMonth = soldV.filter(function(v) { return v.soldDate && v.soldDate.startsWith(lastMonth); }).reduce(function(a, v) { return a + vProfit(v); }, 0);

  var months = []; vehicles.forEach(function(v) { if (v.soldDate) { var m = v.soldDate.slice(0, 7); if (months.indexOf(m) === -1) months.push(m); } }); months.sort().reverse();
  var balSold = vehicles.filter(function(v) { return v.status === "sold" && v.soldDate && v.soldDate.startsWith(balMonth); });

  var moveVehicle = function(vehicleId, direction) {
    var v = vehicles.find(x => x.id === vehicleId);
    if (!v) return;
    var idx = kPipeline.indexOf(v.status);
    var newStatus = kPipeline[idx + direction];
    if (!newStatus) return;
    upd(vehicleId, "status", newStatus);
  };

  var moveVehicleToStatus = function(vehicleId, newStatus) {
    if (!newStatus) return;
    // Converter vehicleId para número se for string numérica (para compatibilidade com dados locais/históricos)
    var normalizedId = isNaN(vehicleId) ? vehicleId : Number(vehicleId);
    upd(normalizedId, "status", newStatus);
  };

  var cP = function(l) { return l.filter(function(v) { return v.status === "sold"; }).reduce(function(a, v) { return a + vProfit(v); }, 0); };
  var cR = function(l) { return l.filter(function(v) { return v.status === "sold"; }).reduce(function(a, v) { return a + (v.soldPrice || v.salePrice || 0); }, 0); };
  var cCost = function(l) { return l.filter(function(v) { return v.status === "sold"; }).reduce(function(a, v) { return a + totalCosts(v); }, 0); };

  var tabList = [["dashboard","Dashboard"],["inventory","Estoque"],["financial","Financeiro"],["ipva","IPVA"],["expenses","Gastos Gerais"],["crm","Clientes"],["sourcing","Busca IA"],["whatsapp","WhatsApp IA"]];
  var monthLabel = function(m) { var parts = m.split("-"); var names = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]; return names[parseInt(parts[1])] + " " + parts[0]; };

  // Selected vehicle detail data
  var sv = selV;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      {/* HEADER */}
      <div style={{ background: C.header, borderBottom: "1px solid " + C.headerBorder, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {customLogo ? (
            <img src={customLogo} alt="Logo" style={{ height: 28, width: 'auto', borderRadius: 4 }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>T</div>
          )}
          <span style={{ fontWeight: 700, fontSize: 16, color: C.headerText }}>BrossMotors</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canSwitch && <div style={{ display: "flex", gap: 2, background: "#1e293b", borderRadius: 8, padding: 3, border: "1px solid " + C.headerBorder }}>
            {["all", "BrossMotors", "BMCars"].map(function(d) { return <button key={d} onClick={function() { setDealer(d); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: dealer === d ? C.accent : "transparent", color: dealer === d ? "#fff" : C.headerMuted, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{d === "all" ? "Todas" : d}</button>; })}
          </div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8, border: "1px solid " + C.headerBorder }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{user.icon}</div>
            <span style={{ fontSize: 12, color: C.headerMuted }}>{user.label}</span>
            <button onClick={function() { setShowSettings(true); setTab(""); }} style={{ background: "none", border: "none", color: C.headerMuted, cursor: "pointer", fontSize: 11, marginRight: 4 }}>Config</button>
            <button onClick={async function() {
              try {
                // Notificar backend para blacklist token (logout seguro)
                const token = localStorage.getItem('token');
                if (token) {
                  await authAPI.logout();
                }
              } catch (error) {
                // Mesmo se falhar, fazer logout local (segurança)
              } finally {
                // SEMPRE remover token do localStorage (CRÍTICO!)
                localStorage.removeItem('token');
                setUser(null);
              }
            }} style={{ background: "none", border: "none", color: C.headerMuted, cursor: "pointer", fontSize: 11 }}>Sair</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "0 40px", display: "flex", gap: 0, overflowX: "auto" }}>
        {tabList.map(function(t) { return <button key={t[0]} onClick={function() { setTab(t[0]); setSelV(null); setShowCosts(false); setAddingV(false); }} style={{ padding: "14px 18px", border: "none", borderBottom: tab === t[0] ? "3px solid " + C.accent : "3px solid transparent", background: tab === t[0] ? C.accentLight : "transparent", color: tab === t[0] ? C.accent : C.textDim, fontSize: 12, fontWeight: tab === t[0] ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease" }} onMouseEnter={tab !== t[0] ? function(e) { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surfaceAlt; } : undefined} onMouseLeave={tab !== t[0] ? function(e) { e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = "transparent"; } : undefined}>{t[1]}</button>; })}
      </div>

      <div style={{ padding: "40px 48px", maxWidth: 1380, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (function() {
          var pipelineStatuses = { available: 0, reserved: 0, sold: 0, maintenance: 0 };
          (allF || []).forEach(function(v) { pipelineStatuses[v.status] = (pipelineStatuses[v.status] || 0) + 1; });

          var pipelineSegments = [
            { label: "Disponível", pct: pipelineStatuses.available, color: C.green },
            { label: "Reservado", pct: pipelineStatuses.reserved, color: C.yellow },
            { label: "Vendido", pct: pipelineStatuses.sold, color: C.blue },
            { label: "Recondicionamento", pct: pipelineStatuses.maintenance, color: C.red }
          ];
          var totalPipeline = Object.values(pipelineStatuses).reduce(function(a, b) { return a + b; }, 0);
          pipelineSegments = pipelineSegments.map(function(s) { return Object.assign({}, s, { pct: totalPipeline > 0 ? (s.pct / totalPipeline) * 100 : 0 }); });

          var agingAlerts = (allF || []).filter(function(v) { return v.status !== "sold" && v.daysInStock > 45; }).sort(function(a, b) { return b.daysInStock - a.daysInStock; }).slice(0, 5);

          return <div>
            {/* ROW 1 — 4 STAT CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
              <Stat label="Contas a Pagar" value={fmtFull(expenses.filter(function(e) { return e.status !== "paid"; }).reduce(function(a, e) { return a + (Number(e.amount) || 0); }, 0))} sub={expenses.filter(function(e) { return e.status !== "paid"; }).length + " pendentes"} accent />
              <Stat label="Lucro Bruto" value={plData ? fmtFull(plData.grossProfit) : fmtFull(totalProfit)} sub={soldV.length + " vendidos"} />
              <Stat label="Despesas Gerais" value={plData ? fmtFull(plData.generalExpenses) : fmtFull(expenses.reduce(function(a,e){ return a+(Number(e.amount)||0); },0))} sub="Operacional + fixas" />
              <Stat label="Lucro Liquido" value={plData ? fmtFull(plData.netProfit) : fmtFull(totalProfit - expenses.reduce(function(a,e){ return a+(Number(e.amount)||0); },0))} sub={plData && plData.grossRevenue > 0 ? ("Margem: " + ((plData.netProfit/plData.grossRevenue)*100).toFixed(1) + "%") : ""} />
            </div>

            {/* ROW 2 — 3 COLUNAS: DONUT + BARRAS + TOP MARGENS */}
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* DONUT - PIPELINE */}
              <Card style={{ padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Pipeline</h3>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <MiniDonut segments={pipelineSegments} size={100} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pipelineSegments.map(function(seg, i) {
                    return <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: seg.color }} />
                      <span style={{ fontSize: 12, flex: 1, color: C.textDim }}>{seg.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{seg.pct.toFixed(0)}%</span>
                    </div>;
                  })}
                </div>
              </Card>

              {/* LUCRO POR MÊS - BARRAS */}
              <Card style={{ padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Lucro Últimos 6 Meses</h3>
                {(function() {
                  var months = [];
                  for (var i = 5; i >= 0; i--) {
                    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    var monthStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
                    var monthProfit = (soldV || []).filter(function(v) { return v.soldDate && v.soldDate.startsWith(monthStr); }).reduce(function(a, v) { return a + vProfit(v); }, 0);
                    months.push({ label: monthStr.split("-")[1], label2: "", value: monthProfit, color: monthProfit > 0 ? C.green : C.red });
                  }
                  return <BarChart data={months} height={140} />;
                })()}
              </Card>

              {/* TOP MARGENS */}
              <Card style={{ padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Top 5 - Margem</h3>
                {((soldV || []).slice().sort(function(a, b) { return Number(vMargin(b)) - Number(vMargin(a)); }).slice(0, 5)).map(function(v, i) {
                  return <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                    <div style={{ fontSize: 12, color: C.text }}>{v.make} {v.model}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: vMargin(v) >= 25 ? C.green : C.yellow }}>{vMargin(v)}%</span>
                  </div>;
                })}
              </Card>
            </div>

            {/* ROW 3 — ALERTAS AGING + PRÓXIMOS PAGAMENTOS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* AGING ALERTS */}
              <Card style={{ padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.red }}>⚠️ Veículos em Estoque &gt; 45 dias</h3>
                {agingAlerts.length === 0 ? <div style={{ fontSize: 12, color: C.textDim, padding: "20px 0", textAlign: "center" }}>Sem alertas</div> : agingAlerts.map(function(v) {
                  var severity = v.daysInStock > 60 ? "critical" : v.daysInStock > 45 ? "high" : "medium";
                  return <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: severity === "critical" ? C.redBg : severity === "high" ? C.yellowBg : C.surfaceAlt, borderRadius: 6, borderLeft: "3px solid " + (severity === "critical" ? C.red : severity === "high" ? C.yellow : C.orange || "#f97316"), marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{v.make} {v.model}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{v.year} | {(v.mileage || 0).toLocaleString()} km</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: severity === "critical" ? C.red : C.yellow }}>{v.daysInStock}d</div>
                      <div style={{ fontSize: 10, color: C.textDim }}>em estoque</div>
                    </div>
                  </div>;
                })}
              </Card>

              {/* PRÓXIMOS PAGAMENTOS */}
              <Card style={{ padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Próximos Pagamentos</h3>
                {((expenses || []).filter(function(e) { return e.status !== "paid"; }).sort(function(a, b) { return new Date(a.date || b.date) - new Date(b.date || a.date); }).slice(0, 5)).length === 0 ? <div style={{ fontSize: 12, color: C.textDim, padding: "20px 0", textAlign: "center" }}>Sem pendências</div> : (expenses || []).filter(function(e) { return e.status !== "paid"; }).sort(function(a, b) { return new Date(a.date || b.date) - new Date(b.date || a.date); }).slice(0, 5).map(function(e) {
                  var daysTo = e.date ? Math.ceil((new Date(e.date) - new Date()) / 86400000) : 999;
                  return <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: daysTo < 0 ? C.redBg : daysTo <= 3 ? C.yellowBg : C.surfaceAlt, borderRadius: 6, borderLeft: "3px solid " + (daysTo < 0 ? C.red : daysTo <= 3 ? C.yellow : C.border), marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{e.category}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{e.description || "Sem descrição"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{fmtFull(Number(e.amount) || 0)}</div>
                      <div style={{ fontSize: 10, color: daysTo < 0 ? C.red : daysTo <= 3 ? C.yellow : C.textDim }}>{daysTo < 0 ? "Atrasado" : daysTo === 0 ? "Hoje" : daysTo + "d"}</div>
                    </div>
                  </div>;
                })}
              </Card>
            </div>
          </div>;
        })()}

        {/* INVENTORY LIST / KANBAN */}
        {tab === "inventory" && !sv && <div>
          {stockError && <div style={{ padding: 12, background: C.redBg, border: "1px solid " + C.red, borderRadius: 8, color: C.red, fontSize: 12, fontWeight: 500, marginBottom: 14 }}>⚠️ {stockError}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Inventario --- {dispV.length} veiculos</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 2, background: C.surfaceAlt, borderRadius: 8, padding: 3, border: "1px solid " + C.border }}>
                {[["lista","Lista"],["kanban","Kanban"]].map(function(item) { return <button key={item[0]} onClick={function() { setInvView(item[0]); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: invView === item[0] ? C.accent : "transparent", color: invView === item[0] ? "#fff" : C.textDim, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{item[1]}</button>; })}
              </div>
              <div style={{ display: "flex", gap: 2, background: C.surfaceAlt, borderRadius: 8, padding: 3, border: "1px solid " + C.border }}>
                {[["active","Ativos"],["sold","Vendidos"],["all","Todos"]].map(function(item) { return <button key={item[0]} onClick={function() { setInvFilter(item[0]); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: invFilter === item[0] ? C.accent : "transparent", color: invFilter === item[0] ? "#fff" : C.textDim, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{item[1]}</button>; })}
              </div>
              <button onClick={function() { setAddingV(!addingV); }} style={{ padding: "8px 18px", background: addingV ? C.redBg : C.accent, color: addingV ? C.red : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{addingV ? "Cancelar" : "+ Novo Veiculo"}</button>
            </div>
          </div>
          {addingV && <VehicleForm onAdd={function(nv) { setVehicles(function(p) { return p.concat([nv]); }); setAddingV(false); }} onCancel={function() { setAddingV(false); }} />}

          {invView === "lista" && <div style={{ display: "grid", gap: 10 }}>
            {listaContent}
          </div>}

          {invView === "kanban" && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {kanbanContent}
          </div>}
        </div>}

        {/* VEHICLE DETAIL */}
        {tab === "inventory" && sv && <div>
          <button onClick={function() { setSelV(null); setShowCosts(false); }} style={{ background: C.surface, border: "1px solid " + C.border, color: C.textMid, padding: "7px 16px", borderRadius: 8, cursor: "pointer", marginBottom: 18, fontSize: 12 }}>Voltar</button>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ height: 400, background: "linear-gradient(45deg, #e5e7eb, #d1d5db)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", aspectRatio: "16 / 9" }}>
              {!imgErr[sv.id] ? <img src={sv.imageUrl || IMGS[sv.make + " " + sv.model] || ""} alt="" onError={function() { setImgErr(function(p) { return Object.assign({}, p, { [sv.id]: true }); }); }} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} /> : <span style={{ color: C.textDim }}>Sem foto</span>}

              {/* Overlay gradiente preto no bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "140px", background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)", pointerEvents: "none", zIndex: 5 }} />

              {/* Texto sobreposto */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 26px", color: "#fff", zIndex: 6 }}>
                <h2 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 700 }}>{sv.make} {sv.model} {sv.year}</h2>
                <p style={{ margin: 0, fontSize: 16, opacity: 0.95 }}>{(sv.mileage || 0).toLocaleString()} km • R$ {(sv.salePrice || 0).toLocaleString("pt-BR")}</p>
              </div>

              <input type="file" id={"img-" + sv.id} accept="image/*" style={{ display: "none" }} onChange={async function(e) { if (e.target.files && e.target.files[0]) { var file = e.target.files[0]; var reader = new FileReader(); reader.onload = async function(ev) { try { var base64 = ev.target.result; setImgErr(function(p) { return Object.assign({}, p, { [sv.id]: false }); }); localStorage.setItem("vehicle_img_" + sv.id, base64); try { await inventoryAPI.uploadImage(sv.id, base64); } catch (apiErr) { } alert("Imagem salva com sucesso!"); var updV = vehicles.map(function(v) { return v.id === sv.id ? Object.assign({}, v, { imageUrl: base64 }) : v; }); setVehicles(updV); setSelV(updV.find(function(v) { return v.id === sv.id; })); } catch (err) { alert("Erro ao salvar imagem: " + (err instanceof APIError ? err.message : err.message)); } }; reader.readAsDataURL(file); } }} />
              <label htmlFor={"img-" + sv.id} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600, opacity: 0, transition: "opacity 0.2s ease", zIndex: 10 }} onMouseEnter={function(e) { e.target.style.opacity = 1; }} onMouseLeave={function(e) { e.target.style.opacity = 0; }}>Alterar foto</label>
              {!imgErr[sv.id] && <button onClick={async function() { if (confirm("Deletar esta imagem?")) { try { localStorage.removeItem("vehicle_img_" + sv.id); try { await inventoryAPI.deleteImage(sv.id); } catch (apiErr) { } setImgErr(function(p) { return Object.assign({}, p, { [sv.id]: true }); }); var updV = vehicles.map(function(v) { return v.id === sv.id ? Object.assign({}, v, { imageUrl: null }) : v; }); setVehicles(updV); setSelV(updV.find(function(v) { return v.id === sv.id; })); alert("Imagem deletada com sucesso!"); } catch (err) { alert("Erro ao deletar imagem: " + (err instanceof APIError ? err.message : err.message)); } } }} style={{ position: "absolute", bottom: 16, right: 16, padding: "6px 12px", background: C.red, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", zIndex: 11 }}>Deletar</button>}
            </div>
            <div style={{ padding: 26 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, color: C.textDim }}>{sv.location} • {sv.motor} • {sv.potencia}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <StatusPillGroup
                    vehicle={sv}
                    onStatusChange={function(newStatus) { return updateStatus(sv.id, newStatus); }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Dados</div>
                  <EditField label="Preco de Venda" value={sv.salePrice || 0} onChange={function(val) { upd(sv.id, "salePrice", val); }} type="number" />
                  <EditField label="Km" value={sv.mileage || 0} onChange={function(val) { upd(sv.id, "mileage", val); }} type="number" />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 6, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, color: C.textDim }}>Localizacao</span>
                    <select value={sv.location || "BrossMotors"} onChange={function(e) { upd(sv.id, "location", e.target.value); }} style={{ padding: "6px 8px", border: "1px solid " + C.border, borderRadius: 4, fontSize: 13, fontFamily: FONT, cursor: "pointer", outline: "none", background: "#fff" }}>
                      <option value="BrossMotors">BrossMotors</option>
                      <option value="BMCars">BMCars</option>
                    </select>
                  </div>

                  {/* CUSTOS DINÂMICOS - CARDS FLUTUANTES */}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid " + C.border }}>
                    <CostsList
                      costs={sv.costs || {}}
                      onAddCost={function(category, value) {
                        updCost(sv.id, category, value);
                      }}
                      onEditCost={function(oldCategory, newCategory, value) {
                        var newCosts = Object.assign({}, sv.costs || {});
                        if (oldCategory !== newCategory) {
                          delete newCosts[oldCategory];
                        }
                        newCosts[newCategory] = value;
                        setVehicles(p => p.map(v => v.id === sv.id ? Object.assign({}, v, { costs: newCosts }) : v));
                        setSelV(v => Object.assign({}, v, { costs: newCosts }));
                        (async () => {
                          try {
                            const vehicle = vehicles.find(v => v.id === sv.id);
                            await inventoryAPI.update(sv.id, Object.assign({}, vehicle, { costs: newCosts }));
                            showToast('Custo atualizado com sucesso!', 'success');
                          } catch (err) {
                            console.error('Erro ao atualizar custo:', err);
                            showToast('Erro ao salvar custo', 'error');
                          }
                        })();
                      }}
                      onDeleteCost={function(category) {
                        deleteCost(sv.id, category);
                      }}
                    />
                  </div>
                </Card>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Resumo</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 10px" }}><span style={{ fontSize: 12, color: C.textDim }}>Custo Total</span><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.red }}>{fmtFull(totalCosts(sv))}</span><button onClick={function() { setShowCosts(!showCosts); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: C.accent, fontWeight: 600, padding: "2px 4px" }}>{showCosts ? "−" : "+"}</button></div></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px" }}><span style={{ fontSize: 12, color: C.textDim }}>Venda</span><span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmtFull(sv.soldPrice || sv.salePrice)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderTop: "2px solid " + C.border }}><span style={{ fontWeight: 700 }}>Lucro</span><span style={{ fontSize: 16, fontWeight: 700, color: vProfit(sv) > 0 ? C.green : C.red }}>{fmtFull(vProfit(sv))}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px" }}><span style={{ fontSize: 12, color: C.textDim }}>Margem</span><span style={{ fontWeight: 700, color: vMargin(sv) >= 25 ? C.green : C.yellow }}>{vMargin(sv)}%</span></div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + C.border }}>
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Breakdown de Custos</div>
                    {function() {
                      var costs = sv.costs || {};
                      var total = totalCosts(sv);
                      if (total === 0) return <div style={{ fontSize: 11, color: C.textDim }}>Sem custos</div>;
                      var top = Object.entries(costs).sort((a,b) => (b[1]||0) - (a[1]||0)).slice(0, 3);
                      return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {top.map(([k,v]) => {
                          var pct = total > 0 ? ((v/total)*100).toFixed(0) : 0;
                          var shortKey = k === "Compra do veiculo" ? "Compra" : k.length > 15 ? k.substring(0,12)+"..." : k;
                          return <div key={k}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                              <span style={{ color: C.textDim }}>{shortKey}</span>
                              <span style={{ fontWeight: 600 }}>{pct}%</span>
                            </div>
                            <div style={{ height: 3, background: C.borderLight, borderRadius: 1 }}>
                              <div style={{ height: "100%", background: C.accent, borderRadius: 1, width: pct+"%" }} />
                            </div>
                          </div>;
                        })}
                      </div>;
                    }()}
                  </div>
                </Card>
              </div>
              {sv.status === "sold" && sv.soldTo && <div style={{ padding: 14, background: C.blueBg, borderRadius: 10, border: "1px solid " + C.blue + "20", marginTop: 8 }}>
                <div style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>Vendido para {sv.soldTo} em {sv.soldDate ? new Date(sv.soldDate).toLocaleDateString("pt-BR") : "---"}</div>
                {sv.docs && sv.docs.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>{sv.docs.map(function(d, i) { return <Tag key={i} color={C.accent} bg={C.accentLight}>{d}</Tag>; })}</div>}
              </div>}
              <button onClick={async function() { if (confirm("Tem certeza que deseja deletar este veiculo?")) { try { await inventoryAPI.delete(sv.id); setVehicles(function(p) { return p.filter(function(v) { return v.id !== sv.id; }); }); setSelV(null); } catch (err) { alert("Erro ao deletar: " + (err instanceof APIError ? err.message : err.message)); } } }} style={{ width: "100%", padding: "12px 16px", background: C.redBg, color: C.red, border: "1px solid " + C.red, borderRadius: 8, cursor: "pointer", marginTop: 16, fontSize: 13, fontWeight: 600 }}>Deletar Veiculo</button>
            </div>
          </Card>
        </div>}

        {/* SOURCING */}
        {tab === "sourcing" && <div>
          <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 600 }}>Busca Inteligente IA</h2>

          {/* BUSCA POR DESCRIÇÃO (AI-POWERED) */}
          <Card style={{ padding: 20, marginBottom: 20, background: C.accentLight, border: "1px solid " + C.accent }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: C.accent }}>🤖 Descreva o carro que procura</h3>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: C.textDim }}>Exemplo: "Civic 2020 automático até 80 mil" ou "BMW M3 branco, pouco km"</p>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr auto" }}>
              <input
                type="text"
                placeholder="Descreva o veículo em linguagem natural..."
                value={aiSearchInput}
                onChange={function(e) { setAiSearchInput(e.target.value); }}
                onKeyPress={function(e) { if (e.key === "Enter" && !aiSearchLoading && aiSearchInput.trim()) performAiSearch(); }}
                style={{ padding: "12px 14px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none" }}
              />
              <button
                onClick={function() {
                  if (!aiSearchInput.trim()) {
                    showToast("Digite algo para buscar", "error");
                    return;
                  }
                  performAiSearch();
                }}
                disabled={aiSearchLoading}
                style={{ padding: "12px 20px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: aiSearchLoading ? "default" : "pointer", opacity: aiSearchLoading ? 0.6 : 1, transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}
                onMouseEnter={aiSearchLoading ? undefined : function(e) { e.currentTarget.style.background = "#1e40af"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(29,78,216,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={aiSearchLoading ? undefined : function(e) { e.currentTarget.style.background = C.accent; e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,78,216,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {aiSearchLoading ? "Analisando..." : "Buscar"}
              </button>
            </div>
          </Card>

          {/* RESULTADO DA BUSCA IA */}
          {aiSearchResult && (
            <Card style={{ padding: 20, marginBottom: 20, background: C.greenBg, borderLeft: "4px solid " + C.green }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.green, marginBottom: 10 }}>✅ Resumo da Busca</div>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 16, lineHeight: 1.5 }}>{aiSearchResult.summary}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12 }}>Total de {aiSearchResult.totalFound} opções encontradas.</div>
              <button
                onClick={function() { setAiSearchResult(null); setSourcing(aiSearchResult.vehicles); }}
                style={{ padding: "8px 14px", background: C.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Ver Resultados Completos
              </button>
            </Card>
          )}

          {/* MINHAS BUSCAS SALVAS */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: "uppercase", color: C.textDim }}>Minhas Buscas Salvas</h3>
              <button onClick={function() { setSelectedSavedSearch({ name: "", alertWhatsapp: false, alertEmail: false, whatsappNumber: "", emailAddress: "" }); setShowSaveSearch(true); }} style={{ padding: "6px 12px", background: C.green, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                + Nova Busca
              </button>
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {savedSearches.length === 0 ? (
                <Card style={{ padding: "24px 20px", textAlign: "center", gridColumn: "1 / -1" }}>
                  <div style={{ color: C.textDim, fontSize: 13 }}>Nenhuma busca salva. Crie uma nova para receber alertas automáticos.</div>
                </Card>
              ) : (
                savedSearches.map(function(ss) {
                  return <Card key={ss.id} style={{ padding: "14px 16px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{ss.name}</div>
                        <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>
                          {ss.isActive ? "Ativa" : "Pausada"}
                        </div>
                      </div>
                      {ss.pendingAlerts > 0 && <div style={{ background: C.red, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{ss.pendingAlerts} novo</div>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                      <button onClick={async function() {
                        try {
                          const result = await savedSearchesAPI.runAndNotify(ss.id);
                          if (result.newCount > 0) {
                            showToast(`✅ ${result.newCount} novo(s) encontrado(s)!`, "success");
                            if (result.whatsappMessage) {
                              showToast(`💬 MSG: "${result.whatsappMessage.substring(0, 50)}..."`, "success");
                            }
                          } else {
                            showToast("Nenhuma novidade por enquanto", "success");
                          }
                          // Recarregar buscas salvas
                          const updated = await savedSearchesAPI.list();
                          if (updated && updated.searches) setSavedSearches(updated.searches);
                        } catch (err) {
                          showToast("Erro ao executar busca", "error");
                        }
                      }} style={{ padding: "6px 10px", background: C.accentLight, color: C.accent, border: "1px solid " + C.accent, borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        ⚡ Rodar Agora
                      </button>
                      <button onClick={async function() {
                        try {
                          await savedSearchesAPI.delete(ss.id);
                          setSavedSearches(savedSearches.filter(s => s.id !== ss.id));
                          showToast("Busca removida");
                        } catch (err) {
                          showToast("Erro ao remover busca", "error");
                        }
                      }} style={{ padding: "6px 10px", background: C.redBg, color: C.red, border: "1px solid " + C.red, borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        🗑 Deletar
                      </button>
                    </div>
                  </Card>;
                })
              )}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid " + C.border, margin: "24px 0" }} />

          <Card style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, textTransform: "uppercase", color: C.textDim }}>Filtros</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <input placeholder="Marca" value={sourcingFilters.make} onChange={function(e) { setSourcingFilters(Object.assign({}, sourcingFilters, { make: e.target.value })); }} style={{ padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, outline: "none" }} />
              <input placeholder="Modelo" value={sourcingFilters.model} onChange={function(e) { setSourcingFilters(Object.assign({}, sourcingFilters, { model: e.target.value })); }} style={{ padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, outline: "none" }} />
              <input placeholder="Preco min" type="number" value={sourcingFilters.priceMin} onChange={function(e) { setSourcingFilters(Object.assign({}, sourcingFilters, { priceMin: e.target.value })); }} style={{ padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, outline: "none" }} />
              <input placeholder="Preco max" type="number" value={sourcingFilters.priceMax} onChange={function(e) { setSourcingFilters(Object.assign({}, sourcingFilters, { priceMax: e.target.value })); }} style={{ padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, outline: "none" }} />
              <input placeholder="KM max" type="number" value={sourcingFilters.kmMax} onChange={function(e) { setSourcingFilters(Object.assign({}, sourcingFilters, { kmMax: e.target.value })); }} style={{ padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, outline: "none" }} />
              <input placeholder="Desconto min" type="number" value={sourcingFilters.discountMin} onChange={function(e) { setSourcingFilters(Object.assign({}, sourcingFilters, { discountMin: e.target.value })); }} style={{ padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: FONT, outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <button onClick={searchSourcing} disabled={sourcingLoading} style={{ padding: "10px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: sourcingLoading ? "default" : "pointer", opacity: sourcingLoading ? 0.6 : 1 }}>
                {sourcingLoading ? "Buscando..." : "Buscar"}
              </button>
              <button onClick={function() { setSourcingFilters({ make: "", model: "", priceMin: "", priceMax: "", kmMax: "", discountMin: "" }); setSourcing([]); }} style={{ padding: "10px 16px", background: C.surfaceAlt, color: C.textMid, border: "1px solid " + C.border, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Limpar
              </button>
              <button onClick={function() { setSelectedSavedSearch({ name: "", alertWhatsapp: false, alertEmail: false, whatsappNumber: "", emailAddress: "" }); setShowSaveSearch(true); }} style={{ padding: "10px 16px", background: C.green, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Salvar Busca
              </button>
            </div>
          </Card>
          <div style={{ display: "grid", gap: 12 }}>
            {sourcing.length === 0 ? <Card style={{ padding: "40px 20px", textAlign: "center" }}><div style={{ color: C.textDim, fontSize: 14 }}>Nenhum veiculo encontrado. Use o filtro acima para buscar.</div></Card> : sourcing.map(function(s) { var sc = sColor(s.score); return <Card key={s.id} style={{ padding: "18px 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", alignItems: "center", gap: 14 }}>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.make} {s.model} {s.year}</div><div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{s.platform} | {s.location} | {s.km.toLocaleString()} km</div></div>
                <div><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Preco</div><div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>R$ {(s.price/1000).toFixed(0)}K</div></div>
                <div><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>FIPE</div><div style={{ fontWeight: 600, color: C.textMid, fontSize: 13, marginTop: 2 }}>R$ {(s.fipe/1000).toFixed(0)}K</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: s.discount <= -15 ? C.green : s.discount <= -10 ? C.yellow : C.textDim }}>{s.discount.toFixed(0)}%</div></div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "conic-gradient(" + sc + " " + (s.score * 3.6) + "deg, " + C.borderLight + " 0deg)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: sc }}>{s.score}</div></div>
                  <div style={{ fontSize: 9, color: sc, fontWeight: 600 }}>{sLabel(s.score)}</div>
                </div>
              </div>
            </Card>; })}
          </div>
        </div>}

        {/* WHATSAPP */}
        {tab === "whatsapp" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ background: "#075e54", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>T</div><div><div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>BrossMotors Bot</div><div style={{ color: "#8bc99a", fontSize: 11 }}>online</div></div></div>
            <div style={{ padding: 14, maxHeight: 480, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, background: "#e5ddd5" }}>
              {WA_MSGS.map(function(m, i) { return <div key={i} style={{ alignSelf: m.from === "vendedor" ? "flex-end" : "flex-start", maxWidth: "82%" }}><div style={{ background: m.from === "vendedor" ? "#dcf8c6" : "#fff", borderRadius: 8, padding: "8px 12px", boxShadow: "0 1px 1px rgba(0,0,0,0.08)" }}><div style={{ fontSize: 12, color: "#303030", whiteSpace: "pre-line", lineHeight: 1.55 }}>{m.text}</div><div style={{ fontSize: 10, color: "#999", textAlign: "right", marginTop: 3 }}>{m.time}</div></div></div>; })}
            </div>
          </Card>
          <Card style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 600 }}>Como Funciona</h3>
            {["Vendedor envia dados pelo WhatsApp", "Bot consulta FIPE e historico", "Sugestao de preco em segundos", "Cadastro direto no sistema"].map(function(t, i) { return <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{i + 1}</div><div style={{ fontSize: 13, color: C.textMid, paddingTop: 4 }}>{t}</div></div>; })}
          </Card>
        </div>}

        {/* FINANCIAL */}
        {tab === "financial" && <div>
          <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 600 }}>Financeiro</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Receita</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{fmtFull(plData?.grossRevenue || 0)}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Custo Total</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{fmtFull(plData?.totalVehicleCosts || 0)}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Lucro Bruto</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{fmtFull((plData?.grossRevenue || 0) - (plData?.totalVehicleCosts || 0))}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Despesas</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{fmtFull(plData?.generalExpenses || 0)}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Lucro Líquido</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: (plData?.netProfit || 0) > 0 ? C.green : C.red }}>{fmtFull(plData?.netProfit || 0)}</div>
            </Card>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid " + C.border, paddingBottom: 12 }}>
            <button onClick={function() { setFinSub('overview'); }} style={{ padding: "8px 12px", background: finSub === 'overview' ? C.accent : "transparent", color: finSub === 'overview' ? "#fff" : C.textMid, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Visão Geral</button>
            <button onClick={function() { setFinSub('vehicles'); }} style={{ padding: "8px 12px", background: finSub === 'vehicles' ? C.accent : "transparent", color: finSub === 'vehicles' ? "#fff" : C.textMid, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Por Veículo</button>
            <button onClick={function() { setFinSub('byloja'); }} style={{ padding: "8px 12px", background: finSub === 'byloja' ? C.accent : "transparent", color: finSub === 'byloja' ? "#fff" : C.textMid, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Comparar Lojas</button>
            <button onClick={function() { setFinSub('monthly'); }} style={{ padding: "8px 12px", background: finSub === 'monthly' ? C.accent : "transparent", color: finSub === 'monthly' ? "#fff" : C.textMid, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Mensal</button>
          </div>

          {finSub === 'overview' && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Lucro - 6 Meses</h3>
              {(function() {
                var months = [];
                for (var i = 5; i >= 0; i--) {
                  var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  var monthStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
                  var monthProfit = (soldV || []).filter(function(v) { return v.soldDate && v.soldDate.startsWith(monthStr); }).reduce(function(a, v) { return a + vProfit(v); }, 0);
                  months.push({ label: monthStr.split("-")[1], label2: "", value: monthProfit, color: monthProfit > 0 ? C.green : C.red });
                }
                return <BarChart data={months} height={140} />;
              })()}
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Top 5 - Margem</h3>
              {((soldV || []).slice().sort(function(a, b) { return Number(vMargin(b)) - Number(vMargin(a)); }).slice(0, 5)).map(function(v, i) {
                return <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid " + C.border : "none" }}>
                  <div style={{ fontSize: 12, color: C.text }}>{v.make} {v.model}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: vMargin(v) >= 25 ? C.green : C.yellow }}>{vMargin(v)}%</span>
                </div>;
              })}
            </Card>
          </div>}

          {finSub === 'vehicles' && <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Veículos Vendidos</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.accent, borderBottom: "2px solid " + C.accent }}>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: 600, color: "#fff" }}>Veículo</th>
                    <th style={{ padding: "14px", textAlign: "right", fontWeight: 600, color: "#fff" }}>Compra</th>
                    <th style={{ padding: "14px", textAlign: "right", fontWeight: 600, color: "#fff" }}>Custos</th>
                    <th style={{ padding: "14px", textAlign: "right", fontWeight: 600, color: "#fff" }}>Venda</th>
                    <th style={{ padding: "14px", textAlign: "right", fontWeight: 600, color: "#fff" }}>Lucro</th>
                    <th style={{ padding: "14px", textAlign: "center", fontWeight: 600, color: "#fff" }}>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {(soldV || []).map(function(v, i) {
                    return <tr key={v.id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#ffffff", borderBottom: "1px solid " + C.border, transition: "background 0.2s" }} onMouseEnter={function(e) { e.currentTarget.style.background = "#f0f9ff"; }} onMouseLeave={function(e) { e.currentTarget.style.background = i % 2 === 0 ? "#f9fafb" : "#ffffff"; }}>
                      <td style={{ padding: "14px" }}>{v.make} {v.model} {v.year}</td>
                      <td style={{ padding: "14px", textAlign: "right" }}>{fmtFull(v.purchasePrice || 0)}</td>
                      <td style={{ padding: "14px", textAlign: "right" }}>{fmtFull(totalCosts(v))}</td>
                      <td style={{ padding: "14px", textAlign: "right", fontWeight: 600 }}>{fmtFull(v.soldPrice || v.salePrice || 0)}</td>
                      <td style={{ padding: "14px", textAlign: "right", fontWeight: 700, color: vProfit(v) > 0 ? C.green : C.red }}>{fmtFull(vProfit(v))}</td>
                      <td style={{ padding: "14px", textAlign: "center", fontWeight: 600, color: vMargin(v) >= 25 ? C.green : C.yellow }}>{vMargin(v)}%</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </Card>}

          {finSub === 'byloja' && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {(function() {
              var lojas = [
                { label: "BrossMotors", location: "BrossMotors" },
                { label: "BMCars", location: "BMCars" }
              ];
              return lojas.map(function(loja) {
                var lojaVehicles = (vehicles || []).filter(function(v) { return v.location === loja.location; });
                var lojaSold = lojaVehicles.filter(function(v) { return v.status === "sold"; });
                var lojaRevenue = lojaSold.reduce(function(a, v) { return a + (v.soldPrice || v.salePrice || 0); }, 0);
                var lojaCosts = lojaSold.reduce(function(a, v) { return a + totalCosts(v); }, 0);
                var lojaProfit = lojaRevenue - lojaCosts;
                return <Card key={loja.location} style={{ padding: 20 }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>{loja.label}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Faturamento</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>{fmtFull(lojaRevenue)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Custos</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.red }}>{fmtFull(lojaCosts)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Lucro</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: lojaProfit > 0 ? C.green : C.red }}>{fmtFull(lojaProfit)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Vendas</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>{lojaSold.length}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, borderTop: "1px solid " + C.border, paddingTop: 12, color: C.textDim }}>
                    Margem média: <strong style={{ color: C.text }}>{lojaSold.length > 0 ? ((lojaProfit / lojaRevenue) * 100).toFixed(1) : 0}%</strong>
                  </div>
                </Card>;
              });
            })()}
          </div>}

          {finSub === 'monthly' && <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Relatório Mensal</h3>
            <div style={{ display: "grid", gridTemplateColumns: "100px 100px 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Mês</label>
                <input type="number" min="1" max="12" value={finMonth} onChange={function(e) { setFinMonth(Number(e.target.value)); }} style={{ width: "100%", padding: "8px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Ano</label>
                <input type="number" value={finYear} onChange={function(e) { setFinYear(Number(e.target.value)); }} style={{ width: "100%", padding: "8px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button onClick={function() { loadFinancialMonthly(); }} style={{ width: "100%", padding: "8px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Carregar</button>
              </div>
            </div>
            {finMonthlyData && finMonthlyData.length > 0 ? <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.accent, borderBottom: "2px solid " + C.accent }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#fff" }}>Descrição</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#fff" }}>Valor</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#fff" }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {finMonthlyData.map(function(t, i) {
                    return <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#ffffff", borderBottom: "1px solid " + C.border, transition: "background 0.2s" }} onMouseEnter={function(e) { e.currentTarget.style.background = "#f0f9ff"; }} onMouseLeave={function(e) { e.currentTarget.style.background = i % 2 === 0 ? "#f9fafb" : "#ffffff"; }}>
                      <td style={{ padding: "12px" }}>{t.description || "-"}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: t.type === 'income' ? C.green : C.red }}>{fmtFull(t.amount || 0)}</td>
                      <td style={{ padding: "12px" }}>{t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div> : <div style={{ fontSize: 12, color: C.textDim, padding: "20px", textAlign: "center" }}>Sem dados para o período</div>}
          </Card>}
        </div>}

        {/* IPVA */}
        {tab === "ipva" && <div>
          <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 600 }}>IPVA</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Total Pendente</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.yellow }}>{ipvaSummary?.pending || 0}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{fmtFull((ipvaSummary?.pending_amount || 0))}</div>
            </Card>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Urgente (&lt; 15d)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.red }}>{ipvaSummary?.urgent || 0}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{fmtFull((ipvaSummary?.urgent_amount || 0))}</div>
            </Card>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Pagos</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.green }}>{ipvaSummary?.paid || 0}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{fmtFull((ipvaSummary?.paid_amount || 0))}</div>
            </Card>
          </div>

          <div style={{ marginBottom: 20 }}>
            <button onClick={function() { setShowIpvaForm(showIpvaForm ? null : 'new'); }} style={{ padding: "10px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {showIpvaForm ? "Cancelar" : "+ Registrar IPVA"}
            </button>

            {showIpvaForm && <Card style={{ padding: 16, marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Veiculo</label>
                  <select value={ipvaFormVehicleId} onChange={function(e) { setIpvaFormVehicleId(e.target.value); }} style={{ width: "100%", padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }}>
                    <option value="">Selecione um veículo...</option>
                    {vehicles.map(function(v) { return <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year})</option>; })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Estado</label>
                  <select value={ipvaFormState} onChange={function(e) { setIpvaFormState(e.target.value); }} style={{ width: "100%", padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }}>
                    <option value="SP">SP (4%)</option>
                    <option value="SC">SC (2%)</option>
                    <option value="RJ">RJ (3%)</option>
                    <option value="MG">MG (3.5%)</option>
                    <option value="RS">RS (3%)</option>
                    <option value="PR">PR (3.5%)</option>
                    <option value="BA">BA (3%)</option>
                    <option value="PE">PE (3.5%)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Ano</label>
                  <input type="number" value={ipvaFormYear} onChange={function(e) { setIpvaFormYear(Number(e.target.value)); }} style={{ width: "100%", padding: "8px 10px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }} />
                </div>
              </div>
              <button onClick={async function() { if (!ipvaFormVehicleId || !ipvaFormState || !ipvaFormYear) return; try { const result = await ipvaAPI.create(ipvaFormVehicleId, { state: ipvaFormState, year: ipvaFormYear }); setIpvaList([...ipvaList, result]); setShowIpvaForm(null); setIpvaFormVehicleId(''); setIpvaFormState('SP'); setIpvaFormYear(new Date().getFullYear()); alert('IPVA registrado com sucesso!'); } catch (err) { alert('Erro ao registrar IPVA: ' + err.message); } }} style={{ width: "100%", padding: "10px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Registrar</button>
            </Card>}
          </div>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.accent, borderBottom: "2px solid " + C.accent }}>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: 600, color: "#fff", textTransform: "uppercase", fontSize: 11 }}>Veículo</th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: 600, color: "#fff", textTransform: "uppercase", fontSize: 11 }}>Estado</th>
                    <th style={{ padding: "14px", textAlign: "right", fontWeight: 600, color: "#fff", textTransform: "uppercase", fontSize: 11 }}>Alíquota</th>
                    <th style={{ padding: "14px", textAlign: "right", fontWeight: 600, color: "#fff", textTransform: "uppercase", fontSize: 11 }}>Valor</th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: 600, color: "#fff", textTransform: "uppercase", fontSize: 11 }}>Vencimento</th>
                    <th style={{ padding: "14px", textAlign: "center", fontWeight: 600, color: "#fff", textTransform: "uppercase", fontSize: 11 }}>Status</th>
                    <th style={{ padding: "14px", textAlign: "center" }} />
                  </tr>
                </thead>
                <tbody>
                  {ipvaList.length === 0 ? <tr><td colSpan="7" style={{ padding: "20px", textAlign: "center", color: C.textDim }}>Sem registros</td></tr> : ipvaList.map(function(ipva, i) {
                    var daysTo = ipva.due_date ? Math.ceil((new Date(ipva.due_date) - new Date()) / 86400000) : 999;
                    var statusColor = ipva.status === 'paid' ? C.green : daysTo <= 15 ? C.red : C.yellow;
                    var statusLabel = ipva.status === 'paid' ? 'Pago' : daysTo <= 15 ? 'Urgente' : 'Pendente';
                    return <tr key={ipva.id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#ffffff", borderBottom: "1px solid " + C.border, transition: "background 0.2s" }} onMouseEnter={function(e) { e.currentTarget.style.background = "#f0f9ff"; }} onMouseLeave={function(e) { e.currentTarget.style.background = i % 2 === 0 ? "#f9fafb" : "#ffffff"; }}>
                      <td style={{ padding: "14px" }}>{ipva.vehicle_make || ""} {ipva.vehicle_model || ""}</td>
                      <td style={{ padding: "14px" }}>{ipva.state || ""}</td>
                      <td style={{ padding: "14px", textAlign: "right" }}>{ipva.aliquota || 0}%</td>
                      <td style={{ padding: "14px", textAlign: "right", fontWeight: 600 }}>{fmtFull(ipva.ipva_due || 0)}</td>
                      <td style={{ padding: "14px" }}>{ipva.due_date ? new Date(ipva.due_date).toLocaleDateString("pt-BR") : "-"}</td>
                      <td style={{ padding: "14px", textAlign: "center" }}><span style={{ background: statusColor + "22", color: statusColor, padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{statusLabel}</span></td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        {ipva.status !== 'paid' && <button onClick={async function() { try { await ipvaAPI.markPaid(ipva.id); setIpvaList(ipvaList.map(function(i) { return i.id === ipva.id ? Object.assign({}, i, { status: 'paid' }) : i; })); } catch (err) { alert('Erro: ' + err.message); } }} style={{ padding: "6px 10px", background: C.greenBg, color: C.green, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 600, marginRight: 4, transition: "opacity 0.2s" }} onMouseEnter={function(e) { e.currentTarget.style.opacity = "0.8"; }} onMouseLeave={function(e) { e.currentTarget.style.opacity = "1"; }}>Pagar</button>}
                        <button onClick={async function() { if (confirm("Deletar IPVA?")) { try { await ipvaAPI.delete(ipva.id); setIpvaList(ipvaList.filter(function(i) { return i.id !== ipva.id; })); } catch (err) { alert('Erro: ' + err.message); } } }} style={{ padding: "6px 10px", background: C.redBg, color: C.red, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 600, transition: "opacity 0.2s" }} onMouseEnter={function(e) { e.currentTarget.style.opacity = "0.8"; }} onMouseLeave={function(e) { e.currentTarget.style.opacity = "1"; }}>Deletar</button>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>}

        {/* GASTOS GERAIS */}
        {tab === "expenses" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Gastos Gerais</h2>
            <button onClick={function() { setAddingExp(!addingExp); }} style={{ padding: "8px 18px", background: addingExp ? C.redBg : C.accent, color: addingExp ? C.red : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{addingExp ? "Cancelar" : "+ Nova Despesa"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
            <Stat label="Total Despesas" value={fmtFull(expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0))} accent />
            <Stat label="Pendente" value={fmtFull(expenses.filter(e => e.status !== "paid").reduce((a, e) => a + (Number(e.amount) || 0), 0))} />
            <Stat label="Pago" value={fmtFull(expenses.filter(e => e.status === "paid").reduce((a, e) => a + (Number(e.amount) || 0), 0))} />
          </div>
          {addingExp && <Card style={{ padding: 22, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" }}>Categoria</label><select value={expForm.category || "Operacional"} onChange={function(e) { setExpForm(Object.assign({}, expForm, { category: e.target.value, customCategory: "" })); }} style={{ width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, cursor: "pointer" }}><option>Operacional</option><option>Aluguel</option><option>Financiamento</option><option>IPVA</option><option>Seguro</option><option value="__custom__">Personalizado...</option></select></div>
              {expForm.category === "__custom__" && <div><label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" }}>Nome da Categoria</label><input type="text" value={expForm.customCategory || ""} onChange={function(e) { setExpForm(Object.assign({}, expForm, { customCategory: e.target.value })); }} placeholder="Ex: Manutenção, Publicidade..." style={{ width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} /></div>}
              <div><label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" }}>Descricao</label><input value={expForm.description} onChange={function(e) { setExpForm(Object.assign({}, expForm, { description: e.target.value })); }} style={{ width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} /></div>
              <div><label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" }}>Valor</label><input type="number" value={expForm.amount} onChange={function(e) { setExpForm(Object.assign({}, expForm, { amount: Number(e.target.value) || 0 })); }} style={{ width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} /></div>
              <div><label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" }}>Data</label><input type="date" value={expForm.date} onChange={function(e) { setExpForm(Object.assign({}, expForm, { date: e.target.value })); }} style={{ width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" }}>Status</label><select value={expForm.status} onChange={function(e) { setExpForm(Object.assign({}, expForm, { status: e.target.value })); }} style={{ width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, cursor: "pointer" }}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="urgent">Urgente</option></select></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={async function() { if (!expForm.category || !expForm.amount) return; if (expForm.category === "__custom__" && !expForm.customCategory) { alert("Por favor, digite o nome da categoria personalizada"); return; } try { var finalForm = Object.assign({}, expForm); if (expForm.category === "__custom__") { finalForm.category = expForm.customCategory; delete finalForm.customCategory; } var result = await expensesAPI.create(finalForm); if (result && result.expense) { setExpenses(function(p) { return p.concat([result.expense]); }); setExpForm({ category: "Operacional", description: "", amount: 0, status: "pending", date: new Date().toISOString().split("T")[0], customCategory: "" }); setAddingExp(false); } } catch (err) { alert("Erro ao adicionar despesa: " + (err instanceof APIError ? err.message : err.message)); } }} style={{ padding: "10px 24px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Adicionar Despesa</button>
              <button onClick={function() { setAddingExp(false); }} style={{ padding: "10px 24px", background: C.redBg, color: C.red, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            </div>
          </Card>}
          <div style={{ display: "grid", gap: 12 }}>
            {expenses.length > 0 ? expenses.map(function(e) {
              var st = expStatusMap[e.status] || { label: e.status, color: C.textDim, bg: C.surfaceAlt };
              return <Card key={e.id} style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.category}</div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{e.description || "Sem descricao"} — {e.date ? new Date(e.date).toLocaleDateString("pt-BR") : "---"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.red }}>{fmtFull(Number(e.amount))}</div>
                    <Tag color={st.color} bg={st.bg}>{st.label}</Tag>
                  </div>
                  <button onClick={async function() { if (confirm("Deletar esta despesa?")) { try { await expensesAPI.delete(e.id); setExpenses(function(p) { return p.filter(function(x) { return x.id !== e.id; }); }); } catch (err) { alert("Erro ao deletar: " + (err instanceof APIError ? err.message : err.message)); } } }} style={{ padding: "4px 10px", background: C.redBg, color: C.red, border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Del</button>
                </div>
              </Card>;
            }) : <Card style={{ padding: 20, textAlign: "center", color: C.textDim }}>
              Nenhuma despesa registrada
            </Card>}
          </div>
        </div>}

        {tab === "crm" && <CrmTab customers={customers} setCustomers={setCustomers} />}

        {showSettings && <div>
          <button onClick={function() { setShowSettings(false); }} style={{ background: C.surface, border: "1px solid " + C.border, color: C.textMid, padding: "7px 16px", borderRadius: 8, cursor: "pointer", marginBottom: 18, fontSize: 12 }}>Voltar</button>
          <Card style={{ padding: 26, maxWidth: 500 }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700 }}>Configuracoes</h2>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Logo da Empresa</h3>
              {customLogo && <div style={{ marginBottom: 12, padding: 12, background: C.surfaceAlt, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <img src={customLogo} alt="Logo atual" style={{ height: 32, width: 'auto', borderRadius: 4 }} />
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>Logo definida</div>
                </div>
                <button onClick={function() { setCustomLogo(null); localStorage.removeItem('customLogo'); }} style={{ padding: "6px 12px", background: C.redBg, color: C.red, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remover</button>
              </div>}
              <label style={{ display: "block", padding: "10px 14px", border: "2px dashed " + C.border, borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 12, color: C.textMid, transition: "all 0.2s" }}>
                + Fazer upload de imagem (PNG, SVG, JPG)
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { if (e.target.files && e.target.files[0]) { var file = e.target.files[0]; var reader = new FileReader(); reader.onload = function(ev) { var base64 = ev.target.result; setCustomLogo(base64); localStorage.setItem('customLogo', base64); }; reader.readAsDataURL(file); } }} />
              </label>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Alterar Senha</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: C.textDim, marginBottom: 6 }}>Senha Atual</label>
                <input type="password" value={changePassForm.oldPass} onChange={function(e) { setChangePassForm(Object.assign({}, changePassForm, { oldPass: e.target.value })); }} style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: C.textDim, marginBottom: 6 }}>Nova Senha</label>
                <input type="password" value={changePassForm.newPass} onChange={function(e) { setChangePassForm(Object.assign({}, changePassForm, { newPass: e.target.value })); }} style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: C.textDim, marginBottom: 6 }}>Confirmar Nova Senha</label>
                <input type="password" value={changePassForm.confirmPass} onChange={function(e) { setChangePassForm(Object.assign({}, changePassForm, { confirmPass: e.target.value })); }} style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
              </div>
              {changePassMsg && <div style={{ padding: 12, borderRadius: 8, marginBottom: 14, background: changePassMsg.includes("sucesso") ? C.greenBg : C.redBg, color: changePassMsg.includes("sucesso") ? C.green : C.red, fontSize: 12 }}>{changePassMsg}</div>}
              <button onClick={async function() { if (!changePassForm.oldPass || !changePassForm.newPass || !changePassForm.confirmPass) { setChangePassMsg("Todos os campos sao obrigatorios"); return; } if (changePassForm.newPass !== changePassForm.confirmPass) { setChangePassMsg("As senhas nao coincidem"); return; } try { setChangePassMsg("Atualizando..."); await authAPI.changePassword(changePassForm.oldPass, changePassForm.newPass); setChangePassMsg("Senha alterada com sucesso!"); setChangePassForm({ oldPass: "", newPass: "", confirmPass: "" }); } catch (err) { setChangePassMsg("Erro: " + (err instanceof APIError ? err.message : err.message)); } }} style={{ width: "100%", padding: "12px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Alterar Senha</button>
            </div>

            <div style={{ borderTop: "1px solid " + C.border, paddingTop: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Informacoes da Conta</h3>
              <div style={{ display: "grid", gap: 10 }}>
                <div><span style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase" }}>Usuario</span><div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginTop: 4 }}>{user.label}</div></div>
                <div><span style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase" }}>Perfil</span><div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginTop: 4 }}>{user.role}</div></div>
                <div><span style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase" }}>Email</span><div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginTop: 4 }}>{user.user}</div></div>
                <div><span style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase" }}>Acesso</span><div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginTop: 4 }}>{user.dealership === "all" ? "Todas as lojas" : user.dealership}</div></div>
              </div>
            </div>
          </Card>
        </div>}
      </div>

      {/* MODAL: SALVAR BUSCA */}
      {showSaveSearch && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}>
        <Card style={{ width: 400, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>Salvar Esta Busca</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.textDim, marginBottom: 6, fontWeight: 600 }}>Nome da Busca</label>
            <input
              type="text"
              placeholder="Ex: BMW M3 até 400K"
              value={selectedSavedSearch?.name || ""}
              onChange={function(e) { setSelectedSavedSearch({ ...selectedSavedSearch, name: e.target.value }); }}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedSavedSearch?.alertWhatsapp || false}
                onChange={function(e) { setSelectedSavedSearch({ ...selectedSavedSearch, alertWhatsapp: e.target.checked }); }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              Alerta WhatsApp
            </label>
          </div>

          {selectedSavedSearch?.alertWhatsapp && <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.textDim, marginBottom: 6, fontWeight: 600 }}>Número WhatsApp</label>
            <input
              type="text"
              placeholder="11 999999999"
              value={selectedSavedSearch?.whatsappNumber || ""}
              onChange={function(e) { setSelectedSavedSearch({ ...selectedSavedSearch, whatsappNumber: e.target.value }); }}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }}
            />
          </div>}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedSavedSearch?.alertEmail || false}
                onChange={function(e) { setSelectedSavedSearch({ ...selectedSavedSearch, alertEmail: e.target.checked }); }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              Alerta por Email
            </label>
          </div>

          {selectedSavedSearch?.alertEmail && <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.textDim, marginBottom: 6, fontWeight: 600 }}>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={selectedSavedSearch?.emailAddress || ""}
              onChange={function(e) { setSelectedSavedSearch({ ...selectedSavedSearch, emailAddress: e.target.value }); }}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }}
            />
          </div>}

          <div style={{ background: C.surfaceAlt, padding: 12, borderRadius: 8, marginBottom: 18, fontSize: 12, color: C.textDim }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Critérios da busca:</div>
            <div>{sourcingFilters.make ? `Marca: ${sourcingFilters.make}` : "Marca: qualquer"}</div>
            <div>{sourcingFilters.model ? `Modelo: ${sourcingFilters.model}` : "Modelo: qualquer"}</div>
            <div>{sourcingFilters.priceMin ? `Preço mín: R$ ${sourcingFilters.priceMin}K` : ""}</div>
            <div>{sourcingFilters.priceMax ? `Preço máx: R$ ${sourcingFilters.priceMax}K` : ""}</div>
            <div>{sourcingFilters.kmMax ? `KM máximo: ${sourcingFilters.kmMax}` : ""}</div>
            <div>{sourcingFilters.discountMin ? `Desconto mínimo: ${sourcingFilters.discountMin}%` : ""}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={function() { setShowSaveSearch(false); setSelectedSavedSearch(null); }} style={{ padding: "12px 16px", background: C.surfaceAlt, color: C.textMid, border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={async function() {
              if (!selectedSavedSearch?.name || !selectedSavedSearch.name.trim()) {
                showToast("Nome da busca é obrigatório", "error");
                return;
              }
              if (selectedSavedSearch.alertWhatsapp && !selectedSavedSearch.whatsappNumber) {
                showToast("Número WhatsApp é obrigatório", "error");
                return;
              }
              if (selectedSavedSearch.alertEmail && !selectedSavedSearch.emailAddress) {
                showToast("Email é obrigatório", "error");
                return;
              }
              try {
                const newSearch = await savedSearchesAPI.create(
                  selectedSavedSearch.name,
                  sourcingFilters,
                  selectedSavedSearch.alertWhatsapp || false,
                  selectedSavedSearch.alertEmail || false,
                  selectedSavedSearch.whatsappNumber || null,
                  selectedSavedSearch.emailAddress || null
                );
                setSavedSearches([newSearch, ...savedSearches]);
                setShowSaveSearch(false);
                setSelectedSavedSearch(null);
                showToast("Busca salva com sucesso!");
              } catch (err) {
                showToast("Erro ao salvar busca: " + (err instanceof APIError ? err.message : err.message), "error");
              }
            }} style={{ padding: "12px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Salvar Busca
            </button>
          </div>
        </Card>
      </div>}

      {/* TOAST CONTAINER */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 12 }}>
        {toasts.map(function(toast) {
          var bg = toast.type === 'success' ? C.greenBg : C.redBg;
          var color = toast.type === 'success' ? C.green : C.red;
          return <div key={toast.id} style={{ background: bg, color: color, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease, slideOut 0.3s ease 2.7s forwards" }}>{toast.message}</div>;
        })}
      </div>

      {/* Toast animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
/* Production build: Wed Apr  8 20:26:54     2026 */
