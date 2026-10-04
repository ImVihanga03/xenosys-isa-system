const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Xenosys ISA Backend is running' });
});

const complianceRoutes = require('./modules/compliance/compliance.routes');
app.use('/api/compliance', complianceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});