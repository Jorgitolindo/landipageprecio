// Configuración
const API_URL = 'http://localhost:3000/api';
let chatOpen = false;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    initializeComments();
    
    // Verificar estado de conexión al cargar
    if (!navigator.onLine) {
        console.log('📴 Iniciando sin conexión');
        showNotification('Sin conexión. Los comentarios se guardarán localmente.', 'error');
    }
});

// ========== CHAT ASSISTANT ==========
function initializeChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatAssistant = document.getElementById('chatAssistant');
    const closeChat = document.getElementById('closeChat');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');

    chatToggle.addEventListener('click', () => {
        chatOpen = !chatOpen;
        if (chatOpen) {
            chatAssistant.classList.remove('hidden');
            chatAssistant.classList.add('flex');
            // En móvil, prevenir scroll del body cuando el chat está abierto
            if (window.innerWidth < 640) {
                document.body.style.overflow = 'hidden';
            }
        } else {
            chatAssistant.classList.add('hidden');
            chatAssistant.classList.remove('flex');
            document.body.style.overflow = '';
        }
    });

    closeChat.addEventListener('click', () => {
        chatOpen = false;
        chatAssistant.classList.add('hidden');
        chatAssistant.classList.remove('flex');
        document.body.style.overflow = '';
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Mostrar mensaje del usuario
        addMessage(message, 'user');
        chatInput.value = '';

        // Mostrar indicador de escritura
        const typingId = showTypingIndicator();

        try {
            // Enviar mensaje al backend
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            // Verificar si la respuesta es exitosa
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Error al parsear respuesta:', parseError);
                throw new Error('Error al procesar la respuesta del servidor');
            }
            
            // Remover indicador de escritura
            removeTypingIndicator(typingId);

            if (response.ok && data.success) {
                addMessage(data.response, 'assistant');
            } else {
                // Mostrar el mensaje de error específico si está disponible
                let errorMsg = 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.';
                
                if (data && data.message) {
                    errorMsg = data.message;
                } else if (data && data.error) {
                    errorMsg = data.error;
                } else if (data && typeof data === 'string') {
                    errorMsg = data;
                }
                
                // Convertir saltos de línea a <br> para HTML
                errorMsg = errorMsg.replace(/\n/g, '<br>');
                
                console.error('Error del servidor:', errorMsg);
                console.error('Respuesta completa:', data);
                console.error('Status:', response.status);
                
                addMessage(errorMsg, 'assistant');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            removeTypingIndicator(typingId);
            addMessage('Error de conexión. Por favor verifica que el servidor esté corriendo en http://localhost:3000', 'assistant');
        }
    });
}

function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'bg-blue-600 text-white ml-auto max-w-[80%]' : 'bg-blue-100 max-w-[80%]'} p-3 rounded-lg`;
    
    const messageText = document.createElement('p');
    messageText.className = 'text-sm';
    
    // Si el texto contiene HTML (como <br>), usar innerHTML, sino textContent
    if (text.includes('<br>') || text.includes('<')) {
        messageText.innerHTML = text;
    } else {
        messageText.textContent = text;
    }
    
    messageDiv.appendChild(messageText);
    chatMessages.appendChild(messageDiv);
    
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message bg-blue-100 p-3 rounded-lg max-w-[80%]';
    typingDiv.innerHTML = '<div class="typing-indicator"><span>.</span><span>.</span><span>.</span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return 'typing-indicator';
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

// ========== COMMENTS SYSTEM ==========
const PENDING_COMMENTS_KEY = 'precio_verdadero_pending_comments';

// Función para verificar conexión
function isOnline() {
    return navigator.onLine;
}

// Función para guardar comentario en cache (localStorage)
function saveCommentToCache(comment) {
    try {
        const pendingComments = getPendingComments();
        const commentWithId = {
            ...comment,
            id: Date.now() + Math.random(), // ID temporal único
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        pendingComments.push(commentWithId);
        localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(pendingComments));
        console.log('💾 Comentario guardado en cache:', commentWithId);
        return commentWithId;
    } catch (error) {
        console.error('Error al guardar en cache:', error);
        return null;
    }
}

// Función para obtener comentarios pendientes
function getPendingComments() {
    try {
        const stored = localStorage.getItem(PENDING_COMMENTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error al leer cache:', error);
        return [];
    }
}

// Función para eliminar comentario del cache
function removeCommentFromCache(commentId) {
    try {
        const pendingComments = getPendingComments();
        const filtered = pendingComments.filter(c => c.id !== commentId);
        localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(filtered));
        console.log('🗑️ Comentario eliminado del cache:', commentId);
    } catch (error) {
        console.error('Error al eliminar del cache:', error);
    }
}

// Función para sincronizar comentarios pendientes
async function syncPendingComments() {
    if (!isOnline()) {
        console.log('📴 Sin conexión, no se pueden sincronizar comentarios');
        return;
    }

    const pendingComments = getPendingComments();
    
    if (pendingComments.length === 0) {
        console.log('✅ No hay comentarios pendientes');
        updatePendingCommentsIndicator();
        return;
    }

    console.log(`🔄 Sincronizando ${pendingComments.length} comentario(s) pendiente(s)...`);

    const synced = [];
    const failed = [];

    for (const comment of pendingComments) {
        try {
            const response = await fetch(`${API_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: comment.name,
                    email: comment.email,
                    text: comment.text
                })
            });

            const data = await response.json();

            if (data.success) {
                synced.push(comment.id);
                removeCommentFromCache(comment.id);
                console.log('✅ Comentario sincronizado:', comment.id);
            } else {
                failed.push(comment);
                console.error('❌ Error al sincronizar comentario:', data.message);
            }
        } catch (error) {
            failed.push(comment);
            console.error('❌ Error de red al sincronizar:', error);
        }
    }

    if (synced.length > 0) {
        showNotification(`${synced.length} comentario(s) sincronizado(s) exitosamente`, 'success');
        loadComments(); // Recargar comentarios
    }

    if (failed.length > 0) {
        console.log(`⚠️ ${failed.length} comentario(s) no se pudieron sincronizar`);
    }

    updatePendingCommentsIndicator();
}

