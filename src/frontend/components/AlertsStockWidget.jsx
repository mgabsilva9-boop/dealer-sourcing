/**
 * AlertsStockWidget - Mostra veículos > 45 dias em estoque
 */

export function AlertsStockWidget({ vehicles = [] }) {
  const alertVehicles = vehicles.filter((v) => {
    const daysInStock = Math.floor((Date.now() - new Date(v.createdAt || v.created_at)) / (1000 * 60 * 60 * 24));
    return daysInStock > 45;
  });

  if (alertVehicles.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700 font-medium">✅ Nenhum alerta de estoque prolongado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg text-red-700">⚠️ Alertas de Estoque Prolongado</h3>

      {alertVehicles.slice(0, 5).map((v) => {
        const daysInStock = Math.floor((Date.now() - new Date(v.createdAt || v.created_at)) / (1000 * 60 * 60 * 24));
        const dailyCost = (v.purchase_price || 0) * 0.002; // ~0.2% ao dia em custo
        const lostValue = dailyCost * (daysInStock - 45);

        return (
          <div key={v.id} className="bg-red-50 border border-red-300 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">
                  {v.make} {v.model} {v.year}
                </p>
                <p className="text-sm text-gray-600">
                  Em estoque há <span className="font-bold text-red-700">{daysInStock} dias</span>
                </p>
              </div>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                {daysInStock - 45} dias além do limite
              </span>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              <p>💰 Custo diário: R$ {(dailyCost / 100).toLocaleString('pt-BR')}</p>
              <p className="font-semibold text-red-700">
                Prejuízo estimado: R$ {(lostValue / 100).toLocaleString('pt-BR')}
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ✏️ Sugestão: Reduza o preço em 5-10% ou verifique a documentação
            </p>
          </div>
        );
      })}

      {alertVehicles.length > 5 && (
        <p className="text-gray-500 text-sm">
          ... e mais {alertVehicles.length - 5} veículos com estoque prolongado
        </p>
      )}
    </div>
  );
}

export default AlertsStockWidget;
