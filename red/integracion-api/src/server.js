import app from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET: usa el MISMO secreto que los 4 backends.');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`API de integración escuchando en http://localhost:${PORT}`));
