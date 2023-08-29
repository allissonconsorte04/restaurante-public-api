require('dotenv').config()

const jwt = require('jsonwebtoken');

function verifyToken (req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.SECRET_JWT, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    next();
  })
}

function renewToken (req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    const nowInSeconds = Date.now()/1000;

    if (decoded.exp - nowInSeconds <= 30 * 60) {
      const newToken = jwt.sign({ userId: decoded.userId }, process.env.SECRET_JWT, {
        expiresIn: '1h'
      });

      res.setHeader('Authorization', newToken);
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    const nowInSeconds = Date.now() / 1000;

    if (decoded.exp - nowInSeconds <= 30 * 60) {
      const newToken = jwt.sign({ userId: decoded.userId }, process.env.SECRET_JWT, {
        expiresIn: '1h',
      });

      res.setHeader('Authorization', newToken);
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = { verifyToken, renewToken, optionalAuth }