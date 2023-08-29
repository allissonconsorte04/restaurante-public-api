const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const clienteRoutes = require('./routes/clientes');
const funcionarioRoutes = require('./routes/funcionarios');
const produtoRoutes = require('./routes/produtos');
const pedidoRoutes = require('./routes/pedidos');
const loginRoutes = require('./routes/login');
const authMiddleware = require('./middlewares/authMiddleware');

app.use(bodyParser.json());
app.use(authMiddleware.optionalAuth);
app.use('/api/clientes', authMiddleware.verifyToken, clienteRoutes);
app.use('/api/funcionarios', authMiddleware.verifyToken, funcionarioRoutes);
app.use('/api/produtos', authMiddleware.verifyToken, produtoRoutes);
app.use('/api/pedidos', authMiddleware.verifyToken, pedidoRoutes);
app.use('/api/login', loginRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
