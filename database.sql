-- Base de datos para Precio Verdadero
-- Ejecutar este script en MySQL para crear las tablas necesarias

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS precios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE precios;

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de conocimiento para la IA
CREATE TABLE IF NOT EXISTS ai_knowledge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('manual_usuario', 'manual_empresa', 'general') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de conversaciones (historial de chat)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos datos de ejemplo para el conocimiento de la IA
INSERT INTO ai_knowledge (title, content, category) VALUES
('Bienvenida', 'Precio Verdadero es una plataforma innovadora que ayuda a los usuarios a encontrar precios justos y transparentes. Nuestro objetivo es eliminar las sorpresas en los precios y proporcionar información clara y confiable.', 'manual_empresa'),
('Servicios Principales', 'Ofrecemos comparación de precios en tiempo real, análisis de tendencias de precios, alertas de precios, y un sistema de calificación de proveedores basado en transparencia y honestidad.', 'manual_empresa'),
('Cómo usar la plataforma', 'Para usar Precio Verdadero, simplemente busca el producto o servicio que necesitas. Nuestro sistema te mostrará una comparación de precios de diferentes proveedores, incluyendo información sobre impuestos y costos ocultos.', 'manual_usuario'),
('Política de Transparencia', 'En Precio Verdadero, creemos firmemente en la transparencia total. Todos los precios mostrados incluyen todos los costos, sin cargos ocultos. Si encuentras alguna discrepancia, por favor repórtala y la investigaremos inmediatamente.', 'manual_empresa');