// Función para actualizar indicador de comentarios pendientes
function updatePendingCommentsIndicator() {
    const pendingComments = getPendingComments();
    const indicator = document.getElementById('pendingCommentsIndicator');
    
    if (pendingComments.length > 0) {
        if (!indicator) {
            // Crear indicador si no existe
            const commentSection = document.querySelector('#commentsContainer').parentElement;
            const indicatorDiv = document.createElement('div');
            indicatorDiv.id = 'pendingCommentsIndicator';
            indicatorDiv.className = 'max-w-2xl mx-auto mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg';
            indicatorDiv.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-clock text-yellow-600"></i>
                        <span class="text-yellow-800 font-semibold">
                            <span id="pendingCount">${pendingComments.length}</span> comentario(s) pendiente(s) de enviar
                        </span>
                    </div>
                    <button id="syncPendingBtn" class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm">
                        <i class="fas fa-sync-alt mr-1"></i>Sincronizar
                    </button>
                </div>
            `;
            commentSection.insertBefore(indicatorDiv, commentSection.firstChild);
            
            // Agregar evento al botón de sincronizar
            document.getElementById('syncPendingBtn').addEventListener('click', syncPendingComments);
        } else {
            // Actualizar contador
            document.getElementById('pendingCount').textContent = pendingComments.length;
        }
    } else {
        // Eliminar indicador si no hay pendientes
        if (indicator) {
            indicator.remove();
        }
    }
}

function initializeComments() {
    const commentForm = document.getElementById('commentForm');
    
    // Cargar comentarios al iniciar
    loadComments();
    
    // Mostrar indicador de comentarios pendientes
    updatePendingCommentsIndicator();
    
    // Sincronizar comentarios pendientes si hay conexión
    if (isOnline()) {
        syncPendingComments();
    }

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('commentName').value.trim();
        const email = document.getElementById('commentEmail').value.trim();
        const text = document.getElementById('commentText').value.trim();

        if (!name || !email || !text) {
            alert('Por favor completa todos los campos');
            return;
        }

        const comment = { name, email, text };

        // Verificar si hay conexión
        if (!isOnline()) {
            // Guardar en cache
            const savedComment = saveCommentToCache(comment);
            if (savedComment) {
                // Limpiar formulario
                commentForm.reset();
                
                // Mostrar mensaje
                showNotification('Comentario guardado localmente. Se enviará cuando vuelva la conexión.', 'success');
                
                // Actualizar indicador
                updatePendingCommentsIndicator();
            } else {
                showNotification('Error al guardar el comentario localmente', 'error');
            }
            return;
        }

        // Intentar enviar directamente
        try {
            const response = await fetch(`${API_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(comment)
            });

            const data = await response.json();

            if (data.success) {
                // Limpiar formulario
                commentForm.reset();
                
                // Mostrar mensaje de éxito
                showNotification('Comentario enviado exitosamente', 'success');
                
                // Recargar comentarios
                loadComments();
            } else {
                // Si falla, guardar en cache
                const savedComment = saveCommentToCache(comment);
                if (savedComment) {
                    showNotification('Error al enviar. Comentario guardado localmente para enviar más tarde.', 'error');
                    updatePendingCommentsIndicator();
                } else {
                    showNotification('Error al enviar el comentario: ' + data.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Guardar en cache si hay error de red
            const savedComment = saveCommentToCache(comment);
            if (savedComment) {
                showNotification('Sin conexión. Comentario guardado localmente. Se enviará cuando vuelva la conexión.', 'success');
                updatePendingCommentsIndicator();
            } else {
                showNotification('Error de conexión. Por favor verifica que el servidor esté corriendo.', 'error');
            }
        }
    });

    // Escuchar eventos de conexión/desconexión
    window.addEventListener('online', () => {
        console.log('🌐 Conexión restaurada');
        showNotification('Conexión restaurada. Sincronizando comentarios...', 'success');
        syncPendingComments();
    });

    window.addEventListener('offline', () => {
        console.log('📴 Sin conexión');
        showNotification('Sin conexión. Los comentarios se guardarán localmente.', 'error');
    });
}

async function loadComments() {
    const commentsContainer = document.getElementById('commentsContainer');
    
    try {
        const response = await fetch(`${API_URL}/comments`);
        const data = await response.json();

        if (data.success) {
            if (data.comments.length === 0) {
                commentsContainer.innerHTML = '<p class="text-center text-gray-500">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
                return;
            }

            commentsContainer.innerHTML = data.comments.map(comment => `
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-semibold text-gray-800">${escapeHtml(comment.name)}</h5>
                            <p class="text-sm text-gray-500">${escapeHtml(comment.email)}</p>
                        </div>
                        <span class="text-xs text-gray-400">${formatDate(comment.created_at)}</span>
                    </div>
                    <p class="text-gray-700">${escapeHtml(comment.text)}</p>
                </div>
            `).join('');
        } else {
            commentsContainer.innerHTML = '<p class="text-center text-red-500">Error al cargar comentarios</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        commentsContainer.innerHTML = '<p class="text-center text-red-500">Error de conexión al cargar comentarios</p>';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

