const express = require('express');
const client = require('prom-client');

const app = express();
app.use(express.json());

// Auto-collect metrics (same purpose as the Python prometheus library)
client.collectDefaultMetrics();

// Simple in-memory inventory (like a small database)
const inventory = {
  laptop:  { stock: 100, price: 75000 },
  phone:   { stock: 200, price: 25000 },
  tablet:  { stock: 50,  price: 35000 },
  headset: { stock: 150, price: 3000 }
};

// Kubernetes liveness probe
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Kubernetes readiness probe
app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

// Check stock for a product
app.get('/inventory/:productId', (req, res) => {
  const item = inventory[req.params.productId];
  if (!item) return res.status(404).json({ error: 'product not found' });
  res.json({ productId: req.params.productId, ...item });
});

// List all products
app.get('/inventory', (req, res) => {
  res.json(inventory);
});

// Reserve stock (order-service will call this)
app.put('/inventory/:productId/reserve', (req, res) => {
  const item = inventory[req.params.productId];
  if (!item) return res.status(404).json({ error: 'product not found' });

  const qty = req.body.quantity || 1;
  if (item.stock < qty) {
    return res.status(400).json({ error: 'insufficient stock', available: item.stock });
  }

  item.stock -= qty;
  res.json({ productId: req.params.productId, reserved: qty, remaining: item.stock });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(3000, () => {
  console.log('Inventory service running on http://localhost:3000');
});