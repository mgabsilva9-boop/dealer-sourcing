import { useState, useEffect } from 'react';
import { sourcingAPI, APIError } from '../sourcingAPI.js';

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export default function SourcingList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ make: '', model: '', priceMax: '' });
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const LIMIT = 20;

  useEffect(() => {
    loadVehicles();
  }, [filters, offset]);

  async function loadVehicles() {
    try {
      setLoading(true);
      setError(null);

      const data = filters.make || filters.model || filters.priceMax
        ? await sourcingAPI.searchVehicles({ ...filters, limit: LIMIT, offset })
        : await sourcingAPI.listVehicles(LIMIT, offset);

      setVehicles(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof APIError ? `${err.status}: ${err.message}` : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleInterested(vehicleId) {
    try {
      await sourcingAPI.markInterested(vehicleId, 'Interested from app');
      alert('✅ Vehicle marked as interested!');
      loadVehicles();
    } catch (err) {
      alert(`❌ ${err instanceof APIError && err.status === 409 ? 'Already interested' : err.message}`);
    }
  }

  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🚗 Vehicle Sourcing (Production API)</h1>

      {error && <div style={{ color: '#c00', background: '#fee', padding: '12px', marginBottom: '16px', borderRadius: '4px' }}>
        ⚠️ {error}
      </div>}

      <div style={{ background: '#f5f5f5', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
        <h3>Search</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input placeholder="Make" value={filters.make} onChange={(e) => {
            setFilters(p => ({ ...p, make: e.target.value }));
            setOffset(0);
          }} style={{ padding: '8px' }} />
          <input placeholder="Model" value={filters.model} onChange={(e) => {
            setFilters(p => ({ ...p, model: e.target.value }));
            setOffset(0);
          }} style={{ padding: '8px' }} />
          <input type="number" placeholder="Max Price" value={filters.priceMax} onChange={(e) => {
            setFilters(p => ({ ...p, priceMax: e.target.value }));
            setOffset(0);
          }} style={{ padding: '8px' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Loading...</div>
      ) : vehicles.length > 0 ? (
        <>
          <div style={{ marginBottom: '16px', color: '#666' }}>
            {offset + 1}-{Math.min(offset + LIMIT, total)} of {total} vehicles
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {vehicles.map(v => (
              <div key={v.id} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
                <h3>{v.make} {v.model}</h3>
                <p>Year: <strong>{v.year}</strong></p>
                <p>Price: <strong>R$ {v.price?.toLocaleString()}</strong></p>
                <p>Mileage: <strong>{v.mileage?.toLocaleString()} km</strong></p>
                <button onClick={() => handleInterested(v.id)} style={{
                  width: '100%', padding: '10px', background: '#0d7c66', color: '#fff',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'
                }}>
                  ⭐ Interested
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}>← Previous</button>
            <span style={{ padding: '8px 16px' }}>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setOffset(offset + LIMIT)} disabled={currentPage >= totalPages}>Next →</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No vehicles found</div>
      )}

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '16px' }}>
        <p>API: {import.meta.env.VITE_API_URL || 'http://localhost:3000'}</p>
        <p>User: {TEST_USER_ID}</p>
      </div>
    </div>
  );
}
