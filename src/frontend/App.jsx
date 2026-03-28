import { useState, useEffect, useCallback } from "react";
import { authAPI, vehiclesAPI, searchAPI, healthAPI, APIError } from "./api.js";

const C = {
  bg: "#f5f6f8", surface: "#ffffff", surfaceAlt: "#f9fafb",
  border: "#e8eaed", borderLight: "#f0f1f3",
  accent: "#0d7c66", accentLight: "#e7f5f2",
  text: "#1a1d23", textMid: "#5f6773", textDim: "#9ca3ae",
  green: "#16a34a", greenBg: "#f0fdf4",
  yellow: "#d97706", yellowBg: "#fffbeb",
  red: "#dc2626", redBg: "#fef2f2",
  blue: "#2563eb", blueBg: "#eff6ff",
  purple: "#7c3aed", cyan: "#0891b2",
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
  { id: "admin", label: "Renata", user: "renata", pass: "garagem2026", desc: "Acesso total", icon: "R", access: "all" },
  { id: "dono", label: "Dono", user: "dono", pass: "dono2026", desc: "Dashboard + financeiro", icon: "D", access: "all" },
  { id: "gerente_b", label: "Gerente Loja B", user: "lojab", pass: "lojab2026", desc: "Dados da Loja B", icon: "B", access: "Loja B" },
];

// ─── REAL DATA FROM SPREADSHEET ─────────────────────────────────────
const INIT_VEHICLES = [
  { id: 1, make: "Ford", model: "Ka", year: 2020, purchasePrice: 52948, salePrice: 0, fipePrice: 0, status: "available", mileage: 72000, daysInStock: 0, location: "Loja A", costs: { "Compra do veiculo": 52948, "Funilaria": 600, "Mercado": 270, "Documentacao": 764, "Combustivel": 47, "Comissao": 400 }, motor: "", potencia: "", features: "" },
  { id: 2, make: "VW", model: "Gol 1.0", year: 2022, purchasePrice: 53000, salePrice: 0, fipePrice: 0, status: "available", mileage: 56000, daysInStock: 0, location: "Loja A", costs: { "Compra do veiculo": 53000, "Funilaria": 200, "Cartorio": 67, "Documentacao": 400, "Combustivel": 235, "Comissao": 300 }, motor: "", potencia: "", features: "" },
  { id: 3, make: "Ram", model: "1500 Classic", year: 2023, purchasePrice: 260000, salePrice: 0, fipePrice: 0, status: "available", mileage: 42000, daysInStock: 0, location: "Loja A", costs: { "Compra do veiculo": 260000, "Combustivel": 220, "Lavagem": 800 }, motor: "", potencia: "", features: "" },
  { id: 4, make: "BMW", model: "M3 Red Frozen", year: 2015, purchasePrice: 325000, salePrice: 0, fipePrice: 0, status: "available", mileage: 37000, daysInStock: 0, location: "Loja A", costs: { "Compra do veiculo": 325000, "Viagem": 3229, "Peca": 2500, "Vistoria": 80, "Lavagem": 1000, "Martelinho": 100, "Combustivel": 200, "Pecas ambar": 1840, "Webmotors": 220 }, motor: "", potencia: "", features: "" },
  { id: 5, make: "Ram", model: "2500 Laramie", year: 2021, purchasePrice: 290000, salePrice: 0, fipePrice: 0, status: "available", mileage: 52000, daysInStock: 0, location: "Loja A", costs: { "Compra do veiculo": 290000, "Viagem": 418, "Combustivel": 807, "Veloci": 800, "Vistoria": 80, "Comida": 113, "Lavagem": 1000, "Cautelar": 600 }, motor: "", potencia: "", features: "" },
  { id: 6, make: "BMW", model: "M3 Competition", year: 2023, purchasePrice: 0, salePrice: 0, fipePrice: 0, status: "available", mileage: 14000, daysInStock: 0, location: "Loja A", costs: { "Compra do veiculo": 0, "Viagem": 696, "Vistoria": 400 }, motor: "", potencia: "", features: "" },
];

const INIT_CRM = [];

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

