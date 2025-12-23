-- Create ULID generation function for PostgreSQL
-- This function generates ULID-compatible identifiers

CREATE OR REPLACE FUNCTION ulid_generate()
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
    ulid TEXT;
BEGIN
    -- Get current timestamp in milliseconds since Unix epoch
    timestamp_part := lpad(to_hex((extract(epoch from now()) * 1000)::bigint), 12, '0');

    -- Generate 16 random bytes (128 bits) and convert to hex
    random_part := encode(gen_random_bytes(16), 'hex');

    -- Combine timestamp (first 10 chars of timestamp_part) and random part
    ulid := upper(substring(timestamp_part from 1 for 10) || substring(random_part from 1 for 16));

    RETURN ulid;
END;
$$ LANGUAGE plpgsql VOLATILE;
