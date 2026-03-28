/**
 * DEALER SOURCING BOT - React Frontend
 * Dashboard para buscar e gerenciar carros
 *
 * Como usar:
 * 1. Copiar este arquivo para seu projeto React
 * 2. npm install axios
 * 3. Criar .env: VITE_API_URL=http://localhost:3000
 * 4. npm run dev
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

// Configuração de cores
const C = {
  bg: '#f5f6f8', surface: '#ffffff', surfaceAlt: '#f9fafb',
  border: '#e8eaed', borderLight: '#f0f1f3',
  accent: '#0d7c66', accentLight: '#e7f5f2',
  text: '#1a1d23', textMid: '#5f6773', textDim: '#9ca3ae',
  green: '#16a34a', greenBg: '#f0fdf4',
  yellow: '#d97706', yellowBg: '#fffbeb',
  red: '#dc2626', redBg: '#fef2f2',
  blue: '#2563eb', blueBg: '#eff6ff',
};

const FONT = "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif";

// API client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== COMPONENTES REUTILIZÁVEIS =====

function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background: C.surface, borderRadius: 12, border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>{children}</div>;
}

function Button({ onClick, children, variant = 'primary', disabled = false }) {
  const styles = {
    primary: { background: C.accent, color: '#fff', border: 'none' },
    secondary: { background: C.surface, color: C.text, border: '1px solid ' + C.border },
    danger: { background: C.red, color: '#fff', border: 'none' }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 18px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant]
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid ' + C.border,
        borderRadius: 8,
        fontSize: 14,
        fontFamily: FONT,
        outline: 'none',
        boxSizing: 'border-box'
      }}
    />
  );
}

// ===== TELAS =====

// Tela de Login
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('seu@email.com');
  const [password, setPassword] = useState('senha123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>🚗</span>
      </div>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>Dealer Sourcing</h1>
      <p style={{ color: C.textDim, fontSize: 13, margin: '0 0 36px' }}>Bot de busca de carros</p>

      <Card style={{ padding: 32, width: 360 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: C.textDim, display: 'block', marginBottom: 6, fontWeight: 500 }}>Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.textDim, display: 'block', marginBottom: 6, fontWeight: 500 }}>Senha</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="*****" />
        </div>
        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <Button onClick={handleLogin} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
      </Card>
    </div>
  );
}

// Tela de Busca
function SearchTab({ user, onSearchComplete }) {
  const [query, setQuery] = useState('BMW 3 series até 150K');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await api.post('/search/query', { queryText: query });
      setResults(response.data.vehicles || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInterest = async (vehicle) => {
    try {
      await api.post('/vehicles/interested', {
        vehicleId: vehicle.id,
        customerName: 'Cliente',
        notes: `${vehicle.platform} - ${vehicle.title}`
      });
      alert('Veículo salvo!');
    } catch (err) {
      alert('Erro ao salvar veículo');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔍 Buscar Carros</h2>

      <Card style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: BMW 3 series até 150K"
          />
          <Button onClick={handleSearch} disabled={loading}>{loading ? '⏳' : 'Buscar'}</Button>
        </div>
      </Card>

      {error && <Card style={{ padding: 12, background: C.redBg, color: C.red, marginBottom: 16 }}>{error}</Card>}

      {loading && <div style={{ textAlign: 'center', color: C.textDim }}>Procurando em WebMotors, OLX...</div>}

      <div style={{ display: 'grid', gap: 12 }}>
        {results.map((vehicle, idx) => (
          <Card key={idx} style={{ padding: 16, display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: 12, alignItems: 'center' }}>
            {vehicle.image ? (
              <img src={vehicle.image} style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 6 }} onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <div style={{ width: 100, height: 80, background: C.borderLight, borderRadius: 6 }} />
            )}

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{vehicle.title}</h3>
              <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>
                <strong>R$ {vehicle.price?.toLocaleString()}</strong> • {vehicle.km?.toLocaleString()} km
              </p>
              <p style={{ fontSize: 11, color: C.textDim, margin: '4px 0 0' }}>
                {vehicle.platform} • Score: {Math.round(vehicle.score)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Button onClick={() => handleSaveInterest(vehicle)} variant="secondary">Salvar</Button>
              {vehicle.link && (
                <a href={vehicle.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.blue, textDecoration: 'none' }}>
                  Ver no site →
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Tela de Histórico
function HistoryTab() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get('/history');
      setSearches(response.data.searches || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📋 Histórico de Buscas</h2>

      {loading ? (
        <div style={{ textAlign: 'center', color: C.textDim }}>Carregando...</div>
      ) : searches.length === 0 ? (
        <Card style={{ padding: 20, textAlign: 'center', color: C.textDim }}>
          Nenhuma busca realizada ainda
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {searches.map(search => (
            <Card key={search.id} style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>"{search.query}"</h3>
              <p style={{ fontSize: 12, color: C.textDim, margin: '6px 0 0' }}>
                {search.resultsCount} veículos encontrados • {search.interestedCount} salvos
              </p>
              <p style={{ fontSize: 11, color: C.textDim, margin: '4px 0 0' }}>
                {new Date(search.createdAt).toLocaleDateString('pt-BR')} às {new Date(search.createdAt).toLocaleTimeString('pt-BR')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Tela de Interesse
function InterestedTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterested();
  }, []);

  const loadInterested = async () => {
    try {
      const response = await api.get('/vehicles/interested');
      setVehicles(response.data.vehicles || []);
    } catch (err) {
      console.error('Erro ao carregar interessados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que quer remover?')) {
      try {
        await api.delete(`/vehicles/interested/${id}`);
        setVehicles(vehicles.filter(v => v.id !== id));
      } catch (err) {
        alert('Erro ao remover');
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>❤️ Veículos de Interesse</h2>

      {loading ? (
        <div style={{ textAlign: 'center', color: C.textDim }}>Carregando...</div>
      ) : vehicles.length === 0 ? (
        <Card style={{ padding: 20, textAlign: 'center', color: C.textDim }}>
          Nenhum veículo salvo ainda
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>
                  {vehicle.make} {vehicle.model}
                </h3>
                <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>
                  <strong>R$ {vehicle.price?.toLocaleString()}</strong> • {vehicle.km?.toLocaleString()} km • {vehicle.year}
                </p>
                <p style={{ fontSize: 11, color: C.textDim, margin: '4px 0 0' }}>
                  {vehicle.platform} • Status: {vehicle.interest_status}
                </p>
              </div>
              <Button onClick={() => handleDelete(vehicle.id)} variant="danger">Remover</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== APP PRINCIPAL =====

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('search');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: '1px solid ' + C.border, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🚗 Dealer Sourcing</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.textDim }}>Olá, {user.name}</span>
          <Button onClick={handleLogout} variant="secondary">Sair</Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.surface, borderBottom: '1px solid ' + C.border, display: 'flex', gap: 20, padding: '0 20px' }}>
        {['search', 'interested', 'history'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: tab === t ? C.accent : C.textMid,
              borderBottom: tab === t ? '2px solid ' + C.accent : 'none'
            }}
          >
            {t === 'search' && '🔍 Buscar'}
            {t === 'interested' && '❤️ Interesse'}
            {t === 'history' && '📋 Histórico'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'search' && <SearchTab user={user} />}
        {tab === 'interested' && <InterestedTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}
