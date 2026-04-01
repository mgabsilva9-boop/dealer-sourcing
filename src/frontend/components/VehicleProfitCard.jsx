/**
 * VehicleProfitCard - Exibe P&L de um veículo
 */

export function VehicleProfitCard({ vehicle, profit }) {
  if (!vehicle || !profit) return null;

  const isProfit = profit.margin > 0;
  const bgColor = isProfit ? 'bg-green-50' : 'bg-red-50';
  const textColor = isProfit ? 'text-green-700' : 'text-red-700';
  const badgeColor = isProfit ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className={`${bgColor} border border-gray-200 rounded-lg p-4`}>
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.make} {vehicle.model} {vehicle.year}
          </h3>
          <p className="text-sm text-gray-500">{vehicle.status || 'Disponível'}</p>
        </div>
        <span className={`${badgeColor} ${textColor} px-3 py-1 rounded-full text-sm font-medium`}>
          {profit.margin_percentage > 0 ? '+' : ''}{profit.margin_percentage}%
        </span>
      </div>

      {/* Cálculos */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Preço Compra:</span>
          <span className="font-medium">R$ {(vehicle.purchase_price / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="ml-4">+ Transporte:</span>
          <span>R$ {(vehicle.transport_cost / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="ml-4">+ Recond.:</span>
          <span>R$ {(vehicle.reconditioning_cost / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="ml-4">+ Docs:</span>
          <span>R$ {(vehicle.documentation_cost / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="ml-4">+ IPVA:</span>
          <span>R$ {(profit.ipva_due / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="border-t border-gray-300 pt-2 my-2" />

        <div className="flex justify-between font-semibold">
          <span className="text-gray-700">Total Custo:</span>
          <span>R$ {(profit.total_cost / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Preço Venda:</span>
          <span className="font-medium">R$ {(vehicle.sale_price / 100).toLocaleString('pt-BR')}</span>
        </div>

        <div className="border-t border-gray-300 pt-2 my-2" />

        <div className={`flex justify-between font-bold text-lg ${textColor}`}>
          <span>{isProfit ? '✅ LUCRO' : '❌ PREJUÍZO'}:</span>
          <span>R$ {(profit.margin / 100).toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}

export default VehicleProfitCard;
