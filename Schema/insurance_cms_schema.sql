-- 1. User Roles & Ranks
CREATE TABLE ranks (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(20)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rank_id INTEGER REFERENCES ranks(id),
    role VARCHAR(20) DEFAULT 'agent' CHECK (role IN ('agent', 'admin', 'superadmin'))
);

-- 2. Clients Table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    user_id INTEGER REFERENCES users(id),  -- the agent responsible for this client
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Policies Table
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    policy_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'active'
);

-- 4. Commission Rates (per rank & policy type)
CREATE TABLE commission_rates (
    id SERIAL PRIMARY KEY,
    rank_id INTEGER REFERENCES ranks(id),
    policy_type VARCHAR(50),
    rate NUMERIC(5, 2) NOT NULL, -- e.g. 10.50 (%)
    UNIQUE (rank_id, policy_type)
);

-- 5. Commissions (calculated per policy)
CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    policy_id INTEGER REFERENCES policies(id),
    amount NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Reminders
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    method VARCHAR(20), -- email, sms, whatsapp
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Leads
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    contact_info TEXT,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'new', -- new, contacted, closed
    next_contact_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Activity Logs
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50), -- call, renewal, lead_followup
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
