/**
 * IPVAStatusWidget - Status de IPVA por estado
 */

const ALIQUOTAS = {
  'SP': 4.0,
  'SC': 2.0,
  'RJ': 3.0,
  'MG': 3.5,
  'RS': 3.0,
  'PR': 3.5,
  'BA': 3.0,
  'PE': 3.5,
};

export function IPVAStatusWidget({ ipvaRecords = [] }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return '✅ Pago';
      case 'urgent':
        return '🔴 Urgente';
      case 'pending':
        return '⏱️ Pendente';
      default:
        return '❓ ' + status;
    }
  };

  // Agrupar por status
  const byStatus = {
    paid: ipvaRecords.filter((r) => r.status === 'paid'),
    pending: ipvaRecords.filter((r) => r.status === 'pending'),
    urgent: ipvaRecords.filter((r) => r.status === 'urgent'),
  };

  const totalPaid = byStatus.paid.reduce((sum, r) => sum + (r.ipva_due || 0), 0);
  const totalPending = byStatus.pending.reduce((sum, r) => sum + (r.ipva_due || 0), 0);
  const totalUrgent = byStatus.urgent.reduce((sum, r) => sum + (r.ipva_due || 0), 0);

  return (
    <div className="space-y-4">
      {/* Alíquotas por Estado */}
      <div>
        <h3 className="font-semibold text-lg mb-2">Alíquotas de IPVA por Estado</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(ALIQUOTAS).map(([state, aliquota]) => (
            <div
              key={state}
              className="bg-blue-50 border border-blue-200 rounded p-2 text-center"
            >
              <p className="font-semibold text-blue-900">{state}</p>
              <p className="text-sm text-blue-700">{aliquota}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pagos */}
        <div className="bg-green-50 border border-green-300 rounded-lg p-3">
          <p className="font-semibold text-green-700">✅ Pagos</p>
          <p className="text-2xl font-bold text-green-900">{byStatus.paid.length}</p>
          <p className="text-sm text-green-600">
            R$ {totalPaid.toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Pendentes */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <p className="font-semibold text-yellow-700">⏱️ Pendentes</p>
          <p className="text-2xl font-bold text-yellow-900">{byStatus.pending.length}</p>
          <p className="text-sm text-yellow-600">
            R$ {totalPending.toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Urgentes */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-3">
          <p className="font-semibold text-red-700">🔴 Urgentes</p>
          <p className="text-2xl font-bold text-red-900">{byStatus.urgent.length}</p>
          <p className="text-sm text-red-600">
            R$ {totalUrgent.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Lista de Urgentes */}
      {byStatus.urgent.length > 0 && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
          <p className="font-semibold text-red-700 mb-2">IPVAs que vencimento urgente:</p>
          <ul className="space-y-1">
            {byStatus.urgent.slice(0, 5).map((r) => (
              <li key={r.id} className="text-sm text-red-700">
                🚗 {r.make} {r.model} ({r.state}) - Vence em{' '}
                {Math.ceil((new Date(r.due_date) - Date.now()) / (1000 * 60 * 60 * 24))} dias
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default IPVAStatusWidget;
