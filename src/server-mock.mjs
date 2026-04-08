/**
 * MOCK SERVER - for frontend testing when Supabase is unavailable
 * Runs on port 3000, responds to same endpoints as real backend
 * No database required
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// In-memory data for testing
const mockData = {
  users: [
    {
      id: '64df10a1-e5a9-4788-8a40-5540a3bb08d3',
      email: 'dono@brossmotors.com',
      password: '$2a$10$nOUIs5kJ5naTuTFkWK1Be.lLa8DZYQQmark7zQK/My7IQUva.9K6m', // 'bross2026'
      name: 'BrossMotors Dono',
      dealership_id: '11111111-1111-1111-1111-111111111111',
      role: 'owner',
    },
  ],
  vehicles: [
    {
      id: '1',
      dealership_id: '11111111-1111-1111-1111-111111111111',
      vin: 'WBA1B12345X123456',
      brand: 'BMW',
      model: 'M340i',
      year: 2024,
      km: 1200,
      price: 450000,
      status: 'available',
      photos: [],
      features: {},
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      dealership_id: '11111111-1111-1111-1111-111111111111',
      vin: '1FTEW1E84FFH12345',
      brand: 'Ford',
      model: 'F-150',
      year: 2023,
      km: 5000,
      price: 320000,
      status: 'maintenance',
      photos: [],
      features: {},
      created_at: new Date().toISOString(),
    },
  ],
  expenses: [],
  customers: [],
  ipva: [],
};

// ===== AUTH =====
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = mockData.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      dealership_id: user.dealership_id,
      role: user.role || 'manager',
    },
    'dev-secret-key-change-in-production',
    { expiresIn: '7d' },
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      dealership_id: user.dealership_id,
      role: user.role || 'manager',
    },
  });
});

// ===== INVENTORY =====
app.get('/inventory/list', (req, res) => {
  res.json({ vehicles: mockData.vehicles });
});

app.post('/inventory', (req, res) => {
  const newVehicle = { id: String(mockData.vehicles.length + 1), ...req.body };
  mockData.vehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

app.put('/inventory/:id', (req, res) => {
  const vehicle = mockData.vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  Object.assign(vehicle, req.body);
  res.json(vehicle);
});

// ===== EXPENSES =====
app.get('/expenses/list', (req, res) => {
  res.json({ expenses: mockData.expenses });
});

app.post('/expenses', (req, res) => {
  const newExpense = { id: String(Date.now()), ...req.body };
  mockData.expenses.push(newExpense);
  res.status(201).json(newExpense);
});

app.delete('/expenses/:id', (req, res) => {
  const idx = mockData.expenses.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
  mockData.expenses.splice(idx, 1);
  res.json({ success: true });
});

app.put('/expenses/:id', (req, res) => {
  const expense = mockData.expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  Object.assign(expense, req.body);
  res.json(expense);
});

// ===== CRM (Customers) =====
app.get('/crm/customers', (req, res) => {
  res.json({ customers: mockData.customers });
});

app.post('/crm/customers', (req, res) => {
  const newCustomer = { id: String(Date.now()), ...req.body };
  mockData.customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

app.put('/crm/customers/:id', (req, res) => {
  const customer = mockData.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  Object.assign(customer, req.body);
  res.json(customer);
});

// ===== HEALTH =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mode: 'mock',
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚗 DEALER SOURCING BOT - MOCK SERVER  ║
║  🚀 Server rodando em porta ${PORT}        ║
║  📡 No database required               ║
║  ✅ Status: Online (TEST MODE)         ║
╚════════════════════════════════════════╝
  `);
});

export default app;