const statusMap = { available: { label: "Disponivel", color: C.green, bg: C.greenBg }, reserved: { label: "Reservado", color: C.yellow, bg: C.yellowBg }, sold: { label: "Vendido", color: C.blue, bg: C.blueBg }, maintenance: { label: "Recondicionamento", color: C.red, bg: C.redBg }, documentation: { label: "Documentacao", color: C.purple, bg: "#f5f3ff" }, transit: { label: "Em Transito", color: C.cyan, bg: "#ecfeff" } };
const expStatusMap = { paid: { label: "Pago", color: C.green, bg: C.greenBg }, pending: { label: "Pendente", color: C.yellow, bg: C.yellowBg }, urgent: { label: "Urgente", color: C.red, bg: C.redBg }, overdue: { label: "Atrasado", color: C.red, bg: C.redBg } };
const catColors = { Financiamento: C.purple, IPVA: C.red, Aluguel: C.blue, Seguro: C.cyan, Operacional: C.textMid };

// ─── ATOMS (no ...rest, no IIFE) ────────────────────────────────────
function Card({ children, style, onClick }) { return <div onClick={onClick} style={{ background: C.surface, borderRadius: 12, border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>{children}</div>; }
function Stat({ label, value, sub, accent }) { return <Card style={{ padding: "20px 22px", borderLeft: accent ? "3px solid " + C.accent : undefined }}><div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 500 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{value}</div>{sub && <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{sub}</div>}</Card>; }
function Tag({ children, color, bg }) { return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: color, background: bg, letterSpacing: 0.3 }}>{children}</span>; }
function MiniBar({ label, value }) { var w = label === "Muito baixa" ? 95 : label === "Baixa" ? 80 : label === "Media" ? 55 : 30; var c = label === "Muito baixa" || label === "Baixa" ? C.green : label === "Media" ? C.yellow : C.red; return <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: C.textMid, width: 28, textAlign: "right" }}>{value}</span><div style={{ flex: 1, height: 4, background: C.borderLight, borderRadius: 2 }}><div style={{ width: w + "%", height: "100%", background: c, borderRadius: 2 }} /></div></div>; }

