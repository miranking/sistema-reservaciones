/**
 * Sistema de Reservaciones - Script de Integración
 * Este script permite embeber el sistema de reservaciones en cualquier sitio web.
 */

function iniciarSistemaReservaciones(containerId, options = {}) {
  // Asegurarse de que el contenedor existe
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Contenedor no encontrado:', containerId);
    return;
  }

  // Opciones por defecto
  const defaultOptions = {
    restaurantName: "Restaurante",
    primaryColor: "#0d925f",
    buffetColor: "#fd9b17",
    showBuffet: true,
    width: "100%",
    height: "800px"
  };

  // Combinar opciones
  const settings = {...defaultOptions, ...options};
  
  // URL base del sistema (desde donde se está sirviendo)
  const baseUrl = 'https://sistema-reservaciones.onrender.com';
  
  // Crear el iframe con todos los permisos de origen
  const iframe = document.createElement('iframe');
  iframe.id = 'sistema-reservaciones-iframe';
  iframe.style.width = settings.width;
  iframe.style.height = settings.height;
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  
  // Atributos para permitir acceso desde cualquier origen
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute('crossorigin', 'anonymous');
  
  // Construir la URL con parámetros de personalización
  let iframeUrl = `${baseUrl}?embedded=true&origin=${encodeURIComponent(window.location.origin)}`;
  if (settings.restaurantName) iframeUrl += `&restaurantName=${encodeURIComponent(settings.restaurantName)}`;
  if (settings.primaryColor) iframeUrl += `&primaryColor=${encodeURIComponent(settings.primaryColor)}`;
  if (settings.buffetColor) iframeUrl += `&buffetColor=${encodeURIComponent(settings.buffetColor)}`;
  if (settings.showBuffet === false) iframeUrl += `&showBuffet=false`;
  
  iframe.src = iframeUrl;
  
  // Vaciar el contenedor e insertar el iframe
  container.innerHTML = '';
  container.appendChild(iframe);
  
  // Comunicación con el iframe usando mensajes con origen amplio
  window.addEventListener('message', function(event) {
    // Verificamos que el mensaje venga del dominio correcto (opcional)
    if (event.origin.includes('sistema-reservaciones.onrender.com')) {
      console.log('Mensaje recibido del sistema de reservaciones:', event.data);
      
      // Manejar mensajes del sistema de reservaciones
      if (event.data.type === 'reservation-complete') {
        console.log('Reservación completada:', event.data.reservation);
        
        // Si hay un callback definido, ejecutarlo
        if (typeof settings.onReservationComplete === 'function') {
          settings.onReservationComplete(event.data.reservation);
        }
      }
    }
  });
  
  // Notificar al iframe que está listo
  setTimeout(() => {
    iframe.contentWindow.postMessage({
      type: 'parent-ready',
      origin: window.location.origin
    }, '*'); // El '*' permite enviar a cualquier origen
  }, 1000);
  
  return {
    refresh: function() {
      iframe.src = iframe.src;
    },
    resize: function(width, height) {
      if (width) iframe.style.width = width;
      if (height) iframe.style.height = height;
    }
  };
}

// Exponer la función globalmente
window.iniciarSistemaReservaciones = iniciarSistemaReservaciones;

// Notificar que el script se ha cargado correctamente
console.log('Sistema de Reservaciones: Script de integración cargado correctamente');
