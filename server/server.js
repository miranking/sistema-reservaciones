const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Datos de ejemplo para las mesas
const tables = [];
for (let i = 1; i <= 20; i++) {
  tables.push({
    id: i,
    tableNumber: i,
    seats: 4,
    positionX: 100 + (i % 5) * 120,
    positionY: 100 + Math.floor(i / 5) * 120,
  });
}

// Datos en memoria para reservaciones
const reservations = [];

// Rutas API
app.get('/api/tables', (req, res) => {
  res.json(tables);
});

app.get('/api/availability', (req, res) => {
  const { date, time } = req.query;
  
  if (!date || !time) {
    return res.status(400).json({ error: 'Se requiere fecha y hora' });
  }
  
  const dateTime = `${date} ${time}`;
  
  // Encontrar reservas existentes para esa fecha/hora
  const bookedTables = reservations
    .filter(r => r.dateTime === dateTime)
    .map(r => r.tableId);
  
  // Devolver mesas disponibles
  const availableTables = tables.filter(t => !bookedTables.includes(t.id));
  
  res.json(availableTables);
});

app.post('/api/reservations', (req, res) => {
  const { name, email, whatsapp, date, time, tableId } = req.body;
  
  if (!name || !email || !whatsapp || !date || !time || !tableId) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  const dateTime = `${date} ${time}`;
  
  // Verificar si la mesa ya está reservada
  const isTableBooked = reservations.some(
    r => r.dateTime === dateTime && r.tableId === tableId
  );
  
  if (isTableBooked) {
    return res.status(409).json({ error: 'Mesa ya reservada para esta fecha y hora' });
  }
  
  // Crear nueva reserva
  const newReservation = {
    id: Date.now().toString(),
    name,
    email,
    whatsapp,
    dateTime,
    tableId,
    createdAt: new Date().toISOString()
  };
  
  reservations.push(newReservation);
  res.status(201).json(newReservation);
});

app.get('/api/reservations', (req, res) => {
  res.json(reservations);
});

// Rutas para la aplicación frontend - IMPORTANTE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta comodín para cualquier otra solicitud - IMPORTANTE
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