function EditField({ label, value, onChange, type }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));
  var save = function() { setEditing(false); onChange(type === "number" ? Number(temp) || value : temp); };
  if (!editing) { return <div onClick={function() { setTemp(String(value)); setEditing(true); }} style={{ cursor: "pointer", padding: "7px 10px", borderRadius: 6, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: C.textDim }}>{label}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{type === "number" ? fmtFull(value) : value}</span></div>; }
  return <div style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + C.accent, background: C.accentLight, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: C.textDim }}>{label}</span><div style={{ display: "flex", gap: 4 }}><input autoFocus value={temp} onChange={function(e) { setTemp(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") save(); }} type={type || "text"} style={{ width: type === "number" ? 100 : 140, padding: "4px 8px", border: "1px solid " + C.border, borderRadius: 4, fontSize: 13, fontFamily: FONT, outline: "none" }} /><button onClick={save} style={{ padding: "4px 10px", background: C.accent, color: "#fff", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>OK</button><button onClick={function() { setEditing(false); }} style={{ padding: "4px 8px", background: "none", color: C.textDim, border: "1px solid " + C.border, borderRadius: 4, fontSize: 11, cursor: "pointer" }}>X</button></div></div>;
}

// ─── LOGIN ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [emailInput, setEmailInput] = useState("penteadojv1314@gmail.com");
  const [passInput, setPassInput] = useState("Fontes13");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  var tryLogin = async function() {
    setLoading(true);
    setError("");
    try {
      // Tentar login na API
      const result = await authAPI.login(emailInput.trim(), passInput);
      // Se sucesso, usar dados do usuário retornado
      const user = result.user || {
        id: result.id || 1,
        label: result.name || emailInput,
        user: emailInput,
        pass: passInput,
        access: "all"
      };
      onLogin(user);
    } catch (err) {
      // Fallback: validação local se API não responder
      const found = USERS.find(function(u) { return u.user === emailInput.toLowerCase().trim() && u.pass === passInput; });
      if (found) {
        onLogin(found);
      } else {
        setError(err instanceof APIError ? err.message : "Erro ao conectar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>G</span></div>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Garagem</h1>
      <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 36px" }}>Sistema de gestao inteligente</p>
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
  const [f, setF] = useState({ make: "", model: "", year: 2024, salePrice: 0, fipePrice: 0, mileage: 0, location: "Loja A", motor: "", potencia: "", features: "", compra: 0, viagem: 0, combustivel: 0, documentacao: 0, funilaria: 0, lavagem: 0, vistoria: 0, comissao: 0 });
  var inp = { width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" };
  var lbl = { fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };
  var submit = function() {
    if (!f.make || !f.model) return;
    var costs = { "Compra do veiculo": Number(f.compra) || 0 };
    if (Number(f.viagem)) costs["Viagem"] = Number(f.viagem);
    if (Number(f.combustivel)) costs["Combustivel"] = Number(f.combustivel);
    if (Number(f.documentacao)) costs["Documentacao"] = Number(f.documentacao);
    if (Number(f.funilaria)) costs["Funilaria"] = Number(f.funilaria);
    if (Number(f.lavagem)) costs["Lavagem"] = Number(f.lavagem);
    if (Number(f.vistoria)) costs["Vistoria"] = Number(f.vistoria);
    if (Number(f.comissao)) costs["Comissao"] = Number(f.comissao);
    onAdd({ id: Date.now(), make: f.make, model: f.model, year: Number(f.year), purchasePrice: Number(f.compra) || 0, salePrice: Number(f.salePrice) || 0, fipePrice: Number(f.fipePrice) || 0, mileage: Number(f.mileage) || 0, status: "available", daysInStock: 0, location: f.location, costs: costs, motor: f.motor, potencia: f.potencia, features: f.features });
  };
  var set = function(key, val) { var u = {}; u[key] = val; setF(Object.assign({}, f, u)); };
  return <Card style={{ padding: 22, marginBottom: 16 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.5fr 1fr", gap: 12, marginBottom: 12 }}>
      <div><label style={lbl}>Marca</label><input value={f.make} onChange={function(e) { set("make", e.target.value); }} style={inp} placeholder="Ford, BMW, Ram..." /></div>
      <div><label style={lbl}>Modelo</label><input value={f.model} onChange={function(e) { set("model", e.target.value); }} style={inp} placeholder="Ka, M3, 1500..." /></div>
      <div><label style={lbl}>Ano</label><input type="number" value={f.year} onChange={function(e) { set("year", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Loja</label><select value={f.location} onChange={function(e) { set("location", e.target.value); }} style={Object.assign({}, inp, { cursor: "pointer" })}><option>Loja A</option><option>Loja B</option></select></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
      <div><label style={lbl}>Compra do veiculo</label><input type="number" value={f.compra} onChange={function(e) { set("compra", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Preco de Venda</label><input type="number" value={f.salePrice} onChange={function(e) { set("salePrice", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>FIPE</label><input type="number" value={f.fipePrice} onChange={function(e) { set("fipePrice", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Km</label><input type="number" value={f.mileage} onChange={function(e) { set("mileage", e.target.value); }} style={inp} /></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
      <div><label style={lbl}>Documentacao</label><input type="number" value={f.documentacao} onChange={function(e) { set("documentacao", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Funilaria</label><input type="number" value={f.funilaria} onChange={function(e) { set("funilaria", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Combustivel</label><input type="number" value={f.combustivel} onChange={function(e) { set("combustivel", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Comissao</label><input type="number" value={f.comissao} onChange={function(e) { set("comissao", e.target.value); }} style={inp} /></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
      <div><label style={lbl}>Viagem</label><input type="number" value={f.viagem} onChange={function(e) { set("viagem", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Lavagem</label><input type="number" value={f.lavagem} onChange={function(e) { set("lavagem", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Vistoria</label><input type="number" value={f.vistoria} onChange={function(e) { set("vistoria", e.target.value); }} style={inp} /></div>
      <div><label style={lbl}>Motor / Features</label><input value={f.motor} onChange={function(e) { set("motor", e.target.value); }} style={inp} placeholder="2.8L Diesel..." /></div>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={submit} style={{ padding: "10px 24px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Adicionar ao Estoque</button>
      <button onClick={onCancel} style={{ padding: "10px 24px", background: C.redBg, color: C.red, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
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
    var updC = function(field, val) { setCustomers(function(p) { return p.map(function(x) { return x.id === c.id ? Object.assign({}, x, { [field]: val }) : x; }); }); };
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
      </Card>
    </div>;
  }

  var addC = function() { if (!form.name) return; setCustomers(function(p) { return p.concat([Object.assign({}, form, { id: Date.now(), purchaseValue: Number(form.purchaseValue) || 0 })]); }); setForm({ name: "", phone: "", email: "", cpf: "", vehicleBought: "", purchaseDate: "", purchaseValue: 0, notes: "", style: "", region: "", collector: false, birthday: "", profession: "", referral: "", contactPref: "WhatsApp" }); setAdding(false); };

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
      <button onClick={addC} style={{ padding: "10px 24px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
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
  const [finSub, setFinSub] = useState("overview");
  const [balMonth, setBalMonth] = useState("2026-02");
  const [loaded, setLoaded] = useState(false);

  useEffect(function() { (async function() {
    try { var r = await window.storage.get("garagem-data"); if (r && r.value) { var d = JSON.parse(r.value); if (d.version === 2 && d.vehicles) { setVehicles(d.vehicles); if (d.customers) setCustomers(d.customers); if (d.expenses) setExpenses(d.expenses); } } } catch(e) {}
    setLoaded(true);
  })(); }, []);

  useEffect(function() { if (!loaded) return; (async function() {
    try { await window.storage.set("garagem-data", JSON.stringify({ version: 2, vehicles: vehicles, customers: customers, expenses: expenses })); } catch(e) {}
  })(); }, [vehicles, customers, expenses, loaded]);

  var upd = useCallback(function(id, field, val) {
    setVehicles(function(p) { return p.map(function(v) { return v.id === id ? Object.assign({}, v, { [field]: val }) : v; }); });
    if (selV && selV.id === id) setSelV(function(p) { return Object.assign({}, p, { [field]: val }); });
  }, [selV]);

  var updCost = useCallback(function(id, costField, val) {
    setVehicles(function(p) { return p.map(function(v) {
      if (v.id !== id) return v;
      var newCosts = Object.assign({}, v.costs || {}, { [costField]: val });
      var updates = { costs: newCosts };
      if (costField === "Compra do veiculo") updates.purchasePrice = val;
      return Object.assign({}, v, updates);
    }); });
  }, []);

  if (!user) return <LoginScreen onLogin={function(u) { setUser(u); if (u.access !== "all") setDealer(u.access); }} />;

  var canSwitch = user.access === "all";
  var allF = dealer === "all" ? vehicles : vehicles.filter(function(v) { return v.location === dealer; });
  var activeV = allF.filter(function(v) { return v.status !== "sold"; });
  var soldV = allF.filter(function(v) { return v.status === "sold"; });
  var dispV = invFilter === "sold" ? soldV : invFilter === "active" ? activeV : allF;
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

  var cP = function(l) { return l.filter(function(v) { return v.status === "sold"; }).reduce(function(a, v) { return a + vProfit(v); }, 0); };
  var cR = function(l) { return l.filter(function(v) { return v.status === "sold"; }).reduce(function(a, v) { return a + (v.soldPrice || v.salePrice || 0); }, 0); };
  var cCost = function(l) { return l.filter(function(v) { return v.status === "sold"; }).reduce(function(a, v) { return a + totalCosts(v); }, 0); };

  var tabList = [["dashboard","Dashboard"],["inventory","Estoque"],["sourcing","Busca IA"],["whatsapp","WhatsApp IA"],["financial","Financeiro"],["expenses","Gastos Gerais"],["crm","Clientes"]];
  var monthLabel = function(m) { var parts = m.split("-"); var names = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]; return names[parseInt(parts[1])] + " " + parts[0]; };

  // Selected vehicle detail data
  var sv = selV ? vehicles.find(function(x) { return x.id === selV.id; }) : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      {/* HEADER */}
      <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>G</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Garagem</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canSwitch && <div style={{ display: "flex", gap: 2, background: C.surfaceAlt, borderRadius: 8, padding: 3, border: "1px solid " + C.border }}>
            {["all", "Loja A", "Loja B"].map(function(d) { return <button key={d} onClick={function() { setDealer(d); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: dealer === d ? C.accent : "transparent", color: dealer === d ? "#fff" : C.textDim, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{d === "all" ? "Todas" : d}</button>; })}
          </div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8, border: "1px solid " + C.border }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.accent }}>{user.icon}</div>
            <span style={{ fontSize: 12, color: C.textMid }}>{user.label}</span>
            <button onClick={function() { setUser(null); }} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 11 }}>Sair</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "0 28px", display: "flex", gap: 0, overflowX: "auto" }}>
        {tabList.map(function(t) { return <button key={t[0]} onClick={function() { setTab(t[0]); setSelV(null); setShowCosts(false); setAddingV(false); }} style={{ padding: "12px 16px", border: "none", borderBottom: tab === t[0] ? "2px solid " + C.accent : "2px solid transparent", background: "transparent", color: tab === t[0] ? C.accent : C.textDim, fontSize: 12, fontWeight: tab === t[0] ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{t[1]}</button>; })}
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
            <Stat label="Contas a Pagar (7 dias)" value={fmtFull(expThisWeekTotal)} sub={expThisWeek.length + " contas pendentes"} accent />
            <Stat label="Lucro deste Mes" value={fmtFull(profitThisMonth)} sub={profitLastMonth ? "Mes anterior: " + fmtFull(profitLastMonth) : "Sem dados anteriores"} />
            <Stat label="Veiculos Ativos" value={activeV.length} sub={avail + " disponiveis | " + fmt(totalStock) + " investido"} />
            <Stat label="Lucro Total" value={fmtFull(totalProfit)} sub={soldV.length + " vendidos"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Pagamentos Proximos</h3>
              {expenses.filter(function(e) { return e.status !== "paid"; }).sort(function(a, b) { return new Date(a.due) - new Date(b.due); }).slice(0, 6).map(function(e) {
                var days = Math.ceil((new Date(e.due) - now) / 86400000);
                return <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, borderLeft: "3px solid " + (days < 0 ? C.red : days <= 3 ? C.yellow : C.border) }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{e.desc}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{e.category} | {e.location}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtFull(e.value)}</div>
                    <div style={{ fontSize: 10, color: days < 0 ? C.red : days <= 3 ? C.yellow : C.textDim, fontWeight: 600 }}>{days < 0 ? Math.abs(days) + "d atrasado" : days === 0 ? "Hoje" : days + "d"}</div>
                  </div>
                </div>;
              })}
            </Card>
            <Card style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Leads Novos</h3>
              {[{id:1,make:"Ford",model:"Ka",year:2024,price:52948,score:87},{id:2,make:"BMW",model:"M3",year:2023,price:325000,score:95},{id:3,make:"Ram",model:"2500",year:2024,price:290000,score:91}].map(function(s) { return <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, borderLeft: "3px solid " + sColor(s.score) }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{s.make} {s.model} {s.year}</div><div style={{ fontSize: 11, color: C.textDim }}>R$ {(s.price/1000).toFixed(0)}K</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>-8%</div><div style={{ fontSize: 11, color: sColor(s.score), fontWeight: 600 }}>Score {s.score}</div></div>
              </div>; })}
            </Card>
          </div>
        </div>}

        {/* INVENTORY LIST */}
        {tab === "inventory" && !sv && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Inventario --- {dispV.length} veiculos</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 2, background: C.surfaceAlt, borderRadius: 8, padding: 3, border: "1px solid " + C.border }}>
                {[["active","Ativos"],["sold","Vendidos"],["all","Todos"]].map(function(item) { return <button key={item[0]} onClick={function() { setInvFilter(item[0]); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: invFilter === item[0] ? C.accent : "transparent", color: invFilter === item[0] ? "#fff" : C.textDim, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{item[1]}</button>; })}
              </div>
              <button onClick={function() { setAddingV(!addingV); }} style={{ padding: "8px 18px", background: addingV ? C.redBg : C.accent, color: addingV ? C.red : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{addingV ? "Cancelar" : "+ Novo Veiculo"}</button>
            </div>
          </div>
          {addingV && <VehicleForm onAdd={function(nv) { setVehicles(function(p) { return p.concat([nv]); }); setAddingV(false); }} onCancel={function() { setAddingV(false); }} />}
          <div style={{ display: "grid", gap: 10 }}>
            {dispV.map(function(v) {
              var margin = vMargin(v);
              var st = statusMap[v.status] || statusMap.available;
              var imgKey = v.make + " " + v.model;
              return <Card key={v.id} onClick={function() { setSelV(v); }} style={{ cursor: "pointer", display: "flex", overflow: "hidden", opacity: v.status === "sold" ? 0.7 : 1 }}>
                <div style={{ width: 150, minHeight: 100, flexShrink: 0, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {!imgErr[v.id] ? <img src={IMGS[imgKey] || IMGS[v.make + " " + v.model + " " + v.year] || ""} alt="" onError={function() { setImgErr(function(p) { return Object.assign({}, p, { [v.id]: true }); }); }} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, color: C.textDim }}>Sem foto</span>}
                </div>
                <div style={{ flex: 1, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{v.make} {v.model}</div>
                    <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{v.year} | {(v.mileage || 0).toLocaleString()} km | {v.location}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2, opacity: 0.6 }}>{v.motor} | {v.potencia}</div>
                    {v.status === "sold" && v.soldTo && <div style={{ fontSize: 11, color: C.blue, marginTop: 3, fontWeight: 500 }}>Vendido {v.soldDate ? new Date(v.soldDate).toLocaleDateString("pt-BR") : ""} --- {v.soldTo}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end", minWidth: 100 }}>
                    <Tag color={st.color} bg={st.bg}>{st.label}</Tag>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Custo <span style={{ color: C.red, fontWeight: 600 }}>{fmt(totalCosts(v))}</span></div>
                    <div style={{ fontSize: 11, color: C.textDim }}>Venda <span style={{ color: C.green, fontWeight: 600 }}>{fmt(v.soldPrice || v.salePrice)}</span></div>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 50, paddingLeft: 12, borderLeft: "1px solid " + C.borderLight }}>
                    <div style={{ color: margin >= 25 ? C.green : margin >= 15 ? C.yellow : C.red, fontWeight: 700, fontSize: 15 }}>{margin}%</div>
                    <div style={{ fontSize: 9, color: C.textDim }}>margem</div>
                    {v.status !== "sold" && <div style={{ color: v.daysInStock > 45 ? C.red : v.daysInStock > 30 ? C.yellow : C.green, fontWeight: 700, fontSize: 16, marginTop: 4 }}>{v.daysInStock}d</div>}
                  </div>
                </div>
              </Card>;
            })}
          </div>
        </div>}

        {/* VEHICLE DETAIL */}
        {tab === "inventory" && sv && <div>
          <button onClick={function() { setSelV(null); setShowCosts(false); }} style={{ background: C.surface, border: "1px solid " + C.border, color: C.textMid, padding: "7px 16px", borderRadius: 8, cursor: "pointer", marginBottom: 18, fontSize: 12 }}>Voltar</button>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ height: 160, background: C.surfaceAlt, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imgErr[sv.id] ? <img src={IMGS[sv.make + " " + sv.model] || ""} alt="" onError={function() { setImgErr(function(p) { return Object.assign({}, p, { [sv.id]: true }); }); }} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: C.textDim }}>Sem foto</span>}
            </div>
            <div style={{ padding: 26 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{sv.make} {sv.model}</h2>
                  <div style={{ color: C.textDim, fontSize: 13, marginTop: 3 }}>{sv.year} | {(sv.mileage || 0).toLocaleString()} km | {sv.location} | {sv.motor} | {sv.potencia}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <Tag color={(statusMap[sv.status] || statusMap.available).color} bg={(statusMap[sv.status] || statusMap.available).bg}>{(statusMap[sv.status] || statusMap.available).label}</Tag>
                  <select value={sv.status} onChange={function(e) { upd(sv.id, "status", e.target.value); }} style={{ padding: "4px 8px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 11, color: C.textMid, background: C.surface, cursor: "pointer" }}>
                    {Object.keys(statusMap).map(function(k) { return <option key={k} value={k}>{statusMap[k].label}</option>; })}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Dados</div>
                  <EditField label="Preco de Venda" value={sv.salePrice || 0} onChange={function(val) { upd(sv.id, "salePrice", val); }} type="number" />
                  <EditField label="FIPE" value={sv.fipePrice || 0} onChange={function(val) { upd(sv.id, "fipePrice", val); }} type="number" />
                  <EditField label="Km" value={sv.mileage || 0} onChange={function(val) { upd(sv.id, "mileage", val); }} type="number" />
                  <EditField label="Localizacao" value={sv.location} onChange={function(val) { upd(sv.id, "location", val); }} />
                </Card>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Resumo</div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px" }}><span style={{ fontSize: 12, color: C.textDim }}>Custo Total</span><span style={{ fontSize: 14, fontWeight: 700, color: C.red }}>{fmtFull(totalCosts(sv))}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px" }}><span style={{ fontSize: 12, color: C.textDim }}>Venda</span><span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmtFull(sv.soldPrice || sv.salePrice)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderTop: "2px solid " + C.border }}><span style={{ fontWeight: 700 }}>Lucro</span><span style={{ fontSize: 16, fontWeight: 700, color: vProfit(sv) > 0 ? C.green : C.red }}>{fmtFull(vProfit(sv))}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px" }}><span style={{ fontSize: 12, color: C.textDim }}>Margem</span><span style={{ fontWeight: 700, color: vMargin(sv) >= 25 ? C.green : C.yellow }}>{vMargin(sv)}%</span></div>
                </Card>
              </div>
              <button onClick={function() { setShowCosts(!showCosts); }} style={{ width: "100%", padding: "11px 16px", background: C.surfaceAlt, border: "1px solid " + C.border, borderRadius: showCosts ? "10px 10px 0 0" : "10px", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Custos Detalhados</span><span style={{ fontSize: 12, color: C.textDim }}>{showCosts ? "Fechar" : "Abrir"}</span>
              </button>
              {showCosts && <div style={{ padding: 16, background: C.surfaceAlt, border: "1px solid " + C.border, borderTop: "none", borderRadius: "0 0 10px 10px", marginBottom: 14 }}>
                {Object.keys(sv.costs || {}).map(function(key) { return <EditField key={key} label={key} value={(sv.costs || {})[key] || 0} onChange={function(val) { updCost(sv.id, key, val); }} type="number" />; })}
              </div>}
              {sv.status === "sold" && sv.soldTo && <div style={{ padding: 14, background: C.blueBg, borderRadius: 10, border: "1px solid " + C.blue + "20", marginTop: 8 }}>
                <div style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>Vendido para {sv.soldTo} em {sv.soldDate ? new Date(sv.soldDate).toLocaleDateString("pt-BR") : "---"}</div>
                {sv.docs && sv.docs.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>{sv.docs.map(function(d, i) { return <Tag key={i} color={C.accent} bg={C.accentLight}>{d}</Tag>; })}</div>}
              </div>}
            </div>
          </Card>
        </div>}

        {/* SOURCING */}
        {tab === "sourcing" && <div>
          <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 600 }}>Busca Inteligente IA</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {SOURCING.map(function(s) { var sc = sColor(s.score); return <Card key={s.id} style={{ padding: "18px 22px" }}>
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
            <div style={{ background: "#075e54", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>G</div><div><div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>Garagem Bot</div><div style={{ color: "#8bc99a", fontSize: 11 }}>online</div></div></div>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <Stat label="Receita Total" value={fmtFull(cR(allF))} accent />
            <Stat label="Custo Total" value={fmtFull(cCost(allF))} />
            <Stat label="Lucro Bruto" value={fmtFull(totalProfit)} sub={soldV.length > 0 ? "Margem: " + ((totalProfit / (cR(allF) || 1)) * 100).toFixed(1) + "%" : "Sem vendas"} />
          </div>
        </div>}

        {/* GASTOS GERAIS */}
        {tab === "expenses" && <div>
          <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 600 }}>Gastos Gerais</h2>
          <Card style={{ padding: 20, textAlign: "center", color: C.textDim }}>
            Modulo de gastos em desenvolvimento. Configure via dashboard.
          </Card>
        </div>}

        {tab === "crm" && <CrmTab customers={customers} setCustomers={setCustomers} />}
      </div>
    </div>
  );
}
