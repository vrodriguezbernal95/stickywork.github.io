-- Migration: Sistema de suscripciones con Stripe
-- Fecha: 2026-01-20

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    plan_name ENUM('free', 'founders', 'professional', 'premium') DEFAULT 'free',
    status ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete') DEFAULT 'trialing',
    trial_start DATE,
    trial_end DATE,
    current_period_start DATE,
    current_period_end DATE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_business_subscription (business_id),
    INDEX idx_stripe_customer (stripe_customer_id),
    INDEX idx_stripe_subscription (stripe_subscription_id),
    INDEX idx_status (status)
);

-- Historial de pagos
CREATE TABLE IF NOT EXISTS payment_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    subscription_id INT,
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('succeeded', 'pending', 'failed', 'refunded') NOT NULL,
    description VARCHAR(255),
    invoice_url VARCHAR(500),
    invoice_pdf VARCHAR(500),
    failure_reason TEXT,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    INDEX idx_stripe_invoice (stripe_invoice_id),
    INDEX idx_business_payments (business_id, created_at)
);

-- Recordatorios de pago fallido
CREATE TABLE IF NOT EXISTS payment_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    subscription_id INT NOT NULL,
    reminder_type ENUM('first_warning', 'second_warning', 'final_warning', 'suspended') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grace_period_ends DATE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    INDEX idx_business_reminders (business_id)
);

-- Añadir campos a businesses para Stripe
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS subscription_status ENUM('trialing', 'active', 'past_due', 'canceled', 'free') DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_ends_at DATE NULL,
ADD COLUMN IF NOT EXISTS grace_period_ends_at DATE NULL;

-- Índice para búsqueda por stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_businesses_stripe ON businesses(stripe_customer_id);
