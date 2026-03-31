CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    status VARCHAR(20),
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_files (
    id SERIAL PRIMARY KEY,
    job_id UUID,
    file_name TEXT,
    file_data BYTEA
);