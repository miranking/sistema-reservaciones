document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const checkAvailabilityBtn = document.getElementById('checkAvailability');
  const restaurantFloor = document.getElementById('restaurant-floor');
  const reservationForm = document.getElementById('reservation-form');
  const selectedTableSpan = document.getElementById('selected-table');
  const selectedDatetimeSpan = document.getElementById('selected-datetime');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const whatsappInput = document.getElementById('whatsapp');
  const makeReservationBtn = document.getElementById('make-reservation');
  const cancelReservationBtn = document.getElementById('cancel-reservation');
  const confirmationMessage = document.getElementById('confirmation-message');
  const confirmationDetails = document.getElementById('confirmation-details');
  const newReservationBtn = document.getElementById('new-reservation');
  
  // Estado de la aplicación
  let tables = [];
  let selectedTable = null;
  
  // Establecer fecha mínima (hoy)
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  dateInput.setAttribute('min', formattedToday);
  dateInput.value = formattedToday;
  
  // Cargar las mesas iniciales
  loadTables();
  
  // Event Listeners
  checkAvailabilityBtn.addEventListener('click', checkAvailability);
  cancelReservationBtn.addEventListener('click', cancelReservation);
  makeReservationBtn.addEventListener('click', makeReservation);
  newReservationBtn.addEventListener('click', resetForm);
  
  // Funciones
  async function loadTables() {
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Error al cargar las mesas');
      
      tables = await response.json();
      
      // No mostrar las mesas todavía hasta que se verifique disponibilidad
      restaurantFloor.innerHTML = '<div class="text-center p-5"><p>Seleccione fecha y hora, luego haga clic en "Verificar Disponibilidad"</p></div>';
    } catch (error) {
      console.error('Error:', error);
      restaurantFloor.innerHTML = `<div class="alert alert-danger">Error al cargar las mesas: ${error.message}</div>`;
    }
  }
  
  async function checkAvailability() {
    const date = dateInput.value;
    const time = timeInput.value;
    
    if (!date || !time) {
      alert('Por favor seleccione fecha y hora');
      return;
    }
    
    try {
      const response = await fetch(`/api/availability?date=${date}&time=${time}`);
      if (!response.ok) throw new Error('Error al verificar disponibilidad');
      
      const availableTables = await response.json();
      renderTables(availableTables);
    } catch (error) {
      console.error('Error:', error);
      restaurantFloor.innerHTML = `<div class="alert alert-danger">Error al verificar disponibilidad: ${error.message}</div>`;
    }
  }
  
  function renderTables(availableTables) {
    restaurantFloor.innerHTML = '';
    
    const availableTableIds = availableTables.map(t => t.id);
    
    tables.forEach(table => {
      const isAvailable = availableTableIds.includes(table.id);
      
      const tableElement = document.createElement('div');
      tableElement.className = `table ${isAvailable ? 'available' : 'unavailable'}`;
      tableElement.style.left = `${table.positionX}px`;
      tableElement.style.top = `${table.positionY}px`;
      tableElement.innerHTML = `
        Mesa ${table.tableNumber}
        <div class="table-seats">${table.seats} personas</div>
      `;
      
      if (isAvailable) {
        tableElement.addEventListener('click', () => selectTable(table));
      }
      
      restaurantFloor.appendChild(tableElement);
    });
  }
  
  function selectTable(table) {
    // Quitar selección previa si existe
    const previousSelected = document.querySelector('.table.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }
    
    // Seleccionar nueva mesa
    selectedTable = table;
    
    // Añadir clase selected a la mesa seleccionada
    const tableElements = document.querySelectorAll('.table');
    tableElements.forEach(el => {
      if (el.textContent.includes(`Mesa ${table.tableNumber}`)) {
        el.classList.add('selected');
      }
    });
    
    // Mostrar formulario de reservación
    selectedTableSpan.textContent = `Mesa ${table.tableNumber} (${table.seats} personas)`;
    selectedDatetimeSpan.textContent = `${formatDate(dateInput.value)} a las ${formatTime(timeInput.value)}`;
    reservationForm.style.display = 'block';
    
    // Hacer scroll hacia el formulario
    reservationForm.scrollIntoView({ behavior: 'smooth' });
  }
  
  function cancelReservation() {
    reservationForm.style.display = 'none';
    
    // Quitar selección de mesa
    const selectedTableElement = document.querySelector('.table.selected');
    if (selectedTableElement) {
      selectedTableElement.classList.remove('selected');
    }
    
    selectedTable = null;
  }
  
  async function makeReservation() {
    // Validar formulario
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const whatsapp = whatsappInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    
    if (!name || !email || !whatsapp) {
      alert('Por favor complete todos los campos');
      return;
    }
    
    if (!selectedTable) {
      alert('Por favor seleccione una mesa');
      return;
    }
    
    // Datos para la reservación
    const reservationData = {
      name,
      email,
      whatsapp,
      date,
      time,
      tableId: selectedTable.id
    };
    
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al hacer la reservación');
      }
      
      const reservation = await response.json();
      
      // Mostrar mensaje de confirmación
      reservationForm.style.display = 'none';
      confirmationMessage.style.display = 'block';
      confirmationDetails.innerHTML = `
        <strong>Nombre:</strong> ${name}<br>
        <strong>Mesa:</strong> ${selectedTable.tableNumber}<br>
        <strong>Fecha y hora:</strong> ${formatDate(date)} a las ${formatTime(time)}<br>
        <strong>Personas:</strong> ${selectedTable.seats}
      `;
      
      // Hacer scroll hacia la confirmación
      confirmationMessage.scrollIntoView({ behavior: 'smooth' });
      
      // Limpiar el formulario
      nameInput.value = '';
      emailInput.value = '';
      whatsappInput.value = '';
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al hacer la reservación: ${error.message}`);
    }
  }
  
  function resetForm() {
    confirmationMessage.style.display = 'none';
    restaurantFloor.innerHTML = '<div class="text-center p-5"><p>Seleccione fecha y hora, luego haga clic en "Verificar Disponibilidad"</p></div>';
    
    // Limpiar selección
    selectedTable = null;
    
    // Volver a verificar disponibilidad
    checkAvailability();
  }
  
  // Funciones de utilidad
  function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }
  
  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  }
});
