/**
 * DashboardFinancial - Integra todos os componentes financeiros
 */

import { useState, useEffect } from 'react';
import VehicleProfitCard from '../components/VehicleProfitCard';
import DealershipComparison from '../components/DealershipComparison';
import AlertsStockWidget from '../components/AlertsStockWidget';
import IPVAStatusWidget from '../components/IPVAStatusWidget';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export function DashboardFinancial() {
  const [vehicles, setVehicles] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [ipvaRecords, setIPVARecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ CORRIGIDO: Polling automático a cada 30s para atualizar dados em tempo real
  useEffect(() => {
    loadData();

    // Executar loadData a cada 30 segundos
    const interval = setInterval(loadData, 30000);

    // Cleanup: limpar interval ao desmontar componente
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar veículos
      const vehiclesRes = await fetch(`${API_BASE}/inventory/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data.vehicles || []);
      }

      // Buscar comparação de lojas
      const comparisonRes = await fetch(`${API_BASE}/financial/comparison`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (comparisonRes.ok) {
        const data = await comparisonRes.json();
        setComparison(data.dealerships || []);
      }

      // Buscar IPVA
      const ipvaRes = await fetch(`${API_BASE}/ipva/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (ipvaRes.ok) {
        const data = await ipvaRes.json();
        setIPVARecords(data.ipva_records || []);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Carregando dashboard financeiro...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">💰 Dashboard Financeiro</h1>

      {/* Abas */}
      <div className="flex gap-2 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'vehicles'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🚗 Veículos
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'alerts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ⚠️ Alertas
        </button>
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Comparativo de Lojas</h2>
            <DealershipComparison dealerships={comparison} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Status de IPVA</h2>
            <IPVAStatusWidget ipvaRecords={ipvaRecords} />
          </section>
        </div>
      )}

      {/* TAB: Veículos */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">P&L por Veículo</h2>
          {vehicles.length === 0 ? (
            <p className="text-gray-500">Nenhum veículo cadastrado</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <VehicleProfitCard key={vehicle.id} vehicle={vehicle} profit={{}} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Alertas */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <section>
            <AlertsStockWidget vehicles={vehicles} />
          </section>
        </div>
      )}

      {/* Botão Refresh */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Atualizar
        </button>
      </div>
    </div>
  );
}

export default DashboardFinancial;
