const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const app = express();
const clienteRoutes = require('./routes/clientes');
const funcionarioRoutes = require('./routes/funcionarios');
const produtoRoutes = require('./routes/produtos');
const pedidoRoutes = require('./routes/pedidos');
const loginRoutes = require('./routes/login');
const authMiddleware = require('./middlewares/authMiddleware');

app.use(cors({
  origin: 'http://localhost:5173',
  methods: 'GET,POST,PUT,DELETE',
  optionsSuccessStatus: 200, // Certifique-se de definir o status HTTP 200 OK para solicitações OPTIONS
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
})

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
