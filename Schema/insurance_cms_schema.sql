-- Agents who use the system
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'agent',  -- or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients who buy policies
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance policies sold to clients
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES agents(id),
    policy_type VARCHAR(50), -- e.g. Car, Life, Health
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'active'
);

-- Automatic or manual reminders for upcoming renewals
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    method VARCHAR(20), -- email, sms, whatsapp
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads are potential clients
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    contact_info TEXT,
    agent_id INTEGER REFERENCES agents(id),
    status VARCHAR(20) DEFAULT 'new', -- new, contacted, closed
    next_contact_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily activity logs: calls, follow-ups, notes
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id),
    action_type VARCHAR(50), -- call, renewal, lead_followup
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Earnings for agents based on commission
CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id),
    policy_id INTEGER REFERENCES policies(id),
    amount NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
