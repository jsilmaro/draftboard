-- Database Schema for Reward + Payment System
-- Supports React.js frontend + Express backend with Stripe integration
-- Compatible with Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creators table
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    stripe_account_id VARCHAR(255) NULL,
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Briefs table
CREATE TABLE briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    funded_amount DECIMAL(10,2) DEFAULT 0.00,
    funded_status VARCHAR(20) DEFAULT 'pending' CHECK (funded_status IN ('pending', 'funded', 'cancelled')),
    stripe_session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brief_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    content TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
    UNIQUE (brief_id, creator_id)
);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brief_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('cash', 'credit', 'prize', 'credit_redemption')),
    amount DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    prize_details JSONB NULL,
    stripe_transfer_id VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- Stripe webhook events table (for tracking processed events)
CREATE TABLE stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform settings table
CREATE TABLE platform_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
('stripe_webhook_secret', 'whsec_your_webhook_secret_here'),
('platform_fee_percentage', '5.0'),
('minimum_cash_reward', '1.00'),
('minimum_credit_reward', '0.50');

-- Create indexes for performance
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_stripe_account ON creators(stripe_account_id);
CREATE INDEX idx_brands_email ON brands(email);
CREATE INDEX idx_briefs_brand_id ON briefs(brand_id);
CREATE INDEX idx_briefs_funded_status ON briefs(funded_status);
CREATE INDEX idx_submissions_brief_id ON submissions(brief_id);
CREATE INDEX idx_submissions_creator_id ON submissions(creator_id);
CREATE INDEX idx_rewards_brief_id ON rewards(brief_id);
CREATE INDEX idx_rewards_creator_id ON rewards(creator_id);
CREATE INDEX idx_rewards_reward_type ON rewards(reward_type);
CREATE INDEX idx_rewards_status ON rewards(status);
CREATE INDEX idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_rewards_created_at ON rewards(created_at);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_briefs_created_at ON briefs(created_at);
CREATE INDEX idx_creators_created_at ON creators(created_at);

-- Views for common queries

-- Creator rewards summary view
CREATE VIEW creator_rewards_summary AS
SELECT 
    c.id as creator_id,
    c.name as creator_name,
    c.email as creator_email,
    c.credit_balance,
    c.stripe_account_id,
    COUNT(r.id) as total_rewards,
    SUM(CASE WHEN r.reward_type = 'cash' THEN r.amount ELSE 0 END) as total_cash_rewards,
    SUM(CASE WHEN r.reward_type = 'credit' THEN r.amount ELSE 0 END) as total_credit_rewards,
    COUNT(CASE WHEN r.reward_type = 'prize' THEN 1 END) as total_prize_rewards,
    MAX(r.created_at) as last_reward_date
FROM creators c
LEFT JOIN rewards r ON c.id = r.creator_id AND r.status = 'completed'
GROUP BY c.id, c.name, c.email, c.credit_balance, c.stripe_account_id;

-- Brief funding summary view
CREATE VIEW brief_funding_summary AS
SELECT 
    b.id as brief_id,
    b.title as brief_title,
    b.brand_id,
    br.name as brand_name,
    b.funded_amount,
    b.funded_status,
    COUNT(s.id) as total_submissions,
    COUNT(r.id) as total_rewards_distributed,
    SUM(r.amount) as total_rewards_amount
FROM briefs b
LEFT JOIN brands br ON b.brand_id = br.id
LEFT JOIN submissions s ON b.id = s.brief_id
LEFT JOIN rewards r ON b.id = r.brief_id AND r.status = 'completed'
GROUP BY b.id, b.title, b.brand_id, br.name, b.funded_amount, b.funded_status;

-- Functions for common operations

-- Function to update creator credit balance
CREATE OR REPLACE FUNCTION update_creator_credits(
    p_creator_id UUID,
    p_amount DECIMAL(10,2)
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Get current balance
    SELECT credit_balance INTO current_balance 
    FROM creators 
    WHERE id = p_creator_id;
    
    -- Calculate new balance
    new_balance := current_balance + p_amount;
    
    -- Ensure balance doesn't go negative
    IF new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Update balance
    UPDATE creators 
    SET credit_balance = new_balance, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_creator_id;
    
    -- Return new balance
    RETURN new_balance;
END;
$$;

-- Function to log reward distribution
CREATE OR REPLACE FUNCTION log_reward(
    p_brief_id UUID,
    p_creator_id UUID,
    p_reward_type VARCHAR(20),
    p_amount DECIMAL(10,2),
    p_description TEXT,
    p_prize_details JSONB,
    p_stripe_transfer_id VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    reward_id UUID;
BEGIN
    -- Generate UUID for reward
    reward_id := uuid_generate_v4();
    
    -- Insert reward record
    INSERT INTO rewards (
        id, brief_id, creator_id, reward_type, amount, 
        description, prize_details, stripe_transfer_id, status
    ) VALUES (
        reward_id, p_brief_id, p_creator_id, p_reward_type, p_amount,
        p_description, p_prize_details, p_stripe_transfer_id, 'completed'
    );
    
    -- If it's a credit reward, update creator's balance
    IF p_reward_type = 'credit' THEN
        PERFORM update_creator_credits(p_creator_id, p_amount);
    END IF;
    
    -- Return the created reward ID
    RETURN reward_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

