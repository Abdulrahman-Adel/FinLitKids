-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Parents Table
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children Table
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Hashed PIN/Password
    balance NUMERIC(10, 2) DEFAULT 0.00,
    avatar_url VARCHAR(255),
    allowance_enabled BOOLEAN DEFAULT false,
    allowance_amount NUMERIC(10, 2),
    allowance_frequency VARCHAR(50) CHECK (allowance_frequency IN ('Weekly', 'Bi-Weekly', 'Monthly')),
    spending_limit NUMERIC(10, 2),
    spending_limit_frequency VARCHAR(50) CHECK (spending_limit_frequency IN ('Weekly', 'Monthly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (parent_id, name) -- Ensure child names are unique per parent
);

-- Chores Table
CREATE TABLE chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    assigned_child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- Chore remains if child deleted? Or CASCADE? Let's SET NULL for now.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0, -- Using points as discussed
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Approved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    -- Potential future fields: due_date DATE, is_recurring BOOLEAN, recurrence_pattern VARCHAR
);

-- Savings Goals Table
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL CHECK (type IN ('Spending', 'Allowance', 'GoalContribution', 'ParentTransfer', 'ChoreReward', 'GoalRefund', 'ManualAdjustment')),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL, -- Positive for income, negative for spending
    related_chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
    related_goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Modules Table (Conceptual - Basic Structure)
CREATE TABLE learning_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_url VARCHAR(255),
    target_age_min INTEGER,
    target_age_max INTEGER,
    reward_points INTEGER DEFAULT 0
);

-- Child Learning Progress Table (Conceptual - Basic Structure)
CREATE TABLE child_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'NotStarted' CHECK (status IN ('NotStarted', 'InProgress', 'Completed')),
    completed_at TIMESTAMPTZ,
    UNIQUE (child_id, module_id) -- Ensure one progress record per child per module
);

-- Indexes for performance on foreign keys and frequently queried columns
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_chores_parent_id ON chores(parent_id);
CREATE INDEX idx_chores_assigned_child_id ON chores(assigned_child_id);
CREATE INDEX idx_savings_goals_child_id ON savings_goals(child_id);
CREATE INDEX idx_transactions_child_id ON transactions(child_id);
CREATE INDEX idx_child_learning_progress_child_id ON child_learning_progress(child_id);
CREATE INDEX idx_child_learning_progress_module_id ON child_learning_progress(module_id);

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update 'updated_at' on relevant tables
CREATE TRIGGER set_timestamp_parents
BEFORE UPDATE ON parents
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_children
BEFORE UPDATE ON children
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_chores
BEFORE UPDATE ON chores
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_savings_goals
BEFORE UPDATE ON savings_goals
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Note: Transactions are typically immutable once created, so no updated_at trigger needed.
-- Note: Learning modules might not need frequent updates, trigger omitted for now.
-- Note: Child learning progress updates might be handled differently, trigger omitted for now.
