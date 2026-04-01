/**
 * DealershipComparison - Compara Loja A vs B
 */

export function DealershipComparison({ dealerships }) {
  if (!dealerships || dealerships.length === 0) {
    return <p className="text-gray-500">Nenhuma loja para comparar</p>;
  }

  const getBestValue = (key) => {
    return Math.max(...dealerships.map((d) => d[key] || 0));
  };

  const isBest = (dealership, key) => {
    return dealership[key] === getBestValue(key);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-3 text-left font-semibold">Métrica</th>
            {dealerships.map((d) => (
              <th
                key={d.dealership_id}
                className="border border-gray-300 p-3 text-left font-semibold"
              >
                {d.dealership_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Veículos em Estoque */}
          <tr>
            <td className="border border-gray-300 p-3 font-medium">Veículos em Estoque</td>
            {dealerships.map((d) => (
              <td
                key={d.dealership_id}
                className={`border border-gray-300 p-3 ${
                  isBest(d, 'vehicle_count') ? 'bg-green-50 font-semibold' : ''
                }`}
              >
                {d.vehicle_count}
              </td>
            ))}
          </tr>

          {/* Total em Custo */}
          <tr className="bg-gray-50">
            <td className="border border-gray-300 p-3 font-medium">Total em Custo</td>
            {dealerships.map((d) => (
              <td
                key={d.dealership_id}
                className={`border border-gray-300 p-3 ${
                  isBest(d, 'total_cost') ? 'bg-green-50 font-semibold' : ''
                }`}
              >
                R$ {(d.total_cost / 100).toLocaleString('pt-BR')}
              </td>
            ))}
          </tr>

          {/* Lucro Realizado */}
          <tr>
            <td className="border border-gray-300 p-3 font-medium">Lucro Realizado</td>
            {dealerships.map((d) => (
              <td
                key={d.dealership_id}
                className={`border border-gray-300 p-3 font-semibold ${
                  d.realized_profit > 0 ? 'text-green-700' : 'text-red-700'
                } ${isBest(d, 'realized_profit') ? 'bg-green-50' : ''}`}
              >
                R$ {(d.realized_profit / 100).toLocaleString('pt-BR')}
              </td>
            ))}
          </tr>

          {/* Margem Média */}
          <tr className="bg-gray-50">
            <td className="border border-gray-300 p-3 font-medium">Margem Média</td>
            {dealerships.map((d) => (
              <td
                key={d.dealership_id}
                className={`border border-gray-300 p-3 ${
                  isBest(d, 'avg_margin') ? 'bg-green-50 font-semibold' : ''
                }`}
              >
                {d.avg_margin?.toFixed(1) || '0'}%
              </td>
            ))}
          </tr>

          {/* Alertas */}
          <tr>
            <td className="border border-gray-300 p-3 font-medium">Alertas (> 45 dias)</td>
            {dealerships.map((d) => (
              <td
                key={d.dealership_id}
                className={`border border-gray-300 p-3 font-semibold ${
                  d.stock_alerts > 0 ? 'text-red-700 bg-red-50' : 'text-green-700'
                }`}
              >
                {d.stock_alerts} veículos
              </td>
            ))}
          </tr>

          {/* IPVA Status */}
          <tr className="bg-gray-50">
            <td className="border border-gray-300 p-3 font-medium">IPVA Pago</td>
            {dealerships.map((d) => (
              <td key={d.dealership_id} className="border border-gray-300 p-3">
                {d.ipva_status?.paid || 0} de {d.vehicle_count}
                <span className="text-gray-500 ml-1">
                  ({Math.round(((d.ipva_status?.paid || 0) / d.vehicle_count) * 100)}%)
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default DealershipComparison;
