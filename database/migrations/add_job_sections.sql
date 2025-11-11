-- Add job sections table for dynamic job description sections
-- This allows jobs to have multiple sections with headings like "About the Role", "What You'll Do", etc.

CREATE TABLE IF NOT EXISTS goodhive.job_sections (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
    heading VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_sections_job_id ON goodhive.job_sections(job_id);
CREATE INDEX IF NOT EXISTS idx_job_sections_sort_order ON goodhive.job_sections(job_id, sort_order);

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_job_sections_updated_at ON goodhive.job_sections;
CREATE TRIGGER update_job_sections_updated_at
    BEFORE UPDATE ON goodhive.job_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE goodhive.job_sections IS 'Stores structured sections of job descriptions with headings and content';
COMMENT ON COLUMN goodhive.job_sections.job_id IS 'Reference to the parent job offer';
COMMENT ON COLUMN goodhive.job_sections.heading IS 'Section heading like "About the Role", "What You''ll Do", etc.';
COMMENT ON COLUMN goodhive.job_sections.content IS 'Rich text content for this section';
COMMENT ON COLUMN goodhive.job_sections.sort_order IS 'Order of sections in the job description (0-based)';

-- Migration: Convert existing job descriptions to first section
-- This creates a default section for existing jobs that have descriptions
INSERT INTO goodhive.job_sections (job_id, heading, content, sort_order)
SELECT
    id as job_id,
    'Job Description' as heading,
    description as content,
    0 as sort_order
FROM goodhive.job_offers
WHERE description IS NOT NULL
  AND description != ''
  AND NOT EXISTS (
    SELECT 1 FROM goodhive.job_sections js WHERE js.job_id = job_offers.id
  );

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON goodhive.job_sections TO your_app_user;
-- GRANT USAGE ON SEQUENCE goodhive.job_sections_id_seq TO your_app_user;