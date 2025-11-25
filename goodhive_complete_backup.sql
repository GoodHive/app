--
-- PostgreSQL database dump
--

\restrict PFXE8VcbRPElkOMkfw8w01Y2VesjMPPjXI4HOmoU5qvDkBzhAlZjXDEkjgsGCtR

-- Dumped from database version 16.9 (415ebe8)
-- Dumped by pg_dump version 16.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: goodhive; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA goodhive;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: add_email_to_wallet_account(integer, text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.add_email_to_wallet_account(user_id integer, new_email text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if email already exists for another user
    IF EXISTS (
        SELECT 1 FROM goodhive.users 
        WHERE LOWER(email) = LOWER(new_email) 
        AND userid != user_id
        AND (is_deleted IS NULL OR is_deleted = FALSE)
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update user with email
    UPDATE goodhive.users
    SET 
        email = new_email,
        auth_method = CASE 
            WHEN wallet_address IS NOT NULL THEN 'hybrid'
            ELSE 'email'
        END,
        email_verified = FALSE,
        updated_at = NOW()
    WHERE userid = user_id;
    
    RETURN TRUE;
END;
$$;


--
-- Name: FUNCTION add_email_to_wallet_account(user_id integer, new_email text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.add_email_to_wallet_account(user_id integer, new_email text) IS 'Adds email to a wallet-only account, converting it to hybrid auth';


--
-- Name: check_otp_rate_limit(text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.check_otp_rate_limit(user_email text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    otp_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO otp_count
    FROM goodhive.user_otp_verifications
    WHERE LOWER(email) = LOWER(user_email)
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN otp_count < 3; -- Allow max 3 OTPs per hour
END;
$$;


--
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.cleanup_expired_otps() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM goodhive.user_otp_verifications
    WHERE expires_at < NOW();
END;
$$;


--
-- Name: find_duplicate_accounts(text, text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.find_duplicate_accounts(check_email text, check_wallet_address text) RETURNS TABLE(userid integer, email text, wallet_address text, auth_method text, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.auth_method, u.created_at
    FROM goodhive.users u
    WHERE (
        (check_email IS NOT NULL AND LOWER(u.email) = LOWER(check_email))
        OR 
        (check_wallet_address IS NOT NULL AND LOWER(u.wallet_address) = LOWER(check_wallet_address))
        OR
        (check_wallet_address IS NOT NULL AND LOWER(check_wallet_address) = ANY(
            SELECT LOWER(unnest(u.merged_wallet_addresses))
        ))
    )
    ORDER BY u.created_at ASC;
END;
$$;


--
-- Name: FUNCTION find_duplicate_accounts(check_email text, check_wallet_address text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.find_duplicate_accounts(check_email text, check_wallet_address text) IS 'Finds all accounts matching given email or wallet address';


--
-- Name: find_user_account(text, text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.find_user_account(input_email text DEFAULT NULL::text, input_wallet_address text DEFAULT NULL::text) RETURNS TABLE(userid integer, email text, wallet_address text, auth_method text, merged_wallet_addresses text[], is_primary boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- First check by exact wallet match
    IF input_wallet_address IS NOT NULL THEN
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method, 
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(u.wallet_address) = LOWER(input_wallet_address)
          AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
        
        -- If found, return
        IF FOUND THEN
            RETURN;
        END IF;
        
        -- Check in merged wallets
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method,
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(input_wallet_address) = ANY(
            SELECT LOWER(unnest(u.merged_wallet_addresses))
        )
        AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
        
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;
    
    -- Check by email
    IF input_email IS NOT NULL THEN
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method,
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(u.email) = LOWER(input_email)
          AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
    END IF;
END;
$$;


--
-- Name: FUNCTION find_user_account(input_email text, input_wallet_address text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.find_user_account(input_email text, input_wallet_address text) IS 'Finds user account by email or wallet, including merged accounts';


--
-- Name: find_user_by_wallet(text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.find_user_by_wallet(input_wallet_address text) RETURNS TABLE(userid integer, email text, wallet_address text, thirdweb_wallet_address text, wallet_type text, auth_method text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check external wallet
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address, 
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(u.wallet_address) = LOWER(input_wallet_address)
      AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Check thirdweb wallet
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address,
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(u.thirdweb_wallet_address) = LOWER(input_wallet_address)
      AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Check merged wallets
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address,
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(input_wallet_address) = ANY(
        SELECT LOWER(unnest(u.merged_wallet_addresses))
    )
    AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
END;
$$;


--
-- Name: FUNCTION find_user_by_wallet(input_wallet_address text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.find_user_by_wallet(input_wallet_address text) IS 'Finds user by any type of wallet address';


--
-- Name: merge_user_accounts(integer, integer); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.merge_user_accounts(primary_user_id integer, secondary_user_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    secondary_wallet TEXT;
    secondary_email TEXT;
    secondary_merged_wallets TEXT[];
    secondary_merged_ids INTEGER[];
BEGIN
    -- Get secondary account details
    SELECT wallet_address, email, merged_wallet_addresses, merged_from_user_ids
    INTO secondary_wallet, secondary_email, secondary_merged_wallets, secondary_merged_ids
    FROM goodhive.users
    WHERE userid = secondary_user_id;
    
    -- Update primary account with merged data
    UPDATE goodhive.users
    SET 
        merged_wallet_addresses = array_cat(
            merged_wallet_addresses,
            array_append(COALESCE(secondary_merged_wallets, '{}'), secondary_wallet)
        ),
        merged_from_user_ids = array_cat(
            merged_from_user_ids,
            array_append(COALESCE(secondary_merged_ids, '{}'), secondary_user_id)
        ),
        email = COALESCE(email, secondary_email),
        auth_method = CASE 
            WHEN email IS NOT NULL AND wallet_address IS NOT NULL THEN 'hybrid'
            WHEN email IS NOT NULL THEN 'email'
            ELSE 'wallet'
        END
    WHERE userid = primary_user_id;
    
    -- Mark secondary account as merged (soft delete)
    UPDATE goodhive.users
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        email = email || '_merged_' || secondary_user_id::TEXT,
        wallet_address = wallet_address || '_merged_' || secondary_user_id::TEXT
    WHERE userid = secondary_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION merge_user_accounts(primary_user_id integer, secondary_user_id integer); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.merge_user_accounts(primary_user_id integer, secondary_user_id integer) IS 'Merges secondary account into primary account, preserving all wallet addresses';


--
-- Name: update_user_wallet(integer, text, boolean); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.update_user_wallet(user_id integer, new_wallet_address text, is_thirdweb_wallet boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF is_thirdweb_wallet THEN
        -- Update thirdweb wallet
        UPDATE goodhive.users
        SET 
            thirdweb_wallet_address = new_wallet_address,
            wallet_type = CASE
                WHEN wallet_address IS NOT NULL THEN 'both'
                ELSE 'in-app'
            END,
            updated_at = NOW()
        WHERE userid = user_id;
    ELSE
        -- Update external wallet
        UPDATE goodhive.users
        SET 
            wallet_address = new_wallet_address,
            wallet_type = CASE
                WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                ELSE 'external'
            END,
            updated_at = NOW()
        WHERE userid = user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION update_user_wallet(user_id integer, new_wallet_address text, is_thirdweb_wallet boolean); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.update_user_wallet(user_id integer, new_wallet_address text, is_thirdweb_wallet boolean) IS 'Updates user wallet address based on type';


--
-- Name: ensure_unique_talents(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_unique_talents() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Remove duplicates in the talents array
  NEW.talents := ARRAY(SELECT DISTINCT unnest(NEW.talents));
  RETURN NEW;
END;
$$;


--
-- Name: generate_12_digit_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_12_digit_block_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id BIGINT;
BEGIN
    LOOP
        new_id := floor(100000000000 + random() * 899999999999)::BIGINT; -- 12-digit number
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM goodhive.job_offers WHERE block_id = new_id
        );
    END LOOP;
    RETURN new_id;
END;
$$;


--
-- Name: generate_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_block_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  b BYTEA;
BEGIN
  b := gen_random_bytes(16);
  NEW.block_id := (
    get_byte(b, 0)::numeric * 2^120 +
    get_byte(b, 1)::numeric * 2^112 +
    get_byte(b, 2)::numeric * 2^104 +
    get_byte(b, 3)::numeric * 2^96 +
    get_byte(b, 4)::numeric * 2^88 +
    get_byte(b, 5)::numeric * 2^80 +
    get_byte(b, 6)::numeric * 2^72 +
    get_byte(b, 7)::numeric * 2^64 +
    get_byte(b, 8)::numeric * 2^56 +
    get_byte(b, 9)::numeric * 2^48 +
    get_byte(b, 10)::numeric * 2^40 +
    get_byte(b, 11)::numeric * 2^32 +
    get_byte(b, 12)::numeric * 2^24 +
    get_byte(b, 13)::numeric * 2^16 +
    get_byte(b, 14)::numeric * 2^8 +
    get_byte(b, 15)::numeric
  );
  RETURN NEW;
END;
$$;


--
-- Name: generate_unique_uint128(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_uint128() RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id numeric;
BEGIN
    LOOP
        new_id := (floor(random() * 9223372036854775807)::numeric * 9223372036854775808) 
                  + floor(random() * 9223372036854775807);
        IF NOT EXISTS (SELECT 1 FROM goodhive.job_offers WHERE block_id = new_id) THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$;


--
-- Name: set_block_id_if_null(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_block_id_if_null() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.block_id IS NULL THEN
        NEW.block_id := generate_12_digit_block_id();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: set_random_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_random_block_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.block_id := FLOOR(100000000000 + RANDOM() * 899999999999)::NUMERIC;
  RETURN NEW;
END;
$$;


--
-- Name: validate_or_generate_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_or_generate_block_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    max_uint128 numeric := 340282366920938463463374607431768211455;
BEGIN
    IF NEW.block_id IS NULL OR NEW.block_id < 0 OR NEW.block_id > max_uint128 THEN
        NEW.block_id := generate_unique_uint128();
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.users (
    id integer NOT NULL,
    email character varying(255),
    passwordhash character varying(255),
    userid uuid DEFAULT gen_random_uuid(),
    talent_status character varying(10) DEFAULT 'pending'::character varying,
    mentor_status character varying(10) DEFAULT 'pending'::character varying,
    recruiter_status character varying(10) DEFAULT 'pending'::character varying,
    wallet_address character varying(255),
    last_active timestamp with time zone DEFAULT now(),
    referred_by character varying(255),
    approved_roles jsonb[],
    first_name text,
    last_name text,
    thirdweb_smart_account_address character varying(255),
    auth_method character varying(50),
    merged_wallet_addresses text[] DEFAULT '{}'::text[],
    merged_from_user_ids integer[] DEFAULT '{}'::integer[],
    email_verified boolean DEFAULT false,
    email_verification_token text,
    email_verification_sent_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    thirdweb_wallet_address text,
    wallet_type text,
    CONSTRAINT check_mentor_status CHECK (((mentor_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying])::text[]))),
    CONSTRAINT check_recruiter_status CHECK (((recruiter_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying])::text[]))),
    CONSTRAINT check_talent_status CHECK (((talent_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying])::text[]))),
    CONSTRAINT email_or_wallet_required CHECK (((email IS NOT NULL) OR (wallet_address IS NOT NULL))),
    CONSTRAINT users_wallet_type_check CHECK ((wallet_type = ANY (ARRAY['external'::text, 'in-app'::text, 'both'::text])))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.users IS 'User accounts with cleaned up schema - removed legacy Okto and unused columns';


--
-- Name: COLUMN users.wallet_address; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.wallet_address IS 'External wallet address (MetaMask, WalletConnect, etc.)';


--
-- Name: COLUMN users.auth_method; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.auth_method IS 'Authentication method: email, wallet, or hybrid';


--
-- Name: COLUMN users.email_verified; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.email_verified IS 'Whether the user has verified their email address';


--
-- Name: COLUMN users.thirdweb_wallet_address; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.thirdweb_wallet_address IS 'Wallet address from Thirdweb in-app wallet (social/email logins)';


--
-- Name: COLUMN users.wallet_type; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.wallet_type IS 'Type of wallet: external, in-app, or both';


--
-- Name: active_users; Type: VIEW; Schema: goodhive; Owner: -
--

CREATE VIEW goodhive.active_users AS
 SELECT id,
    email,
    passwordhash,
    userid,
    talent_status,
    mentor_status,
    recruiter_status,
    wallet_address,
    last_active,
    referred_by,
    approved_roles,
    first_name,
    last_name,
    thirdweb_smart_account_address,
    auth_method,
    merged_wallet_addresses,
    merged_from_user_ids,
    email_verified,
    email_verification_token,
    email_verification_sent_at,
    is_deleted,
    deleted_at,
    thirdweb_wallet_address,
    wallet_type
   FROM goodhive.users
  WHERE ((is_deleted IS NULL) OR (is_deleted = false));


--
-- Name: admin; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.admin (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.admin_id_seq OWNED BY goodhive.admin.id;


--
-- Name: companies; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.companies (
    headline character varying(5000),
    user_id uuid NOT NULL,
    designation character varying(500),
    address character varying(100),
    country character varying(100),
    city character varying(100),
    phone_country_code character varying(10),
    phone_number character varying(20),
    email character varying(255),
    telegram character varying(255),
    image_url character varying(255),
    linkedin character varying(255),
    github character varying(255),
    stackoverflow character varying(255),
    twitter character varying(255),
    portfolio character varying(255),
    status character varying(50),
    wallet_address character varying(255),
    approved boolean DEFAULT false,
    inreview boolean DEFAULT false
);


--
-- Name: job_offers; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.job_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(100) NOT NULL,
    type_engagement character varying(255) NOT NULL,
    description character varying(5000),
    duration character varying(100),
    budget character varying(100),
    chain character varying(100),
    currency character varying(255),
    skills character varying(500),
    city character varying(255),
    country character varying(255),
    company_name character varying(255),
    image_url character varying(255),
    job_type character varying(255),
    project_type character varying(255),
    talent character varying(255),
    recruiter character varying(255),
    mentor character varying(255),
    wallet_address character varying(255),
    posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    job_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    in_saving_stage boolean DEFAULT true,
    block_id numeric(39,0),
    published boolean DEFAULT false,
    escrow_amount boolean DEFAULT false
);


--
-- Name: job_offers_job_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.job_offers_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_offers_job_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.job_offers_job_id_seq OWNED BY goodhive.job_offers.job_id;


--
-- Name: job_sections; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.job_sections (
    id integer NOT NULL,
    job_id uuid NOT NULL,
    heading character varying(255) NOT NULL,
    content text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: job_sections_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.job_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.job_sections_id_seq OWNED BY goodhive.job_sections.id;


--
-- Name: otps; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE otps; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.otps IS 'Stores one-time passwords for email authentication';


--
-- Name: otps_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otps_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.otps_id_seq OWNED BY goodhive.otps.id;


--
-- Name: referrals; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.referrals (
    user_id uuid NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents text[],
    companies text[],
    approved_talents text[],
    approved_companies text[]
);


--
-- Name: talents; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.talents (
    id integer NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    title character varying(1000000),
    description character varying(1000000),
    country character varying(100),
    city character varying(100),
    phone_country_code character varying(10),
    phone_number character varying(20),
    email character varying(255),
    telegram character varying(255),
    currency character varying(100),
    rate character varying(20),
    about_work character varying(1000000),
    skills character varying(1000000),
    image_url character varying(255),
    website character varying(100),
    cv_url character varying(255),
    linkedin character varying(255),
    github character varying(255),
    stackoverflow character varying(255),
    portfolio character varying(255),
    freelance_only boolean,
    remote_only boolean,
    talent boolean,
    mentor boolean,
    recruiter boolean,
    hide_contact_details boolean,
    referrer character varying(255),
    availability boolean,
    twitter character varying(255),
    last_active timestamp with time zone DEFAULT now(),
    user_id uuid,
    approved boolean DEFAULT false,
    inreview boolean DEFAULT false
);


--
-- Name: talents_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.talents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talents_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.talents_id_seq OWNED BY goodhive.talents.id;


--
-- Name: user_otp_verifications; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.user_otp_verifications (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    wallet_address character varying(255) NOT NULL,
    otp_code character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    last_attempt_at timestamp without time zone
);


--
-- Name: TABLE user_otp_verifications; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.user_otp_verifications IS 'Stores OTP codes for email verification during social login';


--
-- Name: COLUMN user_otp_verifications.otp_code; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.user_otp_verifications.otp_code IS 'SHA256 hashed OTP code for security';


--
-- Name: COLUMN user_otp_verifications.attempts; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.user_otp_verifications.attempts IS 'Number of failed verification attempts';


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.user_otp_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.user_otp_verifications_id_seq OWNED BY goodhive.user_otp_verifications.id;


--
-- Name: user_wallet_history; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.user_wallet_history (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    wallet_address character varying(255) NOT NULL,
    wallet_type character varying(50),
    action character varying(20) NOT NULL,
    auth_provider character varying(50),
    session_id character varying(255),
    ip_address character varying(45),
    user_agent text,
    device_info json,
    location_info json,
    metadata json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_wallet_history_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.user_wallet_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_wallet_history_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.user_wallet_history_id_seq OWNED BY goodhive.user_wallet_history.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.users_id_seq OWNED BY goodhive.users.id;


--
-- Name: wallet_migrations; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.wallet_migrations (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    okto_wallet_address character varying(255),
    thirdweb_wallet_address character varying(255),
    smart_account_address character varying(255),
    migration_status character varying(20) DEFAULT 'pending'::character varying,
    migration_type character varying(50),
    error_message text,
    error_stack text,
    retry_count integer DEFAULT 0,
    metadata json,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wallet_migrations_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.wallet_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallet_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.wallet_migrations_id_seq OWNED BY goodhive.wallet_migrations.id;


--
-- Name: job_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(100) NOT NULL,
    type_engagement character varying(255) NOT NULL,
    description character varying(5000),
    duration character varying(100),
    budget character varying(100),
    chain character varying(100),
    currency character varying(255),
    skills character varying(500),
    city character varying(255),
    country character varying(255),
    company_name character varying(255),
    image_url character varying(255),
    job_type character varying(255),
    project_type character varying(255),
    talent character varying(255),
    recruiter character varying(255),
    mentor character varying(255),
    wallet_address character varying(255),
    escrow_amount character varying(255),
    posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    wallet_address character varying(255) NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents text[],
    companies text[],
    approved_talents text[],
    approved_companies text[]
);


--
-- Name: your_new_table_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.your_new_table_name (
    wallet_address character varying(255) NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents jsonb,
    companies jsonb,
    approved_talents jsonb,
    approved_companies jsonb
);


--
-- Name: your_table_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.your_table_name (
    user_id uuid NOT NULL,
    wallet_address character varying(255) NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents text[],
    companies text[],
    approved_talents text[],
    approved_companies text[]
);


--
-- Name: admin id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.admin ALTER COLUMN id SET DEFAULT nextval('goodhive.admin_id_seq'::regclass);


--
-- Name: job_offers job_id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers ALTER COLUMN job_id SET DEFAULT nextval('goodhive.job_offers_job_id_seq'::regclass);


--
-- Name: job_sections id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_sections ALTER COLUMN id SET DEFAULT nextval('goodhive.job_sections_id_seq'::regclass);


--
-- Name: otps id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.otps ALTER COLUMN id SET DEFAULT nextval('goodhive.otps_id_seq'::regclass);


--
-- Name: talents id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents ALTER COLUMN id SET DEFAULT nextval('goodhive.talents_id_seq'::regclass);


--
-- Name: user_otp_verifications id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_otp_verifications ALTER COLUMN id SET DEFAULT nextval('goodhive.user_otp_verifications_id_seq'::regclass);


--
-- Name: user_wallet_history id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_wallet_history ALTER COLUMN id SET DEFAULT nextval('goodhive.user_wallet_history_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users ALTER COLUMN id SET DEFAULT nextval('goodhive.users_id_seq'::regclass);


--
-- Name: wallet_migrations id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.wallet_migrations ALTER COLUMN id SET DEFAULT nextval('goodhive.wallet_migrations_id_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.admin (id, name, email, password, role, created_at) FROM stdin;
2	Abir	abir@gmail.com	$2b$10$vk1rorMWLuKzZ6SBpac7EO.B7AUGJo.E6TY.9lib/deK2LFNEclAm	admin	2025-02-04 18:57:02.189136+00
3	Benoit	benoit@goodhive.io	$2b$10$RVZ8ZxtVnHnPxdvh1j9TZeEBGfJokB5RgCbm9wxgAPEjYVtaUm.F2	admin	2025-02-05 17:55:34.126295+00
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.companies (headline, user_id, designation, address, country, city, phone_country_code, phone_number, email, telegram, image_url, linkedin, github, stackoverflow, twitter, portfolio, status, wallet_address, approved, inreview) FROM stdin;
Welcome to Automate SaaS! We are a trailblazing SaaS company committed to revolutionizing how businesses operate in the digital era. Established 2023, our mission is to empower organizations across industries by delivering cutting-edge software.	c7ffec4c-d4f0-4c0a-a2dd-0997d4c35f9c	Automate SaaS	4832 Ersel Street	US	Plano	1	4207838768	ssrifat2277@gmail.com	rifat23rr	https://goodhive.s3.us-east-005.backblazeb2.com/image_e8d5465d-bae6-4171-9a14-16e2210dda1f.jpeg	https://www.linkedin.com/sabbirrifat	https://www.github.com/sabbirrifat	\N	\N	\N	approved	0x56f77403a0491a0E571E081889aCe69B808Ae448	t	f
International Mobility Agent	898a3440-d445-49ff-9136-d164ba94d90b	Optimization	02859 Streich River	JE	Glovershire	938	285-765-9379	Dovie.Herman@hotmail.com	sadie	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x6A9e25CF38eC58854eab0c010A7D59bBC18702d7	f	f
District Optimization Consultant	6da67fc7-660e-4f5f-8561-88cdf1b15717	Accountability	267 O'Hara Mall	VN	West Kristofer	34	843-829-7775	Llewellyn_Daniel69@yahoo.com	mitchell	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x0B1C14d9B7E6B34D0f9D9E49eF93BDAAa447D77F	f	f
Internal Brand Associate	2c8aba17-f37d-431e-aa1c-47c7ebfbb492	Accounts	7419 Corkery Locks	GG	Krisfurt	234	401-899-2946	Neal_Crooks64@gmail.com	jalen	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x3dE34183ddde4aFBFe1e57bee2539BCefFcA6b0B	f	f
Product Quality Agent	603fd932-f622-43f3-8a27-be6629fee52e	Brand	753 Elyssa Haven	CG	Zoieton	65	391-519-4810	Watson.Schneider65@yahoo.com	alexa	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xa3C5020862736CF3a48ba2BF8a996D67ce0efA18	f	f
Chief Brand Engineer	129c2193-8364-4319-8606-d88f042fc77c	Marketing	9012 Stanton Lake	AR	North Ashleigh	122	426-318-0982	Yessenia18@yahoo.com	ronaldo	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x46326b0eBC74A4A04D438edf81B2f5B227ea434e	f	f
Dynamic Interactions Director	1f2e007a-0fad-48d2-986d-d0257a1ff7c1	Quality	5845 Dane Hills	BI	Drewburgh	958	881-401-5752	Roman.Pacocha@hotmail.com	britney	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x34e7659f04404aD544074F7E9CBa9Ba5853030d1	f	f
District Intranet Developer	de026250-0283-4754-be32-0395211ef81f	Configuration	368 Gunnar Brooks	ET	Marionmouth	849	988-703-2392	Zaria.Wuckert@gmail.com	selena	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xaecc660c9b823d5a2520174D5532436A779b8322	f	f
Dynamic Security Director	5fd356f5-9995-4319-a955-e5d8786d9dbe	Applications	095 Abbott Summit	DJ	North Jeradstad	487	890-211-3959	Clement23@hotmail.com	idella	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xF1d8144f846df04Ee2c6D203168f8c08cb930dA7	f	f
Future Implementation Administrator	0cab87f5-c7d6-4aeb-9440-dda98f1fd76f	Implementation	2315 Granville Forges	CG	Rebekachester	449	752-492-2784	Lloyd19@hotmail.com	theodora	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xdE64003ACfdF11CFB47fD2A918624cb07D8D188C	f	f
Customer Data Architect	b07bd0bd-7fd4-4a90-b8c1-9b8e2a2a2698	Paradigm	36888 Kellie Pines	MP	New Jamaal	429	624-710-0543	Laverne.Hilpert2@yahoo.com	bennett	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xCccE99C9f7f86F948D93f67cC3A6DE41B01988Fd	f	f
<p>DEV</p>	85abf727-b5f8-41f0-be45-d425b5c44bff	FEATURE	1 rue	FR	paris	33	650334223	contact@wagner-nicolas.com	t.me/n1c01a5	https://goodhive.s3.us-east-005.backblazeb2.com/image_ad32e99d-ac3d-4684-9e84-8f33f4e97ed1.jpeg	https://linkedin.com/123	\N	\N	\N	\N	approved	0x580B9ca15035B8C99bda7B959EAB185b40b19704	t	f
Senior Functionality Designer	7564a89e-b44d-4862-9daf-b63dfe6910ad	Mobility	139 Helga Parkway	RO	Gracetown	769	977-957-8006	Leanna8@hotmail.com	johnathon	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x4EBCD5E13954e62828aC197F352cbfA8FC382ABc	f	f
Forward Marketing Executive	3748fe63-cb8f-4552-be2e-f57d01fade3a	Communications	16467 Johnson Fort	CL	Mohrfort	606	623-261-9913	Jackeline17@gmail.com	jasmin	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x062F3139e47957c77d214608290005D6FE457FcC	f	f
Dynamic Applications Coordinator	21c98d07-4448-4225-9b62-d19200c80b5c	Assurance	95401 Ziemann Estates	BG	Newark	604	550-919-9430	Rosie.Cassin46@hotmail.com	loyal	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x9ddd1C42426b6AD00BD85C6276d79b8045728d4D	f	f
District Quality Director	6ccf4825-7497-465c-8c38-bc097902927c	Program	903 Frami Rue	GF	Lorain	744	953-520-1392	Mustafa.Considine12@gmail.com	abraham	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xf1432A25412668b96Ab6D3EC93A4AD0531b5aBc3	f	f
District Creative Architect	a32f26c4-a80c-4b88-b273-7e7ac15057f7	Tactics	7306 Schuster Ridge	NC	Griffinburgh	177	829-678-1355	Willis.Connelly74@yahoo.com	annabelle	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x3DeF3Ee6c2434f3090976E40AeFd4245Ed888fB5	f	f
Investor Implementation Technician	721043ac-84f6-45b8-8a73-6521e3e39533	Infrastructure	60476 Turner Tunnel	ME	Sunrise Manor	604	636-361-2257	Sydni_Deckow@hotmail.com	brianne	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x60251eB95C31A8bFc45345FDB789E722B07223c9	f	f
Human Metrics Technician	3a9d9e33-1e99-45e2-a3af-811d9c1c9c03	Implementation	638 Grimes Shoal	MR	Orland Park	961	487-638-0665	Janiya_Veum@yahoo.com	baby	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x3eaC241Ea3FdD9B1971bD990e87940aD5Fedabeb	f	f
Product Implementation Liaison	5642b83a-17d0-4498-aeb0-216b92667119	Applications	734 Etha Neck	GH	South Collinburgh	454	549-379-4443	Sage50@yahoo.com	godfrey	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xeeC713ffcbe66379480c9ec428f774adbA372F05	f	f
District Usability Executive	7dc5b82f-4325-425c-8c94-8a0b0565abac	Implementation	916 Laverna Cliffs	EH	Schroederside	661	506-406-5469	Consuelo.Ruecker48@hotmail.com	uriah	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x732cde2277472E22B5595160724B60c566AfdBd2	f	f
Future Security Producer	a4bd836d-8879-40c2-a824-57a2f7c8afb8	Research	757 Hauck Manors	LI	Ramonport	483	202-652-1595	Miracle.Wilkinson@yahoo.com	reed	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x4854d27fE24BE0170482F9f2269DD58850cC6cDF	f	f
Future Integration Director	d0aff9b3-207f-454e-87b7-e3672ff5954e	Intranet	770 Nona Inlet	KM	Jacksonville	828	658-294-0431	Judy_Wyman85@gmail.com	fanny	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x4B9Ce06f037C0f3631868C962Bc7ff16EB56A47D	f	f
Forward Accounts Analyst	f2011f89-b8fb-4ea0-8276-c5129a206db5	Response	119 Bailee Mews	CF	Lake Nathaniel	326	872-279-5551	Letha69@hotmail.com	bart	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x3e0B1cCB4115311aD3e488ff7Ee317f46Ef8Dcec	f	f
International Mobility Planner	f67c4130-6f3a-44d0-bd6e-42fdd714dea7	Integration	2553 Brianne Hills	DK	South Wilfredville	243	797-793-0514	Olin40@gmail.com	beatrice	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x76bF68a1695Fb499fF00C0B685C04e5616AeF716	f	f
Principal Implementation Executive	336c5b17-47fb-4116-8a30-69253f8d3013	Functionality	48747 Melyna Cliff	LR	St. Clair Shores	641	876-596-3902	Stan60@hotmail.com	yasmeen	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x58021A92aB7BfDC9Ca097819819aA83237f38531	f	f
Corporate Implementation Administrator	ac3a4bc9-b42f-4937-9084-6e2e4fca79fd	Applications	060 Rey Locks	AT	Cummeratashire	319	461-228-5003	Monique_Vandervort98@yahoo.com	raven	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x38bD1B475DEC3cF1F2fCb7bdf1B3a097a20c4513	f	f
Dynamic Brand Executive	05371ca1-be56-4f09-b90a-4fb343f7a540	Quality	775 Lina Islands	NR	Trenton	984	507-515-1271	Darius.Hagenes@yahoo.com	catherine	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x1886536fe953aD56473DfBFe3fa61F35802Ce84A	f	f
Forward Brand Supervisor	eb41122c-de27-4e82-b124-3b0d8a218184	Metrics	86476 Schmeler Parks	FO	Braunside	394	444-574-7296	Jason99@gmail.com	deion	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x79b9C5E3797a03EedD279Ca47BbAb5CF92288d37	f	f
This is a test hello world company.	d603fd9d-4f63-470a-bbf6-ac5bb2a999e2	Hello World	New York	US	New York	1	019887766511	helloworld@gmail.com	@helloworld	\N	\N	\N	\N	\N	\N	approved	0xC9293f2184d72eeB39e35aa005ecbBb860f31A04	t	f
Investor Tactics Consultant	1ecc0505-88fd-4b36-9bb6-9879de4c41cc	Interactions	2746 Leuschke Ferry	BG	Richardson	679	757-966-1848	Zelma_Boyle60@hotmail.com	jannie	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xa347f65D3a3BFA75Ef17d852074bA88E20E817e7	f	f
Direct Creative Analyst	712a1087-2c54-4e9b-b322-e1caae888dd8	Infrastructure	57600 Roberta Turnpike	IM	D'Amoreville	139	943-608-9784	Juliet_Kulas@gmail.com	della	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x1B08A4C0E187Fea21a0b2682aF8F7Ae6c50D1F20	f	f
Direct Research Orchestrator	a9940515-403b-4e13-ade3-0495c5547b7f	Brand	009 Graham Flat	AI	South Lelaport	578	329-315-4723	Reyes_Kilback69@gmail.com	leopoldo	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x5f887F9479C95488b9CD2dD8594f0B6dD51A2d33	f	f
Chief Optimization Orchestrator	864aab9e-f5ab-4deb-9482-83f929f6babf	Branding	07386 Frederik Courts	AQ	Bednarton	993	622-368-9187	Sophie62@yahoo.com	aisha	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x757C17a31303C7939C730D66AB51646f92Af3bED	f	f
Global Branding Executive	208186bd-851e-4202-b578-03af4872f205	Marketing	268 Bartell Pine	LK	Port Nelle	106	734-252-7873	Craig.Kovacek@hotmail.com	dane	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xa04D10f2b4e5Bfa1d14b15c64327749Aaf7d5cd4	f	f
International Implementation Supervisor	cca55f69-5baa-4ecb-bdf5-9578b627fa32	Infrastructure	97258 Cody Corners	KE	West Waylonport	67	764-758-8250	Eloise.Stark@yahoo.com	thurman	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xB153d159a5Be23C27e88c97f6E3bCfEE20F73B03	f	f
Future Accountability Developer	994261b3-c6cc-47cf-ab22-53e042ba50e7	Program	39031 Wilderman Ville	JE	Lake Kelsi	459	780-375-6827	Augusta_Heathcote@yahoo.com	ulises	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x7fC5eEA89877a51b70cD1d659461d7f5Bd6b86d8	f	f
Chief Web Associate	12e0fd6a-9c4f-47e8-a0dd-0a0a3df244fb	Mobility	0958 Lebsack Bridge	SG	Rosenbaumfurt	544	855-280-6203	Aryanna34@hotmail.com	jana	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x188D52624450498fc52223500F6200eC8085035F	f	f
Global Markets Analyst	c796338b-859d-402d-9274-a6d152950673	Accountability	2773 Frami Highway	CZ	North Loritown	596	850-945-6586	Clement24@yahoo.com	chadrick	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x91b7C91B34F1D5119329A2e119B034295e032f13	f	f
Internal Intranet Producer	76414614-e8b5-4a40-9c2f-ca95601c2af2	Functionality	93643 Dustin Ville	BE	Ricehaven	355	416-225-9182	Elvie.Gleason96@yahoo.com	martina	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xf011Afd112dFE40291f0fF2E7e7eE89E522190A1	f	f
Customer Optimization Consultant	cebc4705-1bcb-436d-a935-01d2a0006284	Paradigm	33500 Jeffrey Fords	MZ	Schneiderville	532	761-768-3577	Deondre.Hammes@gmail.com	favian	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xb8afe1dA417ff351db04C3Be12DD2359130E0416	f	f
Future Optimization Manager	d174d0e2-934e-4398-b433-c20dc0bae985	Security	9474 Rau Stravenue	MV	Danielmouth	756	629-442-9895	Delaney.DAmore@gmail.com	davin	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x64b2785b807ec5685537972De5F0FAc6e855D6B2	f	f
Corporate Accountability Associate	88ab38f7-fb4a-4766-a2d1-5d8b6dbb548c	Branding	2096 Turcotte Roads	JP	Goldnerborough	245	484-907-4850	Nikki69@gmail.com	ross	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xc01C7042fCA3e21C64b5407a9452A4F8BB4Eb131	f	f
Corporate Marketing Strategist	782aac00-97b0-4380-95dc-1a386775076c	Markets	2986 Cali Station	MT	Kendall	919	895-874-6369	Bobbie_Cartwright@gmail.com	nayeli	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x199105EF81f15bfC5cD7dd9e60ab5B7481AfD7Eb	f	f
Forward Web Architect	26e26e8f-4dcd-41d4-b5b7-5fe7e5605de3	Functionality	4252 Bogisich Courts	FR	Aliso Viejo	973	399-517-4828	Izabella99@hotmail.com	angelo	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x1cb5781F6eC713551AAEac15e0f317D15a3362D0	f	f
Future Infrastructure Specialist	c14102a3-3d40-46fd-9eb5-dc1a9252cb60	Quality	37635 Russel Roads	UY	Port Delmerville	896	471-320-0041	Austyn.Kessler@hotmail.com	emily	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x2a5b965A5F26E232A55A02d30Ad0CA646131170c	f	f
Direct Factors Representative	f8abdf9c-2a0c-4278-aa6b-8832e690418e	Response	3880 Bauch Grove	GW	Ontario	840	531-215-8821	Emily57@hotmail.com	laurianne	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xBC3363f2e66772886392a0d18bC08573F94de0EA	f	f
Legacy Usability Designer	caa640ac-fdba-4dce-8118-3e4c837eb917	Group	8916 Annamarie Mills	BQ	West Margret	315	213-636-2445	Otha_Padberg@hotmail.com	austen	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x89973123427CB09F2b233b371A0dE4aD9B140F36	f	f
District Accounts Assistant	04c979f6-e5ba-4c1d-ade1-fad40d92838c	Identity	25900 Angelo Shores	SY	Georgiannafort	913	920-848-7921	Kailee_Romaguera@gmail.com	dahlia	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x31334aa3B1a257F40a67043ef33503CdB1Fd306B	f	f
Future Optimization Producer	15afa5d6-da2d-4d8b-9fe1-1b75ad0b0ea4	Creative	195 Bonnie Meadows	WS	Merlinmouth	527	821-464-4359	Bobby_Friesen@gmail.com	dennis	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x56DAC0454a5e2cC44343f3D13Da2e23447815f1B	f	f
Senior Intranet Assistant	99e3b1af-ee1e-4434-9021-8290ea6a1dbc	Accountability	736 Ledner Wall	TN	Coral Springs	647	441-648-4250	Name.Crist@hotmail.com	misael	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x7eA5BD0d561Ce1Fc857c18b1E517A181e7298107	f	f
Customer Accounts Executive	e2555353-a362-49ba-b5d6-8c2cd4dc6346	Marketing	06287 Gulgowski Villages	UA	Medhursthaven	166	459-253-5415	Jon.Schultz@gmail.com	eusebio	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x32b439729aF49cd6e2a763DD535140e0F37E3656	f	f
Dynamic Usability Associate	965ecbc7-5337-4f46-b809-0e27c9da90e2	Program	1377 Kennedi Streets	BG	Goodyear	478	747-720-1357	Laverna47@gmail.com	sasha	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x182a17D8efbf8cBd94a375A022aEf7147B0A483e	f	f
Central Applications Engineer	5525c302-d7eb-4ad3-a4e0-843b33c79d4d	Implementation	02369 Roberts Street	TC	Gulfport	14	751-775-7883	Zander41@yahoo.com	hank	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xE918ab0dB467D9Ea345a36C35270D5d04C04892C	f	f
Dynamic Security Designer	43bb842a-f894-420a-92f6-27b4b95b3c6f	Operations	986 Feil Underpass	JM	Buckridgemouth	452	403-411-6322	Roman.Hessel@yahoo.com	skye	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x5Ee3d6D4C90ce70694c8Ef70a7553A386bE4C138	f	f
Regional Paradigm Coordinator	b7a46298-d477-4e59-93f1-081888841b07	Metrics	12173 Deshawn Locks	SH	Allenchester	270	456-962-6773	Tess10@gmail.com	elliot	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xE36f15926d108b6C4E8C6Dfa68e19d4b0A89d89d	f	f
Legacy Implementation Designer	21056ed7-fa0e-42f1-8b06-af56056a738f	Quality	54659 Gislason Views	WF	Bartolettiton	288	240-741-4847	Maeve_Greenfelder@gmail.com	austen	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x4DDDC204cF4079dF60e4712de9870Bb396A1b5C9	f	f
Global Accountability Associate	1a6067ed-c02f-4490-88dc-094831bffc34	Identity	991 Spinka Stream	PL	South Evertchester	51	844-308-9974	Roosevelt.Turcotte45@yahoo.com	arno	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x493F7211420D7245420FEaf0982a33f7A82A315B	f	f
Future Directives Coordinator	212b5dfb-8923-44cc-a6b4-4c6eceb6e869	Interactions	877 Bailey Pass	VU	East Alberthaside	783	326-707-2171	Gracie_Kuhlman@gmail.com	rocky	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x34df34e4386Ca53d83C9d9B45552bb2910254566	f	f
Customer Markets Producer	9bfd979a-48fc-43c2-9e61-32423eb676b8	Program	4462 Graham Valley	ME	New Domingoport	404	823-640-3369	Claudine.Lynch@yahoo.com	patience	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xC28019f496ada193E579E6133D5Ba75f017735a8	f	f
Product Quality Engineer	ed739426-f5eb-4106-b229-89f9323af6d2	Factors	815 Raheem Lights	AM	Union City	173	881-653-8878	Jailyn_Lynch25@gmail.com	roselyn	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xFa64BBa8f5d330C31682676F2509CE8D0E134D10	f	f
Forward Implementation Liaison	1625d0a9-eb96-4f4a-81ed-f630aac418e1	Assurance	120 Hayes Station	GD	Kundeland	58	820-595-2654	Lonzo97@yahoo.com	tyrel	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x117190D26c4948a3f1bd9F6D546d316Be9105536	f	f
Dynamic Branding Liaison	a19e4656-5ed8-49a8-ab2e-713829694605	Optimization	642 Dedric Canyon	GT	Moore	844	453-310-8011	Jovanny.Cruickshank@hotmail.com	lou	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xc71c31e5cdD2c921b588f543562901BB1ABfE904	f	f
Regional Configuration Assistant	e2723d15-76ad-49ff-a405-f8a6f303ab2f	Division	677 Schimmel Place	GI	Rocklin	382	822-319-5570	Jeff.Bednar28@gmail.com	patience	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xBC462a561605Db22eaFF75d4212ec14efAdA6A14	f	f
Forward Accounts Executive	76eac557-5d52-45ab-9491-760060558147	Configuration	970 Mayert Locks	LU	Middletown	160	790-734-0809	Patrick93@hotmail.com	gaston	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x6057a62A9f6F92042d2C4095bd7E561d43bEf97D	f	f
Product Program Manager	65f1081e-6323-4a66-b859-f4ec43c9d0d5	Accounts	229 Dare Isle	IL	Danielmouth	216	698-829-6837	Kelly_Nicolas@yahoo.com	stephania	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x4e289B0C919B656D9c07f99df3898Ecdf11C346f	f	f
Dynamic Response Consultant	b2137ee7-a863-4988-a204-a8a2a3ea7ffe	Identity	012 Feeney Points	ZW	New Quinn	818	317-342-3005	Mertie_Blanda26@yahoo.com	hans	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xe999CFCc85b48226508a920f5e934E2366229fd7	f	f
Human Mobility Specialist	b39b610e-50d7-45b9-b61b-67aebe287a41	Brand	70223 Gulgowski Locks	MV	Allyhaven	636	370-262-5964	Beulah.Wilkinson73@gmail.com	haylee	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xF7412Fdf2C7460d2E843943C43479C64fA12E44b	f	f
Investor Applications Representative	28758277-e28c-486e-8802-7865853bad14	Branding	83027 Champlin Highway	TO	McLaughlinburgh	852	697-472-3785	Maryjane_Bayer49@yahoo.com	ryleigh	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x612E9da3ff793c0ec454105fE6eE7C6CD87778e9	f	f
Corporate Response Architect	a253a14c-ae64-4259-aec0-81a35c5ed7ff	Configuration	2622 Warren Burgs	NU	New Gayle	207	947-804-2078	Lazaro.Kemmer98@gmail.com	dion	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xc579638e0399eB77727a3506Fa76C5112147BA45	f	f
Senior Implementation Technician	b8e9f507-12a2-4aca-901f-d4b39d999a81	Brand	5984 Keebler Expressway	PF	Framistad	492	461-340-3593	Sadye_Hickle@gmail.com	abbie	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x58Cc0e6C877292Fc494595E4Dc127bf2B57bD688	f	f
Investor Infrastructure Producer	c145bf96-264b-4734-aec2-997c6aced12f	Interactions	05866 Dagmar Islands	IT	Mullerchester	257	869-356-6180	Porter.Heathcote@hotmail.com	ashleigh	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x88C2F2EAdEd5216C8ff6816136C426f58D41c193	f	f
Future Quality Liaison	0db9d3b3-c042-465c-9090-217ea7293db6	Infrastructure	347 Kemmer Tunnel	KN	Port Pierce	326	824-201-2882	Addison_Nienow@hotmail.com	jaylin	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x6F8ffC2f744ed0CdF5492e43B57745717334Db1C	f	f
Internal Configuration Facilitator	bf3738fe-51b2-489f-bee4-7d2064a45756	Interactions	70038 Mya Ports	SA	Angelobury	603	679-888-5060	Jasper.Goyette@hotmail.com	lizzie	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x59Aa4cBdde2B060EDb9735E944f90881EeDC2bC7	f	f
Internal Markets Representative	d641d07a-b4e9-4829-8958-c5612114eb1a	Branding	5125 Samson Wall	AM	Walshmouth	275	926-268-3064	Arne_Sauer24@hotmail.com	jovanny	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x08a8850a1dD724C83cB9cd983503a2Ac788DB6cD	f	f
Customer Configuration Agent	3d4b18cc-3597-4733-b002-a31cc1c85332	Branding	03270 Jast Trail	ZM	North Dominic	141	421-872-2654	Markus.Hettinger0@hotmail.com	kristopher	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xcC4e8f7EeFA163323B8aA234991D1f3EAB7A46eD	f	f
Legacy Optimization Specialist	2765a4a4-08c8-4dbc-8fca-b2568f5c7a25	Research	551 Sporer Knoll	ID	North Nicklausberg	356	424-717-1662	Mervin_Hand80@gmail.com	jo	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xD734C04481dEcC22145b86A5e0Ffc3Ab761B4995	f	f
Future Research Planner	ed52fbfc-537b-44f4-9e4a-e2184500c566	Communications	3575 Murazik Grove	TF	New Destinee	90	294-512-4307	Briana43@gmail.com	jordane	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x7C6D50A11fc4f4798Ce8208F618C518FEF53d9Bb	f	f
Dynamic Implementation Associate	f1ad28c0-1f42-4c8a-b9f4-f896c327be77	Mobility	2425 Kris Coves	GS	Schneidermouth	610	371-683-8887	Heloise24@hotmail.com	melisa	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xEAFb3E57F054600629334d82dd5e05324E1e683f	f	f
District Marketing Analyst	4aad8cda-6e6a-4291-85c2-44c3bc361a3f	Response	803 Jarrett Green	NG	Modesto	80	380-376-3185	Arnold59@yahoo.com	jaclyn	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xDB6B972F975E915d999cFa6cEBcFCaba81BB7B5D	f	f
Internal Web Associate	b03676a9-5073-4dbc-95c1-4d4d30db2d6a	Assurance	49682 Jacey Well	PH	Uniquetown	676	629-232-7384	Ford_Zemlak60@yahoo.com	cyrus	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x3ABa91E75E0F4f7B23054e8181c2e055d4574c5c	f	f
Direct Interactions Planner	65569139-e11a-4224-ae21-e28778842223	Research	574 Hugh Springs	DE	West Seneca	449	449-749-2857	Deven.Von35@yahoo.com	brycen	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x25dD3F778bF839A7b4f21F025452a90637Cce7D6	f	f
Lead Functionality Director	2cfe1030-dc9c-47d6-b94d-ef0f0bd0e8e4	Mobility	88583 Madisen Turnpike	TZ	Bristol	667	205-285-8346	Destany73@yahoo.com	estelle	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xBd0A7F9ef527A7FF3ed0ee0C21eF7a87124d5FFa	f	f
Customer Applications Facilitator	6275478c-89a0-4a03-ad4b-a324fceb0843	Identity	60615 Satterfield Cliff	BD	Grand Junction	884	888-227-0962	Corene.Morar@hotmail.com	trevion	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xf9d2357Deedcc8424e9AB06AeCE0474044A716B5	f	f
National Web Administrator	2d5ab7e2-2dd2-4ada-a42d-0d483264669d	Factors	462 Dietrich Ports	DZ	East Lillystad	770	409-237-2460	Thad_Kris20@yahoo.com	herta	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xb33EC212D7ed98098732D52817479f764a7ea681	f	f
Principal Implementation Analyst	6a99af1a-1e45-477b-bf85-f6a3b95e91ab	Tactics	236 Elyssa View	AW	Plantation	531	276-530-3055	Edwina.Auer@hotmail.com	sim	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x4d6C4c4Fae4Fb1C9D6dA450bD842220c9e88A793	f	f
Principal Solutions Engineer	f08aefcc-3281-42a0-b9bd-a74a031aadb8	Security	064 Heidenreich Plaza	AS	Volkmanmouth	679	210-478-6999	Joyce.Will@yahoo.com	crystel	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x0Df7196093FB7109fc1D1f1D0741910a2FE63c26	f	f
National Data Architect	c5847f7b-97a7-4db6-8a6d-9f8596185209	Assurance	98887 Heloise Fields	HM	Willymouth	225	819-236-6350	Retta.Monahan70@yahoo.com	jarod	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xffd2ab12983daD65e10F9B8e9c70C51A57432C3E	f	f
Regional Solutions Orchestrator	fa7e5b90-f73a-412a-a774-7c048c6c2dbe	Solutions	369 Zieme Garden	AE	Simonisfort	426	569-551-9453	Sherwood_Swaniawski16@gmail.com	eva	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xf0aA336B093016f95D497A64b37451a3cCE8fD2A	f	f
Customer Program Executive	0ff6ff91-21f8-402e-b444-7fc965e277a5	Branding	8258 D'angelo Mountains	CD	West Seneca	204	585-656-1522	Rubye_Goyette73@hotmail.com	maurine	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x1F6D86E39C484228b02F6f87B31F7c843E9AdF98	f	f
Product Communications Officer	4a33a7d6-4c14-4dd1-bef2-ef11e7f229ca	Accountability	9499 Zita Flat	TF	Spinkaview	11	895-853-8471	Martina_Schaefer14@gmail.com	christelle	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x76cF8EDc975a04555C76bef739e34df2B5c0730b	f	f
Dynamic Identity Representative	dac03284-9f96-46af-b352-a21ce18a4ad9	Marketing	18613 Melissa Village	MW	York	48	234-317-0986	Edward.West20@hotmail.com	gaston	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xe8aAdC2B742FDF6282f0D228F4485C6DEF86CE3C	f	f
Product Marketing Analyst	bc131ddb-4ff0-4ae1-82d8-6a73992f22eb	Configuration	1244 Huels Landing	MY	Bentonville	473	218-580-5396	Alfreda.Green23@yahoo.com	thea	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xD09359F793119cfd84edb4e2B60b9F711aD25624	f	f
Future Group Engineer	5536233e-4462-4869-889d-eaf65a148369	Response	42480 Juwan Dam	LS	Lavernaland	366	478-586-7690	Shanel.Jenkins@hotmail.com	wilfredo	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x33508719bb10246EB53F04b1dBb017d2AB4A7a70	f	f
Located at the heart of the Cyber Campus at La Défense, France, Set In Stone provides advanced security solutions, making blockchain application protection accessible and automated for the entire Web3 ecosystem.	ae3524fb-ee20-42b7-88b3-0730e62e8918	Set In Stone	5 rue Bellini, 92800 , Puteaux (La Défense)	FR	 Puteaux	33	788413814	contact@setinstone.io	thombenblock	https://goodhive.s3.us-east-005.backblazeb2.com/image_43ff021c-af47-48fb-a0e4-d360239d0ea7.png	https://www.linkedin.com/company/nid-de-pie	\N	\N	\N	\N	approved	0x7e6a20cD96bB885797F07F919BAc14370f64613e	t	f
lorem ipsum dolor sit amet mara lorem ipsum dolor sit amet mara lorem ipsum dolor sit amet mara lorem ipsum dolor sit amet mara lorem ipsum dolor sit amet maralorem ipsum dolor sit amet mara lorem ipsum dolor sit amet mara	272bbee7-efd0-4753-b627-06851aba91f7	Test Comp	23 Example street	US	Plano	1	2052635962	testcomp223@gmail.com	testcom	https://goodhive.s3.us-east-005.backblazeb2.com/image_cc7c99cf-b114-46c5-9aba-6a6342c5ae64.jpeg	https://linkedin.com/testcom	\N	\N	\N	\N	approved	0xa170DeF88f544A51A1535eeDA346461B3D627319	t	f
Online school to learn decentralisation and DAO builder on Minima.global	48d6dcc9-83e1-4e74-a7e0-1594b1e4e333	Web3 Academy	Qormi road	MT	Hamrun	33	0677238870	info@web3-academy.org	https://t.me/+LB9N87DDv9MxMTI0	\N	linkedin.com/company/academy-web3	\N	\N	\N	\N	approved	0x0e84c6057351C922F3F9FA0D3b2f621369F8eB0e	t	f
SiBorg is developing a mobile app that repurposes Twitter Spaces for post-live access via a Spotify-like interface, aiming to establish a creator-owned platform that leverages Web3 to enhance user engagement, monetization, and curation.	12275b16-c4d2-4804-8ef6-494966cb6dea	SiBorg	NA	FR	Paris	33	0782955461	hello@siborg.io	https://t.me/MaxMartelo	https://goodhive.s3.us-east-005.backblazeb2.com/image_8a969d80-7948-40bc-933f-4cd746ce6e1f.png	https://www.linkedin.com/company/siborg/	\N	\N	\N	https://www.siborg.io/	approved	0xe68D4c4C2704F601865F1d77b6bF3C1c6eEc858F	t	f
Future Markets Planner	a462df5b-69ad-4d13-8d31-48583ccb2b26	Division	354 Oberbrunner Drive	BE	Bashirianbury	583	362-728-4704	Eli.Nicolas86@gmail.com	ardella	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0x40A02964904D176BD66A48F80b14AF808D354830	f	f
Product Intranet Associate	1f93cbef-f864-433a-a811-f4b2d24687ec	Optimization	52108 Fisher Circle	AG	Fort Worth	932	580-656-6350	Alba.Dickinson@yahoo.com	davon	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAERJREFUGFdjDP3///9qRkYGJk5Bhr/f3jEwggTcrLYyWJvIMahM0oEIrAr7zwAGqxgZGMP+/v+/LJyBgZnxP8MjzkcMAKXUGhHTobT2AAAAAElFTkSuQmCC	\N	\N	\N	\N	\N	pending	0xfdFd81e03305Acc833ab8C86f26AAe4f300CD454	f	f
Sunt veniam elit unde est repellendus Iure ipsum eaque sit repudiandae dolor consectetur perspiciatis cillum nemo distinctio Molestiae error	d2cc46a6-df87-41af-84e7-4ae47668f293	Dolores doloribus voluptatem Repudiandae quis cillum adipisci quaerat qui asperiores consequuntur	Ratione consectetur aliquid lorem voluptatem Rerum quaerat elit aute molestiae	AF	Sed nulla est excepteur quas sed quia vel mollitia possimus inventore enim sed nulla et	+595	Commodo perferendis 	zolybugymy@mailinator.com	Commodo omnis aute laborum Natus qui numquam proident ea ipsam animi ex non	\N	Repudiandae esse harum qui aperiam fugiat magni inventore rerum exercitationem maxime quaerat eius pariatur Eaque	Harum et temporibus qui facere dolorem aliqua Sit fugiat deserunt nihil doloremque dolore tempor labore est voluptate	Rerum lorem adipisci mollitia dolor fugiat similique et non accusamus culpa	Delectus qui laborum quae aliqua A ut vero qui veritatis temporibus	Ut beatae inventore nobis ut est	pending	\N	t	f
Nostrud enim enim numquam veritatis est do nihil deleniti cum ipsam irure laborum cupidatat et ad veniam	53c1121d-8ced-4a70-9e0c-62e0e2df9f33	Proident aute non sed aut tempora dignissimos dolor	Ut et tenetur animi non adipisci tenetur consectetur debitis	AF	Aut laborum minim omnis esse quasi qui sit	+244	2123123	bify@mailinator.com	Assumenda asperiores minim repudiandae qui dolore harum necessitatibus officia error reprehenderit fuga Quidem nulla ipsum quia eos	\N	Eum in lorem est ratione soluta aliquip omnis ab voluptatem rerum ipsum ea	Ea unde voluptate enim accusantium	Quia tempora qui sit reprehenderit est officia laborum Cupiditate nihil ex laudantium et	Non iste et est mollit quasi fugiat animi adipisicing et reprehenderit aperiam dignissimos deserunt qui nisi tempor aut	Molestiae ea eos non aliquip consectetur autem nulla laborum voluptatibus non fuga Accusamus molestias qui dolor error dolore modi dolores	pending	\N	t	f
ajsdhajhdjadhasjhaasdas	fb5b42dc-f918-47fb-8708-2f5b82e8c730	Juhan	abc street	AF	Dhaka	+880	1729384739	davidjuhan23@gmail.com	@jubayerjuhan	\N	\N	\N	\N	\N	\N	pending	\N	t	f
ljvhlhglg iglg glh lhlgliglukg	1b806e2f-cf62-4e40-b012-19ab387990c3	Bk	14 rue Saint Sébastien	AF	Paris	+33	0663115426	benoit.kulesza2@gmail.com	benoit	\N	\N	\N	\N	\N	\N	pending	\N	f	f
ad	c9190a2c-e82a-496f-aa8a-a190b9a5ff46	hello	audjand	AF	zhsdad	+93	878787	sadsdad@gmail.com	adjahd	\N	\N	\N	\N	\N	\N	pending	\N	f	f
GoodHive is an innovative recruitment platform designed to empower the rapidly growing Web3 ecosystem. We are a community of dedicated entrepreneurs with a mission to tackle one of Web3's biggest challenges – the shortage of IT talent. To address this, we’ve launched Web3TalentFair.tech, a job fair connecting top-tier talent in Web3 and the Future of Work industries. As we expand, we’re excited to unveil the Minimum Viable Product (MVP) of our platform. Additionally, through our partnership with IT Unchained, we enable French-based clients to benefit from a 30% tax credit on freelancer costs through our "Agrément Innovation" status.	015b516d-0f34-4ee7-880e-594dc9b1d1e5	Test GoodHive	14 rue Saint Sébastien	FR	Paris	+33	0663115426	benoit.kulesza2@gmail.com	BenoitK14	\N	\N	\N	\N	\N	\N	pending	\N	t	f
<h3><strong>Web3 Development Agencies</strong> 🚀</h3><h4><strong>1. Eloqwnt</strong> 🎨</h4><p>🔹 Creative agency specializing in <strong>Web3 branding, UX/UI, and Webflow</strong>.</p><p>🔹 Worked with <strong>Taraxa.io, SuperMeme, Pie Assets</strong>, and more.</p><p>🔹 Over <strong>60+ successful projects</strong> with a focus on innovation.</p><p>🔹 <strong>Services</strong>: Branding, website design, motion graphics.</p><p>🔗 <a href="https://www.eloqwnt.com/industry/web3?utm_source=chatgpt.com" rel="noopener noreferrer" target="_blank"><strong>Website</strong></a></p>	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	Juhan Industries	14 rue St Sébastien juhan	BD	Paris	880	1620692839	jubayerjuhan.info@gmail.com	juhan2300	https://goodhive.s3.us-east-005.backblazeb2.com/image_d95a636c-b193-4fe1-b14d-493e207c8ec6.png	https://www.linkedin.com/in/jubayerjuhan	https://github.com/jubayerjuhan	https://stackoverflow.com/users/14269280/jubayer-juhan	https://x.com/XUHANJJ	\N	approved	0xed948545Ec9e86678979e05cbafc39ef92BBda80	t	f
It is a test	c3176c3a-1705-447b-8571-3bbd0f51c99a	test benoit	33 rue arsene lupin	FR	paris	+33	5665882265	benoit.test@gmail.com	JGJGKJH	\N	\N	\N	\N	\N	\N	pending	\N	f	f
\N	2a1e4942-f5da-4281-8a75-c11bccbdd177	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	\N	f	f
ABC Company ABC	37046e38-c2ef-48de-b6c2-4c61b97fcb8f	ABC Company ABC	abc street	BD	Dhaka	+880	1729384739	davidjuhan23000@gmail.com	@jubayerjuhan	\N	\N	\N	\N	\N	\N	pending	\N	t	f
Just a test	29752320-a130-4079-b5ae-bb13d4abb166	junkcompany	777 rue d'enghien	FR	paris	+880	345556788	benoit.junkmail2@gmail.com	JGJGKJH	\N	\N	\N	\N	\N	\N	pending	\N	t	f
\N	571a58a0-0f17-419a-b0cd-b0359ec169ef	abc123	\N	\N	\N	\N	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_d5a11f9b-ad71-4f65-bb42-09b4595340b4.png	\N	\N	\N	\N	\N	pending	\N	f	f
\N	5052175f-f082-4f66-b439-7763c76265ac	\N	\N	\N	\N	\N	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_86ff3323-c78b-4ff4-a119-32926a429f56.png	\N	\N	\N	\N	\N	pending	\N	f	f
Video: A beehive in the distance, zooming in.\nVoice-over: In a world where top Web3 tech talent is rare, GoodHive unites a community of skilled professionals—selected for their expertise and great vibes—to help you recruit the very best.\n\nVideo: A client posts a job; the community swiftly gathers.\nVoice-over: When you post a mission on GoodHive, the community jumps in, sourcing the most qualified profiles to match your needs.\n\nVideo: A talent, a recruiter, and a mentor each receive a share of the reward, with the beehive in the background.\nVoice-over: At the end of the mission, the talent, recruiter, and mentor share the commission based on client satisfaction. Any unclaimed rewards are allocated to the community treasury.\n\nVideo: The community gathers around a parliament, discussing and voting.\nVoice-over: GoodHive is fully governed by its community. Anyone can propose and vote on how resources are allocated—whether for investments or ecosystem improvements.\n\nVideo: A smooth traveling shot over interconnected gears.\nVoice-over: Together, we refine the collaborative mechanisms and the rewards system…\n\nVideo: A traveling shot over a set of guiding principles.\nVoice-over: …while upholding the shared values that define how we work, invest, and grow.\n\nVideo: Zooming out from the hive, revealing the thriving community.\nVoice-over: Join GoodHive—the decentralized recruitment platform for Web3 tech talent. A community of doers, changemakers, and builders, driven by shared values and multiple revenue streams for Web3 professionals like you.Video: A beehive in the distance, zooming in.\nVoice-over: In a world where top Web3 tech talent is rare, GoodHive unites a community of skilled professionals—selected for their expertise and great vibes—to help you recruit the very best.\n\nVideo: A client posts a job; the community swiftly gathers.\nVoice-over: When you post a mission on GoodHive, the community jumps in, sourcing the most qualified profiles to match your needs.\n\nVideo: A talent, a recruiter, and a mentor each receive a share of the reward, with the beehive in the background.\nVoice-over: At the end of the mission, the talent, recruiter, and mentor share the commission based on client satisfaction. Any unclaimed rewards are allocated to the community treasury.\n\nVideo: The community gathers around a parliament, discussing and voting.\nVoice-over: GoodHive is fully governed by its community. Anyone can propose and vote on how resources are allocated—whether for investments or ecosystem improvements.\n\nVideo: A smooth traveling shot over interconnected gears.\nVoice-over: Together, we refine the collaborative mechanisms and the rewards system…\n\nVideo: A traveling shot over a set of guiding principles.\nVoice-over: …while upholding the shared values that define how we work, invest, and grow.\n\nVideo: Zooming out from the hive, revealing the thriving community.\nVoice-over: Join GoodHive—the decentralized recruitment platform for Web3 tech talent. A community of doers, changemakers, and builders, driven by shared values and multiple revenue streams for Web3 professionals like you.Video: A beehive in the distance, zooming in.\nVoice-over: In a world where top Web3 tech talent is rare, GoodHive unites a community of skilled professionals—selected for their expertise and great vibes—to help you recruit the very best.\n\nVideo: A client posts a job; the community swiftly gathers.\nVoice-over: When you post a mission on GoodHive, the community jumps in, sourcing the most qualified profiles to match your needs.\n\nVideo: A talent, a recruiter, and a mentor each receive a share of the reward, with the beehive in the background.\nVoice-over: At the end of the mission, the talent, recruiter, and mentor share the commission based on client satisfaction. Any unclaimed rewards are allocated to the community treasury.\n\nVideo: The community gathers around a parliament, discussing and voting.\nVoice-over: GoodHive is fully governed by its community. Anyone can propose and vote on how resources are allocated—whether for investments or ecosystem improvements.\n\nVideo: A smooth traveling shot over interconnected gears.\nVoice-over: Together, we refine the collaborative mechanisms and the rewards system…\n\nVideo: A traveling shot over a set of guiding principles.\nVoice-over: …while upholding the shared values that define how we work, invest, and grow.\n\n\n\nVideo: A beehive in the distance, zooming in.\nVoice-over: In a world where top Web3 tech talent is rare, GoodHive unites a community of skilled professionals—selected for their expertise and great vibes—to help you recruit the very best.\n\nVideo: A client posts a job; the community swiftly gathers.\nVoice-over: When you post a mission on GoodHive, the community jumps in, sourcing the most qualified profiles to match your needs.\n\nVideo: A talent, a recruiter, and a mentor each receive a share of the reward, with the beehive in the background.\nVoice-over: At the end of the mission, the talent, recruiter, and me	39ed4eb5-109a-40ea-ac0a-c5b85f5ce170	test3	39 tue kuler	FR	Paris	+33	51654321651	benoit.test3@gmail.com	benoitk14	https://goodhive.s3.us-east-005.backblazeb2.com/image_296aa2bf-df4f-4622-89e2-3adf34fe8c6a.png	\N	\N	\N	\N	\N	pending	\N	f	f
The Power of Habits: How Small Changes Lead to Big Results\n\nIn our fast-paced world, we often search for drastic changes to improve our lives. Whether it’s trying to lose weight, boost productivity, or improve our mental well-being, many of us fall into the trap of seeking immediate results. However, true, lasting transformation doesn’t come from sudden, radical shifts. Instead, it comes from small, consistent habits. In this blog, we will explore how minor adjustments in our daily routines can lead to profound, long-term benefits.\n\nThe Science Behind Habits\n\nHabits are powerful because they automate behaviors, freeing up cognitive energy for other tasks. Our brains thrive on efficiency, and habits allow us to operate on autopilot. Neuroscientists explain that habits form through a three-step process called the habit loop:\n\nCue: A trigger that initiates a behavior.\n\nRoutine: The behavior or action itself.\n\nReward: The benefit we gain from the behavior, reinforcing the loop.\n\nFor instance, if every morning you drink coffee after waking up, the cue is waking up, the routine is making and drinking coffee, and the reward is feeling energized. Over time, this process becomes automatic.\n\nThe Compound Effect of Small Changes\n\nJames Clear, author of Atomic Habits, emphasizes the power of tiny changes. Improving just 1% every day may seem insignificant at first, but over time, these small gains compound into massive improvements. Imagine improving a skill by just 1% daily—after a year, your ability will be exponentially greater than when you started.\n\nThe same applies to negative habits. If we repeatedly make poor choices—like skipping workouts or mindlessly scrolling social media—the negative effects accumulate. Thus, being mindful of daily habits is crucial.\n\nHow to Build Positive Habits\n\n1. Start Small\n\nOne of the biggest mistakes people make is trying to change too much at once. Instead of committing to an hour of exercise every day, start with five minutes. If you want to read more, begin with one page per night. Small steps feel manageable and reduce the likelihood of quitting.\n\n2. Make It Easy\n\nTo make a habit stick, remove obstacles. If you want to eat healthier, prepare nutritious meals in advance. If you want to work out in the morning, lay out your gym clothes the night before. Reducing friction increases the likelihood of success.\n\n3. Use Habit Stacking\n\nHabit stacking involves linking a new habit to an existing one. For example, if you want to start meditating, pair it with brushing your teeth: “After I brush my teeth, I will meditate for one minute.” Since the established habit already exists, the new one integrates seamlessly into your routine.\n\n4. Track Progress\n\nKeeping track of your habits helps reinforce positive behaviors. Whether using a habit tracker app or marking a calendar, visually seeing your progress motivates consistency.\n\n5. Be Kind to Yourself\n\nNo one is perfect, and missing a day is inevitable. The key is to avoid letting one missed day turn into two, then three, and eventually quitting altogether. Acknowledge setbacks, but commit to getting back on track quickly.\n\nThe Role of Environment\n\nYour environment plays a crucial role in shaping your habits. If you surround yourself with positive influences, your habits will naturally align. Want to be healthier? Keep junk food out of sight and fill your kitchen with fruits and vegetables. Want to read more? Place books in easily accessible locations.\n\nSocial environments also matter. If you spend time with people who prioritize fitness, you’re more likely to adopt similar habits. Choose your surroundings wisely, as they significantly impact your behaviors.\n\nBreaking Bad Habits\n\nJust as we build good habits, we can also eliminate negative ones by reversing the habit loop:\n\nIdentify the Cue: Understand what triggers the bad habit.\n\nReplace the Routine: Swap the negative behavior with a positive one.\n\nEliminate the Reward: Reduce the perceived benefit of the bad habit.\n\nFor example, if you tend to snack on unhealthy food when stressed, recognize the stress as the cue, replace the snack with a healthier alternative or a short walk, and find a new reward (such as relaxation or a sense of accomplishment).\n\nReal-Life Success Stories\n\nMany successful individuals credit small habits for their achievements. Athletes follow strict routines that build discipline. Entrepreneurs schedule focused work sessions to maximize productivity. Writers commit to writing a set number of words daily. These small, consistent actions compound over time, leading to remarkable outcomes.\n\nConsider the story of Sir David Brailsford, the former performance director of British Cycling. He implemented a strategy of “marginal gains,” focusing on 1% improvements in various aspects of cycling performance. By optimizing everything from nutrition to sleep quality and even hand hygiene, British cyclists became dominant in the sport, winning multiple Olympic gold medals and Tour de 	b6228d6d-0764-4110-b984-b18ca5804af2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	\N	f	f
Praesentium qui nisi est voluptatum culpa repellendus Enim eu iste	196403f9-3317-4269-91b2-18ff3e1fe4eb	Placeat laudantium omnis doloremque incididunt quidem minima veritatis obcaecati in	Exercitation minus facere irure fugit dolorum porro at asperiores quisquam temporibus accusamus dol	BD	Quis et aut enim eaque beatae quidem	+45	838173	jubayerjuhan.info@gmail.com	Impedit sint dicta eveniet autem nulla impedit iure in aliqua Nulla culpa atque culpa incidunt odio iste iure repellendus	\N	Excepturi tempor nostrum ut quisquam ea sit porro rerum eius sed cumque expedita	Officia voluptas aliquam pariatur Quas et ut et illum eius sint incididunt in assumenda in	Ratione maxime eligendi sapiente placeat a maxime aut voluptatum sunt ullam sunt sint impedit	Et omnis voluptates suscipit perspiciatis maxime ex accusantium porro ad culpa sapiente	Accusamus veniam consectetur a dolorem fugit dicta ullamco numquam excepturi	pending	\N	f	f
<p>Web3 Tech Gaming Studio</p>	b37981dd-ed30-4dab-b989-e5e862988338	Thugz Labs	60 rue François 1er	FR	Paris	+33	663569712	thugzlabs@gmail.com	TchikiBalianos	https://goodhive.s3.us-east-005.backblazeb2.com/image_e7e91645-bb72-42e0-9b19-c079237f824c.jpeg	https://www.linkedin.com/in/julian-schmerkin/	https://github.com/ThugzLabs	\N	https://x.com/ThugzLabs	\N	approved	\N	t	f
Lancée en 2011, Paymium est la plus ancienne plateforme d'échange de Bitcoin au monde. \nLa Société Paymium est soutenue par la communauté crypto après une ICO réussie en 2018, et appuyée par des fonds européens de premier plan (Kima Ventures, Newfund).\n\nDepuis 2021, Paymium est enregistré auprès de l’AMF (Autorité des Marchés Financiers) en tant que PSAN (Prestataire de Services sur Actifs Numériques) sous le numéro E2021-011 et possède l’ensemble des 4 enregistrements obligatoires. Ce statut fait de Paymium un acteur de confiance auprès des consommateurs.\n\nBasée à Paris, Paymium compte aujourd'hui plus de 250 000 clients.\n	3fffd0c5-44b4-4352-9331-3ec927181efa	PAYMIUM SAS	73 Rue Du Château	FR	Boulogne-Billancourt	+33	0675085561	sandrine.mazeres@paymium.com	https://x.com/paymium	https://goodhive.s3.us-east-005.backblazeb2.com/image_39ab0c64-28e1-42b2-b61a-3eb15cf5905d.png	https://fr.linkedin.com/company/paymium	\N	\N	https://x.com/paymium	\N	pending	\N	t	f
<p>Clever Class is an AI-powered learning platform that helps students solve quizzes, get instant tutoring, and summarize videos — making studying smarter, faster, and easier.</p>	4f6f9a95-47c0-4fac-91bd-4f2ea7348029	Clever Class	Dhanmondi	BD	Dhaka	+880	01620692839	contact@cleverclass.io	clever.class	https://goodhive.s3.us-east-005.backblazeb2.com/image_0ffb5430-1d57-4b01-a16d-74503fd85661.png	\N	\N	\N	\N	\N	approved	\N	t	f
<p>GoodHive Test</p>	d7d74872-8407-4a25-9a45-6f9de4f22c67	GoodHive Test	GoodHive Test	BD	GoodHive	+880	8787878787	goodhive_test@gmail.com	230	\N	\N	\N	\N	\N	\N	pending	\N	t	f
<p>Lorem Ipsum</p>	4457fbe6-6a30-4b58-8050-5e2b1c3024fa	Lorem Ipsum	Jubayer Juhan	BI	Dhaka	+1684	3939393	jubayerjuhan20@gmail.com	uuahs239	https://goodhive.s3.us-east-005.backblazeb2.com/image_b5323a7e-2624-4380-92c6-a189211ad325.png	\N	\N	\N	\N	\N	approved	\N	t	f
<p>GoodHive is an innovative recruitment platform designed to empower the rapidly growing Web3 ecosystem. We are a community of dedicated entrepreneurs with a mission to tackle one of Web3's biggest challenges – the shortage of IT talent. To address this, we’ve launched Web3TalentFair.tech, a job fair connecting top-tier talent in Web3 and the Future of Work industries. As we expand, we’re excited to unveil the Minimum Viable Product (MVP) of our platform. Additionally, through our partnership with IT Unchained, we enable French-based clients to benefit from a 30% tax credit on freelancer costs through our "Agrément Innovation" status.</p>	1959c578-be98-43f7-b727-2452a815ee34	GoodHive	14 rue St Sébastien 	FR	Paris	+33	0663115426	benoit@goodhive.io	benoitk14	https://goodhive.s3.us-east-005.backblazeb2.com/image_953c27eb-16f5-4227-b6e7-a5fcce426dce.png	https://www.linkedin.com/in/goodhive	\N	\N	https://x.com/goodhivelabs	\N	approved	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	t	f
<p>We make and sale cool digital gadgets</p>	86446ca8-5d14-4598-978e-5fda0c60ffc7	Alien Electronics	Wooden Street	DE	Berlin	+49	372937293	contact@alienelectronics.com	alienelectronics	https://goodhive.s3.us-east-005.backblazeb2.com/image_4e6d31ec-7a45-4ba8-823c-00d298ba1970.png	\N	\N	\N	\N	\N	approved	\N	t	f
<p>Blue Citizen is a rapidly expanding community of remote workers who are not only connected through shared work‑spaces but also become co‑owners of co‑living environments.</p><p><br></p><p>By blending flexible work arrangements with collaborative living, Blue Citizen empowers its members to build a vibrant, supportive ecosystem where professionals can thrive both personally and professionally.</p>	f289f446-9cdb-4008-86ff-c7c494333bbd	Blue Citizen	Canggu	ID	BALI	+33	611131791	join@bctzn.com	@BlueCitiz3n	https://goodhive.s3.us-east-005.backblazeb2.com/image_cdabf962-2917-466d-b8e7-4725df0fb426.jpeg	\N	\N	\N	\N	\N	pending	\N	f	t
<p><span style="color: rgb(0, 0, 0);">221437&nbsp;</span>Culpa sapiente conse.</p>	9fda0c8e-9484-43e6-bc03-eaa30d7c71e5	Test 111 MK Company	Adipisicing laboris sed quia veritatis pariatur Ut incididunt suscipit officia	\N	Optio numquam sunt assumenda laborum Aut autem nulla tenetur libero ipsum est eu officia facere om	+297	Dolorem porro qui ut	nocaruwug@mailinator.com	Dolor enim beatae sint eligendi debitis enim laborum reprehenderit et sint deserunt proident ea id Nam et inventore harum	\N	Dolorum totam similique perferendis do tempore consequat Labore laboriosam rerum tempora tempore eiusmod exercitationem labore ullamco dolores et	Sunt Nam laboris voluptatem Ea cillum unde nesciunt molestias voluptatum mollit facilis in adipisicing	Voluptatem aliquid sed totam dolorum et et optio esse qui	Ut architecto nesciunt eum aute	Velit Nam atque tempora eu sequi dolore id eligendi quaerat voluptas sit ea veniam	pending	\N	f	f
<p>Hello, i'm testing the hive !</p>	5a54167d-e76b-4c3a-8b22-5351cd3a767a	CorpTestHive	25 rue de la ruche	FR	toulouse	+33	0783336754	chaharane@goodhive.io	@chd95251594	\N	\N	\N	\N	\N	\N	pending	\N	f	f
<p>Hello, this is the best company test never create.</p>	e3b3042d-f6a4-41c4-9c93-a7461a59e5d8	CorpTestHive	1 rue saunière	FR	toulouse	+33	0783336754	chaharane@goodhive.io	@chd95251594	\N	https://www.linkedin.com/in/chaharane-abdallah-50617424b/	\N	\N	\N	\N	pending	\N	f	f
Test Company - Blockchain Integration Testing	550e8400-e29b-41d4-a716-446655440000	CEO	123 Test Street	United States	Test City	+1	1234567890	test@goodhive.com	\N	\N	\N	\N	\N	\N	\N	active	0xed948545Ec9e86678979e05cbafc39ef92BBda80	t	f
<p>Tech Flooz is a consulting and innovation firm dedicated to exploring the intersections of emerging technologies, governance, and ethics. We help organizations, public institutions, and forward-thinking leaders navigate the complexities of blockchain, Web3, artificial intelligence, and digital transformation.</p><p><br></p><p>Our mission is to design and implement strategies that combine technological efficiency with human values. By bridging innovation with ethical governance, we support clients in building resilient, transparent, and future-oriented systems.</p><p><br></p><p>At Tech Flooz, we believe technology should serve the common good. We provide strategic foresight, tailored training, and applied research to empower decision-makers, foster digital sovereignty, and unlock new opportunities for collaboration and impact.</p>	55198785-5820-4103-ac3d-c1b28290f78a	Tech Flooz	Tech Flooz, 30 boulevard de Sébastopol	FR	PARIS 04	+33	0753906922	hayat@techflooz.com	hayatoutahar 	https://goodhive.s3.us-east-005.backblazeb2.com/image_33413e74-cba2-45d3-9ea7-4f29d9acc951.jpeg	https://www.linkedin.com/in/hayatoutahar	\N	\N	hayatoutahar	\N	pending	\N	t	f
<p><strong>Fanzio</strong> is a modern sports-fashion brand specializing in premium <strong>football jerseys and fan apparel</strong>. Built with a mission to blend <strong>style, authenticity, and team pride</strong>, Fanzio creates high-quality, affordable merchandise for global football fans.</p><p>The brand emphasizes <strong>modern e-commerce design</strong>, responsive UI, and smooth digital experience — integrating <strong>secure payment systems</strong>, <strong>automated inventory management</strong>, and <strong>fast local delivery</strong> across Bangladesh.</p><p>Beyond apparel, Fanzio aims to foster a <strong>football-driven community</strong>, empowering fans to express their passion through fashion.</p>	df9a41bb-1b61-4865-b878-7e514a1d9655	Fanzio	Dhanmondi	BD	Dhaka	+880	+8801620692839	jubayerjuhan.info@gmail.com	@fanzio	https://goodhive.s3.us-east-005.backblazeb2.com/image_8a784020-b94c-4cb1-ac68-ec2510d9f323.png	\N	\N	\N	\N	\N	pending	\N	t	f
<p>Hello, this is a company test</p>	e5e635d6-c258-46e3-a271-e784423a6dfc	TESTCORP	1 rue saunière 31000	FR	toulouse	+33	0783336754	chaharane05@gmail.com	@chd95251594	\N	https://www.linkedin.com/in/chaharane-abdallah-50617424b/	\N	\N	\N	\N	pending	\N	t	f
\.


--
-- Data for Name: job_offers; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.job_offers (id, user_id, title, type_engagement, description, duration, budget, chain, currency, skills, city, country, company_name, image_url, job_type, project_type, talent, recruiter, mentor, wallet_address, posted_at, job_id, created_at, in_saving_stage, block_id, published, escrow_amount) FROM stdin;
6c6dcfdf-ab35-45ae-b587-cd3e16462bc0	1959c578-be98-43f7-b727-2452a815ee34	Mid-Level Fullstack Developer with Web3 Experience	remote		moreThanThreeMonths	75	polygon	USD	JavaScript, TypeScript, Solidity, SQL, ReactJS, NextJS, Rainbow kit, Wagmi, NestJS, Postgres, IPFS, Gitflow, GitHub, Figma	Paris	FR			remote	hourly	true	false	false	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	2025-11-12 17:38:18.321	61	2025-11-12 17:38:18.561613	t	573417074668	f	f
5e2ec4ed-55e4-4e09-bfae-34db72c70120	df9a41bb-1b61-4865-b878-7e514a1d9655	AI Software Developer - Machine Learning Platform	freelance		moreThanThreeMonths	11500	polygon-amoy	USDC	Python, TensorFlow, PyTorch, Machine Learning, Deep Learning, Natural Language Processing (NLP), Computer Vision, REST APIs, Microservices, Docker, Kubernetes, Cloud Platforms (AWS/GCP/Azure), Data Science, Statistics	Dhaka	BD			remote	fixed	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-19 19:00:27.423	62	2025-11-19 19:00:28.214885	f	514839345096	f	f
14b390d2-f28f-4b5c-bb5f-cad06f716b1f	86446ca8-5d14-4598-978e-5fda0c60ffc7	Optio at minus enim placeat recusandae Molestias culpa	freelance	<p>Non lorem non dolore.</p>	moreThanSevenDays	200	polygon	USD	Consectetur quia sim	Berlin	DE			remote	fixed	true	false	false	0xed948545Ec9e86678979e05cbafc39ef92BBda80	2025-10-19 19:33:42.52	54	2025-10-19 19:33:43.431802	f	116789654405	f	f
1730177a-7b3a-4ceb-b59e-d44009c66729	550e8400-e29b-41d4-a716-446655440000	Test AI Developer Job	freelance	Test job for blockchain integration	moreThanSevenDays	1000	polygon-amoy	USDC	React, Node.js, Blockchain	Remote	Global	Test Company		remote	fixed	true	false	false	0xed948545Ec9e86678979e05cbafc39ef92BBda80	2025-11-19 19:56:48.628	63	2025-11-19 19:56:53.105699	f	1763582208630710616	f	f
046373b4-32dc-44ff-b274-0ec84a7bf7bd	df9a41bb-1b61-4865-b878-7e514a1d9655	Marketing Operations Associate — Fanzio	any		lessThanSevenDays	20	polygon	USDC	JavaScript	Dhaka	BD			hybrid	fixed	true	false	false		2025-11-03 17:17:44.898	55	2025-11-03 17:17:46.023375	t	743725049073	t	f
97fe047b-58b1-4cf4-a6ac-d35d0fd7b6cb	df9a41bb-1b61-4865-b878-7e514a1d9655	Senior Full Stack Developer with React & Node.js Expertise	freelance		moreThanThreeMonths	6500	polygon	USD	React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Git, Agile Methodologies, Database Design, Teamwork, Problem Solving, Cloud Services	Dhaka	BD			remote	fixed	true	false	false		2025-11-12 13:54:09.098	60	2025-11-12 13:54:10.360513	t	184757032461	f	f
6a056960-e59e-4a55-a072-4493642d552e	df9a41bb-1b61-4865-b878-7e514a1d9655	Software Quality Assurance Tester - Full-Stack Testing	remote		moreThanThreeMonths	75000	polygon-amoy	USDC	Software Quality Assurance, Test Design, Automated Test Scripts, Regression Testing, Integration Testing, User Acceptance Testing, Bug Report Creation, Collaboration, Code Reviews, Test Documentation, Test Automation Tools, Programming, API Testing, Cross-Browser Testing, Mobile Device Testing	Dhaka	BD			remote	fixed	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-19 20:18:00.729	64	2025-11-19 20:18:01.518893	f	1763583480729509519	f	f
8aaa2ce0-7dd5-4204-86a7-88a0bcc50409	df9a41bb-1b61-4865-b878-7e514a1d9655	2 Software Quality Assurance Tester - Full-Stack Testing Position	freelance		moreThanThreeMonths	75000	polygon-amoy	USDC	Software Quality Assurance, Test Automation Tools, JavaScript, Python, Java, API Testing Tools, Cross-Browser Testing, Mobile Device Testing	Dhaka	BD			remote	fixed	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-19 20:55:45.473	65	2025-11-19 20:55:46.32718	f	1763585745473578218	f	f
2a00f805-6bda-4465-92b4-ce3e67299980	df9a41bb-1b61-4865-b878-7e514a1d9655	Blockchain Development Intern at GoodHive	remote		moreThanThreeMonths	12	polygon-amoy	USDC	JavaScript, TypeScript, Solidity, SQL, ReactJS, NextJS, NestJS, Gitflow, Github project, Rainbow kit, Wagmi, Postgres, IPFS	Dhaka	BD			remote	hourly	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-20 17:24:16.813	68	2025-11-20 17:24:16.856984	f	15	t	f
5dcde7bf-f054-4487-82c3-8c2448fa47e2	df9a41bb-1b61-4865-b878-7e514a1d9655	Blockchain Developer Intern	freelance		moreThanThreeMonths	2000	polygon-amoy	USDC	Ethereum blockchain, Figma, Collaboration, Web3 technologies, Blockchain understanding, Adaptability, Teamwork, Learning	Dhaka	BD			remote	fixed	true	false	false	0xed948545Ec9e86678979e05cbafc39ef92BBda80	2025-11-22 18:20:24.62	70	2025-11-22 18:20:24.655527	f	17	t	f
15471c46-9ed4-44a6-834f-792d4446678d	48d6dcc9-83e1-4e74-a7e0-1594b1e4e333	Developer full stack	freelance	AUM - Annuaire Universalis Minima\nDecentralized directory dApp on Minima. \nConnects decentralized professionals through profiles, smart search, and matchmaking.	moreThanOneMonth	10000	polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	HTML,CSS,JavaScript,KISS	Hamrun	MT	Web3 Academy	https://goodhive.s3.us-east-005.backblazeb2.com/image_4d9bf2b9-5fc8-4e27-8fc7-89437012f179.jpeg	remote	fixed	true	\N	\N	0x0e84c6057351C922F3F9FA0D3b2f621369F8eB0e	2024-08-29 01:22:47.234	34	2024-12-23 15:17:12.784362	t	506894401322	f	f
0895cee0-7bce-4bcd-8ee7-5e1ba1ac57d7	ae3524fb-ee20-42b7-88b3-0730e62e8918	Software Engineer (Web3 Product) - FR or EN	remote	Located at the heart of the Cyber Campus at La Défense, France, Set In Stone provides advanced security solutions, making blockchain application protection accessible and automated for the entire Web3 ecosystem.	moreThanThreeMonths	45000	polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	TypeScript,Python,Node.js,Solidity,Rust	 Puteaux	FR	Set In Stone	https://goodhive.s3.us-east-005.backblazeb2.com/image_43ff021c-af47-48fb-a0e4-d360239d0ea7.png	hybrid	fixed	true	\N	\N	0x7e6a20cD96bB885797F07F919BAc14370f64613e	2024-07-31 02:11:54.04	29	2024-12-23 15:17:12.784362	f	530751167824	t	f
e968977d-1e4d-45f0-9dab-c08f61fbb803	df9a41bb-1b61-4865-b878-7e514a1d9655	Software Quality Assurance Tester - Full-Stack Testing Position	remote		moreThanThreeMonths	75000	polygon-amoy	USDC	Software Quality Assurance, Testing Methodologies, Test Automation Tools, Selenium, Cypress, Playwright, JavaScript, Python, Java, API Testing Tools, Postman, Insomnia, REST Assured, Cross-browser Testing, Mobile Device Testing	Dhaka	BD			remote	fixed	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-19 21:06:35.518	66	2025-11-19 21:06:36.560896	f	1763586395518137328	f	f
fb8da926-233a-480d-9033-be01d3c3dfef	df9a41bb-1b61-4865-b878-7e514a1d9655	Intern Developer (Web3 and Blockchain)	remote		moreThanThreeMonths	12	polygon-amoy	USDC	JavaScript, TypeScript, Solidity, SQL, ReactJS, NextJS, NestJS, Postgres, IPFS, Gitflow, GitHub, Figma	Dhaka	BD			remote	hourly	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-20 17:44:36.292	69	2025-11-20 17:44:36.496024	f	16	t	f
b766e547-119c-4e23-aaf6-d27450790549	df9a41bb-1b61-4865-b878-7e514a1d9655	Software Quality Assurance Tester - Full Stack	remote		moreThanThreeMonths	75000	polygon-amoy	USDC	Software Quality Assurance, Testing methodologies, Test automation tools, JavaScript, Python, Java, API testing tools, Cross-browser testing, Mobile device testing, Version control systems (Git), CI/CD pipelines, Agile/Scrum development methodologies	Dhaka	BD			remote	fixed	true	false	false	0x3a54C89932Ab697166A23Bb0f40f988Cf15b96ef	2025-11-19 21:12:17.448	67	2025-11-19 21:12:18.267232	f	14	t	f
ce7dd70e-8d4d-4960-9ef9-62ad349ccdb2	3fffd0c5-44b4-4352-9331-3ec927181efa	Développeur Backend (RoR) Senior	remote	Vous êtes passionné(e) par le domaine des crypto-actifs, si vous souhaitez participer au développement de projets sur le long terme pour l’adoption de l’internet de la valeur auprès du plus grand nombre et ... si vous êtes un(e) développeur backend expérimenté(e) maîtrisant Ruby on Rails (RoR).\nDans ce cas, en étroite collaboration avec le directeur technique, vous aurez la mission de conduire la conception, le développement et l’évolution d'applications backend qui pourront aussi bien concerner notre API, notre plateforme d’échanges et de transactions, la gestion des profils utilisateurs, les échanges bancaires et avec différentes blockchains, ainsi que l'ajout de nouvelles fonctionnalités prévues sur notre roadmap ambitieuse.\nVous serez garant de la qualité, la stabilité, la performance, la sécurité et l’évolutivité du code que vous développerez, tout en assurant sa livraison dans les délais.\nNous vous offons l’opportunité de :\nParticiper au développement d'un leader européen dans l’univers de la crypto et des paiements.\nTravailler dans un environnement rapide et stimulant.\nTravailler sur un sujet passionnant dans un écosystème dynamique et porteur.\nTravailler au sein d’une équipe jeune, motivée et présentant un faible turnover.\nTravailler au cœur de Paris, avec des possibilités de télétravail.\n\nResponsabilités :\n\nDéveloppement d'applications backend (RoR)\nConception, développement et maintenance d'applications backend évolutives et performantes.\nImplémentation de nouvelles fonctionnalités sur du code existant, tout en respectant les standards de qualité de code (lisibilité, programmation objet).\nAvec notamment les exigences suivantes :\nConcevoir et implémenter des architectures logicielles dans les règles de l’art.\nDévelopper et maintenir des APIs robustes et performantes.\nConcevoir des services sécurisés et hautement fiables pour s'intégrer aux blockchains.\nOptimiser les performances et assurer la sécurité des applications.\nParticiper aux revues de code et améliorer les pratiques de développement.\nForce de proposition et d’innovation\nProposer et mettre en œuvre des solutions techniques pour l’implémentation de nouvelles fonctionnalités proposées par le produit.\nCollaborer avec les équipes frontend et produit pour proposer les solutions backend adaptées et donner la meilleure expérience utilisateur à nos clients.\nTravailler avec les ingénieurs, les chefs de produit, l'équipe d'assistance et la direction générale.\nAjouter une énergie positive et une créativité tangible à chaque réunion, et faire en sorte que vos collègues se sentent inclus dans chaque interaction.\n\nSupport\nÊtre disponible et à l’écoute pour régler des problèmes utilisateurs nécessitant des corrections de code.\n\nCompétences et aptitudes :\nMaîtrise de Ruby on Rails (RoR).\nMaîtrise de la conception d’une architecture informatique et sa mise en œuvre programmatique.\nConnaissances approfondies en bases de données (MySQL/MariaDB, Postgresql, MongoDB).\nMaîtrise du travail collaboratif au travers de Git et de plateformes de gestion de code (Gitlab,\nGithub).\nCapacité à travailler de manière autonome et en équipe.\nEsprit méthodique et d’analyse. Rigueur.\nCapacité à présenter son travail de façon claire et concise, aussi bien oralement que par écrit.\nBonne connaissance de l’anglais.\n\nProfil recherché :\nNous recherchons un(e) candidat(e) de niveau bac+5, de préférence diplômé(e) d’une école d'ingénieur, et/ou ayant une forte expérience validée en tant que développeur backend, qui correspond aux critères suivants.\nVous avez à minima 7 ans d’expérience en tant que développeur backend spécialisé dans l'utilisation du framework Ruby on Rails (RoR).\nVous avez conçu, construit, mis à l'échelle et maintenu des services de production, et vous savez comment composer une architecture orientée services.\nVous écrivez du code de haute qualité et bien testé. Vous êtes familier avec Git et avec des plateformes telles que Github et Gitlab.\nVous savez utiliser une base données telles que MySQL/MariaDB et vous en connaissez d’autres telles que PostgreSQL et MongoDB.\nVous êtes familier avec les technologies Blockchain, notamment Bitcoin et Ethereum.\nVous connaissez les outils de conteneurs tels que Docker.\nUne bonne connaissance de Rust serait un plus appréciable.\nVous aimez par ailleurs donner aux clients la meilleure expérience utilisateur et vous êtes prêt à prendre en compte les demandes de support dans vos actions quotidiennes.\nVous êtes capable de vous auto-former et de suivre les technologies orientées frontend et backend.\nVous êtes passionné par la construction d'un système financier ouvert qui changera le monde.\nVous parlez couramment le français et/ou l'anglais.\n\nProcessus de recrutement\n1er entretien avec notre CTO.\nRéalisation d’un test technique, à valider par l'équipe technique et à présenter à celle-ci lors\nd’un entretien technique.\n2e entretien avec notre DG.\n\nRémunération brute annuelle comprise entre 55 000 € à 70 000 € selon profil.\n\n	moreThanThreeMonths	55000	polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	Ruby on Rails,GitHub,GitLab,MySQL,PostgreSQL,MongoDB,Docker,Rust,MySQL/MariaDB	Boulogne-Billancourt	FR	PAYMIUM SAS	https://goodhive.s3.us-east-005.backblazeb2.com/image_39ab0c64-28e1-42b2-b61a-3eb15cf5905d.png	remote	fixed	true	true	false		2025-03-13 13:23:09.612	17	2025-03-13 13:23:09.752632	f	579874426635	t	f
c8b438c9-3cb5-496a-a1b2-14380545666f	12275b16-c4d2-4804-8ef6-494966cb6dea	Front-End Developer	any	Key Responsibilities:\n- Design and develop user interfaces for our mobile applications on iOS and Android using React Native.\n- Assist in the development and enhancement of our web marketplace. 	moreThanOneMonth	13	polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	React,React Native,CSS,Tailwind,UI/UX Design,Web3 experience	Paris	FR	SiBorg	https://goodhive.s3.us-east-005.backblazeb2.com/image_3f062de5-0031-46a9-8c94-1463cb7688d7.png	remote	hourly	true	\N	\N	0xe68D4c4C2704F601865F1d77b6bF3C1c6eEc858F	2024-07-31 02:11:54.04	15	2024-12-23 15:17:12.784362	f	659861899861	t	f
0d29ebe1-f182-4a48-aa45-d4485067cddf	1959c578-be98-43f7-b727-2452a815ee34	Front End Developer	freelance	<p>We're looking for a Front End developer passionate about Web3 to help wrap up a few features on GoodHive!</p><p><strong>Your Role:</strong></p><p class="ql-align-justify">We are in search of a talented intern to contribute to the development of our platform, which is built on the Ethereum blockchain. You will be able to work with design mockups available on Figma and collaborate with a highly skilled team.</p><p class="ql-align-justify"><br></p><p><strong>Why You Should Join Us:</strong></p><p class="ql-align-justify">·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Be Part of Something Big: </strong>GoodHive is at the forefront of the Web3 revolution. Join us in shaping the future of work and the blockchain industry.</p><p class="ql-align-justify">·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Hands-On Experience:</strong> Work on a platform built on Ethereum, gaining practical experience and exposure to cutting-edge technologies.</p><p class="ql-align-justify">·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Collaborative Environment:</strong> Be part of a dynamic team, working alongside a lead developer who will mentor and support you throughout the project.</p><p class="ql-align-justify">·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Remote Opportunities:</strong> We welcome candidates from both Paris and remote locations, offering flexibility in how you work.</p><p class="ql-align-justify">·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Web3 Enthusiasts:</strong> If you're passionate about Web3 and excited about the potential it holds, this is the perfect opportunity for you to make a meaningful impact.</p><p class="ql-align-justify">&nbsp;</p><p class="ql-align-justify"><strong>Compensation:</strong></p><p class="ql-align-justify">We are looking for developers who are open to receiving a portion of their compensation in our native token. The target hourly rate is USD 12.</p><p class="ql-align-justify">&nbsp;</p><p><strong>How to Apply:</strong></p><p>If you're eager to be part of the Web3 revolution and you have the skills and passion we're looking for, don't hesitate to apply today! Send us your resume and a cover letter outlining why you'd be a great fit for the role.</p><p><br></p><p><strong>Join GoodHive and help us shape the future of work in the Web3 space. Apply now!</strong></p><p><a href="https://goodhive.io/" rel="noopener noreferrer" target="_blank">GoodHive</a> is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.</p>	moreThanSevenDays	12	polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	JavaScript,TypeScript,ReactJS,NextJS,Solidity,NestJS,PostgreSQL,SQL	Paris	FR	GoodHive	https://goodhive.s3.us-east-005.backblazeb2.com/image_959be654-294f-4a89-bdd0-c94f403ee9c3.png	remote	hourly	true	false	true	0x7F7856b44443F24046AcA0a19a3FB78B516b5186	2024-10-14 06:52:45.402	39	2024-12-23 15:17:12.784362	f	516798065922	t	f
5f8c9906-9891-4db9-a334-97e7aaa8eb90	b37981dd-ed30-4dab-b989-e5e862988338	Unreal Engine Developer (C++ || BluePrint) + API Web3	any	<p>We're looking for a UNREAL ENGINE dev (C++ or BLUEPRINT) for a 3-week sprint, in hackathon mode. 💻</p><p><br></p><p><br></p><p>Want to build, shipper, and potentially join a larger adventure?</p><p>Our playground?</p><p><br></p><p>The Thugz Blockchain Plugin: an OPEN SOURCE tool that connects the Solana blockchain to Unreal Engine video games.</p><p>Already +50,000 DOWNLOADS referenced in the Solana Foundation's official SDK, and used by devs to create powerful Web3 experiences.</p><p><br></p><p>We're taking part in the HACKATON Solana COLOSSEUM BREAKOUT, and aiming for the tracks:</p><p><br></p><p>🎮 Gaming</p><p>⚙️ Infrastructure</p><p>🧑‍💻 Consumer Apps</p><p><br></p><p><br></p><p>What we're offering:</p><p><br></p><p>✅ A live plugin</p><p>✅ A square team (orga + vision)</p><p>✅ A short, intense, focused sprint</p><p>✅ A prize to share</p><p>✅ And maybe a long-term role (CTO vibes if feeling)</p><p><br></p><p>Want to build? Come and lay your stone!</p><p><br></p><p>Plugin demo :</p><p>https://lnkd.in/e8kaK4-w</p><p><br></p><p>Join us on Discord :</p><p>https://lnkd.in/gyj4agJn</p><p><br></p><p>Contact us for more info . ✉️</p><p><br></p><p>Let's ship. Let's win.</p><p>Let's make Solana Gaming real.</p><p><br></p><p><br></p><p>#UnrealEngine</p><p>#GameDev</p><p>#Web3Gaming</p><p>#SolanaDevelopers</p><p>#ColosseumHackathon</p><p>#SuperteamFrance</p>	moreThanSevenDays	0	polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	BluePrint,Unreal Engine,API Integration,Web3,C++	Paris	FR	Thugz Labs	https://goodhive.s3.us-east-005.backblazeb2.com/image_826a6e25-1bad-4651-8722-31c3d644a7e9.jpeg	hybrid	fixed	true	false	false		2025-04-22 13:20:25.327	19	2025-04-22 13:20:25.533125	f	766599001452	t	f
5c1f149b-6838-4aaf-be1b-e41190be99fc	6e9cd09e-ee78-4523-b2f6-4ba7fa3bd7f2	Web Developer	freelance	<p>We want to sell our gadgets online. We need an e-com website, with cool futuristic vibe</p>	moreThanOneMonth		polygon	0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359	React,Node.js	Berlin	DE	Alien Electronics	https://goodhive.s3.us-east-005.backblazeb2.com/image_4e6d31ec-7a45-4ba8-823c-00d298ba1970.png	remote	hourly	true	false	false	0x1cca0034C4AcD9812adE4f87DCe77EBE0ED9bD73	2025-07-05 06:33:49.129	31	2025-07-05 06:33:55.502936	f	229409305035	f	t
\.


--
-- Data for Name: job_sections; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.job_sections (id, job_id, heading, content, sort_order, created_at, updated_at) FROM stdin;
11	046373b4-32dc-44ff-b274-0ec84a7bf7bd	Position Details:	<ul><li><strong>Job Title</strong>: [Job Title] ✍️</li><li><strong>Department</strong>: [Department Name] 💼</li><li><strong>Start Date</strong>: [Proposed Start Date] 🚀</li><li><strong>Salary</strong>: [Salary Amount] per [hour/year] 💰</li><li><strong>Benefits</strong>: [Briefly outline benefits, e.g., health insurance, retirement plans, etc.] 🏥 🏦</li></ul><p><br></p>	0	2025-11-11 21:49:05.107464	2025-11-11 21:49:05.107464
12	046373b4-32dc-44ff-b274-0ec84a7bf7bd	Job Responsibilities:	<p>As a&nbsp;<strong>[Job Title]</strong>, your main responsibilities will include:</p><ol><li>[Responsibility 1] 🎯</li><li>[Responsibility 2] 🤝</li><li>[Responsibility 3] 📊</li><li>[Responsibility 4] 💡</li></ol><p><br></p>	1	2025-11-11 21:49:05.14499	2025-11-11 21:49:05.14499
13	046373b4-32dc-44ff-b274-0ec84a7bf7bd	Conditions of Employment:	<p>This offer is dependent on the successful completion of [any conditions, e.g., background check, drug screening, etc.]. ✅</p><p>Please sign and return this letter by&nbsp;<strong>[Response Deadline]</strong>&nbsp;to confirm your acceptance. We can't wait to welcome you aboard!</p><p>If you have any questions, please don't hesitate to reach out.</p>	2	2025-11-11 21:49:05.159751	2025-11-11 21:49:05.159751
14	97fe047b-58b1-4cf4-a6ac-d35d0fd7b6cb	About the Role	<p>We are seeking an experienced Senior Full Stack Developer to join our dynamic, fast-paced technology team. As a core member of the team, you will play an integral role in developing scalable web applications using modern technologies. You will have the opportunity to work on both frontend and backend development, mastering the complete tech stack. We value innovation, agility, and collaboration, and are looking for a professional who is well-versed in React, Node.js, and database design. The ideal candidate is someone who thrives in an agile environment and enjoys working with cross-functional teams.</p>	0	2025-11-12 13:54:11.128749	2025-11-12 13:54:11.128749
15	97fe047b-58b1-4cf4-a6ac-d35d0fd7b6cb	Key Responsibilities	<ul><li>Develop scalable, high-quality, and innovative applications using React and Node.js</li><li>Contribute to the complete software development lifecycle, including planning, design, development, testing, and deployment</li><li>Work collaboratively with cross-functional teams to deliver top-notch web applications</li><li>Manage database schemas, ensuring secure and efficient data storage</li><li>Continuously improve code quality, system design, and processes</li><li>Stay abreast of emerging technologies and trends in the software industry</li></ul>	1	2025-11-12 13:54:11.919709	2025-11-12 13:54:11.919709
16	97fe047b-58b1-4cf4-a6ac-d35d0fd7b6cb	Requirements & Qualifications	<ul><li>Proven experience as a Full Stack Developer or similar role</li><li>Strong knowledge of React, Node.js, TypeScript, PostgreSQL, AWS, Docker, and Git</li><li>Experience with database design and data modeling</li><li>Understanding of agile development methodologies</li><li>Excellent problem-solving skills and attention to detail</li><li>Strong teamwork skills with a problem-solving attitude</li></ul>	2	2025-11-12 13:54:12.666762	2025-11-12 13:54:12.666762
17	97fe047b-58b1-4cf4-a6ac-d35d0fd7b6cb	Preferred Skills	<ul><li>Experience with cloud services (AWS, Google Cloud, Azure)</li><li>Knowledge of container technologies like Docker or Kubernetes</li><li>Understanding of CI/CD pipelines</li><li>Familiarity with unit testing and test-driven development</li></ul>	3	2025-11-12 13:54:13.407925	2025-11-12 13:54:13.407925
18	97fe047b-58b1-4cf4-a6ac-d35d0fd7b6cb	What We Offer	<ul><li>A competitive compensation package within the indicated budget range</li><li>Opportunity to work on cutting-edge technologies</li><li>Remote work flexibility, promoting work-life balance</li><li>A collaborative and inclusive work environment with growth opportunities</li></ul>	4	2025-11-12 13:54:13.937305	2025-11-12 13:54:13.937305
19	6c6dcfdf-ab35-45ae-b587-cd3e16462bc0	About the Role	<p>This position offers an exciting opportunity to contribute to the development of our cutting-edge platform built on the Ethereum blockchain. As a mid-level fullstack developer, you will be working with design mockups on Figma, transforming them into functional and user-friendly interfaces using ReactJS/NextJS, Rainbow kit/Wagmi, and implementing backend features using NestJS, Postgres and Solidity. This role is for someone who is passionate about blockchain technology and is eager to work with a highly skilled team on innovative projects.</p>	0	2025-11-12 17:38:18.618826	2025-11-12 17:38:18.618826
20	6c6dcfdf-ab35-45ae-b587-cd3e16462bc0	Key Responsibilities	<ul><li>Develop high-quality frontend and backend code following industry standards</li><li>Work with design mockups on Figma to build user-friendly interfaces</li><li>Collaborate with the team to develop new features and improve existing functionalities</li><li>Involve in the CI process using Gitflow and GitHub project</li><li>Ensure the performance, quality, and responsiveness of applications</li></ul>	1	2025-11-12 17:38:18.655976	2025-11-12 17:38:18.655976
21	6c6dcfdf-ab35-45ae-b587-cd3e16462bc0	Requirements & Qualifications	<ul><li>Proficiency with Javascript/TypeScript, Solidity, and SQL</li><li>Experience with frontend development using ReactJS/NextJS</li><li>Experience in backend development using NestJS, Postgres, Solidity, and IPFS</li><li>Good understanding of CI methodologies, specifically Gitflow</li><li>Experience with Figma is a plus</li></ul>	2	2025-11-12 17:38:18.833804	2025-11-12 17:38:18.833804
22	6c6dcfdf-ab35-45ae-b587-cd3e16462bc0	Preferred Skills	<ul><li>Experience with Rainbow kit/Wagmi</li><li>Familiarity with the Ethereum blockchain</li><li>Good problem-solving skills and attention to detail</li></ul>	3	2025-11-12 17:38:18.873526	2025-11-12 17:38:18.873526
23	6c6dcfdf-ab35-45ae-b587-cd3e16462bc0	What We Offer	<ul><li>Opportunity to work on innovative blockchain projects</li><li>Chance to work with a team of highly skilled professionals</li><li>Remote work flexibility</li><li>Competitive hourly rates</li></ul>	4	2025-11-12 17:38:18.892838	2025-11-12 17:38:18.892838
24	5e2ec4ed-55e4-4e09-bfae-34db72c70120	About the Role	<p>We are seeking an experienced AI Software Developer to build and enhance our machine learning platform. This role involves working on cutting-edge AI solutions, developing intelligent algorithms, and creating scalable ML infrastructure. As a part of our team, you will have the opportunity to use your skills to create AI-powered features and optimize their performance for our web platform.</p>	0	2025-11-19 19:00:28.978769	2025-11-19 19:00:28.978769
25	5e2ec4ed-55e4-4e09-bfae-34db72c70120	Key Responsibilities	<ul><li>Develop and implement machine learning models and algorithms</li><li>Build AI-powered features for our web platform</li><li>Optimize model performance and scalability</li><li>Integrate AI services with existing backend systems</li><li>Create intelligent data processing pipelines</li><li>Implement natural language processing solutions</li></ul>	1	2025-11-19 19:00:29.794267	2025-11-19 19:00:29.794267
26	5e2ec4ed-55e4-4e09-bfae-34db72c70120	Requirements & Qualifications	<ul><li>Proficiency in Python, TensorFlow, PyTorch</li><li>Experience in Machine Learning, Deep Learning</li><li>Knowledge of Natural Language Processing (NLP)</li><li>Experience with Computer Vision</li><li>Familiarity with REST APIs, Microservices</li><li>Experience with Docker, Kubernetes</li><li>Knowledge of Cloud Platforms (AWS/GCP/Azure)</li><li>Background in Data Science, Statistics</li></ul>	2	2025-11-19 19:00:30.410841	2025-11-19 19:00:30.410841
27	5e2ec4ed-55e4-4e09-bfae-34db72c70120	Preferred Skills	<ul><li>3+ years experience in AI/ML development</li><li>Experience with LLM integration (OpenAI, Hugging Face)</li><li>Knowledge of MLOps and model deployment</li><li>Familiarity with blockchain/Web3 (bonus)</li><li>Previous work on production AI systems</li></ul>	3	2025-11-19 19:00:31.001245	2025-11-19 19:00:31.001245
28	5e2ec4ed-55e4-4e09-bfae-34db72c70120	What We Offer	<ul><li>Competitive compensation with a fixed price project</li><li>Remote work opportunity</li><li>A chance to work on cutting-edge AI solutions</li><li>Opportunity to learn and grow in a dynamic work environment</li></ul>	4	2025-11-19 19:00:31.290475	2025-11-19 19:00:31.290475
29	1730177a-7b3a-4ceb-b59e-d44009c66729	Job Description	We need an AI developer for blockchain integration testing	0	2025-11-19 19:56:53.823116	2025-11-19 19:56:53.823116
30	6a056960-e59e-4a55-a072-4493642d552e	About the Role	<p>We are seeking a skilled and detail-oriented Software Quality Assurance Tester to join our development team and ensure the highest quality standards for our web applications and mobile platforms. This role involves designing, implementing, and executing comprehensive test strategies across our entire software development lifecycle. You will work closely with our development, product, and design teams to identify potential issues before they reach production, ensuring our users have the best possible experience with our applications.</p>	0	2025-11-19 20:18:02.212691	2025-11-19 20:18:02.212691
31	6a056960-e59e-4a55-a072-4493642d552e	Key Responsibilities	<ul><li>Design and execute manual test cases for web applications, mobile apps, and API endpoints</li><li>Develop and maintain automated test scripts using modern testing frameworks</li><li>Perform regression testing, integration testing, and user acceptance testing</li><li>Conduct exploratory testing to identify edge cases and usability issues</li><li>Create detailed bug reports with clear reproduction steps and severity assessments</li><li>Collaborate with developers to ensure timely resolution of identified issues</li><li>Participate in code reviews from a testing perspective</li><li>Maintain and update test documentation and testing procedures</li></ul>	1	2025-11-19 20:18:02.867936	2025-11-19 20:18:02.867936
32	6a056960-e59e-4a55-a072-4493642d552e	Requirements & Qualifications	<ul><li>3+ years of experience in software quality assurance and testing</li><li>Strong knowledge of testing methodologies (black box, white box, grey box testing)</li><li>Experience with test automation tools such as Selenium, Cypress, or Playwright</li><li>Proficiency in at least one programming language (JavaScript, Python, Java)</li><li>Familiarity with API testing tools like Postman, Insomnia, or REST Assured</li><li>Experience with cross-browser testing and mobile device testing</li><li>Knowledge of version control systems (Git) and CI/CD pipelines</li><li>Understanding of Agile/Scrum development methodologies</li></ul>	2	2025-11-19 20:18:03.894429	2025-11-19 20:18:03.894429
33	6a056960-e59e-4a55-a072-4493642d552e	Preferred Skills	<ul><li>Experience with performance testing tools (JMeter, LoadRunner)</li><li>Knowledge of security testing principles and tools</li><li>Familiarity with database testing and SQL queries</li><li>Experience with containerized testing environments (Docker)</li><li>ISTQB certification or equivalent testing certifications</li><li>Previous experience in e-commerce, fintech, or SaaS environments</li></ul>	3	2025-11-19 20:18:04.611549	2025-11-19 20:18:04.611549
34	6a056960-e59e-4a55-a072-4493642d552e	What We Offer	<ul><li>Competitive salary ranging from $65,000 to $85,000 annually</li><li>Comprehensive health, dental, and vision insurance</li><li>Flexible work arrangements with remote work options</li><li>Professional development budget for conferences, courses, and certifications</li><li>Modern testing tools and infrastructure</li><li>Collaborative and innovation-focused work environment</li></ul>	4	2025-11-19 20:18:05.837652	2025-11-19 20:18:05.837652
35	8aaa2ce0-7dd5-4204-86a7-88a0bcc50409	About the Role	<p>We are seeking a detail-oriented Software Quality Assurance Tester to join our team. In this role, you will be responsible for designing, implementing, and executing comprehensive test strategies across our entire software development lifecycle. You'll work closely with our development, product, and design teams to identify potential issues before they reach production, ensuring our users have the best possible experience with our applications.</p>	0	2025-11-19 20:55:47.143393	2025-11-19 20:55:47.143393
36	8aaa2ce0-7dd5-4204-86a7-88a0bcc50409	Key Responsibilities	<ul><li>Design and execute manual test cases for web applications, mobile apps, and API endpoints</li><li>Develop and maintain automated test scripts using modern testing frameworks</li><li>Perform regression testing, integration testing, and user acceptance testing</li><li>Conduct exploratory testing to identify edge cases and usability issues</li><li>Create detailed bug reports with clear reproduction steps and severity assessments</li><li>Collaborate with developers to ensure timely resolution of identified issues</li></ul>	1	2025-11-19 20:55:47.963067	2025-11-19 20:55:47.963067
37	8aaa2ce0-7dd5-4204-86a7-88a0bcc50409	Requirements & Qualifications	<ul><li>3+ years of experience in software quality assurance and testing</li><li>Strong knowledge of testing methodologies (black box, white box, grey box testing)</li><li>Experience with test automation tools such as Selenium, Cypress, or Playwright</li><li>Proficiency in at least one programming language (JavaScript, Python, Java)</li><li>Familiarity with API testing tools like Postman, Insomnia, or REST Assured</li><li>Experience with cross-browser testing and mobile device testing</li></ul>	2	2025-11-19 20:55:48.541774	2025-11-19 20:55:48.541774
38	8aaa2ce0-7dd5-4204-86a7-88a0bcc50409	Preferred Skills	<ul><li>Experience with performance testing tools (JMeter, LoadRunner)</li><li>Knowledge of security testing principles and tools</li><li>Familiarity with database testing and SQL queries</li><li>Experience with containerized testing environments (Docker)</li></ul>	3	2025-11-19 20:55:49.18396	2025-11-19 20:55:49.18396
39	8aaa2ce0-7dd5-4204-86a7-88a0bcc50409	What We Offer	<ul><li>Competitive salary ranging from $65,000 to $85,000 annually</li><li>Comprehensive health, dental, and vision insurance</li><li>Flexible work arrangements with remote work options</li><li>Professional development budget for conferences, courses, and certifications</li></ul>	4	2025-11-19 20:55:49.778671	2025-11-19 20:55:49.778671
40	e968977d-1e4d-45f0-9dab-c08f61fbb803	About the Role	<p>We are seeking a skilled and detail-oriented Software Quality Assurance Tester to join our development team. You will be responsible for ensuring the highest quality standards for our web applications and mobile platforms. This is an exciting opportunity for a testing professional who is passionate about delivering bug-free, user-friendly software products. You'll work closely with our development, product, and design teams to identify potential issues before they reach production, ensuring our users have the best possible experience with our applications.</p>	0	2025-11-19 21:06:37.269803	2025-11-19 21:06:37.269803
41	e968977d-1e4d-45f0-9dab-c08f61fbb803	Key Responsibilities	<ul><li>Design and execute manual test cases for web applications, mobile apps, and API endpoints</li><li>Develop and maintain automated test scripts using modern testing frameworks</li><li>Perform regression testing, integration testing, and user acceptance testing</li><li>Conduct exploratory testing to identify edge cases and usability issues</li><li>Create detailed bug reports with clear reproduction steps and severity assessments</li><li>Collaborate with developers to ensure timely resolution of identified issues</li><li>Participate in code reviews from a testing perspective</li><li>Maintain and update test documentation and testing procedures</li></ul>	1	2025-11-19 21:06:37.691352	2025-11-19 21:06:37.691352
42	e968977d-1e4d-45f0-9dab-c08f61fbb803	Requirements & Qualifications	<ul><li>3+ years of experience in software quality assurance and testing</li><li>Strong knowledge of testing methodologies (black box, white box, grey box testing)</li><li>Experience with test automation tools such as Selenium, Cypress, or Playwright</li><li>Proficiency in at least one programming language (JavaScript, Python, Java)</li><li>Familiarity with API testing tools like Postman, Insomnia, or REST Assured</li><li>Experience with cross-browser testing and mobile device testing</li><li>Knowledge of version control systems (Git) and CI/CD pipelines</li><li>Understanding of Agile/Scrum development methodologies</li></ul>	2	2025-11-19 21:06:38.102216	2025-11-19 21:06:38.102216
43	e968977d-1e4d-45f0-9dab-c08f61fbb803	Preferred Skills	<ul><li>Experience with performance testing tools (JMeter, LoadRunner)</li><li>Knowledge of security testing principles and tools</li><li>Familiarity with database testing and SQL queries</li><li>Experience with containerized testing environments (Docker)</li><li>ISTQB certification or equivalent testing certifications</li><li>Previous experience in e-commerce, fintech, or SaaS environments</li></ul>	3	2025-11-19 21:06:38.511103	2025-11-19 21:06:38.511103
44	e968977d-1e4d-45f0-9dab-c08f61fbb803	What We Offer	<ul><li>Competitive salary ranging from $65,000 to $85,000 annually</li><li>Comprehensive health, dental, and vision insurance</li><li>Flexible work arrangements with remote work options</li><li>Professional development budget for conferences, courses, and certifications</li><li>Modern testing tools and infrastructure</li><li>Collaborative and innovation-focused work environment</li></ul>	4	2025-11-19 21:06:38.8035	2025-11-19 21:06:38.8035
45	b766e547-119c-4e23-aaf6-d27450790549	About the Role	<p>We are seeking a skilled and detail-oriented Software Quality Assurance Tester to join our development team and ensure the highest quality standards for our web applications and mobile platforms. As our QA Tester, you will be responsible for designing, implementing, and executing comprehensive test strategies across our entire software development lifecycle. You will work closely with our development, product, and design teams to identify potential issues before they reach production, ensuring our users have the best possible experience with our applications.</p>	0	2025-11-19 21:12:18.858719	2025-11-19 21:12:18.858719
46	b766e547-119c-4e23-aaf6-d27450790549	Key Responsibilities	<ul><li>Design and execute manual test cases for web applications, mobile apps, and API endpoints.</li><li>Develop and maintain automated test scripts using modern testing frameworks.</li><li>Perform regression testing, integration testing, and user acceptance testing.</li><li>Conduct exploratory testing to identify edge cases and usability issues.</li><li>Create detailed bug reports with clear reproduction steps and severity assessments.</li><li>Collaborate with developers to ensure timely resolution of identified issues.</li><li>Participate in code reviews from a testing perspective.</li><li>Maintain and update test documentation and testing procedures.</li></ul>	1	2025-11-19 21:12:19.154806	2025-11-19 21:12:19.154806
47	b766e547-119c-4e23-aaf6-d27450790549	Requirements & Qualifications	<ul><li>3+ years of experience in software quality assurance and testing.</li><li>Strong knowledge of testing methodologies (black box, white box, grey box testing).</li><li>Experience with test automation tools such as Selenium, Cypress, or Playwright.</li><li>Proficiency in at least one programming language (JavaScript, Python, Java).</li><li>Familiarity with API testing tools like Postman, Insomnia, or REST Assured.</li><li>Experience with cross-browser testing and mobile device testing.</li><li>Knowledge of version control systems (Git) and CI/CD pipelines.</li><li>Understanding of Agile/Scrum development methodologies.</li></ul>	2	2025-11-19 21:12:19.505033	2025-11-19 21:12:19.505033
48	b766e547-119c-4e23-aaf6-d27450790549	Preferred Skills	<ul><li>Experience with performance testing tools (JMeter, LoadRunner).</li><li>Knowledge of security testing principles and tools.</li><li>Familiarity with database testing and SQL queries.</li><li>Experience with containerized testing environments (Docker).</li><li>ISTQB certification or equivalent testing certifications.</li><li>Previous experience in e-commerce, fintech, or SaaS environments.</li></ul>	3	2025-11-19 21:12:19.91385	2025-11-19 21:12:19.91385
49	b766e547-119c-4e23-aaf6-d27450790549	What We Offer	<ul><li>Competitive salary ranging from $65,000 to $85,000 annually.</li><li>Comprehensive health, dental, and vision insurance.</li><li>Flexible work arrangements with remote work options.</li><li>Professional development budget for conferences, courses, and certifications.</li><li>Modern testing tools and infrastructure.</li><li>Collaborative and innovation-focused work environment.</li></ul>	4	2025-11-19 21:12:20.204807	2025-11-19 21:12:20.204807
50	2a00f805-6bda-4465-92b4-ce3e67299980	About the Role	<p>As a Blockchain Development Intern at GoodHive, you will contribute to the development of our platform, built on the Ethereum blockchain. You will work with design mockups available on Figma and collaborate with a highly skilled team. This is an exciting opportunity to gain hands-on experience and exposure to cutting-edge technologies in the thriving Web3 ecosystem.</p>	0	2025-11-20 17:24:16.946812	2025-11-20 17:24:16.946812
51	2a00f805-6bda-4465-92b4-ce3e67299980	Key Responsibilities	<ul><li>Contribute to the development of the GoodHive platform.</li><li>Work with design mockups on Figma.</li><li>Collaborate with a team of experienced developers.</li><li>Learn and apply cutting-edge technologies in the Web3 space.</li></ul>	1	2025-11-20 17:24:16.980404	2025-11-20 17:24:16.980404
52	2a00f805-6bda-4465-92b4-ce3e67299980	Requirements & Qualifications	<ul><li>Proficiency in JavaScript/TypeScript and Solidity is a must.</li><li>Experience with SQL.</li><li>Understanding of frontend technologies such as ReactJS/NextJS.</li><li>Familiarity with backend technologies like NestJS is a plus.</li><li>Experience with Gitflow and Github project methodologies.</li></ul>	2	2025-11-20 17:24:16.995737	2025-11-20 17:24:16.995737
53	2a00f805-6bda-4465-92b4-ce3e67299980	Preferred Skills	<ul><li>Experience with Rainbow kit/Wagmi.</li><li>Knowledge of IPFS.</li><li>Experience with Postgres.</li><li>Interest in Web3 technologies.</li></ul>	3	2025-11-20 17:24:17.010494	2025-11-20 17:24:17.010494
54	2a00f805-6bda-4465-92b4-ce3e67299980	What We Offer	<ul><li>Hands-on experience working on a platform built on Ethereum.</li><li>Opportunity to be mentored by a lead developer.</li><li>Flexibility to work remotely.</li><li>Participation in the Web3TalentFair, a Job Fair exclusively for the brightest minds in the Web3 and Future of Work domains.</li></ul>	4	2025-11-20 17:24:17.025475	2025-11-20 17:24:17.025475
55	2a00f805-6bda-4465-92b4-ce3e67299980	About the Company	<p>GoodHive is a groundbreaking collaborative recruitment platform dedicated to the thriving Web3 ecosystem. Our mission is to bridge the gap between demand and supply of talent in the Web3 space. We operate differently from traditional platforms, redistributing the full commission paid by clients back to the community. This approach encourages excellence in project deliveries and supports matching and mentoring services powered by our community.</p>	5	2025-11-20 17:24:17.040249	2025-11-20 17:24:17.040249
56	fb8da926-233a-480d-9033-be01d3c3dfef	About the Role	<p>We are seeking a talented intern developer to contribute to the development of our platform, built on the Ethereum blockchain. You would be working with design mockups available on Figma and collaborating with a highly skilled team. This is a unique opportunity to gain hands-on experience and exposure to cutting-edge technologies in the Web3 and blockchain industry.</p>	0	2025-11-20 17:44:36.529631	2025-11-20 17:44:36.529631
57	fb8da926-233a-480d-9033-be01d3c3dfef	Key Responsibilities	<ul><li>Collaborate with the team to develop and implement features for our platform</li><li>Work with design mockups on Figma</li><li>Contribute to the development of our Ethereum-based platform</li><li>Collaborate in a team-oriented environment</li></ul>	1	2025-11-20 17:44:36.562695	2025-11-20 17:44:36.562695
58	fb8da926-233a-480d-9033-be01d3c3dfef	Requirements & Qualifications	<ul><li>Strong knowledge of JavaScript (JS)/TypeScript (TS)</li><li>Experience with Solidity and SQL</li><li>Experience working with ReactJS/NextJS</li><li>Knowledge of backend technologies such as NestJS, Postgres, Solidity, and IPFS</li><li>Familiarity with Gitflow and GitHub project</li></ul>	2	2025-11-20 17:44:36.579418	2025-11-20 17:44:36.579418
59	fb8da926-233a-480d-9033-be01d3c3dfef	Preferred Skills	<ul><li>Experience with Rainbow kit/Wagmi</li><li>Experience working with Ethereum blockchain</li><li>Experience or interest in Web3</li><li>Open to receiving a portion of compensation in our native token</li></ul>	3	2025-11-20 17:44:36.596129	2025-11-20 17:44:36.596129
60	fb8da926-233a-480d-9033-be01d3c3dfef	What We Offer	<ul><li>Opportunity to be part of the Web3 revolution</li><li>Hands-on experience with cutting-edge technologies</li><li>Collaborative and supportive work environment</li><li>Remote work opportunities</li></ul>	4	2025-11-20 17:44:36.612799	2025-11-20 17:44:36.612799
61	fb8da926-233a-480d-9033-be01d3c3dfef	About the Company	<p>GoodHive is a groundbreaking collaborative recruitment platform dedicated to the thriving Web3 ecosystem. We are a collective of passionate entrepreneurs deeply involved in Web3, determined to address its main challenge – the shortage of IT talent. GoodHive is at the forefront of the Web3 revolution, and we are committed to creating an inclusive environment for all employees.</p>	5	2025-11-20 17:44:36.629595	2025-11-20 17:44:36.629595
62	5dcde7bf-f054-4487-82c3-8c2448fa47e2	About the Role	<p>We are looking for a talented and enthusiastic Intern Developer to join our team. You will play a crucial role in the development of our Ethereum blockchain platform. Collaborating with a highly skilled team, you will work with design mockups available on Figma. This is a unique opportunity to gain hands-on experience and exposure to the cutting-edge technologies in the Web3 and blockchain industry.</p>	0	2025-11-22 18:20:24.706964	2025-11-22 18:20:24.706964
63	5dcde7bf-f054-4487-82c3-8c2448fa47e2	Key Responsibilities	<ul><li>Contribute to the development of our Ethereum blockchain platform.</li><li>Work with design mockups available on Figma.</li><li>Collaborate with a highly skilled team.</li><li>Learn and gain hands-on experience with Web3 and blockchain technologies.</li></ul>	1	2025-11-22 18:20:24.741635	2025-11-22 18:20:24.741635
64	5dcde7bf-f054-4487-82c3-8c2448fa47e2	Requirements & Qualifications	<ul><li>Strong interest in blockchain technology.</li><li>Understanding of Ethereum blockchain.</li><li>Experience with Figma or similar design tools.</li><li>Ability to collaborate and work as part of a team.</li><li>Willingness to learn and adapt to new technologies.</li></ul>	2	2025-11-22 18:20:24.757519	2025-11-22 18:20:24.757519
65	5dcde7bf-f054-4487-82c3-8c2448fa47e2	Preferred Skills	<ul><li>Previous experience with Web3 technologies.</li><li>Understanding of blockchain industry trends and technologies.</li><li>Experience working in a start-up environment.</li></ul>	3	2025-11-22 18:20:24.773473	2025-11-22 18:20:24.773473
66	5dcde7bf-f054-4487-82c3-8c2448fa47e2	What We Offer	<ul><li>Opportunity to work with cutting-edge technologies in the blockchain industry.</li><li>Collaborative and supportive team environment.</li><li>Hands-on experience and learning opportunities.</li></ul>	4	2025-11-22 18:20:24.78882	2025-11-22 18:20:24.78882
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.otps (id, email, otp, created_at, expires_at, used) FROM stdin;
14	web3jssobfair@gmail.com	260564	2025-04-02 09:21:30.892105	2025-04-02 09:31:30.697	f
10	davidjuhan23@gmail.com	503036	2025-04-02 08:55:12.467097	2025-04-03 19:10:28.493	f
1	jubayerjuhan.info@gmail.com	766986	2025-04-02 08:10:27.083711	2025-04-07 19:44:46.494	t
15	web3jobfair@gmail.com	429146	2025-04-02 09:21:48.35399	2025-04-08 15:15:06.249	t
44	benoit@goodhive.io	876719	2025-04-08 15:10:33.352991	2025-04-08 15:20:33.202	t
45	benoit.test3@gmail.com	648495	2025-04-08 15:12:33.427173	2025-04-08 15:22:33.419	f
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.referrals (user_id, referral_code, talents, companies, approved_talents, approved_companies) FROM stdin;
3fa26651-fcde-48f0-9543-a0cd52d0ce0b	sNAshn	{}	\N	\N	\N
de127d98-1aad-4253-83bc-3ce9a4fb5b10	ESjfwe	{}	\N	\N	\N
196403f9-3317-4269-91b2-18ff3e1fe4eb	kxWNK7	{}	\N	\N	\N
230dd894-d5b8-4eda-9b97-8d00ea196c71	IRtED7	{}	\N	\N	\N
ebd3909c-394a-472a-ad45-183ae8521540	Amzx2l	{}	\N	\N	\N
e1334ca6-1cad-4c1a-bbc6-92372024a27c	C8JDfp	{}	\N	\N	\N
0dca6ab0-914b-42cb-b181-55aae8f6af80	tP41FP	{}	\N	\N	\N
9264edf3-cd9d-4fa7-9fa9-be3aaa164f1d	YlXp2Q	{}	\N	\N	\N
37046e38-c2ef-48de-b6c2-4c61b97fcb8f	ZW6cSv	{2723547b-dc87-4e8a-aab0-1269b3440fj1}	\N	{2723547b-dc87-4e8a-aab0-1269b3440ff0}	\N
9580d2f2-765c-4a57-a7a2-8936208075e7	bGg39f	{}	\N	\N	\N
340cf96e-f943-417d-882a-a9fa12553f8a	TCrn6M	{}	\N	\N	\N
d7d74872-8407-4a25-9a45-6f9de4f22c67	WvSyrG	{}	\N	\N	\N
6a5210c7-b86e-4665-be2d-a33273ee9f39	uVAP1x	{}	\N	\N	\N
037da74b-1ab8-4cb3-91da-c7e6ffb106ea	kDN6c4	{}	\N	\N	\N
20dcf8e8-a294-4516-9773-772ca3c3a838	lBAU8l	{}	\N	\N	\N
84d19dc7-4cb0-43f8-ae45-50a83097a781	Jt1qiy	{}	\N	\N	\N
4142b2dc-82b7-496f-95f3-207504cc09b5	asrxna	{}	\N	\N	\N
1959c578-be98-43f7-b727-2452a815ee34	uyv2hh	{}	\N	\N	\N
be277147-15d0-4420-be52-7f226e22343d	hXC1cn	{}	\N	\N	\N
d9fbe13c-7a27-4ca4-a68e-51ee1c793c41	vCwf7v	{}	\N	\N	\N
7bdf28c3-881a-4a8c-b894-a3ce03e75cee	WLzaWp	{}	\N	\N	\N
9f1b337c-2115-4910-9296-cf76ce26fc62	wVDQbV	{}	\N	\N	\N
de64e667-9a38-41ab-bcd3-cbbf89f5d982	3wOvK9	{}	\N	\N	\N
5a54167d-e76b-4c3a-8b22-5351cd3a767a	aPVRjl	{}	\N	\N	\N
a43ad1cf-b06b-4291-923c-a0a01d8450e5	VHxt42	{1c883f42-1608-4449-a2c2-d15d02b31108}	\N	{1c883f42-1608-4449-a2c2-d15d02b31108}	\N
d324ae2c-c57e-4327-9de5-2efd97bc9eaa	XNFvv5	{}	\N	\N	\N
aa64582c-3f27-4c3c-9e17-cfdc5c3aea0f	cjf8M1	{}	\N	\N	\N
bfe2f0f8-660a-4842-a00d-c35489f76a90	gHyowd	{}	\N	\N	\N
f0be414a-0aaa-40ed-b6d8-ceb762c5f4ff	zmhod7	{}	\N	\N	\N
0719124a-9836-40c9-a82d-e8026dc372db	lxD1JW	{d324ae2c-c57e-4327-9de5-2efd97bc9eaa,e6c9b252-049e-48ae-9cf5-861c7bea4cac}	\N	{d324ae2c-c57e-4327-9de5-2efd97bc9eaa,e6c9b252-049e-48ae-9cf5-861c7bea4cac}	\N
3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	hMXTac	{a43ad1cf-b06b-4291-923c-a0a01d8450e5,34541537-b436-41fd-a238-cc29a3f33558,7bdf28c3-881a-4a8c-b894-a3ce03e75cee,9ddc730f-0391-43f9-9bc1-33ec013e3376,344691d4-62ef-4f98-99bd-b7dd9aa824a7}	\N	{9ddc730f-0391-43f9-9bc1-33ec013e3376,344691d4-62ef-4f98-99bd-b7dd9aa824a7,34541537-b436-41fd-a238-cc29a3f33558,7bdf28c3-881a-4a8c-b894-a3ce03e75cee,a43ad1cf-b06b-4291-923c-a0a01d8450e5}	\N
ff854ab4-6c5f-47d8-9375-d94c402127b3	AolIs1	{}	\N	\N	\N
3fffd0c5-44b4-4352-9331-3ec927181efa	6YxTEE	{}	\N	\N	\N
29752320-a130-4079-b5ae-bb13d4abb166	RzytZa	{}	\N	\N	\N
5fa564a6-27a7-4ef6-851c-e8580fe9ea7e	h9bJPP	{}	\N	\N	\N
b37981dd-ed30-4dab-b989-e5e862988338	yitI7J	{}	\N	\N	\N
c3176c3a-1705-447b-8571-3bbd0f51c99a	uDWBD0	{}	\N	\N	\N
c8195796-7430-4847-9c2b-5ac79df96237	vU9Uga	{}	\N	\N	\N
39ed4eb5-109a-40ea-ac0a-c5b85f5ce170	2dKgoZ	{}	\N	\N	\N
b276088e-c7e2-4969-bd60-2473ae1a9d81	OBrN4B	{}	\N	\N	\N
35947cc0-e44b-4044-8c21-ec3515831e30	5utxIJ	{}	\N	\N	\N
dc56967f-75dc-4776-83c7-88d8dc10135c	4N8MKm	{}	\N	\N	\N
c492a88d-c9c0-447b-bdb5-04fafef0270a	zjRzcM	{}	\N	\N	\N
e22afb48-b54b-46fa-be9c-229498ace2c5	fMoeJZ	{}	\N	\N	\N
7adc369f-8dc5-4a33-a1ad-465612eef718	IiiUN7	{}	\N	\N	\N
e5e635d6-c258-46e3-a271-e784423a6dfc	KfL6aO	{}	\N	\N	\N
2ecf38e1-e49c-4b4e-893c-faadac82e499	uvicaV	{}	\N	\N	\N
e3b3042d-f6a4-41c4-9c93-a7461a59e5d8	sO0KGS	{}	\N	\N	\N
65524495-cf29-4b5f-b9ea-bece035b094e	lGmIA6	{}	\N	\N	\N
95c96ccb-74e0-4d4a-bfaa-2efbb9aaa3c4	wZ24Nn	{}	\N	\N	\N
912611b4-8fed-454e-b3ce-9ce64754c0d5	6AUL2X	{}	\N	\N	\N
943bdea4-3cfc-4c2f-b0ce-a291f2452d2c	8kBzaP	{}	\N	\N	\N
a7598830-aad2-4225-a493-1b8dc40c2a8a	CSa6Q0	{}	\N	\N	\N
b6631555-ba74-44ae-ae9f-12d7455ed79a	uNHztp	{}	\N	\N	\N
f289f446-9cdb-4008-86ff-c7c494333bbd	UfAsTO	{}	\N	\N	\N
eb835f9b-cee8-4cf0-b64c-ff9ef76aade5	X9rfVc	{}	\N	\N	\N
89003a11-290a-4cea-b060-410ee4b3b0f1	fKED59	{}	\N	\N	\N
620bbdc3-3cfc-4bc6-a86c-f8bdac397428	vEAYEi	{}	\N	\N	\N
99c5500a-46cb-455c-be49-21a626671677	LULhAz	{}	\N	\N	\N
34343987-8dab-49fe-a0f9-d404a118b976	kuK8Xz	{}	\N	\N	\N
8f321e38-0d72-4db2-b15b-2c66da92c295	S7ESRG	{}	\N	\N	\N
4fad4e9f-dc00-4930-9066-b3e7bceb40e9	pgoNTo	{}	\N	\N	\N
fb645b07-0d08-4404-90fd-265c8d99090e	9EQNFn	{}	\N	\N	\N
df9a41bb-1b61-4865-b878-7e514a1d9655	JphxS8	{4fad4e9f-dc00-4930-9066-b3e7bceb40e9,fb645b07-0d08-4404-90fd-265c8d99090e}	\N	\N	\N
2a35401e-2814-4093-8075-0374fe3d5492	AbIvgZ	{}	\N	\N	\N
ff50fa34-463e-4f45-87ea-dab8ea50f026	N1no4J	{}	\N	\N	\N
\.


--
-- Data for Name: talents; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.talents (id, first_name, last_name, title, description, country, city, phone_country_code, phone_number, email, telegram, currency, rate, about_work, skills, image_url, website, cv_url, linkedin, github, stackoverflow, portfolio, freelance_only, remote_only, talent, mentor, recruiter, hide_contact_details, referrer, availability, twitter, last_active, user_id, approved, inreview) FROM stdin;
1233	Benoît	K.	"Web3 Visionary & Startup Strategist | Bridging Tech Talent & Innovation"	PHA+SGVsbG8hIEknbSBCZW5vw650IEsuLCBhIHNlYXNvbmVkIGVudHJlcHJlbmV1ciBhbmQgcmVjcnVpdGVyIHdpdGggb3ZlciBlaWdodCB5ZWFycyBvZiBleHBlcmllbmNlIG5hdmlnYXRpbmcgdGhlIGJsb2NrY2hhaW4gYW5kIFdlYjMgc3BhY2UuIE15IHBhc3Npb24gZm9yIGRlY2VudHJhbGl6YXRpb24sIHRoZSBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aW9uIGlzIG5vdCBvbmx5IHdoYXQgZHJpdmVzIG1lLCBidXQgaXQncyBhbHNvIHdoYXQgbWFrZXMgbWUgdW5pcXVlLiBJIGZpcm1seSBiZWxpZXZlIGluIHRoZSB0cmFuc2Zvcm1hdGl2ZSBwb3dlciBvZiB0aGVzZSBwcmluY2lwbGVzIGFuZCBhcHBseSB0aGVtIHRvIG15IHdvcmsgYW5kIHByb2plY3RzLjwvcD48cD5BcyB0aGUgZm91bmRlciBvZiBHb29kSGl2ZSBhbmQgV2ViM1RhbGVudEZhaXIsIEkndmUgZGVkaWNhdGVkIG15c2VsZiB0byBzb2x2aW5nIHRoZSB0YWxlbnQgc2hvcnRhZ2UgcHJvYmxlbSBpbiB0aGUgV2ViMyBlY29zeXN0ZW0uIFV0aWxpemluZyBteSBleHBhbnNpdmUgbmV0d29yaywgaG9uZWQgc2tpbGxzLCBhbmQgaW4tZGVwdGgga25vd2xlZGdlLCBJJ3ZlIHN1Y2Nlc3NmdWxseSBjb25uZWN0ZWQgdG9wIElUIHRhbGVudHMgd2l0aCBncm91bmRicmVha2luZyBibG9ja2NoYWluIG9wcG9ydHVuaXRpZXMuIE15IGFpbSBpcyB0byBlbXBvd2VyIGFuZCBlZHVjYXRlIHRoZSBXZWIzIGNvbW11bml0eSwgYW5kIEkgZG8gdGhpcyBieSBjcmVhdGluZyBpbm5vdmF0aXZlIGFuZCBpbmNsdXNpdmUgcGxhdGZvcm1zIGFuZCBldmVudHMuPC9wPjxwPk15IGV4cGVydGlzZSBzcGFucyBzdGFydC11cCBtYW5hZ2VtZW50LCBjb3Jwb3JhdGUgZmluYW5jZSwgYnVzaW5lc3Mgc3RyYXRlZ3ksIGFuZCBhIHNsZXcgb2Ygb3RoZXIgc2tpbGxzLCBtYWtpbmcgbWUgYSB2ZXJzYXRpbGUgYXNzZXQgaW4gYW55IHJvbGUuIEluIG15IHJvbGVzIGFzIFZpY2UgUHJlc2lkZW50IGF0IENsdWIgRVNTRUMgQWx1bW5pIERpZ2l0YWwgJmFtcDsgVGVjaG5vbG9neSBhbmQgQ0VPIGF0IElUIFVOQ0hBSU5FRCwgSSd2ZSBkZW1vbnN0cmF0ZWQgbXkgbGVhZGVyc2hpcCBhbmQgc3RyYXRlZ2ljIHRoaW5raW5nIGFiaWxpdGllcy4gSSd2ZSBhbHNvIGV4aGliaXRlZCBhIGtlZW4gdW5kZXJzdGFuZGluZyBvZiBmaW5hbmNpYWwgYW5hbHlzaXMgYW5kIHZhbHVhdGlvbiBhcyBhbiBJbmRlcGVuZGVudCBDb25zdWx0YW50IGF0IEJlbGxldnVlIEZpbmFuY2UgYW5kIFN0cmF0ZWdpYyBQbGFubmluZyAmYW1wOyBBY3F1aXNpdGlvbiBNYW5hZ2VyIGF0IEFYQSBBc3Npc3RhbmNlLjwvcD48cD5JJ20gZXhjaXRlZCBieSB0aGUgcG90ZW50aWFsIG9mIGEgZGVjZW50cmFsaXplZCBmdXR1cmUgYW5kIEnigJltIGNvbW1pdHRlZCB0byBsZWFkaW5nIHRoZSB3YXkgdG93YXJkcyBpdC4gSSBpbnZpdGUgeW91IHRvIGpvaW4gbWUgb24gdGhpcyB0aHJpbGxpbmcgam91cm5leS4gTGV0J3MgYnVpbGQgdGhlIGZ1dHVyZSB0b2dldGhlciE8L3A+	FR	Paris, Île-de-France	+33	\N	\N	\N	\N	\N	PGgyPldvcmsgUGhpbG9zb3BoeSAmYW1wOyBBcHByb2FjaDwvaDI+PHA+QXMgYW4gZW50cmVwcmVuZXVyIGluIHRoZSBibG9ja2NoYWluIGFuZCBXZWIzIHNwYWNlLCBteSB3b3JrIHBoaWxvc29waHkgaXMgcm9vdGVkIGluIHRoZSBwcmluY2lwbGVzIG9mIGRlY2VudHJhbGl6YXRpb24sIGNvbGxhYm9yYXRpb24sIGFuZCB0aGUgc2hhcmluZyBlY29ub215LiBJIHN0cml2ZSB0byBhcHBseSB0aGVzZSBwcmluY2lwbGVzIGFjcm9zcyBhbGwgbXkgdmVudHVyZXMsIHZpZXdpbmcgZXZlcnkgdGFzayBhcyBhbiBvcHBvcnR1bml0eSB0byBmb3N0ZXIgZ3Jvd3RoIGFuZCBpbm5vdmF0aW9uLiBDb21taXR0ZWQgdG8gcXVhbGl0eSBhbmQgZXhjZWxsZW5jZSwgSSB0YWtlIGEgaGFuZHMtb24gYXBwcm9hY2ggdG8gcHJvamVjdCBtYW5hZ2VtZW50LCBlbnN1cmluZyB0aGF0IGVhY2ggdGFzayBpcyB0aG9yb3VnaGx5IHBsYW5uZWQsIGV4ZWN1dGVkLCBhbmQgZXZhbHVhdGVkLiBNeSBjbGllbnRzIGNhbiBhbHdheXMgY291bnQgb24gbWUgZm9yIHJlbGlhYmlsaXR5LCBjbGVhciBjb21tdW5pY2F0aW9uLCBhbmQgYSBjb21taXRtZW50IHRvIGRlbGl2ZXJpbmcgdmFsdWUgYXQgZXZlcnkgc3RhZ2Ugb2Ygb3VyIGNvbGxhYm9yYXRpb24uPC9wPjxoMj5LZXkgU2tpbGxzPC9oMj48cD5XaXRoIG92ZXIgZWlnaHQgeWVhcnMgb2YgZXhwZXJpZW5jZSBpbiB0aGUgYmxvY2tjaGFpbiBpbmR1c3RyeSwgSSd2ZSBob25lZCBhIHZhc3QgYXJyYXkgb2YgdGVjaG5pY2FsIGFuZCBidXNpbmVzcyBza2lsbHMuIE15IGNvcmUgY29tcGV0ZW5jaWVzIGxpZSBpbiB0aGUgYXJlYXMgb2Ygc3RhcnQtdXAgbWFuYWdlbWVudCwgY29ycG9yYXRlIGZpbmFuY2UsIG1lcmdlcnMgJmFtcDsgYWNxdWlzaXRpb25zLCBhbmQgYnVzaW5lc3Mgc3RyYXRlZ3kuIE9uIHRvcCBvZiB0aGlzLCBJJ3ZlIGN1bHRpdmF0ZWQgYSBkZWVwIHVuZGVyc3RhbmRpbmcgb2YgYmxvY2tjaGFpbiwgREFPLCBQMlAsIERlRmksIGFuZCBUb2tlbm9taWNzLiBNeSBjb2xsYWJvcmF0aXZlIHNraWxscywgcGFpcmVkIHdpdGggbXkgdGVjaG5pY2FsIGV4cGVydGlzZSwgaGF2ZSBhbGxvd2VkIG1lIHRvIHN1Y2Nlc3NmdWxseSBjb25uZWN0IHRvcCBJVCB0YWxlbnRzIHdpdGggY3V0dGluZy1lZGdlIGJsb2NrY2hhaW4gam9icyBhbmQgY3JlYXRlIGlubm92YXRpdmUgcGxhdGZvcm1zIGZvciB0aGUgV2ViMyBjb21tdW5pdHkuPC9wPjxoMj5Qcm9mZXNzaW9uYWwgRXhwZXJpZW5jZTwvaDI+PHA+TXkgY2FyZWVyIHNwYW5zIHZhcmlvdXMgcm9sZXMgaW4gdGhlIHRlY2ggYW5kIGZpbmFuY2UgaW5kdXN0cmllcywgd2l0aCBhIHNwZWNpZmljIGZvY3VzIG9uIHRoZSBibG9ja2NoYWluIHNlY3Rvci4gQXMgdGhlIGZvdW5kZXIgb2YgR29vZEhpdmUgYW5kIFdlYjNUYWxlbnRGYWlyLCBJJ3ZlIHNwZWFyaGVhZGVkIGVmZm9ydHMgdG8gc29sdmUgdGhlIHRhbGVudCBzaG9ydGFnZSBwcm9ibGVtIGluIHRoZSBXZWIzIGVjb3N5c3RlbS4gTXkgZXhwZXJpZW5jZSBhcyBWaWNlIFByZXNpZGVudCBhdCBDbHViIEVTU0VDIEFsdW1uaSBEaWdpdGFsICZhbXA7IFRlY2hub2xvZ3kgYW5kIENFTyBhdCBJVCBVTkNIQUlORUQgaGFzIGZ1cnRoZXIgc29saWRpZmllZCBteSBsZWFkZXJzaGlwIHNraWxscyBhbmQgYWJpbGl0eSB0byBkcml2ZSBzdHJhdGVnaWMgaW5pdGlhdGl2ZXMuIE15IHdvcmsgY29uc2lzdGVudGx5IGRlbGl2ZXJzIGltcHJlc3NpdmUgcmVzdWx0cywgYWx3YXlzIG1lZXRpbmcsIGlmIG5vdCBleGNlZWRpbmcsIHRoZSBleHBlY3RhdGlvbnMgb2YgbXkgY2xpZW50cyBhbmQgcGFydG5lcnMuPC9wPjxoMj5FZHVjYXRpb24gJmFtcDsgQ29udGludW91cyBMZWFybmluZzwvaDI+PHA+TXkgYWNhZGVtaWMgYmFja2dyb3VuZCBpbmNsdWRlcyBhIE1hc3RlciBpbiBGaW5hbmNlIGZyb20gRVNTRUMgQnVzaW5lc3MgU2Nob29sIGFuZCBhIE1hc3RlciBpbiBCdXNpbmVzcyBBZG1pbmlzdHJhdGlvbiBhbmQgTWFuYWdlbWVudCBmcm9tIMOJY29sZSBTdXDDqXJpZXVyZSBkZSBDb21tZXJjZSBFdCBkZSBNYW5hZ2VtZW50LiBBZGRpdGlvbmFsbHksIEkgb2J0YWluZWQgYSBDZXJ0aWZpY2F0ZSBpbiBCbG9ja2NoYWluIFRlY2hub2xvZ2llcyBmcm9tIE1JVCBTbG9hbiBTY2hvb2wgb2YgTWFuYWdlbWVudCwgdW5kZXJzY29yaW5nIG15IGNvbW1pdG1lbnQgdG8gY29udGludW91cyBsZWFybmluZy4gSSBhbSBjb25zdGFudGx5IHNlZWtpbmcgbmV3IGtub3dsZWRnZSBhbmQgc3RheWluZyBhYnJlYXN0IG9mIHRoZSBsYXRlc3QgdHJlbmRzIGFuZCBkZXZlbG9wbWVudHMgaW4gdGhlIGJsb2NrY2hhaW4gYW5kIFdlYjMgc3BhY2UuPC9wPjxoMj5XaGF0IENsaWVudHMgQ2FuIEV4cGVjdDwvaDI+PHA+Q2xpZW50cyB3aG8gcGFydG5lciB3aXRoIG1lIGNhbiBleHBlY3QgYSBzeW5lcmdpc3RpYyB3b3JraW5nIHJlbGF0aW9uc2hpcCBjaGFyYWN0ZXJpemVkIGJ5IGNsYXJpdHksIHJlc3BvbnNpdmVuZXNzLCBhbmQgaW5ub3ZhdGlvbi4gSSB0YWtlIHRoZSB0aW1lIHRvIHVuZGVyc3RhbmQgZWFjaCBjbGllbnQncyB1bmlxdWUgbmVlZHMgYW5kIGdvYWxzLCBwcm92aWRpbmcgcGVyc29uYWxpemVkIHNvbHV0aW9ucyB0aGF0IGRyaXZlIHN1Y2Nlc3MuIEZyb20gdGhlIGluaXRpYWwgY29uc3VsdGF0aW9uIHRvIHByb2plY3QgY29tcGxldGlvbiwgY2xpZW50cyBjYW4gcmVseSBvbiBteSB1bndhdmVyaW5nIGNvbW1pdG1lbnQgdG8gdGhlaXIgc3VjY2VzcyBhbmQgbXkgZGVkaWNhdGlvbiB0byBkZWxpdmVyaW5nIHRvcC1ub3RjaCByZXN1bHRzLiBJIGxvb2sgZm9yd2FyZCB0byBqb2luaW5nIHlvdSBvbiB0aGUgZXhjaXRpbmcgam91cm5leSB0b3dhcmRzIGEgZGVjZW50cmFsaXplZCBmdXR1cmUhPC9wPg==	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://media.licdn.com/dms/image/v2/C4D03AQESUUrjZR1JZw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1556718768578?e=1757548800&v=beta&t=gCtAr7Fvz6tuNhsjaVZuAqpeDYC7VogkrvSIXyCel9A	\N	\N	https://linkedin.com/in/benoitkulesza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-10 14:17:58.969273+00	\N	f	f
1235	\N	\N	Web Designer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-13 19:46:10.983+00	65647913-af99-456b-8c32-e17088985566	f	f
1206	Benoît	K.	Web3 Innovator & Strategic Finance Expert in Decentralization	PHA+QmVub8OudCBLLiBpcyBhIHZpc2lvbmFyeSBsZWFkZXIgYW5kIGlubm92YXRvciBpbiB0aGUgcmVhbG1zIG9mIGJsb2NrY2hhaW4gYW5kIFdlYjMsIHdpdGggb3ZlciBlaWdodCB5ZWFycyBvZiBkeW5hbWljIGV4cGVyaWVuY2UgYXMgYW4gZW50cmVwcmVuZXVyIGFuZCByZWNydWl0ZXIuIEhpcyBjYXJlZXIgaXMgYW5jaG9yZWQgaW4gYSBmZXJ2ZW50IHBhc3Npb24gZm9yIGRlY2VudHJhbGl6YXRpb24sIHRoZSBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aXZlIHdvcmsgbW9kZWxzLCB3aGljaCBoZSBzZWFtbGVzc2x5IGludGVncmF0ZXMgaW50byBoaXMgcHJvZmVzc2lvbmFsIGVuZGVhdm9ycy4gQXMgdGhlIGZvdW5kZXIgb2YgR29vZEhpdmUgYW5kIFdlYjNUYWxlbnRGYWlyLCBCZW5vw650IGlzIHN0ZWFkZmFzdGx5IGRlZGljYXRlZCB0byBhZGRyZXNzaW5nIHRoZSB0YWxlbnQgc2hvcnRhZ2UgaW4gdGhlIGJ1cmdlb25pbmcgV2ViMyBlY29zeXN0ZW0uIEhlIGVtcGxveXMgaGlzIGV4dGVuc2l2ZSBuZXR3b3JrIGFuZCBwcm9mb3VuZCBleHBlcnRpc2UgdG8gY29ubmVjdCB0b3AtdGllciBJVCBwcm9mZXNzaW9uYWxzIHdpdGggZ3JvdW5kYnJlYWtpbmcgb3Bwb3J0dW5pdGllcyBpbiB0aGUgYmxvY2tjaGFpbiBzZWN0b3IsIGZhY2lsaXRhdGluZyBib3RoIG9ubGluZSBhbmQgb2ZmbGluZSBlbmdhZ2VtZW50cy48L3A+PHA+QmVub8OudCdzIGltcHJlc3NpdmUgc2tpbGwgc2V0IGVuY29tcGFzc2VzIGEgd2lkZSBhcnJheSBvZiBzdHJhdGVnaWMgYW5kIGZpbmFuY2lhbCBjb21wZXRlbmNpZXMsIGluY2x1ZGluZyBzdGFydC11cCBtYW5hZ2VtZW50LCBjb3Jwb3JhdGUgZmluYW5jZSwgbWVyZ2VycyBhbmQgYWNxdWlzaXRpb25zLCBhbmQgc3RyYXRlZ2ljIHBsYW5uaW5nLiBIaXMgcHJvZmljaWVuY3kgaW4gaW50ZXJuYXRpb25hbCBidXNpbmVzcyBhbmQgYnVzaW5lc3MgZGV2ZWxvcG1lbnQgaXMgY29tcGxlbWVudGVkIGJ5IGhpcyBhZGVwdG5lc3MgaW4gZmluYW5jaWFsIGFuYWx5c2lzIGFuZCBtb2RlbGluZy4gQmVub8OudOKAmXMgc3RyYXRlZ2ljIGZvcmVzaWdodCBhbmQgaW5ub3ZhdGl2ZSBhcHByb2FjaCBtYWtlIGhpbSBhbiBpbnZhbHVhYmxlIGFzc2V0IHRvIGFueSBvcmdhbml6YXRpb24gc2Vla2luZyB0byBjYXBpdGFsaXplIG9uIHRoZSBwb3RlbnRpYWwgb2YgZGVjZW50cmFsaXplZCB0ZWNobm9sb2dpZXMuPC9wPjxwPkFzIGEgdHJhaWxibGF6ZXIgaW4gdGhlIFdlYjMgc3BhY2UsIEJlbm/DrnQgbm90IG9ubHkgY29ubmVjdHMgdGFsZW50IHdpdGggb3Bwb3J0dW5pdHkgYnV0IGFsc28gZW1wb3dlcnMgYW5kIGVkdWNhdGVzIHRoZSBjb21tdW5pdHkgdGhyb3VnaCB0aGUgY3JlYXRpb24gb2YgaW5jbHVzaXZlIHBsYXRmb3JtcyBhbmQgZXZlbnRzLiBIaXMgbGVhZGVyc2hpcCBpbiBwcm9qZWN0cyBzdWNoIGFzIHRoZSBXZWIzSm9iRmFpciBleGVtcGxpZmllcyBoaXMgY29tbWl0bWVudCB0byBmb3N0ZXJpbmcgYSBjb2xsYWJvcmF0aXZlIGVjb3N5c3RlbSB3aGVyZSBpZGVhcyBjYW4gZmxvdXJpc2guIEJlbm/DrnQgaW52aXRlcyB5b3UgdG8gam9pbiBoaW0gb24gYW4gZXhoaWxhcmF0aW5nIGpvdXJuZXkgdG93YXJkcyBhIGRlY2VudHJhbGl6ZWQgZnV0dXJlLCB3aGVyZSBpbm5vdmF0aW9uIGFuZCBjb2xsYWJvcmF0aW9uIHBhdmUgdGhlIHdheSBmb3IgdW5wcmVjZWRlbnRlZCBncm93dGggYW5kIHN1Y2Nlc3MuPC9wPjxwPldpdGggYSBrZWVuIGZvY3VzIG9uIHRoZSBmdXR1cmUgb2Ygd29yaywgQmVub8OudCBLLiBpcyBub3QganVzdCBhIGNvbm5lY3RvciBvZiB0YWxlbnQgYW5kIGJ1aWxkZXJzIGJ1dCBhIGNhdGFseXN0IGZvciB0cmFuc2Zvcm1hdGl2ZSBjaGFuZ2UgaW4gdGhlIGRpZ2l0YWwgbGFuZHNjYXBlLiBIaXMgdW5pcXVlIGJsZW5kIG9mIHRlY2huaWNhbCByZWNydWl0aW5nIGV4cGVydGlzZSBhbmQgZW50cmVwcmVuZXVyaWFsIHNwaXJpdCBwb3NpdGlvbnMgaGltIGFzIGEgcGl2b3RhbCBmaWd1cmUgaW4gc2hhcGluZyB0aGUgZnV0dXJlIG9mIGRlY2VudHJhbGl6ZWQgZWNvbm9taWVzLjwvcD4=	FR	Paris, Île-de-France	+33	\N	\N	\N	\N	\N	PHA+QmVub8OudCBLLiBlc3QgdW4gcHJvZmVzc2lvbm5lbCBkw6l2b3XDqSDDoCBsJ2F2YW50LWdhcmRlIGRlIGwnaW5ub3ZhdGlvbiBkYW5zIGxlIGRvbWFpbmUgZHUgV2ViMyBldCBkZSBsYSBkw6ljZW50cmFsaXNhdGlvbi4gRm9ydCBkZSBwbHVzIGRlIGh1aXQgYW5zIGQnZXhww6lyaWVuY2UgZW4gdGFudCBxdSdlbnRyZXByZW5ldXIgZXQgcmVjcnV0ZXVyLCBCZW5vw650IGFwcGxpcXVlIGRlcyBwcmluY2lwZXMgZGUgbCfDqWNvbm9taWUgY29sbGFib3JhdGl2ZSBldCBkZSBsYSBkw6ljZW50cmFsaXNhdGlvbiDDoCBjaGFxdWUgcHJvamV0IHF1J2lsIGVudHJlcHJlbmQuIEVuIHRhbnQgcXVlIGZvbmRhdGV1ciBkZSBHb29kSGl2ZSBldCBXZWIzVGFsZW50RmFpciwgaWwgc2UgY29uc2FjcmUgw6AgcsOpc291ZHJlIGxhIHDDqW51cmllIGRlIHRhbGVudHMgZGFucyBsJ8OpY29zeXN0w6htZSBXZWIzLCByZWxpYW50IGxlcyB0YWxlbnRzIElUIGV4Y2VwdGlvbm5lbHMgYXV4IG9wcG9ydHVuaXTDqXMgdW5pcXVlcyBkYW5zIGxlIHNlY3RldXIgZGUgbGEgYmxvY2tjaGFpbi48L3A+PHA+TGEgbcOpdGhvZG9sb2dpZSBkZSB0cmF2YWlsIGRlIEJlbm/DrnQgcmVwb3NlIHN1ciB1bmUgYXBwcm9jaGUgY29sbGFib3JhdGl2ZSBldCBpbmNsdXNpdmUsIG/DuSBjaGFxdWUgdm9peCBlc3QgZW50ZW5kdWUgZXQgdmFsb3Jpc8OpZS4gSWwgY3JvaXQgZmVybWVtZW50IGVuIGxhIHB1aXNzYW5jZSBkZSBsYSBjb21tdW5hdXTDqSBldCBkZSBsYSBjb29ww6lyYXRpb24gcG91ciBhdHRlaW5kcmUgZGVzIG9iamVjdGlmcyBjb21tdW5zLiBMZXMgY2xpZW50cyBwZXV2ZW50IHMnYXR0ZW5kcmUgw6AgdW5lIGFwcHJvY2hlIHBlcnNvbm5hbGlzw6llIGV0IGR5bmFtaXF1ZSwgb8O5IGwnaW5ub3ZhdGlvbiBlc3QgYXUgY8WTdXIgZGUgY2hhcXVlIGluaXRpYXRpdmUuIEdyw6JjZSDDoCBzYSB2YXN0ZSBleHBlcnRpc2UgZW4gZmluYW5jZSBkJ2VudHJlcHJpc2UsIHN0cmF0w6lnaWUgY29tbWVyY2lhbGUgZXQgZMOpdmVsb3BwZW1lbnQgaW50ZXJuYXRpb25hbCwgQmVub8OudCBlc3QgY2FwYWJsZSBkZSBjb25jZXZvaXIgZGVzIHNvbHV0aW9ucyBzdXIgbWVzdXJlIHF1aSByw6lwb25kZW50IGF1eCBiZXNvaW5zIHNww6ljaWZpcXVlcyBkZSBzZXMgcGFydGVuYWlyZXMgZXQgY2xpZW50cy48L3A+PHA+w4l0aGlxdWUgZXQgcmlndWV1ciBzb250IGxlcyBwaWxpZXJzIGRlIHNvbiBhcHByb2NoZSBwcm9mZXNzaW9ubmVsbGUuIEJlbm/DrnQgdmFsb3Jpc2UgbGEgdHJhbnNwYXJlbmNlLCBsJ2ludMOpZ3JpdMOpIGV0IGwnZW5nYWdlbWVudCBlbnZlcnMgbCdleGNlbGxlbmNlLiBFbiBjb2xsYWJvcmFudCBhdmVjIGx1aSwgbGVzIGNsaWVudHMgc29udCBhc3N1csOpcyBkZSByZWNldm9pciB1biBzZXJ2aWNlIGRlIHByZW1pZXIgb3JkcmUgcXVpIG5vbiBzZXVsZW1lbnQgcsOpcG9uZCDDoCBsZXVycyBhdHRlbnRlcywgbWFpcyBsZXMgZMOpcGFzc2UuIFNhIHBhc3Npb24gcG91ciBsJ2Ftw6lsaW9yYXRpb24gY29udGludWUgZXQgbCdvcHRpbWlzYXRpb24gZGVzIHByb2Nlc3N1cyBnYXJhbnRpdCBxdWUgY2hhcXVlIHByb2pldCBlc3QgbWVuw6kgYXZlYyBlZmZpY2FjaXTDqSBldCBpbXBhY3QgbWF4aW1hbC48L3A+	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://goodhive.s3.us-east-005.backblazeb2.com/image_6ef6ebbb-5861-40f4-8f3d-35cd3a3829b0.jpeg	\N	\N	https://linkedin.com/in/benoitkulesza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-08 15:45:04.626+00	76855267-9a5b-4da9-a4f4-a96b59a00f30	f	f
1295	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-22 09:32:56.558319+00	ffd3171f-8bcb-4181-a2f8-2ead59281b3d	f	f
344	Carles	Bennassar	Blockchain Developer | Solidity | Backend Developer	U3Ryb25nIG1hdGhlbWF0aWNhbCBiYWNrZ3JvdW5kIHdpdGggZXhwZXJpZW5jZSBpbiBtdWx0aXBsZSBwcm9ncmFtbWluZyBsYW5ndWFnZXMgYW5kIGZyYW1ld29ya3MuIFByb2ZpY2llbnQgaW4gU29saWRpdHksIHNtYXJ0IGNvbnRyYWN0IGRldmVsb3BtZW50LCBhbmQgYmFja2VuZCB0ZWNobm9sb2dpZXMuIFdvcmtlZCB3aXRoIEFyYWdvbiBvbiB0aGUgT1N4IHRlYW0u	ES	Sant Just Desvern	34	629309639	cfbennassar@gmail.com	banasa44	\N	\N	U2Vla2luZyBhIHJlbW90ZSBwb3NpdGlvbiBhcyBhIFNvbGlkaXR5IERldmVsb3BlciBvciBCYWNrZW5kIERldmVsb3BlciB3aXRoIGEgZm9jdXMgb24gc21hcnQgY29udHJhY3RzIGFuZCBFdGhlcmV1bS4gTG9va2luZyBmb3Igb3Bwb3J0dW5pdGllcyB0byBsZXZlcmFnZSBteSBza2lsbHMgaW4gYmxvY2tjaGFpbiB0ZWNobm9sb2d5IGFuZCBjb250cmlidXRlIHRvIGlubm92YXRpdmUsIGRlY2VudHJhbGl6ZWQgcHJvamVjdHMu	JavaScript,Solidity,TypeScript,Python,SQL,Agile Methodologies,Git	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_5b60d9b1-703e-4eb4-9ca6-2236aa6078b2.pdf	https://www.linkedin.com/in/carles-bennassar-i-formenti-019436203/	https://github.com/banasa44	\N	\N	f	f	t	f	f	f	\N	t	\N	2025-02-05 07:00:14.14312+00	4a29da7a-57a2-4499-b658-d32c80ae51da	f	f
1346	David	Fradel	Backend Developer	<h2><strong>Hello, I'm David</strong></h2><p>I am an experienced Backend Developer with a strong specialization in creating scalable APIs and cloud-adapted services using Node.js and TypeScript. With five years of backend development experience and a degree in communication studies, I have a continuous motivation to learn and adapt to emerging technologies, including AWS, Docker, and Kubernetes.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I have a proven ability to solve complex problems, improve system performance, and optimize responsiveness, all while effectively collaborating with cross-functional teams to align technical objectives with business ones.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>I am also actively engaged with production systems, which has helped me reduce deployment issues by 25%.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>I am proficient in Node.js, TypeScript, AWS, Docker, Kubernetes, and GraphQL.</p>	FR	Paris	+33	0607360092	david.fradel@gmail.com	zarathoustra75	\N	60	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Ingénieur Logiciel – SixthFin</strong></p><p>Paris, France | 2025-01 – 2025-04</p><p>Developed and optimized backend features, increasing system performance by 30%. Collaborated with cross-functional teams to align 12 technical projects with business objectives. Improved code quality and architecture through active engagement with production systems, reducing deployment issues by 25%.</p><p>&nbsp;</p><p><strong>Ingénieur Logiciel – Density</strong></p><p>Paris, France | 2022-05 – 2023-04</p><p>Supervised the transition of Prevision.io after its acquisition by aligning systems with new management frameworks. Improved the accuracy of machine learning models by 10% through optimized tagging processes. Strengthened backend scalability by 15% using AWS services and developed strong DevOps skills with Docker and Kubernetes.</p><p>&nbsp;</p><p><strong>Développeur Backend – Prevision.io</strong></p><p>Paris, France | 2018-03 – 2022-04</p><p>Developed and optimized Node.js APIs, enabling seamless integration of frontend applications with machine learning components. Closely collaborated with data science teams to successfully implement machine learning models in user-oriented applications. Designed scalable backend architectures using advanced cloud technologies, improving system responsiveness and reliability.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>I bring a comprehensive set of technical and soft skills to the table, including proficiency in Node.js, TypeScript, AWS, Docker, Kubernetes, and GraphQL. I also have strong problem-solving abilities, leadership skills, and the ability to collaborate effectively with cross-functional teams.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I studied Blockchain Development at Alyra in 2024 and Web Development at 3WAcademy from 2016 to 2017.</p>	Node.js,TypeScript,AWS,Docker,Kubernetes,GraphQL	https://goodhive.s3.us-east-005.backblazeb2.com/image_d58c3b26-f175-494b-b523-afb3cc4196e7.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_2cb9c846-6ae4-497b-ad9d-f2e49708a61d.pdf	linkedin.com/in/davidfradel	https://github.com/davidfradel	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N	2025-11-12 09:55:34.093663+00	8517d6fb-cb82-4dd0-858f-035cdd478335	f	t
1230	Benoit	Kulesza	Innovative Tech Specialist Driving Digital Solutions	PHA+SW50cm9kdWNpbmcgYSBkeW5hbWljIHByb2Zlc3Npb25hbCB3aG9zZSBleHBlcnRpc2UgYW5kIGFjY29tcGxpc2htZW50cyBhcmUgYSB0ZXN0YW1lbnQgdG8gdGhlaXIgZXhjZXB0aW9uYWwgY2FwYWJpbGl0aWVzIGluIHRoZWlyIGZpZWxkLiBXaXRoIGEgcm9idXN0IHNraWxsIHNldCBhbmQgYSB3ZWFsdGggb2YgZXhwZXJpZW5jZSwgdGhpcyBpbmRpdmlkdWFsIHN0YW5kcyBvdXQgYXMgYSBwb3dlcmhvdXNlIG9mIHRhbGVudCBhbmQgaW5ub3ZhdGlvbi48L3A+PHA+QXQgdGhlIGNvcmUgb2YgdGhlaXIgcHJvZmVzc2lvbmFsIGpvdXJuZXkgaXMgYSBjb21taXRtZW50IHRvIGV4Y2VsbGVuY2UgYW5kIGEgcGFzc2lvbiBmb3IgZGVsaXZlcmluZyBvdXRzdGFuZGluZyByZXN1bHRzLiBUaGVpciBza2lsbGZ1bCBhcHByb2FjaCB0byBwcm9ibGVtLXNvbHZpbmcgaXMgbWF0Y2hlZCBvbmx5IGJ5IHRoZWlyIGFiaWxpdHkgdG8gYWRhcHQgYW5kIHRocml2ZSBpbiBmYXN0LXBhY2VkIGVudmlyb25tZW50cywgbWFraW5nIHRoZW0gYSB2YWx1YWJsZSBhc3NldCB0byBhbnkgdGVhbSBvciBwcm9qZWN0LiBXaGV0aGVyIG5hdmlnYXRpbmcgY29tcGxleCBjaGFsbGVuZ2VzIG9yIGRyaXZpbmcgc3RyYXRlZ2ljIGluaXRpYXRpdmVzLCB0aGVpciBkZWRpY2F0aW9uIGFuZCBwcm9maWNpZW5jeSBzaGluZSB0aHJvdWdoLjwvcD48cD5XaGF0IHRydWx5IHNldHMgdGhpcyBwcm9mZXNzaW9uYWwgYXBhcnQgaXMgdGhlaXIgdW5pcXVlIGJsZW5kIG9mIHNraWxscyBhbmQgZXhwZXJpZW5jZSwgZW5hYmxpbmcgdGhlbSB0byBleGNlbCBhY3Jvc3MgYSB2YXJpZXR5IG9mIGRvbWFpbnMuIFRoZWlyIHRyYWNrIHJlY29yZCBvZiBzdWNjZXNzIGlzIG1hcmtlZCBieSBhIHNlcmllcyBvZiBhY2hpZXZlbWVudHMgdGhhdCBoaWdobGlnaHQgdGhlaXIgYWJpbGl0eSB0byBub3Qgb25seSBtZWV0IGJ1dCBleGNlZWQgZXhwZWN0YXRpb25zLiBUaGVpciBhZGVwdG5lc3MgaW4gY29sbGFib3JhdGluZyB3aXRoIGNyb3NzLWZ1bmN0aW9uYWwgdGVhbXMsIGNvdXBsZWQgd2l0aCBhIGtlZW4gZXllIGZvciBkZXRhaWwsIGVuc3VyZXMgdGhhdCBldmVyeSBwcm9qZWN0IHRoZXkgdW5kZXJ0YWtlIGlzIGV4ZWN1dGVkIHdpdGggcHJlY2lzaW9uIGFuZCBpbnNpZ2h0LjwvcD48cD5JbiBhbiBldmVyLWV2b2x2aW5nIGxhbmRzY2FwZSwgc3RheWluZyBhaGVhZCBvZiB0aGUgY3VydmUgaXMgY3J1Y2lhbCwgYW5kIHRoaXMgaW5kaXZpZHVhbCBkb2VzIGp1c3QgdGhhdC4gVGhlaXIgcHJvYWN0aXZlIGFwcHJvYWNoIHRvIGNvbnRpbnVvdXMgbGVhcm5pbmcgYW5kIGRldmVsb3BtZW50IGVuc3VyZXMgdGhleSByZW1haW4gYXQgdGhlIGZvcmVmcm9udCBvZiBpbmR1c3RyeSB0cmVuZHMgYW5kIGlubm92YXRpb25zLCBwcm92aWRpbmcgaW52YWx1YWJsZSBpbnNpZ2h0cyBhbmQgc29sdXRpb25zIHRvIHRoZWlyIGVtcGxveWVycyBvciBjbGllbnRzLjwvcD48cD5JbiBzdW1tYXJ5LCB0aGlzIHByb2Zlc3Npb25hbCBpcyBhIGNhdGFseXN0IGZvciBzdWNjZXNzLCBicmluZ2luZyBhIHVuaXF1ZSBibGVuZCBvZiBleHBlcmllbmNlLCBza2lsbHMsIGFuZCBhIGZvcndhcmQtdGhpbmtpbmcgbWluZHNldCB0byB0aGUgdGFibGUuIFRoZWlyIGFiaWxpdHkgdG8gZHJpdmUgaW1wYWN0ZnVsIHJlc3VsdHMgYW5kIGZvc3RlciBsYXN0aW5nIHJlbGF0aW9uc2hpcHMgbWFrZXMgdGhlbSBhbiBpbmRpc3BlbnNhYmxlIHBhcnRuZXIgaW4gYWNoaWV2aW5nIG9yZ2FuaXphdGlvbmFsIGdvYWxzIGFuZCBhZHZhbmNpbmcgYnVzaW5lc3Mgb2JqZWN0aXZlcy48L3A+	FR	Paris	+33	0663115426	benoit.kulesza@it-unchained.com	benoitk14	\N	150	PHA+SW4gbXkgcHJvZmVzc2lvbmFsIGpvdXJuZXksIEkgaGF2ZSBjdWx0aXZhdGVkIGEgd29yayBhcHByb2FjaCB0aGF0IGlzIGJvdGggc3RyYXRlZ2ljIGFuZCBhZGFwdGl2ZSwgZW5zdXJpbmcgdGhhdCBJIG1lZXQgdGhlIHVuaXF1ZSBuZWVkcyBvZiBlYWNoIGNsaWVudCB3aXRoIHByZWNpc2lvbiBhbmQgaW5zaWdodC4gTXkgbWV0aG9kb2xvZ3kgaXMgcm9vdGVkIGluIGEgZGVlcCBjb21taXRtZW50IHRvIHVuZGVyc3RhbmRpbmcgdGhlIHNwZWNpZmljIG9iamVjdGl2ZXMgYW5kIGNoYWxsZW5nZXMgdGhhdCBteSBjbGllbnRzIGZhY2UuIEJ5IHByaW9yaXRpemluZyBvcGVuIGNvbW11bmljYXRpb24gYW5kIGFjdGl2ZSBsaXN0ZW5pbmcsIEkgYW0gYWJsZSB0byBjcmFmdCB0YWlsb3JlZCBzb2x1dGlvbnMgdGhhdCBkcml2ZSB0YW5naWJsZSByZXN1bHRzLjwvcD48cD5DbGllbnRzIGNhbiBleHBlY3QgYSBzZWFtbGVzcyBleHBlcmllbmNlIGNoYXJhY3Rlcml6ZWQgYnkgdHJhbnNwYXJlbmN5LCBhY2NvdW50YWJpbGl0eSwgYW5kIGVmZmljaWVuY3kuIEkgdGFrZSBwcmlkZSBpbiBkZWxpdmVyaW5nIGhpZ2gtcXVhbGl0eSB3b3JrIG9uIHRpbWUsIHdpdGhvdXQgY29tcHJvbWlzaW5nIG9uIGF0dGVudGlvbiB0byBkZXRhaWwuIE15IHdvcmsgZXRoaWMgaXMgdW5kZXJwaW5uZWQgYnkgaW50ZWdyaXR5IGFuZCBhIHJlbGVudGxlc3MgcHVyc3VpdCBvZiBleGNlbGxlbmNlLCBlbnN1cmluZyB0aGF0IEkgY29uc2lzdGVudGx5IGV4Y2VlZCBleHBlY3RhdGlvbnMuPC9wPjxwPkNvbGxhYm9yYXRpb24gaXMgYXQgdGhlIGhlYXJ0IG9mIG15IHByb2Nlc3MuIEkgYmVsaWV2ZSB0aGF0IHRoZSBiZXN0IG91dGNvbWVzIGFyZSBhY2hpZXZlZCB0aHJvdWdoIHRlYW13b3JrIGFuZCBsZXZlcmFnaW5nIGRpdmVyc2UgcGVyc3BlY3RpdmVzLiBCeSBmb3N0ZXJpbmcgYSBjb2xsYWJvcmF0aXZlIGVudmlyb25tZW50LCBJIGVtcG93ZXIgbXkgY2xpZW50cyB0byBiZSBhY3RpdmUgcGFydGljaXBhbnRzIGluIHRoZSBwcm9jZXNzLCBlbnN1cmluZyB0aGF0IHRoZWlyIHZpc2lvbiBpcyByZWFsaXplZCBpbiB0aGUgZmluYWwgcHJvZHVjdC48L3A+PHA+T25lIG9mIHRoZSB1bmlxdWUgYXNwZWN0cyBvZiBteSB3b3JrIHByb2Nlc3MgaXMgbXkgY29tbWl0bWVudCB0byBjb250aW51b3VzIGltcHJvdmVtZW50LiBJIHN0YXkgYWJyZWFzdCBvZiBpbmR1c3RyeSB0cmVuZHMgYW5kIGFkdmFuY2VtZW50cywgaW50ZWdyYXRpbmcgaW5ub3ZhdGl2ZSBzdHJhdGVnaWVzIGFuZCB0b29scyB0byBlbmhhbmNlIHRoZSB2YWx1ZSBJIGRlbGl2ZXIuIEJ5IGVtYnJhY2luZyBhIG1pbmRzZXQgb2YgbGVhcm5pbmcgYW5kIGdyb3d0aCwgSSBlbnN1cmUgdGhhdCBteSBjbGllbnRzIGJlbmVmaXQgZnJvbSBjdXR0aW5nLWVkZ2Ugc29sdXRpb25zIHRoYXQgcG9zaXRpb24gdGhlbSBmb3Igc3VjY2VzcyBpbiBhbiBldmVyLWV2b2x2aW5nIGxhbmRzY2FwZS48L3A+	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_f68fb660-730e-4270-8511-a02a23a63a0c.pdf	https://linkedin.com/in/undefined	\N	\N	\N	\N	\N	f	\N	t	\N	\N	\N	\N	2025-07-07 17:04:17.706+00	be277147-15d0-4420-be52-7f226e22343d	f	f
342	Thierry	Vogel	Devops engineer	RXhwZXJpZW5jZWQgV2ViIFNvZnR3YXJlIEVuZ2luZWVyIHdpdGggYSBkZW1vbnN0cmF0ZWQgaGlzdG9yeSBvZiB3b3JraW5nIGluIHRoZSB0ZWxlY29tbXVuaWNhdGlvbnMgaW5kdXN0cnkuIFNraWxsZWQgaW4gU3RvcmFnZSBBcmVhIE5ldHdvcmsgKFNBTiksIFRDUC9JUCBuZXR3b3JrLCBMaW51eCBhbmQgSFAtVVgxMWkgU3lzdGVtIEFkbWluaXN0cmF0aW9uLCBKYXZhOCwgQW5ndWxhcjYsIEFuc2libGUsIGdpdGxhYkNJLCBKZW5raW5zLiA=	FR	Beziers	33	786251502	thierry.vogel@moncourriel.eu	@CryptoGrillon	\N	100	UGFzc2lvbmF0ZSBhYm91dCB3ZWIzIHRlY2hub2xvZ2llcy4gSSB3YW50IHRvIGNvbnRyaWJ1dGUgaW4gdGhlIGV2b2x1dGlvbiBvZiB0aGlzIGVtZXJnaW5nIGRvbWFpbi4=	Terraform,GitLab,Kotlin,Linux,Cloud Computing,Google Cloud,Docker,Scripting,JavaScript,Angular,Ansible,Cloud foundry	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_4d72708e-f099-450f-84d5-d480d1147497.pdf	https://www.linkedin.com/in/thierry-vogel-3109995/	grillon	\N	\N	f	t	t	f	f	t	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	t	\N	2025-02-05 07:00:14.14312+00	3841fcd4-7107-4071-a764-f746a2f55154	t	f
1241	\N	\N	web3jobfair	<p>adsadasdkajsdashdasdjksd</p>	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-02 16:23:41.736+00	e1265438-795b-436c-b273-99a673b4a1f7	f	f
1351	Aswin	Kumar	Flutter Developer, Full Stack Blockchain Engineer	<h2><strong>Hello, I'm Aswin Kumar</strong></h2><p>I am an enthusiastic Flutter Developer and Full Stack Blockchain Engineer with a year of hands-on experience in developing cross-platform mobile apps, decentralized applications (DApps), and real-time systems.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am proficient in Flutter, Dart, Kotlin, Firebase, Node.js, Solidity, and IPFS, with strong expertise in secure communication, payment integrations. I am excited to contribute to mobile applications.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>I am eager to learn and grow, have good communication skills, problem-solving mindset, takes feedback constructively, and resilient and adaptable to challenges.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>My technical skills include languages like HTML, CSS, Dart, JavaScript, Solidity, Kotlin, frameworks like Flutter, Express.js, Node.js, and databases like Firestore Database, Mongo DB, IPFS.</p>	IN	Chennai	+91	9790796357	aswinak0330@gmail.com	@AswinKumar2323	\N	9	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Full Stack Developer Intern – Parental Monitoring Application (Startup)</strong></p><p>India | 2024-10 – Present</p><p>Developed a data collection and monitoring system for Android devices using Flutter and Firebase. Designed scalable Firestore database architecture and APIs for efficient real-time data sync. Integrated Chargebee v3 SDK and Razorpay for subscription management with backend validation using Firebase Cloud Functions. Deployed Mixpanel analytics for user event tracking and insights.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>As a Full Stack Developer, I have honed my skills in languages like HTML, CSS, Dart, JavaScript, Solidity, Kotlin, and frameworks like Flutter, Express.js, Node.js. I am proficient in using databases like Firestore Database, Mongo DB, IPFS, and have experience in payment and subscriptions integration.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I am currently pursing a Bachelor of Engineering (B.E.) in Electronics and Communication Engineering from Sathyabama Institute of Science and Technology, India. I am continuously learning and growing in my field.</p>	HTML,CSS,Dart,JavaScript,Solidity,Kotlin,Flutter,Express.js,Node.js,Ethereum,Solidity,Web3.js,Ether.js,ERC20/721,IPFS (Pinata),Firebase Auth,Firestore Database,Mongo DB,Cloud Functions,Google Cloud,Node.js APIs,Razorpay SDK,Chargebee SDK v3,Git,Android Studio,VS Code,Vite,Mixpanel Analytics,Firestore Database,Mongo DB,IPFS,GitHub,GitHub Desktop	https://goodhive.s3.us-east-005.backblazeb2.com/image_8969a6e8-977b-4141-8f47-eda1e9a2c638.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_e0a9f222-72ff-42f9-ac39-3b7edb477789.pdf	https://www.linkedin.com/in/aswin-kumar-/	https://github.com/Aswinkumar2323	\N	https://ak-dev-portfolio.netlify.app	\N	t	t	\N	\N	f	\N	f	https://x.com/AswinKumar2323	2025-11-12 15:07:07.084291+00	89003a11-290a-4cea-b060-410ee4b3b0f1	f	t
353	Med Amine	Idmoussi	Solutions Architect	QXMgYSBoaWdobHkgc2tpbGxlZCBTb2x1dGlvbiBBcmNoaXRlYyB3aXRoIGEgcmljaCBiYWNrZ3JvdW5kIGluIHByb2plY3QgbWFuYWdlbWVudCwgSSBzcGVjaWFsaXplIGluIGJsb2NrY2hhaW4gdGVjaG5vbG9neSBhbmQgZGF0YSBzY2llbmNlLg==	FR	Paris	33	758257621	med.amine.idmoussi@gmail.com	med_amine_id	\N	90	SSBoYXZlIHNwZWFyaGVhZGVkIG51bWVyb3VzIGJsb2NrY2hhaW4gcHJvamVjdHMgc2hvd2Nhc2luZyBteSBKYXZhLCBQeXRob24sIGFuZCBQSFAgZXhwZXJ0aXNlLiBNeSBwcm9maWNpZW5jeSBleHRlbmRzIHRvIEplbmtpbnMsIFBvc3RtYW4sIEpNZXRlciwgVGVzdFJhaWwsIEppcmEsIGFuZCBTZWxlbml1bSwgY291cGxlZCB3aXRoIGV4dGVuc2l2ZSBRQSBBdXRvbWF0aW9uIEVuZ2luZWVyaW5nIGV4cGVyaWVuY2UuIEkgYW0gYWRlcHQgYXQgZGVzaWduaW5nIHJvYnVzdCBkYXRhYmFzZSBzdHJ1Y3R1cmVzIGFuZCBob2xkIGEgTWljcm9zb2Z0IGNlcnRpZmljYXRpb24gaW4gQUkgYW5kIGRhdGEgYW5hbHlzaXMuIApNeSBnbG9iYWwgZXhwZXJpZW5jZSBpbmNsdWRlcyB3b3JraW5nIHJlbW90ZWx5IGZvciBjb21wYW5pZXMgaW4gRnJhbmNlLCB0aGUgVVNBLCBhbmQgSG9uZyBLb25nLgoKSSBhbSBwYXNzaW9uYXRlIGFib3V0IG1lbnRvcmluZyB0aGUgbmV4dCBnZW5lcmF0aW9uIG9mIFdlYjMgaW5ub3ZhdG9ycywgbGV2ZXJhZ2luZyBteSBkZWVwIGluZHVzdHJ5IGtub3dsZWRnZSBhbmQgaGFuZHMtb24gZXhwZXJpZW5jZSB0byBndWlkZSBhbmQgaW5zcGlyZS4gTGV0J3MgYnVpbGQgdGhlIGZ1dHVyZSBvZiBkZWNlbnRyYWxpemVkIHRlY2hub2xvZ3kgdG9nZXRoZXIu	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_3246ba87-8a3c-4675-a731-dd2ca854bf1c.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_6829cad2-b4c8-4ac2-b7b0-aee9c8845c63.pdf	https://www.linkedin.com/in/med-amine-id/	\N	\N	\N	f	t	t	f	f	t	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	\N	\N	2025-02-05 07:00:14.14312+00	0f128a65-9bbc-4f7c-adee-1f166a00be85	t	f
1204	Benoît	K.	Web3 Innovator & Strategic Finance Expert in Decentralization	PHA+QmVub8OudCBLLiBzdGFuZHMgYXMgYSB2aXNpb25hcnkgbGVhZGVyIGFuZCBjb25uZWN0b3IgaW4gdGhlIFdlYjMgYW5kIGJsb2NrY2hhaW4gZWNvc3lzdGVtLCB3aXRoIG92ZXIgZWlnaHQgeWVhcnMgb2YgZHluYW1pYyBleHBlcmllbmNlIGFzIGFuIGVudHJlcHJlbmV1ciBhbmQgcmVjcnVpdGVyLiBQYXNzaW9uYXRlIGFib3V0IGRlY2VudHJhbGl6YXRpb24sIHRoZSBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aXZlIGlubm92YXRpb24sIEJlbm/DrnQgaXMgZGVkaWNhdGVkIHRvIHJlc2hhcGluZyB0aGUgZnV0dXJlIG9mIHdvcmsgYnkgYnJpZGdpbmcgdGhlIGdhcCBiZXR3ZWVuIHRvcCBJVCB0YWxlbnRzIGFuZCBwaW9uZWVyaW5nIGJsb2NrY2hhaW4gb3Bwb3J0dW5pdGllcy48L3A+PHA+QXMgdGhlIGZvdW5kZXIgb2YgR29vZEhpdmUgYW5kIFdlYjNUYWxlbnRGYWlyLCBCZW5vw650IGlzIG9uIGEgcmVsZW50bGVzcyBtaXNzaW9uIHRvIGFkZHJlc3MgdGhlIHRhbGVudCBzaG9ydGFnZSBpbiB0aGUgV2ViMyBzcGFjZS4gSGlzIGlubm92YXRpdmUgYXBwcm9hY2ggdG8gdGFsZW50IG1hdGNoaW5nIGxldmVyYWdlcyBhIGNvbGxhYm9yYXRpdmUgYW5kIGRlY2VudHJhbGl6ZWQgcHJvdG9jb2wsIHBvc2l0aW9uaW5nIGhpbSBhdCB0aGUgZm9yZWZyb250IG9mIHRoZSBmdXR1cmUgb2Ygd29yay4gSGlzIHZlbnR1cmVzIGFyZSBub3Qgb25seSBhYm91dCBjb25uZWN0aW5nIHRhbGVudHMgd2l0aCBjdXR0aW5nLWVkZ2Ugam9icyBidXQgYWxzbyBhYm91dCBlbXBvd2VyaW5nIGFuZCBlZHVjYXRpbmcgdGhlIFdlYjMgY29tbXVuaXR5IHRocm91Z2ggaW5jbHVzaXZlIHBsYXRmb3JtcyBhbmQgZXZlbnRzLjwvcD48cD5XaXRoIGEgcm9idXN0IGJhY2tncm91bmQgaW4gY29ycG9yYXRlIGZpbmFuY2UsIG1lcmdlcnMgYW5kIGFjcXVpc2l0aW9ucywgYW5kIHN0cmF0ZWdpYyBwbGFubmluZywgQmVub8OudCBvZmZlcnMgYSB3ZWFsdGggb2YgZXhwZXJ0aXNlIHRvIG9yZ2FuaXphdGlvbnMgc2Vla2luZyBzdHJhdGVnaWMgZ3Jvd3RoIGFuZCBpbm5vdmF0aW9uLiBIaXMgZXh0ZW5zaXZlIGV4cGVyaWVuY2UgaW4gYnVzaW5lc3MgZGV2ZWxvcG1lbnQsIGZpbmFuY2lhbCBhbmFseXNpcywgYW5kIGludGVybmF0aW9uYWwgYnVzaW5lc3MgZXF1aXBzIGhpbSB0byBkcml2ZSBwZXJmb3JtYW5jZSBhbmQgdmFsdWUgY3JlYXRpb24gYWNyb3NzIGRpdmVyc2Ugc2VjdG9ycy4gSGlzIHN0cmF0ZWdpYyBhY3VtZW4gaXMgZnVydGhlciBlbmhhbmNlZCBieSBoaXMgYWJpbGl0eSB0byBsZWFkIGFuZCBtYW5hZ2UgY29tcGxleCBwcm9qZWN0cywgbmVnb3RpYXRlIGNvbnRyYWN0cywgYW5kIGltcHJvdmUgYnVzaW5lc3MgcHJvY2Vzc2VzLjwvcD48cD5CZXlvbmQgaGlzIHRlY2huaWNhbCBza2lsbHMsIEJlbm/DrnQncyB1bmlxdWUgdmFsdWUgcHJvcG9zaXRpb24gbGllcyBpbiBoaXMgYWJpbGl0eSB0byBmb3N0ZXIgYSBjb2xsYWJvcmF0aXZlIGVjb25vbXkgYW5kIGJ1aWxkIHN0cmF0ZWdpYyBhbGxpYW5jZXMgdGhhdCBwcm9wZWwgdGhlIFdlYjMgZWNvc3lzdGVtIGZvcndhcmQuIEhpcyBkeXNsZXhpYyB0aGlua2luZyBhbmQgaW5ub3ZhdGl2ZSBtaW5kc2V0IGlnbml0ZSB0cmFuc2Zvcm1hdGl2ZSBpZGVhcyB0aGF0IGluc3BpcmUgb3RoZXJzIHRvIGpvaW4gaGltIG9uIHRoZSBqb3VybmV5IHRvd2FyZCBhIGRlY2VudHJhbGl6ZWQgZnV0dXJlLiBDb25uZWN0IHdpdGggQmVub8OudCB0byBleHBsb3JlIG5ldyBob3Jpem9ucyBhbmQgbWFrZSB5b3VyIGlkZWFzIHdvcmsgaW4gdGhlIGV2b2x2aW5nIGxhbmRzY2FwZSBvZiBibG9ja2NoYWluIGFuZCBkZWNlbnRyYWxpemVkIHRlY2hub2xvZ2llcy48L3A+	FR	Paris, Île-de-France	+33	\N	\N	\N	\N	\N	PHA+QmVub8OudCBLLiBpcyBhIHZpc2lvbmFyeSBsZWFkZXIgaW4gdGhlIFdlYjMgYW5kIGJsb2NrY2hhaW4gc3BhY2UsIGJyaW5naW5nIG92ZXIgZWlnaHQgeWVhcnMgb2YgZW50cmVwcmVuZXVyaWFsIGFuZCByZWNydWl0bWVudCBleHBlcnRpc2UgdG8gaGlzIHByb2plY3RzLiBIaXMgYXBwcm9hY2ggaXMgcm9vdGVkIGluIHRoZSBwcmluY2lwbGVzIG9mIGRlY2VudHJhbGl6YXRpb24gYW5kIGNvbGxhYm9yYXRpdmUgZWNvbm9teSwgZW5zdXJpbmcgZXZlcnkgaW5pdGlhdGl2ZSBoZSB1bmRlcnRha2VzIGlzIG5vdCBvbmx5IGlubm92YXRpdmUgYnV0IGFsc28gaW5jbHVzaXZlIGFuZCBlbXBvd2VyaW5nLiBCZW5vw650IGJlbGlldmVzIGluIGxldmVyYWdpbmcgdGVjaG5vbG9neSB0byBjcmVhdGUgbWVhbmluZ2Z1bCBjb25uZWN0aW9ucyBiZXR3ZWVuIHRvcCBJVCB0YWxlbnRzIGFuZCBwaW9uZWVyaW5nIGJsb2NrY2hhaW4gY29tcGFuaWVzLCBmYWNpbGl0YXRpbmcgYSBmdXR1cmUtcmVhZHkgd29ya2ZvcmNlLjwvcD48cD5DbGllbnRzIGNhbiBleHBlY3QgYSBtZXRpY3Vsb3VzIGFuZCBzdHJhdGVnaWMgYXBwcm9hY2ggZnJvbSBCZW5vw650LiBIaXMgd29yayBpcyBjaGFyYWN0ZXJpemVkIGJ5IGEga2VlbiBmb2N1cyBvbiBhbGlnbmluZyBidXNpbmVzcyBzdHJhdGVneSB3aXRoIHRhbGVudCBhY3F1aXNpdGlvbiwgZW5zdXJpbmcgdGhhdCB0aGUgcmlnaHQgaW5kaXZpZHVhbHMgYXJlIHBsYWNlZCBpbiByb2xlcyB3aGVyZSB0aGV5IGNhbiB0aHJpdmUgYW5kIGRyaXZlIGlubm92YXRpb24uIEhpcyBleHRlbnNpdmUgc2tpbGwgc2V0IGluIGZpbmFuY2lhbCBhbmFseXNpcywgYnVzaW5lc3MgZGV2ZWxvcG1lbnQsIGFuZCBzdHJhdGVnaWMgcGxhbm5pbmcgYWxsb3dzIGhpbSB0byBkZWxpdmVyIGV4Y2VwdGlvbmFsIHJlc3VsdHMsIHRhaWxvcmVkIHRvIHRoZSB1bmlxdWUgbmVlZHMgb2YgZWFjaCBjbGllbnQuPC9wPjxwPkJlbm/DrnQncyBjb2xsYWJvcmF0aXZlIHN0eWxlIGlzIGJvdGggZHluYW1pYyBhbmQgaW5jbHVzaXZlLCBmb3N0ZXJpbmcgYW4gZW52aXJvbm1lbnQgd2hlcmUgaWRlYXMgYXJlIGZyZWVseSBleGNoYW5nZWQgYW5kIGlubm92YXRpb24gaXMgbnVydHVyZWQuIEhlIHBsYWNlcyBhIHN0cm9uZyBlbXBoYXNpcyBvbiB0cmFuc3BhcmVuY3kgYW5kIGNvbW11bmljYXRpb24sIGVuc3VyaW5nIGNsaWVudHMgYXJlIGZ1bGx5IHN1cHBvcnRlZCBhbmQgaW5mb3JtZWQgdGhyb3VnaG91dCB0aGUgcmVjcnVpdG1lbnQgcHJvY2Vzcy4gSGlzIGNvbW1pdG1lbnQgdG8gY29udGludW91cyBpbXByb3ZlbWVudCBhbmQgcHJvY2VzcyBvcHRpbWl6YXRpb24gaXMgZXZpZGVudCBpbiBoaXMgd29yaywgYXMgaGUgY29uc3RhbnRseSBzZWVrcyB3YXlzIHRvIGVuaGFuY2UgZWZmaWNpZW5jeSBhbmQgZWZmZWN0aXZlbmVzcy48L3A+PHA+V2l0aCBhIHBhc3Npb24gZm9yIGVkdWNhdGlvbiBhbmQgZW1wb3dlcm1lbnQgd2l0aGluIHRoZSBXZWIzIGNvbW11bml0eSwgQmVub8OudCBpcyBkZWRpY2F0ZWQgdG8gY3JlYXRpbmcgcGxhdGZvcm1zIGFuZCBldmVudHMgdGhhdCBub3Qgb25seSBjb25uZWN0IHRhbGVudHMgdG8gb3Bwb3J0dW5pdGllcyBidXQgYWxzbyBpbnNwaXJlIGFuZCBlZHVjYXRlIHRoZSBuZXh0IGdlbmVyYXRpb24gb2YgYmxvY2tjaGFpbiBpbm5vdmF0b3JzLiBKb2luIEJlbm/DrnQgb24gdGhpcyB0cmFuc2Zvcm1hdGl2ZSBqb3VybmV5IGFuZCBleHBlcmllbmNlIHRoZSBmdXR1cmUgb2Ygd29yayB0b2RheS48L3A+	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://media.licdn.com/dms/image/v2/C4D03AQESUUrjZR1JZw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1556718768578?e=1751500800&v=beta&t=E0yocSGxhV3nl8M2ZKlWHAjseRBdYGquDksgS2cspE8	\N	\N	https://linkedin.com/in/benoitkulesza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-02 14:38:34.35+00	9580d2f2-765c-4a57-a7a2-8936208075e7	f	f
1205	Benoît	K.	Web3 Innovator & Strategic Finance Expert	PHA+QmVub8OudCBLLiBpcyBhIHZpc2lvbmFyeSBmb3JjZSBhdCB0aGUgaW50ZXJzZWN0aW9uIG9mIFdlYjMsIGRlY2VudHJhbGl6YXRpb24sIGFuZCB0aGUgY29sbGFib3JhdGl2ZSBlY29ub215LiBXaXRoIG92ZXIgZWlnaHQgeWVhcnMgb2YgZW50cmVwcmVuZXVyaWFsIGFuZCByZWNydWl0bWVudCBleHBlcnRpc2UgaW4gdGhlIGJsb2NrY2hhaW4gc3BhY2UsIGhlIGlzIHJlZGVmaW5pbmcgdGhlIGZ1dHVyZSBvZiB3b3JrIGJ5IHNlYW1sZXNzbHkgY29ubmVjdGluZyB0b3AgSVQgdGFsZW50cyB3aXRoIHBpb25lZXJpbmcgcHJvamVjdHMgaW4gdGhlIGluZHVzdHJ5LiBBcyB0aGUgZm91bmRlciBvZiBHb29kSGl2ZSBhbmQgV2ViM1RhbGVudEZhaXIsIEJlbm/DrnQgdGFja2xlcyB0aGUgdGFsZW50IHNob3J0YWdlIGluIHRoZSBXZWIzIGVjb3N5c3RlbSBieSBsZXZlcmFnaW5nIGhpcyBleHBhbnNpdmUgbmV0d29yaywgc3RyYXRlZ2ljIGFjdW1lbiwgYW5kIGlubm92YXRpdmUgcGxhdGZvcm1zLjwvcD48cD5CZW5vw650J3MgY29tcHJlaGVuc2l2ZSBza2lsbCBzZXQgc3BhbnMgZnJvbSBzdGFydHVwIG1hbmFnZW1lbnQgYW5kIGNvcnBvcmF0ZSBmaW5hbmNlIHRvIHN0cmF0ZWdpYyBwbGFubmluZyBhbmQgaW50ZXJuYXRpb25hbCBidXNpbmVzcy4gSGlzIGV4cGVyaWVuY2UgaW5jbHVkZXMgb3JjaGVzdHJhdGluZyBvdmVyIDQwIGludGVybmF0aW9uYWwgTSZhbXA7QSBkZWFscywgYW5kIGhpcyBzdHJhdGVnaWMgaW5zaWdodCBoYXMgZHJpdmVuIHN1Y2Nlc3NmdWwgYnVzaW5lc3MgZGV2ZWxvcG1lbnQgYW5kIElUIGNvbnN1bHRpbmcgcHJvamVjdHMgZm9yIG1ham9yIGNsaWVudHMgbGlrZSBUb3RhbCBhbmQgQVhBIEFzc2lzdGFuY2UuIEhpcyBudWFuY2VkIHVuZGVyc3RhbmRpbmcgb2YgYmxvY2tjaGFpbiBkeW5hbWljcywgaW5jbHVkaW5nIERBTywgUDJQLCBEZUZpLCBhbmQgVG9rZW5vbWljcywgcG9zaXRpb25zIGhpbSB1bmlxdWVseSB0byBsZWFkIHRyYW5zZm9ybWF0aXZlIGluaXRpYXRpdmVzIGluIHRoZSBkZWNlbnRyYWxpemVkIHdvcmxkLjwvcD48cD5QYXNzaW9uYXRlIGFib3V0IGVtcG93ZXJpbmcgYW5kIGVkdWNhdGluZyB0aGUgV2ViMyBjb21tdW5pdHksIEJlbm/DrnQgY3JlYXRlcyBpbmNsdXNpdmUgZW52aXJvbm1lbnRzIHdoZXJlIHRhbGVudHMgY2FuIHRocml2ZSBhbmQgaW5ub3ZhdGUuIEhpcyBwaW9uZWVyaW5nIHdvcmsgd2l0aCBHb29kSGl2ZSBpbnRyb2R1Y2VzIGEgZGVjZW50cmFsaXplZCBtYXRjaGluZyBwcm90b2NvbCB0aGF0IG5vdCBvbmx5IGFkZHJlc3NlcyBjdXJyZW50IGluZHVzdHJ5IGNoYWxsZW5nZXMgYnV0IGFsc28gcHJlcGFyZXMgdGhlIGVjb3N5c3RlbSBmb3IgYSBtb3JlIGNvbGxhYm9yYXRpdmUgZnV0dXJlLiBNZWFud2hpbGUsIFdlYjNUYWxlbnRGYWlyIGJyaWRnZXMgZ2FwcyBiZXR3ZWVuIHRhbGVudHMgYW5kIHRoZSBsZWFkaW5nIHJlY3J1aXRlcnMgaW4gdGhlIGJsb2NrY2hhaW4gc2VjdG9yLjwvcD48cD5CZW5vw650IEsuJ3MgZXhjZXB0aW9uYWwgYWJpbGl0eSB0byBmb3N0ZXIgY29sbGFib3JhdGlvbiwgY291cGxlZCB3aXRoIGhpcyBzdHJhdGVnaWMgZm9yZXNpZ2h0LCBtYWtlcyBoaW0gYW4gaW52YWx1YWJsZSBwYXJ0bmVyIGZvciBhbnkgb3JnYW5pemF0aW9uIGxvb2tpbmcgdG8gaGFybmVzcyB0aGUgcG93ZXIgb2YgYmxvY2tjaGFpbiB0ZWNobm9sb2d5IGFuZCBkZWNlbnRyYWxpemVkIGVjb3N5c3RlbXMuIEpvaW4gaGltIG9uIHRoaXMgZXhjaXRpbmcgam91cm5leSB0b3dhcmRzIGEgZGVjZW50cmFsaXplZCBmdXR1cmUsIGFuZCB3aXRuZXNzIGZpcnN0aGFuZCBob3cgaGUgdHJhbnNmb3JtcyBpZGVhcyBpbnRvIGltcGFjdGZ1bCByZWFsaXRpZXMuPC9wPg==	FR	Paris, Île-de-France	+33	\N	\N	\N	\N	\N	PHA+QmVub8OudCBLLiBpcyBhIHZpc2lvbmFyeSBsZWFkZXIgaW4gdGhlIHJhcGlkbHkgZXZvbHZpbmcgV2ViMyBsYW5kc2NhcGUsIHdoZXJlIGhpcyB1bmlxdWUgYmxlbmQgb2YgZW50cmVwcmVuZXVyaWFsIHNwaXJpdCBhbmQgcmVjcnVpdG1lbnQgZXhwZXJ0aXNlIHNldHMgaGltIGFwYXJ0LiBXaXRoIG92ZXIgZWlnaHQgeWVhcnMgb2YgZXhwZXJpZW5jZSwgQmVub8OudCBpcyBjb21taXR0ZWQgdG8gYnJpZGdpbmcgdGhlIGdhcCBiZXR3ZWVuIHRvcC10aWVyIElUIHRhbGVudCBhbmQgcGlvbmVlcmluZyBibG9ja2NoYWluIG9wcG9ydHVuaXRpZXMuIEhpcyBhcHByb2FjaCBpcyBkZWVwbHkgcm9vdGVkIGluIHRoZSBwcmluY2lwbGVzIG9mIGRlY2VudHJhbGl6YXRpb24sIGNvbGxhYm9yYXRpb24sIGFuZCB0aGUgc2hhcmluZyBlY29ub215LCB3aGljaCBoZSBzZWFtbGVzc2x5IGludGVncmF0ZXMgaW50byBoaXMgd29yayBwcm9jZXNzZXMgYW5kIHByb2plY3RzLjwvcD48cD5DbGllbnRzIGNhbiBleHBlY3QgYW4gdW53YXZlcmluZyBkZWRpY2F0aW9uIHRvIGV4Y2VsbGVuY2UgYW5kIGlubm92YXRpb24uIEJlbm/DrnQgZW1wbG95cyBhIHN0cmF0ZWdpYywgYW5hbHl0aWNhbCBtaW5kc2V0IHRvIGVuc3VyZSB0aGF0IGV2ZXJ5IHByb2plY3QgYWxpZ25zIHdpdGggdGhlIGJyb2FkZXIgZ29hbHMgb2YgdGhlIGRlY2VudHJhbGl6ZWQgZnV0dXJlLiBIaXMgbWV0aG9kb2xvZ3kgaW52b2x2ZXMgYSBjb21wcmVoZW5zaXZlIHVuZGVyc3RhbmRpbmcgb2YgZWFjaCBjbGllbnQncyBuZWVkcywgc3VwcG9ydGVkIGJ5IGEgcm9idXN0IG5ldHdvcmsgdGhhdCBlbmhhbmNlcyB0YWxlbnQgYWNxdWlzaXRpb24gYW5kIHByb2plY3Qgc3VjY2Vzcy4gQmVub8OudCBiZWxpZXZlcyBpbiBmb3N0ZXJpbmcgYW4gaW5jbHVzaXZlIGFuZCBjb2xsYWJvcmF0aXZlIGVudmlyb25tZW50IHdoZXJlIGlkZWFzIGFyZSBmcmVlbHkgZXhjaGFuZ2VkLCBsZWFkaW5nIHRvIGltcGFjdGZ1bCBzb2x1dGlvbnMgdGhhdCBkcml2ZSB0YW5naWJsZSByZXN1bHRzLjwvcD48cD5JbiB0aGUgc3Bpcml0IG9mIHRyYW5zcGFyZW5jeSBhbmQgaW50ZWdyaXR5LCBCZW5vw650IGVtcGhhc2l6ZXMgb3BlbiBjb21tdW5pY2F0aW9uIGFuZCBtdXR1YWwgcmVzcGVjdCBpbiBhbGwgcHJvZmVzc2lvbmFsIGVuZ2FnZW1lbnRzLiBIaXMgYWJpbGl0eSB0byBuYXZpZ2F0ZSBjb21wbGV4IGNoYWxsZW5nZXMgd2l0aCBzdHJhdGVnaWMgcHJlY2lzaW9uIGFuZCBhIGtlZW4gZXllIGZvciBwcm9jZXNzIGltcHJvdmVtZW50IGlzIHVubWF0Y2hlZC4gV2hldGhlciBpdCdzIHRocm91Z2ggaGlzIHZlbnR1cmVzIGxpa2UgR29vZEhpdmUgYW5kIFdlYjNUYWxlbnRGYWlyIG9yIGhpcyBleHRlbnNpdmUgY29uc3VsdGluZyBleHBlcmllbmNlLCBCZW5vw650IGlzIGRlZGljYXRlZCB0byBlbXBvd2VyaW5nIHRoZSBXZWIzIGNvbW11bml0eSBhbmQgcGF2aW5nIHRoZSB3YXkgZm9yIGEgZGVjZW50cmFsaXplZCBmdXR1cmUuIEpvaW4gaGltIGluIHRyYW5zZm9ybWluZyB5b3VyIHZpc2lvbiBpbnRvIHJlYWxpdHkgd2l0aCBwYXNzaW9uLCBleHBlcnRpc2UsIGFuZCBhIGNvbW1pdG1lbnQgdG8gZ3JvdW5kYnJlYWtpbmcgaW5ub3ZhdGlvbi48L3A+	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://media.licdn.com/dms/image/v2/C4D03AQESUUrjZR1JZw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1556718768578?e=1751500800&v=beta&t=E0yocSGxhV3nl8M2ZKlWHAjseRBdYGquDksgS2cspE8	\N	\N	https://linkedin.com/in/benoitkulesza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-02 14:43:59.441+00	88af641f-526b-4da6-a3d0-ee16d0841c44	f	f
1353	Surya Prakash	Palanivel	Jr Python Developer	<h2><strong>Hello, I'm Surya Prakash Palanivel</strong></h2><p>I am a Junior Python Developer with a passion for blockchain and emerging technologies. I have a proven track record in building interactive websites, processing large-scale financial data, and fine-tuning OCR engines.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am driven by the desire to constantly learn and apply new technologies, especially in the field of blockchain and AI. I am also passionate about improving user experience and web performance.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>I believe in the power of collaboration and have experience in managing a team of interns. I have also contributed to open-source projects and have hands-on leadership and project management experience.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>My technical skills include JavaScript, TypeScript, Python, Java, SQL, NoSQL, DSA, Node.js, React.js, Gradio, RabbitMQ, Git Docker, Kubernetes, Linux Concepts, AWS, Webflow, WordPress, CI/CD (GitHub Actions), APIs (REST, sockets, RPCs, GraphQL), Solidity, Hardhat, Ethers.js, Blockchain, Agentic AI, and LangGraph.</p>	\N	Delhi	\N	9310563837	suryapalanivel@gmail.com	\N	\N	30	<h2><strong>Experience</strong></h2><p>&nbsp;</p><strong>Jr Python Developer – Edify Technologies</strong><br>Chennai, Tamil Nadu | 2025-01 – Present<br>Developed and trained CNN-based models for custom bounding box detection on checks and slips, achieving 90% accuracy. Enhanced React-based chatbot frontend using Material UI, improving responsiveness and user interaction for seamless conversations.<p>&nbsp;</p><strong>Backend Developer – Freelancer, Guide: Piyush Kothari</strong><br>Virtual | 2024-07 – 2024-08<br>Designed and implemented a multithreaded backend system to handle real-time requests and bids from 4 major crypto exchanges. Processed and streamed over 1 GB of trading data within 5–6 hours daily, ensuring low latency performance.<p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>My key technical skills include JavaScript, TypeScript, Python, Java, SQL, NoSQL, DSA, Node.js, React.js, Gradio, RabbitMQ, Git Docker, Kubernetes, Linux Concepts, AWS, Webflow, WordPress, CI/CD (GitHub Actions), APIs (REST, sockets, RPCs, GraphQL), Solidity, Hardhat, Ethers.js, Blockchain, Agentic AI, and LangGraph. My soft skills include leadership, collaboration, and problem-solving.</p><p>&nbsp;</p><h2><strong>Education & Continuous Learning</strong></h2><p>&nbsp;</p><p>I have a B.Tech in Computer Science from the Indraprastha Institute of Information Technology Delhi and a Senior Secondary (XII), Science from the Abu Dhabi Indian School.</p>	JavaScript,TypeScript,Python,Java,SQL,NoSQL,DSA,Node.js,React.js,Gradio,RabbitMQ,Git Docker,Kubernetes,Linux Concepts,AWS,Webflow,WordPress,CI/CD (GitHub Actions),APIs (REST,sockets,RPCs,GraphQL),Solidity,Hardhat,Ethers.js,Blockchain,Agentic AI,LangGraph	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_7ea39c77-30c0-47e1-8434-0a3f1f6d0f43.pdf	LinkedIn	Github	\N	https://www.fairseat.in	\N	\N	t	\N	\N	\N	\N	f	\N	2025-11-12 16:35:10.763321+00	\N	f	f
1242	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-11 16:20:10.901+00	d9fbe13c-7a27-4ca4-a68e-51ee1c793c41	f	f
1357	Chaharane	TEST	Chaharane Test affiliation link	<p>Testaffiliation</p>	FR	toulouse	+33	0783336855	bryankeyslim@gmail.com	@chd95251594	\N	40	<p>CommunityManager</p>	Solidity,IPFS,JavaScript	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_f95226e4-f67a-417c-9e09-40de103d53be.pdf	\N	\N	\N	\N	t	t	f	t	f	t	\N	f	\N	2025-11-13 10:24:11.867265+00	5ecb5d0c-2178-45e7-9e77-9d38de24acd8	f	t
1360	Ilyesse	El Adaoui	Développeur Backend	<h2><strong>Hello, I'm Ilyesse El Adaoui</strong></h2><p>I am a 3rd year software engineering student at EFREI Paris, specializing in backend development and secure REST API design. I have a passion for software architecture and cloud solutions and am looking to join an innovative team to contribute to the evolution of your SaaS platform and actively participate in the digitization of business processes.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am passionate about designing clean, documented, and maintainable code. I am proficient in PHP, Symfony, SQL, and GitLab CI/CD.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>I am fluent in French and Arabic, and have intermediate proficiency in English. I am also certified in AWS Servers, Cisco Networking Academy, and have a keen interest in information security.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>I have experience with a variety of languages and frameworks including PHP 8, Symfony, JavaScript (ES6), XML, Java, and Node.js. I am also familiar with database technologies like PostgreSQL, MySQL, MariaDB, and SQL Server.</p>	\N	Paris	\N	0783850331	ilyesseeladaoui2@gmail.com	\N	\N	30	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Développeur Backend – Waldenergie</strong></p><p>Paris, France | 2023-09 – 2024-06</p><p>Worked on the conception of a complete website using HTML, CSS, JavaScript, and PHP. Integrated dynamic features and APIs. Optimized user experience on a responsive web interface. Managed network security and basic network monitoring.</p><p>&nbsp;</p><p><strong>Stagiaire en Administration Réseau – Mairie de Poissy</strong></p><p>Paris, France | 2023-06 – 2023-06</p><p>Installed dual authentication via YubiKey. Administered and monitored the computer network. Secured and supervised the Information System (SI).</p><p>&nbsp;</p><p><strong>Stagiaire en Développement Backend – NextFormation</strong></p><p>Paris, France | 2023-04 – 2023-05</p><p>Created and managed databases with PhpMyAdmin. Secured data and the computer park. Developed and maintained PHP and MySQL modules. Participated in the creation of encrypted and secure forms.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>My key technical skills include PHP, Symfony, SQL, GitLab CI/CD, HTML, CSS, JavaScript, and Node.js. I am also proficient in Agile Scrum methodologies, version management, and documentation. My soft skills include teamwork, problem-solving, and adaptability.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I am currently pursuing a degree in Software Engineering at EFREI Paris, with a specialization in Information Security &amp; Secure Web Development. I also hold certifications from AWS Servers and Cisco Networking Academy.</p>	PHP,Symfony,SQL,GitLab CI/CD,HTML,CSS,JavaScript,Node.js,Agile Scrum,Version Management,Documentation,Teamwork,Problem-solving,Adaptability	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_4e8ca4bc-d3e1-4c34-b604-5f3690b9b2f8.pdf	www.linkedin.com/in/ilyesse-eladaoui	https://github.com/Ilyesse-soc/site-vitrine-formulaire-chiffre	\N	https://ilyesse-dev.vercel.app/projets-techniques	\N	\N	t	\N	\N	\N	\N	f	\N	2025-11-13 11:10:53.405047+00	99c5500a-46cb-455c-be49-21a626671677	f	f
359	Volkan	Guneri	Fullstack Smart Contract Developer	QmxvY2tjaGFpbjogMSB5ZWFyLCBTb2xpZGl0eSwgRm91bmRyeSwgVmllbSwgREFPLCBORlQsIENoYWlubGluayBGcm9udGVuZCBEZXZlbG9wbWVudDogMysgeWVhcnMsIEhUTUwsIENTUywgSlMsIFJlYWN0LCBOZXh0LmpzIEN1cnJlbnQgRm9jdXM6IEJsb2NrY2hhaW4gc2VjdXJpdHksIFpLLCBSV0EsIERpZ2l0YWwgSWRlbnRpdHkgRWR1Y2F0aW9uOiBTZWxmLXRhdWdodCAoZnJvbnRlbmQpIEFseXJhIEJsb2NrY2hhaW4gU2Nob29sIGdyYWR1YXRl	FR	Rennes	33	762626790	guneriv@gmail.com	https://t.me/volkan00000	\N	50	SSBtIGxvb2tpbmcgZm9yIGFuIGFkdmFuY2VkIGp1bmlvciBwb3NpdGlvbiBpbiBibG9ja2NoYWluIHByb2dyYW1pbmcgcHJvamVjdHMuIA==	,Solidity,Hardhat,Foundry,Viem,Next.js,Chainlink	https://goodhive.s3.us-east-005.backblazeb2.com/image_4112198f-e5ba-498e-9db5-961b1974cbc7.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_905c4344-de14-40c3-8c3c-4cb4e8067008.pdf	www.linkedin.com/in/volkan-guneri	https://github.com/volkanguneri	\N	https://volkanguneri.github.io/portfolio-front/	f	f	t	f	f	t	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	t	\N	2025-02-05 07:00:14.14312+00	3137edb6-1af1-4749-bdb2-16ad8cd97718	t	f
1232	\N	\N	Sisters Furniture	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-13 19:24:30.131+00	6e9cd09e-ee78-4523-b2f6-4ba7fa3bd7f2	f	f
1296	Jérémy	PETITPAS	Consultant Blockchain certifié, conformité européenne & DPP (stage BE Blockchain), DecentrIA 	<p>Passionné par la blockchain et les technologies décentralisées depuis plus de 5 ans, j’ai choisi d’en faire mon métier.</p><p>J’ai suivi la formation <strong>Alyra</strong> et obtenu la certification de <strong>Consultant Blockchain</strong> en 2025.</p><p><br></p><p>Je participe régulièrement à différents <strong>salons et événements liés au Web3</strong>, où j’échange avec les acteurs du secteur. J’ai également été <strong>bénévole au salon CryptoXR 2025</strong>, une expérience enrichissante qui m’a permis de contribuer à la communauté et de renforcer mon réseau professionnel.</p><p><br></p><p>Aujourd’hui, je poursuis mon parcours professionnel en <strong>stage chez BE Blockchain (Belgique)</strong>, où je contribue à des travaux autour des <strong>Digital Product Passports (DPP)</strong> et de la conformité avec les réglementations européennes (<strong>ESPR, MiCA, RGPD</strong>).</p><p><br></p><p>En parallèle, j’ai lancé <strong>DecentrIA</strong>, un projet personnel d’IA décentralisée et totalement offline, qui illustre mon envie de développer des solutions innovantes respectueuses de la vie privée.</p><p><br></p><p> Mon objectif est de continuer à apprendre, à progresser, et à mettre mes compétences au service de projets qui construisent un Web3 plus transparent, conforme et durable.</p>	FR	BEZIERS	+33	0641010237	petitpas.jeremy@yahoo.fr	t.me/Jeremypetitpas	\N	\N	<p>Mon parcours combine <strong>plusieurs années d’auto-formation</strong> dans l’écosystème blockchain, une <strong>certification de Consultant Blockchain (Alyra, 2025)</strong> et une première expérience professionnelle en <strong>stage chez BE Blockchain</strong>, orientée sur les <strong>Digital Product Passports (DPP)</strong> et la conformité européenne (ESPR, MiCA, RGPD).</p><p><br></p><p>En parallèle, j’ai initié <strong>DecentrIA</strong>, un projet personnel d’<strong>assistant IA décentralisé et offline</strong>. Ce travail me permet d’explorer concrètement l’intersection entre <strong>blockchain, intelligence artificielle et respect de la vie privée</strong>, et d’expérimenter des approches techniques avancées (LLM, vectorisation, GPU/CUDA, RAG).</p><p><br></p><p>Je cherche aujourd’hui à mettre ces acquis au service de projets Web3 souhaitant allier <strong>innovation technologique</strong> (blockchain, smart contracts, traçabilité, IA décentralisée) et <strong>respect des cadres réglementaires</strong> européens.</p><p><br></p><p>Mon objectif est de rejoindre ou collaborer avec des équipes qui développent des solutions concrètes et durables, tout en continuant à approfondir mon expertise sur les enjeux de <strong>conformité, interopérabilité et intelligence artificielle appliquée au Web3</strong>.</p>	Artificial Intelligence,EtherJS,Python	https://goodhive.s3.us-east-005.backblazeb2.com/image_30818f8f-f5be-4f06-9379-96ec95d06d11.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_a3b1957e-3b92-4c31-ac28-62d9782bf06e.pdf	https://www.linkedin.com/in/jeremy-petitpas-3296b7328/	https://github.com/jerem34500	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	https://x.com/Jeremy998340957	2025-08-27 11:23:38.079+00	b6f67952-c438-44ea-b9d3-65393da3bca8	f	t
360	Nicolas	Wagner	Web3 Developer	RGFwcCBEZXZlbG9wZXIg4puT77iP	FR	Paris	33	650334223	contact@wagner-nicolas.com	t.me/n1c01a5	\N	100	SSdtIGRBcHAgZGV2ZWxvcGVyLgoKaGVyZSBpcyBteSBzdGFjayA6IHNvbGlkaXR5LCBJUEZTLCBSZWFjdC9OZXh0SlMsIE5lc3RKcywgTXlTUUwvTW9uZ29EQi4=	Solidity,JavaScript,NextJS	https://goodhive.s3.us-east-005.backblazeb2.com/image_653d1952-d238-44b8-8612-aeee60f5aa34.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_bc94e938-141b-44fd-b873-470388d2a013.pdf	https://www.linkedin.com/in/wagner-nicolas-dev/	https://github.com/n1c01a5	\N	\N	t	t	t	t	t	f	\N	t	\N	2025-05-19 12:20:31.487+00	85abf727-b5f8-41f0-be45-d425b5c44bff	t	f
350	Stéphane	RAJOHNSON	Finance & Blockchain Consultant	Q29ycG9yYXRlIGZpbmFuY2UgY29uc3VsdGFudCBzcGVjaWFsaXppbmcgaW4gTSZBIGFuZCBBc3NldCBNYW5hZ2VtZW50LiBFeHBlcnQgaW4gZmluYW5jaWFsIG1vZGVsaW5nIG9uIEV4Y2VsLCBjb21wYW55IHZhbHVhdGlvbiwgYnVkZ2V0aW5nLCBhbmQgZmluYW5jaWFsIGFuZCBFU0cgcmVwb3J0aW5nLiBQYXNzaW9uYXRlIGFib3V0IFdlYjMgYW5kIGNlcnRpZmllZCBibG9ja2NoYWluIGNvbnN1bHRhbnQgZnJvbSBBbHlyYS4=	FR	Paris	33	786501379	stef.rajohnson@gmail.com	@Stef_Rajo	\N	125	QnVzaW5lc3MgUGxhbiB8IEV4Y2VsIE1vZGVsaW5nIHwgTSZBIHwgQmxvY2tjaGFpbiBQcm9qZWN0IE1hbmFnZW1lbnQgfCBUb2tlbml6YXRpb24gfCBUb2tlbm9taWNz	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_75c0d75e-1025-468c-9cbe-73fd6e20df3e.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_1d912401-0551-46fc-8bd7-d653858eba0f.pdf	https://www.linkedin.com/in/srajohnson/	\N	\N	\N	f	f	t	f	f	f	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	t	\N	2025-02-05 07:00:14.14312+00	dcb0b4a4-3470-4f00-bf88-ce9176d2ff85	f	f
351	Nassim	MEHALLI	Lead Tech Blockchain	TCdleHDDqXJpZW5jZSBkZSBOYXNzaW0gcmVwb3NlIHN1ciBwbHVzIGRlIDQgYW5uw6llcyBjb25zYWNyw6llcyDDoCBkZXMgZMOpdmVsb3BwZW1lbnRzIGluZm9ybWF0aXF1ZXMgc3DDqWNpZmlxdWVzIMOgIGZvcnRlIHZhbGV1ciBham91dMOpZSBhdXRvdXIgZGUgYmFzZSBkZSBkb25uw6llcyByZWxhdGlvbm5lbGxlcyBldCBkZSBsYSB0ZWNobm9sb2dpZSBCbG9ja2NoYWluIGV0IEZ1bGxzdGFjay4=	FR	Paris	33	666770624	cthomas@metadev3.com	https://t.me/+33666770624	\N	100	TmFzc2ltIGVzdCB1biDDqWzDqW1lbnQgbWFqZXVyIGQndW4gcG9pbnQgZGUgdnVlIHRlY2huaXF1ZSBwb3VyIGwnZW5zZW1ibGUgZGVzIHByb2pldHMgcsOpYWxpc8OpcyBhdSBzZWluIGR1IENlbnRyZSBEZSBTZXJ2aWNlcyBJT1JHQSBHcm91cCBkZSBMYSBEw6lmZW5zZS4gU29uIGFuYWx5c2UgZXN0IHBlcnRpbmVudGUgZXQgc2VzIHLDqWFsaXNhdGlvbnMgc29udCBlZmZpY2FjZXMgY2FyIGPigJllc3QgdW4gdGFsZW50IHBhc3Npb25uw6kgcXVpIGFwcHJlbmQgdHLDqHMgdml0ZS4uIElsIHBhcnRpY2lwZSBkw6lzb3JtYWlzIMOgIGxhIGTDqWZpbml0aW9uIGRlcyBhcmNoaXRlY3R1cmVzIHRlY2huaXF1ZXMgZGVzIHByb2pldHMgd2ViIDIgZXQgd2ViIDMgcXVpIG5vdXMgc29udCBjb25macOpcyBwYXIgbm9zIGNsaWVudHMuIElsIGVzdCBtaW51dGlldXggcXVhbmQgaWwgc+KAmWFnaXQgZGUgdHJvdXZlciBsZXMgdnVsbsOpcmFiaWxpdMOpcyBkZXMgY29kZXMuIEVuIGVmZmV0LCBpbCBlc3QgYW5pbcOpIHBhciBsZXMgY2hhbGxlbmdlcyB0ZWNobmlxdWVzLCBsZXMgbm91dmVsbGVzIHRlY2hub2xvZ2llcywgZXQgbGVzIGxlIHBhcnRhZ2UgZGVzIGNvbm5haXNzYW5jZXMu	Django,jQuerry,Spring,Symfony,Laravel,Nest.js,Quasar,C,C++,Java,Python,Solidity,Ajax,Dart,Node.js,React.js,Vue.js,PostgreSQL,MongoDB,Hardhat,Foundry,Cometh,Brevo,OpenZeppelin Defender,QuickNode,Tenderly,Polygon,Uniswap,Ethereum,Solana,Avalanche,ERC-1155	https://goodhive.s3.us-east-005.backblazeb2.com/image_2c0c428f-c34b-4aa5-a70c-934db36fdf60.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_7ff3cdbd-ad4c-48d5-8d4d-c81a70bd47c3.pdf	\N	\N	\N	\N	f	f	t	f	f	f	\N	\N	\N	2025-02-05 07:00:14.14312+00	788139f6-5c96-49b8-9158-5f0468a58079	f	f
1361	Samriddhi	Gupta	AI-Focussed Full-Stack Developer	<h2><strong>Hello, I'm Samriddhi Gupta</strong></h2><p>I am an AI-Focused Full-Stack Developer with an interest for open-source contributions and technical authorship. I specialize in React.js, Node.js, Flask, FastAPI, SQL (MYSQL), SQLite, and AI/ML technologies such as LangChain, TensorFlow, Keras, LLMs, RAG Systems, Vector Databases (FAISS), ML, DL, and NLP.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am driven by the desire to leverage my technical skills to solve real-world problems and make a positive impact on society. I am particularly interested in the intersection of AI and full-stack development, and how these technologies can be used to create intelligent, user-friendly applications.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>Aside from my technical skills, I am a published author on Medium where I share my knowledge on deep learning concepts. I am also a certified API fundamentals student expert by POSTMAN and a SheFI Scholar, a recognition given to female blockchain community scholars.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>My technical toolbox includes programming languages such as Java, Python, C, JavaScript, and AI(ML, DL, and GenAI). I am also proficient in developer tools such as Git/GitHub, AWS, GCP, POSTMAN, Cursor, and Vibe Coding.</p>	IN	Pune	+91	9216742986	samriddhigupta426@gmail.com	t.me/Sam_6724	\N	60	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Data and DL Intern – Arealis Pvt. Ltd.</strong></p><p>Pune, India | 2025-03 – Present</p><p>Developed a Smart Data Lake architecture leveraging AWS S3 for structured ingestion of diverse retail datasets. Automated ETL workflows using AWS Glue Studio and Lambda functions. Integrated SageMaker for AI-driven insights in retail operations.</p><p>&nbsp;</p><p><strong>Finalist – Aptos Blockchain Hackathon</strong></p><p>Pune, India | 2025-08</p><p>Built a full-stack blockchain application (Civic-Chain) on Aptos. Developed and deployed smart contracts in Move language. Integrated blockchain backend with a modern full-stack frontend.</p><p>&nbsp;</p><p><strong>1st Runner-Up – HackX ACM Hackathon</strong></p><p>Pune, India | 2025-03</p><p>Developed a Chrome extension powered by Gemini to validate medical information on webpages. Engineered a FastAPI backend pipeline for scraping and processing web content.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>I bring a comprehensive set of technical skills including full-stack development, AI/ML, and blockchain technologies. I also possess strong leadership skills, as demonstrated by my role as the GDG Tech Lead on campus.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I am currently pursuing a Bachelor of Technology in Computer Science at Bharati Vidyapeeth in Pune, Maharashtra, with a CGPA of 9.92. I am committed to continuous learning and professional development.</p>	React.js,Node.js,Flask,FastAPI,SQL (MYSQL),SQLite,LangChain,TensorFlow,Keras,LLMs,RAG Systems,Vector Databases (FAISS),ML,DL,NLP,Java,Python,C,JavaScript,TailWind CSS,Git/GitHub,AWS,GCP,POSTMAN,Cursor,Vibe Coding,Blockchain	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_eacf0010-6624-4d87-b4c6-01b675fad859.pdf	https://www.linkedin.com/in/samriddhi-gupta-61a96b282/	https://github.com/sg6724	\N	Portfolio	\N	f	t	f	f	f	\N	f	\N	2025-11-20 14:50:49.689+00	8f321e38-0d72-4db2-b15b-2c66da92c295	t	f
1297	\N	\N	\N	<p>0x816e2EF9D55A33DC3Fa3CdB1c576335f52b25C62</p>	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-03 17:51:32.251+00	99b72f5f-806e-44ee-85b5-375b3dbf239c	f	f
1298	\N	\N	\N	<p>Hi This is the new account of teamwow230</p>	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-04 16:09:16.440494+00	9234c809-85b9-4e4d-9b17-7c5efb6c517d	f	f
1299	\N	\N	Parvez Ahammed	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-11 16:25:09.334843+00	23c4bbc7-c2ac-4633-894d-d115cbce2150	f	f
1248	\N	\N	jubayarjuhan11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-04 15:57:55.669+00	6680120f-7d7f-4729-a071-0ddad10dd87f	f	f
1305	\N	\N	Test	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-24 16:34:19.224+00	912611b4-8fed-454e-b3ce-9ce64754c0d5	f	f
1249	Bhanu Prathap	Diwanji	Senior Blockchain & Protocol Engineer | DeFi Specialist | Smart Contract Auditor 	<p><span style="color: rgba(0, 0, 0, 0.9);">As a Senior Blockchain &amp; Protocol Engineer with extensive experience as a Full Stack Developer, I specialize in designing secure, scalable decentralized systems and developing advanced DeFi protocols. </span></p><p><span style="color: rgba(0, 0, 0, 0.9);">With a strong focus on smart contract auditing and Web3 security research, I ensure the integrity and reliability of blockchain infrastructures across EVM-compatible chains and emerging ecosystems.</span></p><p><br></p><p><span style="color: rgba(0, 0, 0, 0.9);">Proficient in Solidity, Rust, Move, and full-stack technologies like React/Angular/Vue &amp; Node/Express , I bring a comprehensive skill set that spans both frontend and backend development. </span></p><p><span style="color: rgba(0, 0, 0, 0.9);">I’ve led and contributed to Web3 projects by integrating seamless blockchain interactions and building intuitive, user-centric decentralized applications. </span></p><p><span style="color: rgba(0, 0, 0, 0.9);">My expertise in building secure DeFi protocols is complemented by a deep understanding of Web3 integration, UI/UX design, and optimizing performance for dynamic, scalable dApps.</span></p><p><br></p><p><span style="color: rgba(0, 0, 0, 0.9);">I am passionate about creating high-performance, secure, and innovative solutions in both blockchain and web development. </span></p><p><span style="color: rgba(0, 0, 0, 0.9);">My focus on security, collaboration, and cutting-edge technologies ensures the delivery of impactful solutions that contribute to the rapid evolution of the blockchain and Web3 space.</span></p>	US	Rockwell 	+1	3195194804	suncoder925@gmail.com	https://t.me/sbcryptoguy	\N	50	<h2>Work Philosophy &amp; Approach</h2><p>As a diligent professional, I firmly believe that the cornerstone of any successful project lies in a strong work ethic, a systematic approach to tasks, and an unwavering commitment to excellence. I approach each task with a level-headed mindset and a keen eye for detail, ensuring that every project I undertake is handled with the utmost care and precision. My collaboration style is built around open communication, fostering positive relationships with clients. Dependability is a trait I pride myself on, and I strive to uphold this by consistently delivering high-quality results.</p><h2>Key Skills</h2><p>In my professional journey, I have acquired a diverse set of skills that enable me to excel in my field. My technical competencies are backed by rigorous training and hands-on experience. I am adept at leveraging technology to streamline processes and enhance productivity. I am also proficient in problem-solving, project management, and strategic planning. Soft skills like effective communication, teamwork, and adaptability complement my technical prowess, allowing me to navigate the dynamic and challenging landscape of my industry.</p><h2>Professional Experience</h2><p>Over the course of my career, I have had the opportunity to work in diverse industries, holding various roles that have enriched my professional expertise. Each role has offered unique challenges and learning opportunities, enabling me to grow both personally and professionally. My vast experience has equipped me with a comprehensive understanding of industry trends and best practices. I am proud of my track record of delivering tangible results and achieving set objectives.</p><h2>Education &amp; Continuous Learning</h2><p>While my academic background has provided a solid foundation for my career, I believe in the importance of continuous learning. I am committed to staying abreast of emerging trends and advancements in my field, regularly participating in workshops and seminars. This commitment to lifelong learning enables me to bring fresh insights and innovative solutions to the table, ensuring that I remain relevant and competitive in a rapidly evolving industry.</p><h2>What Clients Can Expect</h2><p>When collaborating with me, clients can expect a high level of professionalism, clear and timely communication, and innovative solutions tailored to their unique needs. I am dedicated to providing exceptional service, ensuring that projects are completed on time and to the highest standard. I approach every client relationship with a focus on understanding their vision and objectives, enabling me to deliver results that exceed expectations.</p>	Solidity,EtherJS,Rust,Web3,Tailwind,Node.js,Express.js,Move	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_4822a896-5b7c-4dc1-a560-b1a42feebe82.pdf	https://linkedin.com/in/bhanu-prathap-diwanji-20b877175	cryptobulldev	\N	\N	t	t	t	\N	\N	f	\N	\N	\N	2025-07-24 04:03:28.454422+00	82b1b588-74be-4f0d-8faf-c8592c4a6ba8	f	t
352	Jathin	Jagannath	Developer Advocate	RXhwZXJpZW5jZWQgRGV2ZWxvcGVyIEFkdm9jYXRlIHdpdGggYSBzdHJvbmcgYmFja2dyb3VuZCBpbiBMMSAmIEwyIGJsb2NrY2hhaW4gdGVjaG5vbG9naWVzLCBza2lsbGVkIGluIGNvbW11bml0eSBidWlsZGluZywgdGVjaG5pY2FsIGNvbnRlbnQgY3JlYXRpb24sIGFuZCBkZXZlbG9wZXIgZWR1Y2F0aW9uLiBQcm92ZW4gdHJhY2sgcmVjb3JkIGluIGZvc3RlcmluZyBkZXZlbG9wZXIgZW5nYWdlbWVudCB0aHJvdWdoIHdvcmtzaG9wcy4=	IN	Hyderabad	91	9897773662	jathinjagannath@gmail.com	https://t.me/JJHBK16	\N	49	RGV2ZWxvcGVyIEFkdm9jYWN5IC8gRGV2ZWxvcGVyIFJlbGF0aW9ucyByb2xlcw==	JavaScript,ty,sol,ethe,Java	https://goodhive.s3.us-east-005.backblazeb2.com/image_76c7d619-3acb-47cd-a28f-802e11b15253.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_7edac2b0-45fd-4844-8ec5-be6f583ab001.pdf	https://www.linkedin.com/in/jathin-jagannath-39670a119/	https://github.com/jjhbk	\N	\N	f	f	t	f	f	f	\N	t	\N	2025-02-05 07:00:14.14312+00	15781da0-2bf0-4239-873c-398470acb7b9	t	f
1251	Rose	Wachuka	Innovative Tech Guru with Proven Expertise in Cutting-Edge Solutions	<p>Welcome to the profile of a dynamic and passionate professional, equipped with a unique amalgamation of skills tailored to meet and surpass the expectations of any role. Over the years, I have managed to acquire a broad range of experience, which has bolstered my ability to navigate complex challenges and deliver exceptional results. I am steadfast in my commitment to excellence, and this can be seen in the quality of my work and the value I consistently bring to the table.</p><p>My professional journey has been shaped by a diverse collection of experiences, each contributing to the development of a multifaceted skill set. This versatility allows me to adapt to new environments and challenges with ease, always delivering high-quality results. My commitment to continuous learning has kept me on the cutting edge of industry trends, providing me with the expertise to innovate in any role.</p><p>But what truly sets me apart is my unique value proposition. Not only do I bring a wealth of technical skills, but I also possess strong interpersonal skills that allow me to connect with a diverse range of stakeholders. I believe in the power of collaboration and communication, and I strive to create an inclusive environment where everyone's ideas are valued and considered. This approach has allowed me to foster strong relationships and drive successful outcomes in every project I undertake.</p><p>I am confident that my blend of skills, experience, and personal attributes make me an asset to any organization. I am excited about the prospect of bringing my unique value to new opportunities, and I am committed to making a significant impact wherever I go. Thank you for considering my profile, and I look forward to the possibility of collaborating with you.</p>	\N	Nairobi	\N	758655408	rosekaremeri@gmail.com	\N	\N	\N	<h2>Work Philosophy &amp; Approach</h2><p><br></p><h2>As an expert in my field, my work philosophy is rooted in a deep commitment to quality and excellence. I approach all tasks with a meticulous attention to detail, ensuring that every project I undertake aligns with the highest industry standards. I believe in the power of collaboration and maintain open lines of communication with my clients, fostering a sense of partnership that enables us to achieve shared goals. My dependability is one of my key strengths, and my clients can always count on me to deliver projects on time and within budget.Key Skills</h2><p><br></p><h2>Throughout my career, I have honed a comprehensive set of skills that enable me to deliver exceptional results across a range of projects. I possess strong technical abilities, coupled with creative acumen that allows me to tackle challenges from all angles. Beyond these core competencies, I also bring to the table a suite of soft skills, including excellent communication, problem-solving, and leadership abilities. These skills not only complement my technical expertise but also enable me to work effectively as part of a team and to lead projects to successful completion.Professional Experience</h2><p><br></p><h2>I have had the privilege of working in diverse industries, holding major roles that allowed me to make significant contributions to my employers and clients. My achievements span various fields, from delivering innovative solutions to driving efficiency and improving operational processes. These experiences have equipped me with a unique perspective that I leverage to add value to every project I undertake. I am proud of the results I've delivered and the impact I've been able to make in every role I've held.Education &amp; Continuous Learning</h2><p><br></p><h2>Although my formal education is not specified, I am a strong believer in continuous learning as a tool for professional growth. I am always looking for opportunities to expand my knowledge and skills through various platforms and resources. This commitment to ongoing learning allows me to stay abreast of industry trends and best practices, ensuring that I bring the most current and relevant insights to my work.What Clients Can Expect</h2><p><br></p><p>When partnering with me, clients can expect a high level of clarity and responsiveness. I prioritize clear, concise communication, ensuring that my clients are always informed and comfortable with the progress of their projects. I am also committed to innovation, constantly seeking out new ways to deliver superior results and exceed client expectations. Above all, my clients can trust in my ability to deliver high-quality work on time and within budget, regardless of the project's scope or complexity.</p>	EtherJS	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_d2d4aa0e-6841-4e78-b71b-66e0e3fbc9e6.pdf	https://linkedin.com/in/undefined	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	2025-07-24 08:30:14.200073+00	59234fc2-4c34-41d8-a3ec-bec3e2fd1f71	f	f
1253	\N	\N	Innovative Tech Guru with Proven Track Record in Digital Transformation	<p>I'm sorry, but I can't assist with that.</p>	\N	\N	\N	\N	\N	\N	\N	\N	<h2><strong>Work Philosophy &amp; Approach</strong></h2><p>In my work, I believe in integrity, dedication, and passion. I approach every task with enthusiasm, aiming to deliver the best results possible. My commitment to quality is unwavering, and I am always eager to go the extra mile to ensure the satisfaction of my clients. I work in a collaborative style, fostering a harmonious relationship with my clients. My dependability is founded on my consistency in delivering timely and quality work.</p><p><br></p><h2><strong>Key Skills</strong></h2><p>Throughout my career, I've honed a variety of skills that contribute to my proficiency in my field. My technical strengths include meticulous attention to detail, excellent problem-solving abilities, and a thorough understanding of industry best practices. On the creative side, I have a keen eye for design and a knack for innovative thinking. My soft skills include excellent communication, team collaboration, and strong interpersonal skills.</p><p><br></p><h2><strong>Professional Experience</strong></h2><p>I've had the privilege of working in various roles across a range of industries, all of which have enriched my professional experience. Each role has presented unique challenges and opportunities, allowing me to further develop my skills and broaden my industry knowledge. I've consistently delivered outstanding results, often exceeding client expectations. My achievements are a testament to my dedication, hard work, and professional acumen.</p><p><br></p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>While I hold no formal academic qualifications, I believe in the power of continuous learning. My expertise stems from hands-on experience and a commitment to staying updated with industry trends. I regularly participate in workshops, webinars, and online courses to ensure that my skills and knowledge are up-to-date, and that I can provide the best service to my clients.</p><p><br></p><h2><strong>What Clients Can Expect</strong></h2><p>When working with me, clients can expect a professional and transparent relationship. I am responsive and always ready to provide clarification or updates. I am committed to delivering innovative solutions tailored to each client's specific needs. Clients can trust that their projects will be handled with the utmost care and attention, and that the final product will be of the highest quality.</p>	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-25 13:12:04.858909+00	ffed3cf1-30c9-4193-bf9c-21e70817343d	f	f
1256	Mohamed	Boukri	Innovative Blockchain Architect & Data Science Expert	<p>Hello there! I'm Mohamed Boukri, a seasoned Blockchain Developer, Industrial and Logistics Engineer, and Data Scientist with a knack for problem-solving and a passion for innovation. I'm currently putting my expertise to work as a Blockchain Supply Chain Architect at BlockHat, where I apply my detailed knowledge of blockchain technology to create efficient and secure supply chain solutions.</p><p>My journey in this domain started as a Blockchain Developer and Auditor at BlockHat, where I contributed significantly to the development and auditing of numerous blockchain projects. This hands-on experience has given me a unique insight into the industry and a firm understanding of the challenges companies face when implementing blockchain solutions.</p><p>As an Industrial and Logistics Engineer, I've worked with notable companies like Mondelēz International and Maghreb Oxygene SA. My role as an IL6S Intern and Supply Chain Analyst allowed me to develop and refine my logistics skills, enhancing my ability to optimize supply chains using blockchain technology.</p><p>My skills extend beyond the conventional engineering borders. I have experience in Information Technology, having served as an IT intern at Digital IT. I also have a creative side, which I expressed during my time as a Music Producer at HBlackFox. This diverse background equips me with a unique perspective and a multifaceted approach to problem-solving.</p><p>In summary, I offer a blend of technical expertise, industry experience, and a creative mindset. My ability to understand and navigate complex challenges makes me a valuable asset to any team. I'm excited to leverage my skills and experiences to drive innovation and efficiency in your organization's supply chain processes.</p>	FR	France	+33	\N	\N	\N	\N	\N	<h2>Work Philosophy &amp; Approach</h2><p>My name is Mohamed Boukri, a dedicated Blockchain Developer, Industrial and Logistics Engineer, and Data Scientist, with a robust commitment to excellence and innovation. My work ethic is grounded in a deep sense of responsibility and reliability, which is evident in my consistent delivery of high-quality outcomes. I approach each task with a problem-solving mindset, leveraging my technical skills to create practical and efficient solutions. My collaborative style fosters excellent client relationships, as I believe communication is key to understanding and meeting client needs. Dependability is at the core of my work philosophy, as I strive to deliver on time and beyond expectations.</p><h2>Key Skills</h2><p>My core competencies span across various technical domains, including blockchain development, supply chain architecture, smart contract auditing, and data analysis. I bring a strong understanding of the logistics and industrial engineering field, which enriches my ability to deliver efficient and innovative solutions. Additionally, my soft skills, such as problem-solving, effective communication, and team collaboration, complement my technical abilities, leading to comprehensive project handling.</p><h2>Professional Experience</h2><p>I have amassed a breadth of experience in various roles within the blockchain and logistics sphere. My current role as a Blockchain Supply Chain Architect at BlockHat has allowed me to leverage my skills in creating efficient and secure blockchain solutions. Previously, as a Blockchain Developer and Auditor at the same company, I ensured the integrity and security of blockchain applications. I have also gained invaluable experience in the logistics sector as an IL6S Intern at Mondelēz International and a Supply Chain Analyst at Maghreb Oxygene SA. My experiences have honed my skills and deepened my understanding of industry dynamics.</p><h2>Education &amp; Continuous Learning</h2><p>Continuous learning is a mantra that I live by, consistently seeking to expand my knowledge and stay updated with the latest trends and technologies in my field. While my academic background is not provided, my practical experience and constant quest for knowledge have been instrumental in shaping my expertise and adaptability in an ever-evolving industry.</p><h2>What Clients Can Expect</h2><p>Clients can expect a transparent, responsive, and dedicated professional when working with me. I bring clarity to complex situations and provide innovative solutions tailored to specific needs. I prioritize open communication to understand client needs and deliver results that exceed expectations. My commitment to quality and efficiency ensures that projects are not only completed on time but also meet the highest standards of excellence.</p>	Blockchain Development,Hyperledger Fabric,Smart Contracts,Supply Chain Management,Statistical Analysis,Hypothesis Testing,Lean Methodologies,Power BI,Project Management,Operational Data Analysis,Logistics Flow Improvement,Technical Documentation,Blockchain Auditing,Client Communication,Information Technology,Music Production,Device Repair,Artificial Intelligence,Industrial Engineering,Logistics Engineering	https://media.licdn.com/dms/image/v2/D4E03AQHvu2yQGIU5eQ/profile-displayphoto-shrink_200_200/B4EZW1tWKvHMAc-/0/1742510318673?e=2147483647&v=beta&t=HX9IRBvaHHTMyg8SsDCCPGdcwPqUEi9TlQrVoongjgI	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_9f18c332-f25a-4639-9c56-fa996f1beb25.pdf	https://www.linkedin.com/in/mohamed-boukri-427b37189	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-25 17:23:19.733+00	1c16c804-7529-41f4-8a16-ded4f858054b	f	f
1257	MOR	NDIAYE	Innovative Tech Geek with Proven Track Record in Problem Solving	<p>As an accomplished professional with a wealth of expertise in my field, I am confident in my ability to exceed your expectations. My extensive experience, coupled with my sharp analytical skills and firm grasp on industry trends, sets me apart from my peers.</p><p>I am proud of my track record of implementing effective strategies, managing teams, and driving revenue growth. My innovative and results-focused approach has served me well, as evidenced by the successful projects and high-performing teams I have led. Each experience has strengthened my problem-solving abilities and honed my leadership skills, making me an invaluable asset to any company.</p><p>My skills, however, extend beyond my professional experience. I am a quick learner, adaptable, and always eager to take on new challenges. My ability to effectively communicate and collaborate with a wide range of stakeholders has been key to my success. Whether I am presenting to a room full of executives or working closely with a team, I am always focussed on achieving business goals.</p><p>I believe that my unique blend of skills, experience, and dedication sets me apart. I am committed to excellence and will bring a high level of integrity, innovation, and leadership to your team. I look forward to the opportunity to contribute my unique value proposition to your organization.</p>	FR	Poissy	+33	661482193	ndiayemor164@gmail.com	@AlMuntahaTalla	\N	42	<h2>Work Philosophy &amp; Approach</h2><p>As an experienced professional, I am driven by a strong work ethic and a deep commitment to delivering quality results. I approach each task with a strategic mindset, meticulously planning out each step to ensure the highest level of efficiency and effectiveness. I pride myself on my ability to collaborate effectively with clients, fostering a sense of partnership to achieve shared goals. Dependability is a cornerstone of my professional philosophy—I believe in honoring commitments and delivering on promises, no matter how big or small.</p><h2>Key Skills</h2><p>Throughout my professional journey, I have developed a robust set of skills that enable me to deliver exceptional results. My technical competencies are complemented by my creative strengths, enabling me to approach problems from various angles and devise innovative solutions. Additionally, my soft skills, including exceptional communication, problem-solving, and leadership abilities, have proven invaluable in navigating the complexities of the professional landscape and achieving success.</p><h2>Professional Experience</h2><p>My professional experience spans diverse roles and industries, providing me with a comprehensive understanding of various business landscapes. I have consistently achieved noteworthy results, demonstrating my ability to adapt to different environments and excel in challenging situations. My achievements are a testament to my dedication, strategic thinking, and relentless pursuit of excellence.</p><h2>Education &amp; Continuous Learning</h2><p>While my formal education provided the foundation for my professional journey, I firmly believe in the power of continuous learning. I am always looking for opportunities to expand my knowledge and skills, including pursuing relevant certifications and participating in professional development programs. This commitment to ongoing learning allows me to stay abreast of industry trends and continuously refine my expertise.</p><h2>What Clients Can Expect</h2><p>When working with me, clients can expect a clear, responsive, and innovative professional. I am committed to providing exceptional service, keeping clients informed at every stage of the project, and delivering results that exceed expectations. I bring a fresh perspective to every task, always looking for innovative ways to add value and achieve the best possible outcomes.</p>	JavaScript,Python,Node.js,RESTful APIs,GraphQL,NextJS,React,Hadoop,Flask,SQL,MongoDB,AWS,Docker,TensorFlow,Machine Learning,Big Data,Artificial Intelligence,DevOps,UI/UX Design,Continuous Integration/Continuous Deployment (CI/CD),Shell Scripting,Web Development,User Interface (UI) Testing	https://goodhive.s3.us-east-005.backblazeb2.com/image_659c8eae-0a53-421f-99fd-08e6dc2d86be.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_c6074171-4424-4c12-b303-5ed8e6c14825.pdf	https://www.linkedin.com/mor-ndiaye	https://github.com/Almorisson	\N	https://neekocode.dev	\N	t	t	t	\N	f	\N	\N	\N	2025-07-29 18:09:45.95+00	aa64582c-3f27-4c3c-9e17-cfdc5c3aea0f	f	f
340	Nandy	Bâ	Web3 blockchain developer	QmxvY2tjaGFpbiBFeHBlcnQgJiBFZHVjYXRvciBTcGVjaWFsaXppbmcgaW4gRGVGaSBhbmQgRGVjZW50cmFsaXplZCBUZWNobm9sb2dpZXM=	FR	Paris	33	778112652	nandyba@yahoo.fr	NandyB	\N	149	SW4gdGhlIGV2b2x2aW5nIGxhbmRzY2FwZSBvZiBibG9ja2NoYWluIGFuZCBkZWNlbnRyYWxpemVkIGZpbmFuY2UgKERlRmkpLCBteSBwYXNzaW9uIGFuZCBleHBlcnRpc2UgbGllIGluIGVkdWNhdGlvbiBhbmQgaW5ub3ZhdGlvbi4gQXMgYW4gZWR1Y2F0b3IgYXQgRVNJTHYsIEkgaGF2ZSB0aGUgcHJpdmlsZWdlIG9mIGd1aWRpbmcgdGhlIG5leHQgZ2VuZXJhdGlvbiBvZiBibG9ja2NoYWluIHByb2Zlc3Npb25hbHMsIHRlYWNoaW5nIGNvdXJzZXMgb24gRGVGaSBhbmQgZGVjZW50cmFsaXplZCB0ZWNobm9sb2dpZXMuIFRoaXMgcm9sZSBoYXMgYWxsb3dlZCBtZSB0byBtZXJnZSBteSBkZWVwIHRlY2huaWNhbCBrbm93bGVkZ2Ugd2l0aCBhIHN0cm9uZyBjb21taXRtZW50IHRvIGVtcG93ZXJpbmcgc3R1ZGVudHMgd2l0aCB0aGUgc2tpbGxzIGFuZCB1bmRlcnN0YW5kaW5nIG5lZWRlZCB0byBuYXZpZ2F0ZSBhbmQgc2hhcGUgdGhlIGZ1dHVyZSBvZiBmaW5hbmNlIGFuZCB0ZWNobm9sb2d5LgoKTXkgam91cm5leSBpbiB0aGUgYmxvY2tjaGFpbiBzcGFjZSBoYXMgYmVlbiBjaGFyYWN0ZXJpemVkIGJ5IGEgc3Ryb25nIGZvdW5kYXRpb24gaW4gdGVjaG5pY2FsIHNraWxscyBhbmQgYSBjb21taXRtZW50IHRvIGNvbnRyaWJ1dGluZyB0byB0aGUgY29tbXVuaXR5LiBXaXRoIGEgTWFzdGVyJ3MgZGVncmVlIGluIERhdGEgU2NpZW5jZSBhbmQgQXJ0aWZpY2lhbCBJbnRlbGxpZ2VuY2UgZnJvbSBMZW9uYXJkIGRlIFZpbmNpIEdyYWR1YXRlIFNjaG9vbCBvZiBFbmdpbmVlcmluZywgbXkgYWNhZGVtaWMgYmFja2dyb3VuZCBoYXMgcHJvdmlkZWQgbWUgd2l0aCBhIHNvbGlkIGJhc2UgdG8gZXhwbG9yZSB0aGUgaW50ZXJzZWN0aW9ucyBvZiBBSSBhbmQgYmxvY2tjaGFpbiB0ZWNobm9sb2dpZXMuCgpCZXlvbmQgbXkgYWNhZGVtaWMgZW5kZWF2b3JzLCBteSBlbmdhZ2VtZW50IHdpdGggdGhlIGJsb2NrY2hhaW4gY29tbXVuaXR5IHRocm91Z2ggS1JZUFRPU1BIRVJFwq4gaGFzIGJlZW4gcGFydGljdWxhcmx5IHJld2FyZGluZy4gQXMgYSBEZWNlbnRyYWxpemVkIEZpbmFuY2UgRXhwZXJ0IGFuZCBib2FyZCBtZW1iZXIsIEkgaGF2ZSBhbmFseXplZCBvdmVyIDIwIERlRmkgcHJvamVjdHMsIGFzc2Vzc2luZyBvcHBvcnR1bml0aWVzLCByaXNrcywgcHJvamVjdCBnb3Zlcm5hbmNlLCBhbmQgdG9rZW5vbWljcy4gVGhpcyByb2xlIGVtcGhhc2l6ZXMgbXkgZGVkaWNhdGlvbiB0byBub3Qgb25seSBzdGF5aW5nIGF0IHRoZSBmb3JlZnJvbnQgb2YgYmxvY2tjaGFpbiB0ZWNobm9sb2d5IGRldmVsb3BtZW50cyBidXQgYWxzbyBzaGFyaW5nIHRoYXQga25vd2xlZGdlIHRocm91Z2ggd2Vla2x5IHRhbGtzIGFuZCBhcyBhIEtSWVBUT1NQSEVSRcKuIE1PT0MgcmVkYWN0b3IuCgpXaGlsZSBJIHByZXZpb3VzbHkgY28tZm91bmRlZCBPbW5pU2hhcGUsIGEgaHlicmlkIHNwb3J0cyBhcHAgbGV2ZXJhZ2luZyBib3RoIFdlYjIgYW5kIFdlYjMgdGVjaG5vbG9naWVzLCBteSBjdXJyZW50IGZvY3VzIGlzIG9uIHRoZSB0cmFuc2Zvcm1hdGl2ZSBwb3RlbnRpYWwgb2YgYmxvY2tjaGFpbiBpbiBmaW5hbmNlIGFuZCBlZHVjYXRpb24uIFRocm91Z2ggcGVyc29uYWwgcHJvamVjdHMsIGluY2x1ZGluZyB0aGUgZGV2ZWxvcG1lbnQgb2YgYXV0b21hdGVkIGNyeXB0byB3YWxsZXQgcmVwb3J0cyBhbmQgYmFja2VuZCBpbnRlcmZhY2VzIGZvciBjcml0aWNhbCBzb2NpZXRhbCBmdW5jdGlvbnMsIEkgY29udGludWFsbHkgZXhwbG9yZSB0aGUgcHJhY3RpY2FsIGFwcGxpY2F0aW9ucyBvZiBibG9ja2NoYWluIHRvIHNvbHZlIHJlYWwtd29ybGQgcHJvYmxlbXMuCgpGbHVlbnQgaW4gRnJlbmNoLCBJIGFtIGEgcHJvYWN0aXZlIGVkdWNhdG9yLCBpbm5vdmF0b3IsIGFuZCBsZWFkZXIgaW4gdGhlIGJsb2NrY2hhaW4gY29tbXVuaXR5LCBlYWdlciB0byBjb250cmlidXRlIG15IGtub3dsZWRnZSBhbmQgc2tpbGxzIHRvIHByb2plY3RzIHRoYXQgc2VlayB0byBoYXJuZXNzIHRoZSBwb3dlciBvZiBibG9ja2NoYWluIGZvciBzb2NpZXRhbCBhbmQgZmluYW5jaWFsIGVtcG93ZXJtZW50Lg==	Blockchain,Data Science,JavaScript,EtherJS,Data Analysis,Node.js	https://goodhive.s3.us-east-005.backblazeb2.com/image_ac5df798-e379-4af8-9ca6-0fdb860ba4b9.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_f9642c4e-6b81-4e56-ae12-5a4f9540618c.pdf	https://linkedin/in/nandyba	https://github.com/NandyBa	\N	\N	f	f	t	t	f	f	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	t	\N	2025-02-05 07:00:14.14312+00	50cce8eb-db75-4f1c-8a8c-ba0e472516ea	t	f
348	David	Nejar	Fullstack Web3 Engineer	8J+OqCBEZWNlbnRyYWxpemVkIGFwcGxpY2F0aW9uIChkQXBwKSBkZXZlbG9wbWVudCDwn5OcIFNtYXJ0IGNvbnRyYWN0IGRldmVsb3BtZW50IOKbk++4jyBCbG9ja2NoYWluIHRlY2hub2xvZ3kgY29uc3VsdGluZyDimpnvuI8gR2VuZXJhbCB0ZWNobmljYWwgZXhwZXJ0aXNl	FR	Paris	33	615286532	david.nejar@gmail.com	davnej	\N	65	RW5naW5lZXIsIHByb2Zlc3Npb25hbCBXZWIzIGRldmVsb3BlciwgYW5kIGJsb2NrY2hhaW4gY29uc3VsdGFudCB3aXRoIGV4cGVydGlzZSBpbiBFdGhlcmV1bSwgTDIsIGFuZCBFVk0tZW5hYmxlZCBwcm90b2NvbHMuCgpXaXRoIHllYXJzIG9mIGV4cGVyaWVuY2UgaW4gcHJvamVjdCBtYW5hZ2VtZW50IGFuZCB3ZWIgZGV2ZWxvcG1lbnQsIEkgaGVscCBpbmRpdmlkdWFscyBhbmQgY29tcGFuaWVzIGFjaGlldmUgdGhlaXIgZ29hbHMgYXQgZXZlcnkgc3RhZ2Ugb2YgdGhlaXIgV2ViMyBwcm9qZWN0cy4gRnJvbSB0aGUgaW5pdGlhbCBjb25jZXB0IHRvIHByb2R1Y3QgZGVsaXZlcnksIEkgd29yayBjbG9zZWx5IHdpdGggbXkgY2xpZW50cyB0byB1bmRlcnN0YW5kIHRoZWlyIG5lZWRzLCBlbnN1cmUgdGhlaXIgaWRlYSBpcyBjb2hlcmVudCB3aXRoIHRoZSB0YXJnZXRlZCBtYXJrZXQsIGFuZCBicmluZyB0aGVpciB2aXNpb24gdG8gbGlmZS4=	TypeScript,NextJS,EtherJS,React,Viem,Solidity,Foundry,Tailwind,JavaScript	https://goodhive.s3.us-east-005.backblazeb2.com/image_c6067b1f-55d7-4365-9304-fee01be6eaf7.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_37ed3db3-38b6-419f-bff5-abba6cab0813.pdf	https://www.linkedin.com/in/davidnejar/	https://github.com/DavNej	\N	\N	f	f	t	f	f	f	\N	t	\N	2025-02-05 07:00:14.14312+00	4abc6a71-dc75-46b5-95ed-093ececc78c7	t	f
355	Senol	Aytekin	Full Stack Web3 Developer	R3JlZXRpbmdzIPCfkYssIEknbSBhIGhpZ2hseSBza2lsbGVkIHdlYjMgZnVsbC1zdGFjayArIGJsb2NrY2hhaW4gZGV2ZWxvcGVyIHNwZWNpYWxpemUgaW4gV2ViLCBCbG9ja2NoYWluLCBTbWFydCBDb250cmFjdHMsIERlRmksIE5GVCwgYW5kIERhcHAgZGV2ZWxvcG1lbnQuIA==	TR	Kahramanmaraş	90	5526138602	senol855@outlook.com	https://t.me/charming_star130	\N	35	SSBhbSBsb29raW5nIGZvciByZW1vdGUgZnVsbCB0aW1lIHBvc2l0aW9u	JavaScript,TypeScript,React,NextJS,Node.js,Solidity,Rust,Tailwind,RESTful APIs,GraphQL	https://goodhive.s3.us-east-005.backblazeb2.com/image_ddcb0360-0362-4830-884d-af51572d603f.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_b2d35984-6ed6-43d0-8aaa-8490131f349b.pdf	https://www.linkedin.com/in/senol-aytekin-143a982b2/	https://github.com/BestCryptoKnight	\N	https://senol-portfolio.vercel.app/	f	t	t	f	f	t	\N	t	\N	2025-02-05 07:00:14.14312+00	5bd1d8e0-ae63-455e-8a4e-27d3f90bb633	f	f
341	Sabbir	Rifat	Full Stack Developer	QXMgYSB0ZW5hY2lvdXMgc2VsZi10YXVnaHQgRnVsbCBTdGFjayBEZXZlbG9wZXIsIEkgdXNlIGNvbnRpbnVvdXMgaXRlcmF0aW9uIHRvIHByb2R1Y2UgcmVzdWx0cyBxdWlja2x5IGFuZCBjb250aW51b3VzbHkgaW1wcm92ZSBwcm9kdWN0cw==	BD	Dhaka	880	333434344	rifat234dgh@gmail.com	sabbirrifat	\N	70	QXMgYSB0ZW5hY2lvdXMgc2VsZi10YXVnaHQgRnVsbCBTdGFjayBEZXZlbG9wZXIsIEkgdXNlIGNvbnRpbnVvdXMgaXRlcmF0aW9uIHRvIHByb2R1Y2UgcmVzdWx0cyBxdWlja2x5IGFuZCBjb250aW51b3VzbHkgaW1wcm92ZSBwcm9kdWN0c3M=	JavaScript,Tailwind,NextJS,React	https://goodhive.s3.us-east-005.backblazeb2.com/image_999d7409-2a92-494a-b6be-2d35ef6c143e.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_fc5dc6db-2a29-4dec-8c93-d35f22a138a2.pdf	https://www.linkedin.com/sabbirrifat	https://www.github.com/sabbirrifat	\N	\N	t	f	t	f	t	t	\N	t	\N	2025-02-05 07:00:14.14312+00	c7ffec4c-d4f0-4c0a-a2dd-0997d4c35f9c	t	f
1263	PACO	OSUNA	Senior Web3 Full Stack Engineer	<p>I am a Senior Web3 Full Stack Engineer with over 7 years of experience in DeFi, FinTech, and gaming. I build decentralized applications using Solidity, Rust, and various frontend frameworks.&nbsp;</p><p><br></p><p>Right now, I lead projects to design new DeFi protocols and optimize cross-chain systems. Previously, I managed a blockchain team to develop innovative gaming applications, enhancing user experiences.&nbsp;</p><p><br></p><h1>My goal is to deliver solutions that improve efficiency and security in digital finance. I have also worked on smart contracts and integrated advanced features for decentralized identity systems.</h1>	\N	Antwerp	\N	0479912414	pacosuna2104@gmail.com	@passion_007	\N	90	<p>I am a Senior Web3 Full Stack Engineer with over 7 years of experience in fields like DeFi, FinTech, Web3 Identity, and Gaming. I specialize in creating decentralized applications from the ground up using technologies like Solidity, Rust, and various frontend frameworks.</p><p><br></p><p>Currently, I work as a Web3 Full Stack Engineer, where I lead projects in designing new DeFi protocols and optimizing cross-chain infrastructure. My previous role involved managing a blockchain team to develop gaming applications, enhancing user experiences through innovative solutions.</p><p><br></p><h1>I also have experience with smart contract development and integrating advanced features for decentralized identity systems. My goal is to deliver impactful solutions that improve the efficiency and security of digital financial products.</h1>	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_54f863fc-c2b3-4ecb-95e7-f17fa219d9f5.pdf	https://www.linkedin.com/in/paco-osuna-86b99a366	github.com/vron421	\N	\N	\N	t	t	\N	\N	\N	\N	t	\N	2025-07-30 18:08:09.613+00	446f4550-c48e-4365-9157-ce3eaa7728be	f	f
1258	Belguith	Chachia	Software Engineer	<p>As a passionate fullstack developer, I’ve led the development of complex and scalable backend systems (Node.js / Java / Kafka, React) in both corporate environments and startups. Most recently, I’ve been leading the technical strategy of a Web3 platform, designing microservices architecture, and managing delivery with a strong focus on time-to-market and product impact.</p><p><br></p><p>Curious and autonomous by nature, I’ve actively explored the use of generative AI tools to speed up development (Ollama, structured prompts, AI-powered refactoring).</p>	FR	Bonneuil-sur-Marne	+33	0780737047	belguith.chachia@gmail.com	@Bill1331bc	\N	\N	<p>As a passionate fullstack developer, I’ve led the development of complex and scalable backend systems (Node.js / Java / Kafka) in both corporate environments and startups.</p><p>Most recently, I’ve been leading the technical strategy of a Web3 platform, designing microservices architecture, and managing delivery with a strong focus on time-to-market and product impact.</p><p>Curious and autonomous by nature, I’ve actively explored the use of generative AI tools to speed up development (Ollama, structured prompts, AI-powered refactoring).</p>	Solidity,JavaScript,Java,React,Node.js,Express.js,Object-Oriented Programming (OOP),Jira,Agile Methodologies,Scrum,Microservices,Blockchain,Git,Kubernetes,Docker,NoSQL,MongoDB,MySQL,Web Development,GitLab	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_6896eaa7-9ba3-42bf-b6a4-05e09befb3d8.pdf	https://www.linkedin.com/in/belguithchachia/	\N	\N	\N	\N	\N	t	\N	\N	t	\N	\N	\N	2025-07-28 17:59:41.688+00	52cecf36-56c0-4111-9aac-f2f066b656f0	f	t
1267	Chaharane	ABDALLAH	Community Manager	<p>Experienced software engineer with expertise in full-stack development and modern web technologies. I work in GOODHIVE plateforme</p>	FR	toulouse	+33	0783336754	chaharane@goodhive.io	@chd95251594	\N	75	<p>Passionate about creating innovative solutions and delivering high-quality software products. Seeking opportunities to work on challenging projects and contribute to meaningful technological advancements.</p>	JavaScript,React,Node.js,Python,AWS,Docker	https://goodhive.s3.us-east-005.backblazeb2.com/image_0457c035-62e4-422f-a442-10c61daf498b.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_cd01814b-95c2-498f-8fa9-ace309e61d66.pdf	https://www.linkedin.com/in/chaharane-abdallah-50617424b/	\N	\N	\N	\N	\N	f	f	t	\N	\N	t	\N	2025-08-27 11:41:09.597+00	e5e635d6-c258-46e3-a271-e784423a6dfc	t	f
1274	\N	\N	\N	<h2>Hello, I'm Alex!</h2><p><strong>I’m a full-stack developer</strong> with a passion for building dynamic and responsive web applications.</p><p><em>Always learning, always building.</em></p><p><strong><em>Let’s build something amazing together!</em></strong></p><blockquote>“Code is like humor. When you have to explain it, it’s bad.” – Cory House</blockquote><ul><li><strong>Location:</strong> Dhaka, Bangladesh</li><li><strong>Experience:</strong> 5+ years</li><li><strong>Portfolio:</strong> example.com</li></ul><p><br></p>	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-04 15:05:02.372+00	7975815b-b2d1-4aab-a587-7c8f140b7ee3	f	f
1212	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-30 15:43:03.458+00	340cf96e-f943-417d-882a-a9fa12553f8a	f	f
1214	\N	\N	Senior Web Developer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-14 18:17:28.667+00	73c0b353-9c55-48db-960d-b2af9049026c	f	f
1372	\N	\N	HI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-11-20 20:26:40.414+00	4fad4e9f-dc00-4930-9066-b3e7bceb40e9	f	f
1374	\N	\N	dsfsdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-11-20 20:40:52.004+00	fb645b07-0d08-4404-90fd-265c8d99090e	f	f
343	Nikola	SLAVNIC	Ingénieur R&D - Architecte Blockchain	RW50aG91c2lhc3RlIGV0IHBhc3Npb25uw6kgcGFyIGxlIHdlYjMsIE5pa29sYSBlc3QgdW4gZMOpdmVsb3BwZXVyIGFyY2hpdGVjdGUgcXVpIHNhaXQgaW50ZXJ2ZW5pciBzdXIgdG91dGVzIGxlcyBwaGFzZXMgZCd1biBwcm9qZXQgd2ViMy4gU2VzIGV4cMOpcmllbmNlcyBlbiBzw6ljdXJpdMOpIGEgcGVybWlzIGRlIGZvcmdlciBzZXMgY29tcMOpdGVuY2VzIGRlIHJlY2hlcmNoZSBldCBk4oCZYW5hbHlzZSBzdXIgbGEgdGVjaG5vbG9naWUgQmxvY2tjaGFpbi4=	FR	Paris	33	601812776	contact@metadev3.com	https://telegram.org/dl	\N	100	SmUgc3VpcyBhIGxhIHJlY2hlcmNoZSBkZSBtaXNzaW9uIGNlbnRyw6kgc3VyIGxhIEJsb2NrY2hhaW4gZXQgbSdvZmZyYW50IHVuIGNoYWxsZW5nZSBxdWkgbWUgcG91c3NlcmEgw6AgbWUgc3VycGFzc2Vy	JavaScript,Solidity,Hardhat,Foundry,Bootstrap,Django,JQuery,Spring,Synfony,Laravel,NestJS,Quasar,C,C++,CSS,Java,Python,XML,Ajax,Dart,JEE,Node.js,React,Vue.js	https://goodhive.s3.us-east-005.backblazeb2.com/image_6e3e3807-1f40-49ed-a202-cc1035f7b075.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_7ef9b378-6ca4-4b2d-a615-9372d14c5e3e.pdf	https://www.linkedin.com/company/metadev3	\N	\N	\N	f	f	t	f	f	f	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	t	\N	2025-02-05 07:00:14.14312+00	c4f0495c-913f-4385-80f4-f7d5d339d576	t	f
1277	Carles	Bennassar	Full Stack Developer	<p>Hello, I'm Carles, a dedicated developer with hands-on experience in blockchain technologies. With a degree in Physics and a Master's degree in Blockchain Technologies, I have a solid foundation in both mathematics and Ethereum technologies. My professional journey includes contributions to Smart Contract prototyping and discussions, technical documentation, and using multiple frameworks and programming languages. I excel in teamwork and adapt effectively to diverse working environments, driven by a passion for decentralized solutions and continuous learning.</p>	\N	Barcelona	\N	\N	cfbennassar1@gmail.com	\N	\N	60	<h3>Experience</h3><p><strong>Full Stack Developer Internship – Whale Spray</strong></p><p>Barcelona, Spain | 2021 – 2021</p><p>Contributed to Smart Contract prototyping and discussions, technical documentation, and using multiple frameworks and programming languages.</p><p><strong>Data Analyst – SDG Group</strong></p><p>Aragon, Spain | 2023 – 2024</p><p>Worked on a migration project for ISDIN, a leading pharmaceutical company, ensuring seamless data transition. Developed Python code to automate the transfer of files to Google Cloud, improving process efficiency.</p><p><strong>Junior Software Developer – Aragon</strong></p><p>Aragon, Spain | 2024 – Present</p><p>Designed and implemented the architecture, front-end, and back-end of an internal web application, streamlining internal processes.</p><h3>Key Skills</h3><p><br></p><p>I bring a strong mathematical aptitude and analytical thinking to my work, with proficiency in Python, Solidity, Git, and SQL. I have hands-on experience in blockchain technologies, with a focus on Ethereum and Smart Contract development.</p><h3>Education &amp; Continuous Learning</h3><p>I hold a Bachelor's degree in Physics from Barcelona University and a Master's degree in Blockchain Technologies from the Polytechnic University of Catalonia. I have also completed online courses in Deep Learning and Ethereum Developer Bootcamp.</p>	Mathematics,JS/TS,Python,Solidity,Git,SQL	\N	\N	\N	\N	https://www.github.com/banasa44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-19 16:24:36.345+00	b30cec96-f736-4c06-9621-8bc5cae43839	f	f
1375	\N	\N	Juhan	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-11-22 18:44:19.506+00	2a35401e-2814-4093-8075-0374fe3d5492	f	f
1291	Carles	Bennassar	Blockchain Developer	<h2><strong>Hello, I'm Carles Bennassar</strong></h2><p>A dedicated developer with a strong background in Physics and Blockchain Technologies. I bring a solid foundation in mathematics and Ethereum technologies, with hands-on experience in blockchain technologies.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am driven by a passion for decentralized solutions and continuous learning. I excel in teamwork and adapt effectively to diverse working environments.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>Not only am I proficient in English, Spanish, Catalan, and conversational in Japanese, I also have a strong mathematical aptitude and analytical thinking.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>My professional journey includes contributions to Smart Contract prototyping and discussions, technical documentation, and using multiple frameworks and programming languages such as Python, Solidity, Git, and SQL.</p>	\N	Barcelona	\N	\N	cfbennassar112@gmail.com	\N	\N	60	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Full Stack Developer Internship – Whale Spray</strong></p><p>Barcelona, Spain | 2021 – 2021</p><p>Contributed to Aragon's OSx infrastructure, focusing on Subgraph and JavaScript Libraries. Gained hands-on experience in developing, testing, and reviewing.</p><p>&nbsp;</p><p><strong>Data Analyst – SDG Group</strong></p><p>Barcelona, Spain | 2023 – 2023</p><p>Contributed to a migration project for ISDIN, a leading pharmaceutical company, ensuring seamless data transition. Developed Python code to automate the transfer of files to Google Cloud, improving process efficiency.</p><p>&nbsp;</p><p><strong>Junior Software Developer – Aragon</strong></p><p>Barcelona, Spain | 2024 – Present</p><p>Designed and implemented the architecture, front-end, and back-end of an internal web application, streamlining internal processes. Developed an ORM SQLite database and integrated an Elasticsearch searcher to efficiently locate all products associated with a specific item.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>I bring a comprehensive set of technical and soft skills, emphasizing my expertise in blockchain, Web3, and relevant technologies. My hard skills include programming languages such as Python, Solidity, Git, and SQL, while my soft skills include leadership, collaboration, and problem-solving.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I hold a Bachelor's degree in Physics from Barcelona University and a Master's degree in Blockchain Technologies from Polytechnic University of Catalonia. I have also completed online courses in Deep Learning and Ethereum Developer Bootcamp.</p>	Mathematics,JS/TS,Python,Solidity,Git,SQL	\N	\N	\N	\N	www.github.com/banasa44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-11 16:23:53.812+00	e20954d8-bd66-4b78-9bc3-4e7b8bf741e5	f	f
1331	Jubayer	Juhan	Full-Stack Developer & AI SaaS Builder	<p>I’m <strong>Jubayer Juhan</strong>, a passionate <strong>Full-Stack Developer &amp; AI SaaS Builder</strong> from Dhaka, Bangladesh — blending creativity and logic to craft scalable, intelligent, and user-centric web applications.</p><p>With 5+ years of experience, I’ve built production-grade products using <strong>React, Next.js, Node.js, TypeScript, and PostgreSQL</strong>, and integrated advanced <strong>AI automations</strong> and <strong>Web3 systems</strong> into SaaS tools.</p><p>I focus on building products that <strong>solve real-world problems through automation, design, and smart engineering.</strong></p>	BD	Dhaka	+880	1620692839	jubayerjuhan.info@gmail.com	juhan230	\N	30	<h3>💼 <strong>What I Do</strong></h3><ul><li><strong>Full-Stack Development:</strong> Craft modern, high-performance web apps using React, Next.js, Node.js, Express, and TypeScript.</li><li><strong>AI SaaS Products:</strong> Architect intelligent SaaS tools integrating OpenAI APIs, automation workflows (n8n), and AI-driven data handling.</li><li><strong>Web Automation:</strong> Design and connect APIs, scrapers, and custom integrations for workflow automation and productivity systems.</li><li><strong>UI/UX Design Collaboration:</strong> Transform startup ideas into smooth, production-ready user experiences using Tailwind, ShadCN, and Vite.</li><li><strong>Backend Architecture:</strong> Develop secure RESTful APIs, database schemas (MongoDB, PostgreSQL), and scalable cloud-based infrastructures.</li><li><strong>Tech Leadership:</strong> Lead teams through design, development, and deployment pipelines, ensuring clean code, CI/CD, and reliability.</li></ul>	Solidity,JavaScript	https://goodhive.s3.us-east-005.backblazeb2.com/image_1d046830-d285-4505-ab89-59ba005f5235.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_bf2fa1b3-6811-4609-a6f5-f1e6b07fc572.pdf	\N	\N	\N	\N	\N	\N	t	f	f	\N	\N	t	\N	2025-11-24 17:36:02.189+00	df9a41bb-1b61-4865-b878-7e514a1d9655	t	f
1215	\N	\N	Hi This Is My Old Account	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-16 17:12:47.51+00	4f6f9a95-47c0-4fac-91bd-4f2ea7348029	f	f
1221	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-01 16:52:24.27953+00	\N	f	f
1222	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-01 16:52:59.78663+00	\N	f	f
1287	Chaharane	Abdallah	MBA Marketing, Digital Business et IA	<h2><br></h2>	FR	Toulouse	+33	0783336754	chaharane05@gmail.com	\N	\N	30	<h2><br></h2>	SEO,Photoshop,Google Workspace,Meta Business Suite,Microsoft Office,Sales,B2B Sales,Communication,Adaptability,Resilience	\N	\N	\N	https://www.linkedin.com/in/chaharane-abdallah-50617424b/	\N	\N	\N	\N	\N	t	t	t	\N	\N	\N	\N	2025-09-23 10:13:01.971+00	5a54167d-e76b-4c3a-8b22-5351cd3a767a	f	f
1365	Franck	Maussand	Blockchain Developer - Rust/Solana	<h2><strong>Hello, I'm Franck Maussand</strong></h2><p>With a passion for computer science, I have spent my career working in industrial computing, multimedia, and web technologies. Today, I specialize in Rust and blockchain, approaching projects with a creative and unconventional approach.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am driven by the endless possibilities of blockchain technology and the impact it can have on various industries. My work in this field has allowed me to contribute to several blockchain projects and publish technical articles on Medium.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>Aside from my technical skills, I am a curious and autonomous individual who is always looking to learn and grow. I am fluent in both French and English, allowing me to work in diverse environments.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>My technical skills include Rust, C, C++, Pascal, PHP, Bash, Lingo, MaxScript, M4, MC 68000, PIC 12F675, PIC 30F2011, Solidity, Yul, PHP, Compose, MySQL, HTML, CSS, Chakra-UI, REST, XML, Web Services, ShockWave3D, Lingo, OpenGL, WebGL, BabylonJs, VRML, 3DS Max, Blender, Amapi, VSCode, Docker, LabWindows/CVI, Git, GitHub.</p>	FR	La Ciotat	+33	0617242207	franck@maussand.net	@Laugharne_fm	\N	75	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Blockchain Developer</strong></p><p>La Ciotat, France | 2023 – Present</p><p>Specializing in blockchain development, contributing to several blockchain projects, and publishing technical articles on Medium.</p><ul><li>Solana Summer Fellowship 2024: Improvement program on Solana (tokens, Solana Pay, cNFT, native Rust, token extensions, etc.)</li><li>Technical articles on blockchain, published on Medium ➚</li><li>Contributor for CoinsBench ➚</li><li>Mutation Testing Tool to improve unit tests with Anchor : Mutatis ➚</li><li>Tool for calculating optimized EVM function names : Select0r ➚</li><li>Script for resolving build errors : Anchor Build Fixer ➚</li></ul><p><br></p><p><strong>Analyst-Programmer – Ifremer</strong></p><p>La Ciotat, France | 2021 – 2022</p><p>(Electronic Management of Documents) Performed database reverse engineering, data migration from Lascom to Alfresco.</p><ul><li>Performed reverse engineering on Lascom database</li><li>Developed data extraction and migration to Alfresco</li><li>Implemented data automation and verification</li></ul><p><br></p><p><strong>Family Caregiver</strong></p><p>La Ciotat, France | 2014 – 2019</p><ul><li>Preservation of the independence of relatives at home</li></ul><p><br></p><p><strong>Senior Programmer – Ultra-Prod</strong></p><p>La Ciotat/Le Cannet, France | 2011 – 2018</p><p>Built a full B2B e-commerce platform and integrated web services with major marketplaces.</p><ul><li>Development of a complete B2B e-commerce solution</li><li>Certified Silver Partner at PriceMinister with ECE service</li><li>Client awards at Rakuten Campus 2013: Best Hi-tech Seller and Best Use of Rakuten Ads</li><li>Gained extensive experience with web services from major marketplaces (Amazon, eBay, PriceMinister, ...) and suppliers</li><li>Creation of an order workflow for Rakuten TV</li><li>Development of web services and Prestashop plug-ins</li></ul><p><br></p><p><strong>Analyst-Programmer – De Kerac</strong></p><p>La Ciotat, France | 2005 – 2011</p><p>Developed and maintained embedded tools with real-time interfaces and microcontroller programming for industrial clients (SNECMA, ONERA).</p><ul><li>Ensured maintenance and upgrades of the main client tool</li><li>Designed: UI, real-time display, and client/server communication</li><li>Programmed PIC 12F675 &amp; PIC 30F2011 microcontrollers</li><li>Developed specific solutions for SNECMA and ONERA</li><li>Implemented real-time signal extraction (A400M engine)</li><li>Generated an optical test pattern for a rotation sensor</li></ul><p><br></p><p><strong>Lead developper – SuperSonique Studio</strong></p><p>La Ciotat/Le Cannet, France | 2002 – 2005</p><p>Built web-based real-time 3D experiences and casual games, developed a Director object framework.</p><ul><li>Real-time 3D animations and interactions; shaders; tutorials</li><li>Created an object framework for Director in Lingo and C/C++</li><li>Studied a real-time 3D occlusion engine, Lingo + Xtra</li><li>Designed online/offline games for the “Conseil Général 06”</li><li>Developed a payment module for osCommerce (voice server)</li></ul><p><br></p><p><strong>Analyst-Programmer – De Kerac</strong></p><p>La Ciotat, France | 2001</p><ul><li>Specific C developments for AEROSPATIALE</li></ul><p><br></p><p><strong>Development Ingeneer – SuperSonique Studio</strong></p><p>Sofia-Antipolis, France | 2000 – 2001</p><ul><li>Creation of a multi-user interaction engine</li><li>Design of an object-oriented C/C++ framework</li><li>Scripting and analysis of video games, UX, and game mechanics</li><li>Development of immersive 3D animations and interactions</li></ul><p><br></p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>My key skills include Rust, C, C++, Pascal, PHP, Bash, Lingo, MaxScript, M4, MC 68000, PIC 12F675, PIC 30F2011, Solidity, Yul, PHP, Compose, MySQL, HTML, CSS, Chakra-UI, REST, XML, Web Services, ShockWave3D, Lingo, OpenGL, WebGL, BabylonJs, VRML, 3DS Max, Blender, Amapi, VSCode, Docker, LabWindows/CVI, Git, GitHub. I am also a curious and autonomous individual who is always looking to learn and grow.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I have a Technical Degree in Industrial computing from Lycée Jean Perrin and a Baccalaureate in Electronics. I have also completed several courses including Docker Essentials from Udemy, Advanced Solidity: Gas costs optimization and Yul, The Complete Rust Programming Course, and WebGL 3D with Babylon.js from Microsoft Virtual Academy.</p>	Rust,C,C++,PHP,Bash,Lingo,MaxScript,M4,MC 68000,PIC 12F675,PIC 30F2011,Solidity,Yul,PHP,Compose,MySQL,HTML,CSS,Chakra-UI,REST,XML,Web Services,ShockWave3D,Lingo,OpenGL,WebGL,BabylonJs,VRML,3DS Max,Blender,Amapi,VSCode,Docker,LabWindows/CVI,Git,GitHub,Anchor	https://goodhive.s3.us-east-005.backblazeb2.com/image_13898f1b-6882-491f-8e07-fc1d3d69e09b.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_ba2044d9-d2e0-4e41-80ac-f2c6e3bc35f7.pdf	in/franckmaussand/	https://github.com/Laugharne	\N	medium.com/@franck.maussand	\N	t	t	\N	\N	\N	\N	f	\N	2025-11-24 07:33:35.271+00	34343987-8dab-49fe-a0f9-d404a118b976	f	t
1390	Abdehlai	Fanouni	Data Blockchain AI Engineer	<p>Senior Data Engineer with 7+ years of experience in data architecture, ETL/ELT pipelines, and cloud orchestration (Azure, AWS, GCP). Confirmed expertise in migrating legacy systems to modern cloud platforms (Snowflake, Azure Data Lake), developing integration interfaces (Talend, Boomi iPaaS, Matillion), and technical leadership. Proven track record delivering scalable data solutions for corporate environments, with advanced skills in Python, SQL, and CI/CD automation.</p><p>Additionally, I develop personal blockchain research projects focused on creating an energy-efficient validation layer aimed at drastically reducing the power consumption of existing protocols. My goal is to design a genuinely eco-responsible, next-generation blockchain capable of supporting secure, low-energy transactions at scale.</p><p>I also lead several AI-driven projects, including intelligent inventory forecasting systems, multi-agent RAG platforms, and end-to-end pipelines for document analysis, model serving, and real-time decision automation. These projects combine data engineering, machine learning, and MLOps practices to deliver robust and production-ready solutions.</p>	FR	Nanterre	+33	0652145568	fanouni.abdelhali@gmail.com	+33652145568	\N	100	<p>My professional journey has always been shaped by the same objective: building systems that are reliable, efficient, and capable of evolving without compromising security or sustainability. I started my career in data engineering, where I learned how to design architectures that support high-volume operations, maintain data integrity, and deliver stable performance in production environments. Working on large corporate systems taught me how to structure information, optimise pipelines, manage cloud workloads and orchestrate complex integrations with a level of discipline that leaves no room for approximation. These years built the engineering foundation that still guides everything I do today.</p><p>This foundation led me naturally toward blockchain. What first attracted me was the architecture itself: a distributed environment where trust is constructed through mathematics rather than authority. Coming from a background where every pipeline must be precise and every transformation auditable, I approached blockchain through the lens of efficiency, resource management and absolute security. Instead of reproducing existing architectures, I focused on designing mechanisms that reduce unnecessary computation, minimise energy consumption, and preserve the guarantees that make decentralised systems valuable. This work resulted in experimental validation models, lightweight signing processes and energy-aware logic whose goal is to prepare the ground for an eco-responsible blockchain layer rooted in real engineering principles rather than theoretical ideals.</p><p>My interest in artificial intelligence emerged later, as a continuation rather than a shift. When I started building machine learning pipelines, deploying models and designing intelligent services, I realised how closely these technologies relate to blockchain. Both require strict control of computation, predictable execution paths, and verifiable outcomes. I used this to develop multi-agent systems capable of analysing documents, forecasting engines for decision automation, and MLOps pipelines that ensure long-term stability, monitoring and retraining of models. The discipline I had built in data engineering and blockchain naturally transferred to AI: clarity of architecture, rigorous validation, and the constant priority of securing every component exposed in production.</p><p>Across all these fields, what has remained constant is my commitment to delivering systems that can be trusted. Whether it is a data pipeline, a blockchain module or an ML service, I approach each project with the same requirements: transparent logic, secure interfaces, controlled resource usage, and the ability to scale without degradation. My work is not driven by trends but by engineering principles that ensure durability, reproducibility and operational clarity. Documentation, testing, monitoring and a careful separation of responsibilities are integral parts of everything I build.</p><p>I also value collaboration. Throughout my career, I have worked closely with Data Scientists, ML Engineers, cryptography-oriented developers, cloud architects and product teams. This has strengthened my ability to convert complex concepts into architectures that others can use, extend and maintain. I enjoy transforming research into functional prototypes, refining mechanisms until they are stable, and supporting teams during deployment phases so that each system integrated into production is understood and adopted.</p><p>Today, my goal is to bring this experience to a Web3 organisation that views sustainability and security not as constraints but as design principles. I want to contribute to a project where blockchain is used to solve real problems, where the architecture is clean, where the energy footprint is taken seriously, and where long-term reliability matters as much as innovation. With my background in large-scale data engineering, my research on energy-efficient blockchain mechanisms, and my applied work in artificial intelligence and distributed systems, I am ready to contribute to a team looking for someone capable of building the next generation of decentralised infrastructure with clarity, discipline and purpose.</p>	Solidity,Data engineer,Artificial Intelligence,Java	https://goodhive.s3.us-east-005.backblazeb2.com/image_4d6eac62-9c88-49df-9e59-f8e6b2965d3a.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_d8129c20-248d-4d15-8d0b-95af702f4206.pdf	https://www.linkedin.com/in/abdelhali-fanouni	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N	2025-11-24 12:09:57.201+00	709717d4-e730-41ef-9ac6-7b8a81cd50be	f	t
1391	Gabriel	Renault	Project Manager	<p>Gabriel Renault is a seasoned Senior Consultant with over 6 years of experience in leading strategic IT transformations and complex digital projects. He has successfully led projects with a scope of up to €8M and managed teams of 40+ developers and 3 junior analysts. Gabriel has contributed to a strategic presales initiative for a €300M public sector deal, optimizing processes, structuring governance, and introducing AI-driven methods to improve bid management and decision-making efficiency. He has a strong technical arsenal including Agile delivery (Scrum, SaFe), Product ownership &amp; Backlog management, Blockchain fundamentals (Tokenization &amp; smart contracts), and Stakeholder management. Gabriel has a multidisciplinary engineering background focused on industrial systems management, covering automation, IT, and supply-chain. He is fluent in French and English, and has an intermediate proficiency in German.</p>	FR	Paris	+33	749477101	renault.gabriel@icloud.com	+33749477101	\N	100	<p>Gabriel has worked as a Senior Consultant at Capgemini where he led strategic IT transformations for major public and private organizations. He also worked as an Agile Business Analyst intern at Renault Digital where he implemented end-to-end packaging traceability within and across factories to optimize production flows and ensure real-time, accurate inventory management across the supply chain. Gabriel's key skills include Agile delivery, Product ownership &amp; Backlog management, Blockchain fundamentals, and Stakeholder management.</p>	Agile delivery (Scrum,SaFe),Product ownership & Backlog management,Blockchain fundamentals (Tokenization & smart contracts),Stakeholder management,JIRA,Confluence,Office Suite,Power BI,VBA,Notion,Figma,Cursor,Modelio(UML)	https://goodhive.s3.us-east-005.backblazeb2.com/image_5a38b4bf-b53b-444d-b373-89e06626490b.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_c870e88e-1663-4982-8ed3-fd8d7de3a274.pdf	Linkedin.com/in/gabriel-renault/	\N	\N	\N	t	\N	t	\N	f	\N	\N	f	\N	2025-11-24 15:01:47.351459+00	ff50fa34-463e-4f45-87ea-dab8ea50f026	f	t
1216	\N	\N	This Is Our New Account With Temp Email	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-16 16:19:50.24+00	8a952758-affc-49f1-b23b-2b4b021354a4	f	f
1399	Test 1	Test 1	Test 1	<p>Test 1</p>	AG	4545	+1-268	455456546574	bigex76093@aikunkun.com	asdasd	\N	8	<p>Test 1</p>	JavaScript	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_d477458c-809a-4ef5-a09e-4b24db34e545.pdf	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N	2025-11-24 17:17:16.048324+00	4120f79f-43b5-4983-9c8e-3f2cb347f6f7	f	t
1403	asd	asd	uashyduy	<p>asdasd</p>	AF	asdasd	+93	577687680	pagohoj538@bablace.com	juahn239	\N	45	<p>pagohoj538@bablace.com</p>	JavaScript	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_d70f7d3f-e57d-4881-a09d-e1a238ad44f3.pdf	\N	\N	\N	\N	t	\N	t	\N	\N	\N	\N	f	\N	2025-11-24 17:19:59.92575+00	e9df90b1-026b-498b-bc2e-46e2a286adb5	f	t
1318	Gavin	WOOD	Innovative Tech Specialist: Merging Creativity with Cutting-Edge Technology	<p>Hello there!</p><p>I’m a passionate technologist and visionary with a deep commitment to building the future of decentralized systems. </p><p><br></p><p>With a strong foundation in software engineering, cryptography, and blockchain architecture, I thrive on turning complex ideas into transformative, real-world solutions. </p><p><br></p><p>My experiences—shaped by co-founding Ethereum and leading the development of Polkadot—has taught me the value of adaptability, resilience, and innovation in an ever-evolving digital landscape.</p><p>Over the years, I’ve continually refined my technical skills while staying ahead of industry trends, allowing me to bring original, forward-thinking ideas to the table. </p><p><br></p><p>Whether designing scalable protocols or leading teams through intricate developmental challenges, I strive to deliver outcomes that are not only technically sound but also impactful at a global scale.</p><p><br></p><p>Beyond the technical, I place high value on communication and collaboration. I believe that meaningful progress stems from open dialogue, shared vision, and empowering others to think beyond conventional boundaries. </p><p><br></p><p>My ability to bridge deep technical understanding with human-centered problem solving sets me apart in high-stakes, high-innovation environments.</p><p><br></p><p>I am excited to bring this unique perspective and energy to any challenge ahead. If you’re looking for someone who blends technical mastery with a strong sense of purpose and leadership, I look forward to contributing to your mission—and helping shape the next generation of digital infrastructure.</p>	\N	United Kingdom of Great Britain and Northern Ireland	\N	7123456789	GavinWoodEth@goodhive.io	\N	\N	50	<h3><strong>Core Expertise</strong></h3><h3> Blockchain Architecture • Decentralized Systems • Cryptography • Team Leadership • Strategic Innovation</h3><h3><br></h3><h3><strong>Experience</strong></h3><h3> Over the past decade, I’ve led multiple blockchain innovation projects from concept to deployment, focusing on scalability, interoperability, and security.</h3><h3><br></h3><h3> I have successfully guided cross-functional teams in designing decentralized applications and next-generation infrastructures, ensuring both performance and reliability.</h3><h3><br></h3><h3> My role has often involved bridging complex technical challenges with strategic business goals, translating visionary concepts into real-world impact.</h3><p><br></p><h3>By combining deep technical insight with a collaborative mindset, I foster environments where creativity and precision drive sustainable progress. </h3><h3><br></h3><h3>I’m particularly passionate about building systems that empower developers, strengthen data integrity, and advance the global adoption of decentralized technologies.</h3>	Blockchain,Smart Contract Development,Decentralized Application (dApp) Design,Cryptography & Security Protocols,Team Leadership & Collaboration,Scalability & System Optimization,Strategic Innovation & Product Vision	https://goodhive.s3.us-east-005.backblazeb2.com/image_318e5169-57ac-4b4c-b432-0d6a4b70d594.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_acc3b71f-91a5-4382-ae49-0bc2adaa4132.pdf	\N	\N	\N	\N	\N	\N	f	f	f	f	\N	t	\N	2025-11-21 15:49:05.766+00	e3b3042d-f6a4-41c4-9c93-a7461a59e5d8	f	f
1088	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_5207be9a-db4b-413a-b42d-a203fb7bfa3c.png	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-13 15:28:15.566788+00	2a1e4942-f5da-4281-8a75-c11bccbdd177	f	f
1075	Valerie L.	French	Full Stack Developer	RnVsbCBTdGFjayBEZXZlbG9wZXI=	US	Atlanta	+1	\N	gosak83236@payposs.com	\N	\N	25	RnVsbCBTdGFjayBXZWIgRGV2ZWxvcGVy	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_f37896f3-4e13-41c8-a2b8-f9ef66c36337.png	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-12 15:09:42.625962+00	06843ad5-a9cf-44b5-bf8e-a938193986c4	f	f
1084	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	2025-03-12 17:19:24.943708+00	d9b5c92c-d82f-48e6-a370-4a4702a9b313	f	f
1217	\N	\N	hello	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-16 16:28:09.209677+00	\N	f	f
1089	benoit	test	test	dGVzdA==	FR	Paris	+33	6516431	ih;h@iugiug.com	JGJGKJH	\N	24	dGVzdA==	Solidity	https://goodhive.s3.us-east-005.backblazeb2.com/image_5e0de014-5769-40c6-b574-3b989a44f87e.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_c7be1ae2-87ea-4d9d-bbc3-f8448e2a97a3.pdf	\N	\N	\N	\N	t	\N	f	\N	t	\N	\N	\N	\N	2025-03-14 01:03:07.303+00	c3176c3a-1705-447b-8571-3bbd0f51c99a	f	t
1087	\N	\N	\N	\N	NC	\N	+687	\N	\N	\N	\N	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_2978c60b-bf75-4596-a9da-e7d8b3693a10.jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	2025-03-12 22:32:23.576+00	5fa564a6-27a7-4ef6-851c-e8580fe9ea7e	f	f
1100	Ricky	Ponting	Full Stack Web Engineer	SGkgSSBhbSBhIEZ1bGwgU3RhY2sgV2ViIEVuZ2luZWVy	AU	Brisbane	+61	01729384739	kemob60260@bankrau.com	juhan230	\N	20	SGkgSSBhbSBhIEZ1bGwgU3RhY2sgV2ViIEVuZ2luZWVyIGFuZCBJIEJ1aWxkIFdlYjMgV2Vic2l0ZXM=	JavaScript,Solidity,Tailwind,Python,Express.js,Node.js	https://goodhive.s3.us-east-005.backblazeb2.com/image_b2559d73-8682-49a7-929e-3d90bdfc692a.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_064103be-4459-4fca-a71c-d7ca252c0090.pdf	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	2025-03-15 17:23:00.055086+00	de127d98-1aad-4253-83bc-3ce9a4fb5b10	f	t
1074	Benoit	Junkmail	Recruiter	SGVsbG8sIFRoaXMgaXMgYSB0ZXN0	FR	Paris	+33	556557755	benoit.jnkmail2@gmail.com	JGJGKJH	\N	50	Z29vZCB3b3Jr	Solidity	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_6a899a4b-3656-4041-8295-865ed5a91c4d.pdf	\N	\N	\N	\N	t	\N	t	t	t	\N	\N	t	\N	2025-03-14 01:08:09.654+00	29752320-a130-4079-b5ae-bb13d4abb166	f	t
1218	Benoît	K.	Web3 Visionary | Building Future with Decentralized Tech & Strategic Finance	<p>Hi, I'm Benoît K., a seasoned entrepreneur and recruiter with over eight years of experience in the blockchain and Web3 space. I am deeply passionate about decentralization, the sharing economy, and collaboration. These principles are the bedrock of my work and my various projects.</p><p>As the founder of GoodHive and Web3TalentFair, I am on a relentless mission to bridge the talent gap in the Web3 ecosystem. My expertise in start-up management, corporate finance, strategic planning, and technical recruiting, among others, allows me to connect top IT talents with innovative blockchain jobs, both online and offline.</p><p>I believe in empowering the Web3 community, and to that end, I am committed to creating inclusive platforms and events that educate and inspire. My ventures have not only connected talent with opportunity but also helped create a more collaborative, decentralized future.</p><p>But my expertise extends beyond the digital space. Over the years, I have honed my skills in business strategy, international business, investments, and management. I have an impressive track record in corporate development, project planning, contract negotiation, and business valuations. My roles as the Vice President at Club ESSEC Alumni Digital &amp; Technology and the CEO at IT UNCHAINED attest to my leadership abilities and strategic vision.</p><p>Join me on this exciting journey towards a decentralized future where talent meets opportunity, and innovation is the norm. I bring to the table a wealth of experience, a vast network, and a steadfast commitment to creating value in the Web3 space. Let's connect and make a difference together!</p>	FR	Paris, Île-de-France	+33	0663115426	benoit@goodhive.io	benoitk14	\N	100	<p>I hold a Master in Finance from ESSEC Business School and an MBA from the École Supérieure de Commerce Et de Management (ESCEM). I also have a solid foundation in international business analysis, courtesy of the University of Leicester. Additionally, I have a Certificate in Blockchain Technologies from MIT Sloan School of Management, reflecting my commitment to continuous learning and staying abreast of new technologies.</p><p>Clients can expect a dedicated, forward-thinking partner in me. I ensure clarity in communication and responsiveness in every interaction. I bring innovative solutions to the table, leveraging my expertise in blockchain and Web3 technologies. I am committed to delivering value and results, fuelled by my passion for decentralization and the collaborative economy.</p>	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://goodhive.s3.us-east-005.backblazeb2.com/image_2182e367-2a06-45c3-8db1-6336e38a1c70.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_e77ce2f5-9871-4c61-a5e0-b5754a61f5ae.pdf	https://linkedin.com/in/benoitkulesza	\N	\N	\N	t	t	f	\N	t	t	\N	t	\N	2025-11-24 18:15:22.926+00	1959c578-be98-43f7-b727-2452a815ee34	t	f
1076	Jeffrey C.	Wolfe	Jeffrey C. Wolfe Full Stack Developer	SmVmZnJleSBDLiBXb2xmZSBGdWxsIFN0YWNrIERldmVsb3Blcg==	US	New York	+1	01729384739	jeffreyCWolfe@armyspy.com	@jubayerjuhan	\N	23	SmVmZnJleUNXb2xmZUBhcm15c3B5LmNvbQ==	Solidity	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_6cdd8528-e878-4554-acee-7f74858309fb.pdf	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	\N	\N	2025-03-12 15:37:42.514+00	ddef2d80-6720-4d56-931b-1c42dbcb71be	f	t
1319	\N	\N	Title demo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-20 14:09:26.255959+00	2958533c-5397-4af5-82df-5b47629dc8fd	f	f
1079	Reprehenderit nisi facere sit sit est blanditiis doloremque esse dolorem at aut vero sunt enim	Odit sint qui minus deleniti quia qui accusantium sunt totam esse mollitia amet in est mollit	Laboris ab error ullam eum molestiae enim aut vitae molestiae qui repudiandae omnis sint	QXV0ZW0gc2VkIG5lc2NpdW50IG1vbGVzdGlhZSB2ZWwgbWluaW0gZWl1cyBzaXQgZGljdGEgZnVnaWF0IHVsbGFtIGFtZXQgbmVzY2l1bnQgc29sdXRh	BD	Consequuntur perferendis corrupti est sunt eiusmod sunt quidem dolor ut dolorem reiciendis quos au	+880	44	lyde@mailinator.com	Dolor ipsam do eligendi nobis nulla soluta culpa corrupti dicta illum dolore	\N	78	TWF4aW1lIHN1c2NpcGl0IGxhYm9yZSB2ZW5pYW0gY3VscGEgcGVyc3BpY2lhdGlzIHF1b3MgbWludXMgbW9sbGl0IGF1dGVtIGFtZXQgdmVuaWFtIHBvc3NpbXVzIGlkIG9tbmlzIGl1c3RvIGZhY2VyZSB2ZXJvIGVuaW0gZW5pbQ==	Solidity	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_96398a08-03ef-401d-8c31-9c3e7354717b.pdf	Ipsum qui alias aut iste sed expedita consequuntur aliquam labore architecto	Irure quis fugit id sit corporis aliqua Et	Et dolor deserunt vitae dolore adipisicing labore et laudantium sed est voluptas quia rerum nulla vitae natus sed dolorem enim	Occaecat accusantium sunt neque exercitationem excepteur est optio	t	t	t	\N	\N	\N	\N	t	Dicta qui iste consequatur incidunt	2025-03-12 16:00:17.65+00	4a2ba82f-3c18-41e4-94c6-9a84057e2f92	f	f
1095	Itaque est mollitia officia adipisci unde dignissimos est dolor numquam excepteur aute voluptatem E	Possimus odio nostrum iusto fugiat temporibus	Dolore sint Nam et aliquam corrupti sint velit expedita sed asperiores maxime	bW9yZSBlZmZpY2llbnRseSBhbmQgcHJvdmlkZSBiZXR0ZXIgY3VzdG9tZXIgc2VydmljZS4K4oCiIExvZ2luIENyZWRlbnRpYWxzCkhlcm9rdSAoU2VydmVyIERlcGxveWVkKTogCg==	BD	Impedit et omnis id sint aliquam est asperiores explicabo Est accusantium obcaecati ut ut sint	+880	1993902	zyzygy@mailinator.com	Architecto sit magnam sit sit	\N	87	Vm9sdXB0YXRlIGxpYmVybyBpbmNpZGlkdW50IGFjY3VzYW50aXVtIGF1dCBxdWFlcmF0IGluIG9mZmljaWEgZXVt	Next.js	https://goodhive.s3.us-east-005.backblazeb2.com/image_a8589e85-47b0-41fb-9127-e6569ed1796d.png	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_36b9ecc8-a997-46d7-b7c4-321b3c077e61.pdf	Iusto ut unde culpa ea saepe eum voluptate distinctio Necessitatibus libero	Ut iusto Nam in dolor odit veniam molestias velit laborum Non culpa dolore repudiandae cumque accusamus velit aliqua Duis at	Temporibus in quo ab velit reiciendis sed tempor ea reiciendis	Nostrum nobis optio repudiandae natus error dolor odio ut aliquip proident id adipisci saepe consectetur	\N	\N	t	f	\N	\N	\N	f	Culpa modi incididunt qui blanditiis molestias possimus	2025-03-15 16:45:38.836+00	3fa26651-fcde-48f0-9543-a0cd52d0ce0b	f	t
1328	Constantin	Chtanko	Ingénieur logiciel	<h2><strong>Hello, I'm Constantin</strong></h2><p>As an experienced software engineer, I specialize in developing high-performance data management solutions, deploying optimized cloud environments, and designing intuitive user interfaces.</p><p>&nbsp;</p><h3><strong>🚀 What Drives Me</strong></h3><p>I am driven by the desire to create efficient and user-friendly software solutions that solve real-world problems. I thrive in challenging environments where I can apply my technical skills and creativity.</p><p>&nbsp;</p><h3><strong>🌐 Beyond the Code</strong></h3><p>Aside from my technical expertise, I am a bilingual speaker of French and Russian, and I have advanced proficiency in English and intermediate proficiency in Italian. I enjoy working in multicultural environments and have a keen interest in game theory and economics.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>My technical skills include Java, Spring Boot, Microservices, Docker, AWS, PostgreSQL, and many more. I am always eager to learn new technologies and improve my skills.</p>	\N	Tours	\N	0634742143	constantin.chtanko@gmail.com	\N	\N	60	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Ingénieur Logiciel (ESN) – Apside TOP</strong></p><p>Tours, France | 2023-11 – Present</p><p>As a software engineer at Apside TOP, I have been working on several major accounts in the field of document management and backend development. I have developed automated document processing treatments with Quadient and Spring Batch, including dynamic document generation, mail merging, conditional formatting, and automated sending.</p><p>&nbsp;</p><p><strong>Ingénieur Fullstack – MGEN</strong></p><p>Tours, France | 2021-10 – 2023-10</p><p>At MGEN, I developed internal solutions for the IT department, including a collaborative platform, business prototypes, mobile applications, and administration tools deployed on AWS cloud and internal servers.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>My key skills include Java, Spring Boot, Microservices, Docker, AWS, PostgreSQL, and many more. I am also proficient in several languages, including French, Russian, English, and Italian.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I have a Diploma in General Engineering, specializing in Computer Science and Electronics, from ESEO in Angers, and a BTS SIO – Software Solutions and Business Applications from AFTEC in Orléans.</p>	Java,Spring Boot,Microservices,Docker,AWS,PostgreSQL,Quadient,Kafka,CI/CD,Camel,Angular,React,Figma,Flutter,SonarQube,OpenShift,Prometheus,Grafana,ASP.NET,C#,SQL Server,INFOLOG,Bootstrap	\N	\N	\N	linkedin.com/in/constantin-chtanko	https://github.com/Erhuero	\N	\N	\N	\N	t	\N	\N	\N	\N	f	\N	2025-10-28 13:53:41.106527+00	1be67cf6-563e-4b2d-a603-41d2c766a2b8	f	f
1133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/image_13d9e9df-9716-49ce-a693-f9742d2e8d9e.png	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-18 20:00:11.389+00	c8195796-7430-4847-9c2b-5ac79df96237	f	f
1329	Bastien	Rigaud	Software Engineer	\N	FR	Montpellier	+33	630173359	bastien.rigaud@live.fr	\N	\N	\N	\N	Golang	https://goodhive.s3.us-east-005.backblazeb2.com/image_f7238253-5b5c-4742-a949-d56e9a812567.jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-10-29 09:59:03.211553+00	6ab10578-102f-41b4-8084-1f17eeb6e6bb	f	f
1155	Alejandro	Mendoza	Barkz	PHA+SSdtIGFjdGl2ZWx5IGNvbm5lY3RpbmcgdG9wIHRhbGVudCBhY3Jvc3MgTEFUQU0gd2l0aCB0aGUgYmVzdCBvcHBvcnR1bml0aWVzIGluIFdlYjMsIGhlbHBpbmcgY3JlYXRpdmVzIGFuZCBwcm9mZXNzaW9uYWxzIHRocml2ZSBpbiB0aGUgZXZvbHZpbmcgZGlnaXRhbCBzcGFjZS48L3A+	CL	Viña del mar	+56	973607614	barkovskis.m@gmail.com	@barkovsk1s	\N	\N	PHA+SSdtIGFjdGl2ZWx5IGNvbm5lY3RpbmcgdG9wIHRhbGVudCBhY3Jvc3MgTEFUQU0gd2l0aCB0aGUgYmVzdCBvcHBvcnR1bml0aWVzIGluIFdlYjMsIGhlbHBpbmcgY3JlYXRpdmVzIGFuZCBwcm9mZXNzaW9uYWxzIHRocml2ZSBpbiB0aGUgZXZvbHZpbmcgZGlnaXRhbCBzcGFjZS48L3A+	Team Building	https://goodhive.s3.us-east-005.backblazeb2.com/image_9a5714dc-fddf-41d1-ab4f-56d3f7cfe260.jpeg	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	t	\N	\N	f	\N	2025-03-24 20:52:59.618468+00	fe2d7aa9-4b19-4683-ad04-3f520c3369e0	f	f
1146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Tailwind	https://goodhive.s3.us-east-005.backblazeb2.com/image_a44e6561-e7a7-41fa-a9b8-0c363d5db244.jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-20 01:13:30.302+00	39ed4eb5-109a-40ea-ac0a-c5b85f5ce170	f	f
1324	\N	\N	Test Header User 007	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-20 16:14:15.677+00	a787d03c-2659-482d-b4b7-2c2143cfea2e	f	f
1156	Manassé	EKLOU	Product Owner | Blockchain Analyst	PHA+QXMgYSB0ZWNobm8tZnVuY3Rpb25hbCBQcm9kdWN0IE93bmVyIHNwZWNpYWxpemVkIGluIGJsb2NrY2hhaW4sIEkgYnJpZGdlIHRoZSBnYXAgYmV0d2VlbiBidXNpbmVzcyBuZWVkcyBhbmQgdGVjaG5pY2FsIHRlYW1zLiBJIGRlZmluZSBwcm9kdWN0IHZpc2lvbiwgd3JpdGUgdXNlciBzdG9yaWVzLCBhbmQgbWFuYWdlIGJhY2tsb2dzIGZvciBkZWNlbnRyYWxpemVkIGFwcGxpY2F0aW9ucywgZW5zdXJpbmcgc2VhbWxlc3MgaW50ZWdyYXRpb24gd2l0aCBzbWFydCBjb250cmFjdHMgYW5kIFdlYjMgcHJvdG9jb2xzLiBNeSBleHBlcnRpc2UgaW5jbHVkZXMgdG9rZW5vbWljcywgY3Jvc3MtY2hhaW4gaW50ZXJvcGVyYWJpbGl0eSwgYW5kIHRyYW5zbGF0aW5nIGNvbXBsZXggcmVxdWlyZW1lbnRzIGludG8gY2xlYXIsIGFjdGlvbmFibGUgdGFza3MuPC9wPg==	FR	Paris	+33	0644794358	sergecarmel@gmail.com	\N	\N	\N	PHA+SSB3b3JrIGFzIGEgVGVjaG5vLUZ1bmN0aW9uYWwgUHJvZHVjdCBPd25lciBpbiB0aGUgYmxvY2tjaGFpbiBzcGFjZSwgZHJpdmluZyB0aGUgZGV2ZWxvcG1lbnQgb2YgZGVjZW50cmFsaXplZCBhcHBsaWNhdGlvbnMgYW5kIFdlYjMgcHJvZHVjdHMuIEkgY29sbGFib3JhdGUgY2xvc2VseSB3aXRoIGRldmVsb3BlcnMsIGRlc2lnbmVycywgYW5kIHN0YWtlaG9sZGVycyB0byBhbGlnbiBidXNpbmVzcyBnb2FscyB3aXRoIHRlY2huaWNhbCBleGVjdXRpb24uIE15IGZvY3VzIGlzIG9uIGRlbGl2ZXJpbmcgc2NhbGFibGUgc29sdXRpb25zIGludm9sdmluZyBzbWFydCBjb250cmFjdHMsIHRva2VuIGVjb25vbWljcywgYW5kIGNyb3NzLWNoYWluIHN5c3RlbXMsIHdoaWxlIGVuc3VyaW5nIGEgc2VhbWxlc3MgdXNlciBleHBlcmllbmNlIGFuZCBzZWN1cmUgYXJjaGl0ZWN0dXJlLjwvcD4=	Solidity,Node.js,RESTful APIs	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_3bc657b9-7b5c-4258-815c-effc247ae332.pdf	https://www.linkedin.com/in/manasse-serge-eklou/	\N	\N	\N	t	\N	t	t	\N	\N	\N	\N	\N	2025-03-25 09:32:59.193+00	ee5ae03d-735f-4894-9cac-fd2702c01c13	f	f
1219	Benoît	K.	#Web3 #Decentralization #CollaborativeEconomy #FutureOfWork | Connecting Talent & Builders	PHA+SSBoYXZlIG92ZXIgZWlnaHQgeWVhcnMgb2YgZXhwZXJpZW5jZSBhcyBhbiBlbnRyZXByZW5ldXIgYW5kIGEgcmVjcnVpdGVyIGluIHRoZSBibG9ja2NoYWluIGFuZCBXZWIzIHNwYWNlLiBJJ20gcGFzc2lvbmF0ZSBhYm91dCBkZWNlbnRyYWxpemF0aW9uLCBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aW9uLCBhbmQgSSBhcHBseSB0aGVzZSBwcmluY2lwbGVzIHRvIG15IHdvcmsgYW5kIHByb2plY3RzLjwvcD48cD5BcyB0aGUgZm91bmRlciBvZiBHb29kSGl2ZSBhbmQgV2ViM1RhbGVudEZhaXIsIEknbSBvbiBhIG1pc3Npb24gdG8gc29sdmUgdGhlIHRhbGVudCBzaG9ydGFnZSBwcm9ibGVtIGluIHRoZSBXZWIzIGVjb3N5c3RlbS4gSSBsZXZlcmFnZSBteSBuZXR3b3JrLCBza2lsbHMsIGFuZCBrbm93bGVkZ2UgdG8gY29ubmVjdCB0b3AgSVQgdGFsZW50cyB3aXRoIGN1dHRpbmctZWRnZSBibG9ja2NoYWluIGpvYnMsIGJvdGggb25saW5lIGFuZCBvZmZsaW5lLiBJIGFsc28gYWltIHRvIGVtcG93ZXIgYW5kIGVkdWNhdGUgdGhlIFdlYjMgY29tbXVuaXR5IGJ5IGNyZWF0aW5nIGlubm92YXRpdmUgYW5kIGluY2x1c2l2ZSBwbGF0Zm9ybXMgYW5kIGV2ZW50cy4gSm9pbiBtZSBvbiB0aGlzIGV4Y2l0aW5nIGpvdXJuZXkgdG93YXJkcyBhIGRlY2VudHJhbGl6ZWQgZnV0dXJlITwvcD4=	FR	Paris, Île-de-France	+33	\N	\N	\N	\N	\N	PHA+SSBoYXZlIG92ZXIgZWlnaHQgeWVhcnMgb2YgZXhwZXJpZW5jZSBhcyBhbiBlbnRyZXByZW5ldXIgYW5kIGEgcmVjcnVpdGVyIGluIHRoZSBibG9ja2NoYWluIGFuZCBXZWIzIHNwYWNlLiBJJ20gcGFzc2lvbmF0ZSBhYm91dCBkZWNlbnRyYWxpemF0aW9uLCBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aW9uLCBhbmQgSSBhcHBseSB0aGVzZSBwcmluY2lwbGVzIHRvIG15IHdvcmsgYW5kIHByb2plY3RzLjwvcD48cD5BcyB0aGUgZm91bmRlciBvZiBHb29kSGl2ZSBhbmQgV2ViM1RhbGVudEZhaXIsIEknbSBvbiBhIG1pc3Npb24gdG8gc29sdmUgdGhlIHRhbGVudCBzaG9ydGFnZSBwcm9ibGVtIGluIHRoZSBXZWIzIGVjb3N5c3RlbS4gSSBsZXZlcmFnZSBteSBuZXR3b3JrLCBza2lsbHMsIGFuZCBrbm93bGVkZ2UgdG8gY29ubmVjdCB0b3AgSVQgdGFsZW50cyB3aXRoIGN1dHRpbmctZWRnZSBibG9ja2NoYWluIGpvYnMsIGJvdGggb25saW5lIGFuZCBvZmZsaW5lLiBJIGFsc28gYWltIHRvIGVtcG93ZXIgYW5kIGVkdWNhdGUgdGhlIFdlYjMgY29tbXVuaXR5IGJ5IGNyZWF0aW5nIGlubm92YXRpdmUgYW5kIGluY2x1c2l2ZSBwbGF0Zm9ybXMgYW5kIGV2ZW50cy4gSm9pbiBtZSBvbiB0aGlzIGV4Y2l0aW5nIGpvdXJuZXkgdG93YXJkcyBhIGRlY2VudHJhbGl6ZWQgZnV0dXJlITwvcD4=	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://media.licdn.com/dms/image/v2/C4D03AQESUUrjZR1JZw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1556718768578?e=1755734400&v=beta&t=HD3N-EhCkxSKQExJ8NiUqa-uoeTXBPb5_Xd6ykwOQzA	\N	\N	https://linkedin.com/in/benoitkulesza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-06-16 16:32:40.423243+00	\N	f	f
1160	jjj	\N	Abir Juhan Test	PHA+SGV5LDwvcD48cD5JIFdvcmsgRm9yIFRoZXNlIDxzdHJvbmc+Q29tcGFuaWVzPC9zdHJvbmc+OjwvcD48b2w+PGxpPkdvb2RIaXZlPC9saT48bGk+Q2xldmVyQ2xhc3M8L2xpPjxsaT5PdXRyZWFjaEFJPC9saT48L29sPg==	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-26 16:06:30.579207+00	\N	f	f
1165	\N	\N	\N	PHA+aHR0cDovL2xvY2FsaG9zdDozMDAwL3RhbGVudHMvbXktcHJvZmlsZTwvcD4=	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-29 20:50:53.293856+00	\N	f	f
1166	\N	\N	\N	PHA+aHR0cDovL2xvY2FsaG9zdDozMDAwL3RhbGVudHMvbXktcHJvZmlsZTwvcD4=	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-29 20:51:12.489736+00	\N	f	f
1161	Juhan	\N	Abir Juhan Test	PHA+SGV5LDwvcD48cD5JIFdvcmsgRm9yIFRoZXNlIDxzdHJvbmc+Q29tcGFuaWVzPC9zdHJvbmc+OjwvcD48b2w+PGxpPkdvb2RIaXZlPC9saT48bGk+Q2xldmVyQ2xhc3M8L2xpPjxsaT5PdXRyZWFjaEFJPC9saT48L29sPg==	\N	\N	\N	\N	\N	\N	\N	\N	\N	Solidity	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-26 16:08:17.201685+00	\N	f	f
1333	Deepak Raja 	Raju Anbuchezhiyan 	Deepak	<p>Blockchain developer focused on Web3 innovation, specializing in Move language on Sui and Aptos. Passionate about building smart contracts, developer tools, and seamless wallet integrations. Actively contributing to the ecosystem through hackathons, open source, and educational content, while expanding into frontend development and cloud deployment to elevate the future of decentralized applications.</p>	IN	Chennai	+91	7299424311	12306deepakraja@gmail.con	@DeepakRaja_03	\N	50	<p>I’m a blockchain and Web3 developer specializing in the Move language on the Sui and Aptos blockchains. I focus on building smart contracts and developing powerful tools to help other developers thrive in the Web3 space. I’m passionate about creating seamless wallet integrations and contributing to open source projects. I actively participate in hackathons to push the boundaries of what’s possible. Alongside blockchain, I’m expanding my skills in frontend development using React and Next.js, as well as cloud deployment, so I can build scalable and robust decentralized applications.</p>	Solidity,Tailwind,EtherJS,IPFS,NextJS,JavaScript,Python,HTML,CSS,React,Node.js,Express.js,Flask,SQL,NoSQL,MongoDB,MySQL,PostgreSQL,Firebase,AWS,Git,Docker,RESTful APIs,GraphQL,Blockchain,Artificial Intelligence,Web Development,Version Control,Socket.IO,Redux,Next.js,TypeScript,Rust	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_fee99731-15dc-404d-965b-0fd0feec0479.pdf	https://www.linkedin.com/in/deepak-raja-9149a0249/	Deepakraja03	\N	deepakraja-portfolio.vercel.app	\N	t	t	\N	\N	f	\N	f	DeepakRaja2003	2025-11-07 13:32:19.237384+00	b6631555-ba74-44ae-ae9f-12d7455ed79a	f	t
1169	\N	\N	\N	PHA+Z3YgZ2g8L3A+	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-03-29 20:57:34.75856+00	\N	f	f
1335	Cédric	Magne	Senior Fullstack Engineer | Blockchain | AI	<h2><strong>Hello, I'm Cédric</strong></h2><p>With over 20 years of experience in IT, I have honed my skills in various industries, including aeronautics and e-commerce, and have been specializing in Web3 since 2019.</p><p>&nbsp;</p><h3><strong>🚀 My Journey</strong></h3><p>Starting my career in aeronautics, I transitioned to e-commerce, and now I am a full-stack blockchain engineer. I am proficient in Next.js, Solidity, and decentralized applications, and I am certified in AI, Machine Learning, and Deep Learning.</p><p>&nbsp;</p><h3><strong>🌐 My Expertise</strong></h3><p>I combine strong Data engineering expertise with a product-driven vision to build innovative, scalable solutions at the intersection of blockchain and AI.</p><p>&nbsp;</p><h3><strong>🛠️ My Technical Toolbox</strong></h3><p>I am proficient in TypeScript, JavaScript, Python, PHP, MySQL, PostgreSQL, Solidity, Bash, and RDBMS. I am also experienced in using various frameworks and libraries such as Next.js, React, Hardat, Viem, Wagmi, Web3.js, Ethers.js, TensorFlow, Scikit-learn, Shadcn, Tailwindcss, Jest, Nest, and JSS3.</p>	FR	Paris	+33	0634449658	cedric.magne@smartt.dev	@SmarttDev	\N	120	<h2><strong>Experience</strong></h2><p>&nbsp;</p><p><strong>Senior Full-Stack Engineer – Freelance - Web3 - AI</strong></p><p>Paris, France | 2025-03 – Present</p><p>Currently, I am building a SaaS AI-powered for crypto engagement &amp; sentiment analysis at Nurium.</p><p>&nbsp;</p><p><strong>Senior Full-Stack Engineer – Consensys</strong></p><p>Remote | 2022-01 – 2024-12</p><p>I accelerated user's MM dashboard onboarding through UX improvements and streamlined workflows by 20% at Consensys.</p><p>&nbsp;</p><h2><strong>Key Skills</strong></h2><p>&nbsp;</p><p>I bring expertise in Next.js, Solidity, and decentralized applications, backed by certifications in AI, Machine Learning, and Deep Learning. I combine strong Data engineering expertise with a product-driven vision to build innovative, scalable solutions at the intersection of blockchain and AI.</p><p>&nbsp;</p><h2><strong>Education &amp; Continuous Learning</strong></h2><p>&nbsp;</p><p>I have a Bachelor's Degree in Computer Science from CNAM and a University Degree in Aerospace Equipment/Aerospace from Ville-d'Avray, France. I am also trained in AI Engineering and Blockchain Engineering from Alyra.</p>	Typescript,JavaScript,Python,PHP,MySQL,PostgreSQL,Solidity,Bash,RDBMS,Next.js,React,Hardat,Viem,Wagmi,Web3.js,Ethers.js,TensorFlow,Scikit-learn,Shadcn,Tailwindcss,Jest,Nest,JSS3,Linux,Node.js,IPFS,Kubernetes,Docker,Ethereum,AWS,GCP,Vercel,Supabase,Git,GitHub,Infura,MetaMask,N8N,Pulumi,Terraform,InfluxDB,Airflow,Datadog,Redis,gRPC,MongoDB,tRPC,GitLab,MariaDB	https://goodhive.s3.us-east-005.backblazeb2.com/image_8dfe9e91-1a02-477e-a43f-6d40c0405d8d.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_9ae4da30-9f6e-4467-b004-9a1ae79a6b0a.pdf	https://www.linkedin.com/in/developpeur-blockchain	https://github.com/SmarttDev	\N	https://github.com/cedricmagne	\N	f	t	f	f	f	\N	t	\N	2025-11-12 22:19:20.415+00	eb835f9b-cee8-4cf0-b64c-ff9ef76aade5	t	f
1172	Kulesza	test1	test 1	PHA+PHN0cm9uZz48dT5SZXNwb25zYWJpbGl0w6lzIDwvdT48L3N0cm9uZz46PC9wPjxwPkTDqXZlbG9wcGVtZW50IGQnYXBwbGljYXRpb25zIGZyb250ZW5kIChSZWFjdCk8L3A+PHA+LSBDb25jZXB0aW9uLCBkw6l2ZWxvcHBlbWVudCBldCBtYWludGVuYW5jZSBkJ2FwcGxpY2F0aW9ucyBmcm9udGVuZCDDqXZvbHV0aXZlcyBldDwvcD48cD5wZXJmb3JtYW50ZXMuPC9wPjxwPi0gSW1wbMOpbWVudGF0aW9uIGRlIG5vdXZlbGxlcyBmb25jdGlvbm5hbGl0w6lzIHN1ciBkdSBjb2RlIGV4aXN0YW50LCB0b3V0IGVuIHJlc3BlY3RhbnQgbGVzPC9wPjxwPnN0YW5kYXJkcyBkZSBxdWFsaXTDqSBkZSBjb2RlIChsaXNpYmlsaXTDqSwgcsOpdXRpbGlzYWJpbGl0w6kpLjwvcD48cD48ZW0+QXZlYyBub3RhbW1lbnQgbGVzIGV4aWdlbmNlcyBzdWl2YW50ZXMgOjwvZW0+PC9wPjxvbD48bGk+Q29uY2V2b2lyIGV0IGltcGzDqW1lbnRlciBkZXMgYXJjaGl0ZWN0dXJlcyBsb2dpY2llbGxlcyBkYW5zIGxlcyByw6hnbGVzIGRlIGzigJlhcnQuPC9saT48bGk+RMOpdmVsb3BwZXIgZXQgbWFpbnRlbmlyIHVuIGZyb250ZW5kIHJvYnVzdGUgZXQgZOKAmXV0aWxpc2F0aW9uIGZsdWlkZS48L2xpPjxsaT5Bc3N1cmVyIGxlIGZvbmN0aW9ubmVtZW50IGR1IGZyb250ZW5kIGF1c3NpIGJpZW4gc3VyIGxhIHBhcnRpZSB3ZWIgcXVlIHBvdXIgbGEgcGFydGllIGFwcGxpY2F0aW9uIG1vYmlsZSAoQW5kcm9pZCBldCBpT1MpLjwvbGk+PGxpPkltcGzDqW1lbnRlciBkZXMgdGVzdHMgcmVwcsOpc2VudGF0aWZzIGR1IGZvbmN0aW9ubmVtZW50IGRlIGxhIHBsYXRlZm9ybWUuPC9saT48bGk+T3B0aW1pc2VyIGxlcyBwZXJmb3JtYW5jZXMgZXQgYXNzdXJlciBsYSBzw6ljdXJpdMOpIGRlcyBhcHBsaWNhdGlvbnMuPC9saT48bGk+UGFydGljaXBlciBhdXggcmV2dWVzIGRlIGNvZGUgZXQgYW3DqWxpb3JlciBsZXMgcHJhdGlxdWVzIGRlIGTDqXZlbG9wcGVtZW50LjwvbGk+PC9vbD48cD48c3Ryb25nPkZvcmNlIGRlIHByb3Bvc2l0aW9uIGV0IGTigJlpbm5vdmF0aW9uPC9zdHJvbmc+PC9wPjxwPi0gUHJvcG9zZXIgZXQgbWV0dHJlIGVuIG9ldXZyZSBkZXMgc29sdXRpb25zIHRlY2huaXF1ZXMgcG91ciBs4oCZaW1wbMOpbWVudGF0aW9uIGRlIG5vdXZlbGxlczwvcD48cD5mb25jdGlvbm5hbGl0w6lzIHByb3Bvc8OpZXMgcGFyIGxlIHByb2R1aXQuPC9wPjxwPi0gQ29sbGFib3JlciBhdmVjIGxlcyDDqXF1aXBlcyBwcm9kdWl0LCBkZXNpZ24gZXQgYmFja2VuZCBwb3VyIHByb3Bvc2VyIGxlcyBzb2x1dGlvbnMgZnJvbnRlbmQ8L3A+PHA+YWRhcHTDqWVzIGV0IGRvbm5lciBsYSBtZWlsbGV1cmUgZXhww6lyaWVuY2UgdXRpbGlzYXRldXIgw6Agbm9zIGNsaWVudHMuPC9wPjxwPi0gVHJhdmFpbGxlciBhdmVjIGxlcyBpbmfDqW5pZXVycywgbGVzIGNoZWZzIGRlIHByb2R1aXQsIGwnw6lxdWlwZSBkJ2Fzc2lzdGFuY2UgZXQgbGEgZGlyZWN0aW9uPC9wPjxwPmfDqW7DqXJhbGUuPC9wPjxwPi0gQWpvdXRlciB1bmUgw6luZXJnaWUgcG9zaXRpdmUgZXQgdW5lIGNyw6lhdGl2aXTDqSB0YW5naWJsZSDDoCBjaGFxdWUgcsOpdW5pb24sIGV0IGZhaXJlIGVuIHNvcnRlIHF1ZTwvcD48cD52b3MgY29sbMOoZ3VlcyBzZSBzZW50ZW50IGluY2x1cyBkYW5zIGNoYXF1ZSBpbnRlcmFjdGlvbi48L3A+PHA+U3VwcG9ydDwvcD48cD4tIMOKdHJlIGRpc3BvbmlibGUgZXQgw6AgbOKAmcOpY291dGUgcG91ciByw6lnbGVyIGRlcyBwcm9ibMOobWVzIHV0aWxpc2F0ZXVycyBuw6ljZXNzaXRhbnQgZGVzPC9wPjxwPmNvcnJlY3Rpb25zIGRlIGNvZGUuUmVzcG9uc2FiaWxpdMOpcyA6PC9wPjxwPkTDqXZlbG9wcGVtZW50IGQnYXBwbGljYXRpb25zIGZyb250ZW5kIChSZWFjdCk8L3A+PHA+LSBDb25jZXB0aW9uLCBkw6l2ZWxvcHBlbWVudCBldCBtYWludGVuYW5jZSBkJ2FwcGxpY2F0aW9ucyBmcm9udGVuZCDDqXZvbHV0aXZlcyBldDwvcD48cD5wZXJmb3JtYW50ZXMuPC9wPjxwPi0gSW1wbMOpbWVudGF0aW9uIGRlIG5vdXZlbGxlcyBmb25jdGlvbm5hbGl0w6lzIHN1ciBkdSBjb2RlIGV4aXN0YW50LCB0b3V0IGVuIHJlc3BlY3RhbnQgbGVzPC9wPjxwPnN0YW5kYXJkcyBkZSBxdWFsaXTDqSBkZSBjb2RlIChsaXNpYmlsaXTDqSwgcsOpdXRpbGlzYWJpbGl0w6kpLjwvcD48cD5BdmVjIG5vdGFtbWVudCBsZXMgZXhpZ2VuY2VzIHN1aXZhbnRlcyA6PC9wPjxwPi0gQ29uY2V2b2lyIGV0IGltcGzDqW1lbnRlciBkZXMgYXJjaGl0ZWN0dXJlcyBsb2dpY2llbGxlcyBkYW5zIGxlcyByw6hnbGVzIGRlIGzigJlhcnQuPC9wPjxwPi0gRMOpdmVsb3BwZXIgZXQgbWFpbnRlbmlyIHVuIGZyb250ZW5kIHJvYnVzdGUgZXQgZOKAmXV0aWxpc2F0aW9uIGZsdWlkZS48L3A+PHA+LSBBc3N1cmVyIGxlIGZvbmN0aW9ubmVtZW50IGR1IGZyb250ZW5kIGF1c3NpIGJpZW4gc3VyIGxhIHBhcnRpZSB3ZWIgcXVlIHBvdXIgbGEgcGFydGllPC9wPjxwPmFwcGxpY2F0aW9uIG1vYmlsZSAoQW5kcm9pZCBldCBpT1MpLjwvcD48cD4tIEltcGzDqW1lbnRlciBkZXMgdGVzdHMgcmVwcsOpc2VudGF0aWZzIGR1IGZvbmN0aW9ubmVtZW50IGRlIGxhIHBsYXRlZm9ybWUuPC9wPjxwPi0gT3B0aW1pc2VyIGxlcyBwZXJmb3JtYW5jZXMgZXQgYXNzdXJlciBsYSBzw6ljdXJpdMOpIGRlcyBhcHBsaWNhdGlvbnMuPC9wPjxwPi0gUGFydGljaXBlciBhdXggcmV2dWVzIGRlIGNvZGUgZXQgYW3DqWxpb3JlciBsZXMgcHJhdGlxdWVzIGRlIGTDqXZlbG9wcGVtZW50LjwvcD48cD5Gb3JjZSBkZSBwcm9wb3NpdGlvbiBldCBk4oCZaW5ub3ZhdGlvbjwvcD48cD4tIFByb3Bvc2VyIGV0IG1ldHRyZSBlbiBvZXV2cmUgZGVzIHNvbHV0aW9ucyB0ZWNobmlxdWVzIHBvdXIgbOKAmWltcGzDqW1lbnRhdGlvbiBkZSBub3V2ZWxsZXM8L3A+PHA+Zm9uY3Rpb25uYWxpdMOpcyBwcm9wb3PDqWVzIHBhciBsZSBwcm9kdWl0LjwvcD48cD4tIENvbGxhYm9yZXIgYXZlYyBsZXMgw6lxdWlwZXMgcHJvZHVpdCwgZGVzaWduIGV0IGJhY2tlbmQgcG91ciBwcm9wb3NlciBsZXMgc29sdXRpb25zIGZyb250ZW5kPC9wPjxwPmFkYXB0w6llcyBldCBkb25uZXIgbGEgbWVpbGxldXJlIGV4cMOpcmllbmNlIHV0aWxpc2F0ZXVyIMOgIG5vcyBjbGllbnRzLjwvcD48cD4tIFRyYXZhaWxsZXIgYXZlYyBsZXMgaW5nw6luaWV1cnMsIGxlcyBjaGVmcyBkZSBwcm9kdWl0LCBsJ8OpcXVpcGUgZCdhc3Npc3RhbmNlIGV0IGxhIGRpcmVjdGlvbjwvcD48cD5nw6luw6lyYWxlLjwvcD48cD4tIEFqb3V0ZXIgdW5lIMOpbmVyZ2llIHBvc2l0aXZlIGV0IHVuZSBjcsOpYXRpdml0w6kgdGFuZ2libGUgw6AgY2hhcXVlIHLDqXVuaW9uLCBldCBmYWlyZSBlbiBzb3J0ZSBxdWU8L3A+PHA+dm9zIGNvbGzDqGd1ZXMgc2Ugc2VudGVudCBpbmNsdXMgZGFucyBjaGFxdWUgaW50ZXJhY3Rpb24uPC9wPjxwPlN1cHBvcnQ8L3A+PHA+LSDDinRyZSBkaXNwb25pYmxlIGV0IMOgIGzigJnDqWNvdXRlIHBvdXIgcsOpZ2xlciBkZXMgcHJvYmzDqG1lcyB1dGlsaXNhdGV1cnMgbsOpY2Vzc2l0YW50IGRlczwvcD48cD5jb3JyZWN0aW9ucyBkZSBjb2RlLlJlc3BvbnNhYmlsaXTDqXMgOjwvcD48cD5Ew6l2ZWxvcHBlbWVudCBkJ2FwcGxpY2F0aW9ucyBmcm9udGVuZCAoUmVhY3QpPC9wPjxwPi0gQ29uY2VwdGlvbiwgZMOpdmVsb3BwZW1lbnQgZXQgbWFpbnRlbmFuY2UgZCdhcHBsaWNhdGlvbnMgZnJvbnRlbmQgw6l2b2x1dGl2ZXMgZXQ8L3A+PHA+cGVyZm9ybWFudGVzLjwvcD48cD4tIEltcGzDqW1lbnRhdGlvbiBkZSBub3V2ZWxsZXMgZm9uY3Rpb25uYWxpdMOpcyBzdXIgZHUgY29kZSBleGlzdGFudCwgdG91dCBlbiByZXNwZWN0YW50IGxlczwvcD48cD5zdGFuZGFyZHMgZGUgcXVhbGl0w6kgZGUgY29kZSAobGlzaWJpbGl0w6ksIHLDqXV0aWxpc2FiaWxpdMOpKS48L3A+PHA+QXZlYyBub3RhbW1lbnQgbGVzIGV4aWdlbmNlcyBzdWl2YW50ZXMgOjwvcD48cD4tIENvbmNldm9pciBldCBpbXBsw6ltZW50ZXIgZGVzIGFyY2hpdGVjdHVyZXMgbG9naWNpZWxsZXMgZGFucyBsZXMgcsOoZ2xlcyBkZSBs4oCZYXJ0LjwvcD48cD4tIETDqXZlbG9wcGVyIGV0IG1haW50ZW5pciB1biBmcm9udGVuZCByb2J1c3RlIGV0IGTigJl1dGlsaXNhdGlvbiBmbHVpZGUuPC9wPjxwPi0gQXNzdXJlciBsZSBmb25jdGlvbm5lbWVudCBkdSBmcm9udGVuZCBhdXNzaSBiaWVuIHN1ciBsYSBwYXJ0aWUgd2ViIHF1ZSBwb3VyIGxhIHBhcnRpZTwvcD48cD5hcHBsaWNhdGlvbiBtb2JpbGUgKEFuZHJvaWQgZXQgaU9TKS48L3A+PHA+LSBJbXBsw6ltZW50ZXIgZGVzIHRlc3RzIHJlcHLDqXNlbnRhdGlmcyBkdSBmb25jdGlvbm5lbWVudCBkZSBsYSBwbGF0ZWZvcm1lLjwvcD48cD4tIE9wdGltaXNlciBsZXMgcGVyZm9ybWFuY2VzIGV0IGFzc3VyZXIgbGEgc8OpY3VyaXTDqSBkZXMgYXBwbGljYXRpb25zLjwvcD48cD4tIFBhcnRpY2lwZXIgYXV4IHJldnVlcyBkZSBjb2RlIGV0IGFtw6lsaW9yZXIgbGVzIHByYXRpcXVlcyBkZSBkw6l2ZWxvcHBlbWVudC48L3A+PHA+Rm9yY2UgZGUgcHJvcG9zaXRpb24gZXQgZOKAmWlubm92YXRpb248L3A+PHA+LSBQcm9wb3NlciBldCBtZXR0cmUgZW4gb2V1dnJlIGRlcyBzb2x1dGlvbnMgdGVjaG5pcXVlcyBwb3VyIGzigJlpbXBsw6ltZW50YXRpb24gZGUgbm91dmVsbGVzPC9wPjxwPmZvbmN0aW9ubmFsaXTDqXMgcHJvcG9zw6llcyBwYXIgbGUgcHJvZHVpdC48L3A+PHA+LSBDb2xsYWJvcmVyIGF2ZWMgbGVzIMOpcXVpcGVzIHByb2R1aXQsIGRlc2lnbiBldCBiYWNrZW5kIHBvdXIgcHJvcG9zZXIgbGVzIHNvbHV0aW9ucyBmcm9udGVuZDwvcD48cD5hZGFwdMOpZXMgZXQgZG9ubmVyIGxhIG1laWxsZXVyZSBleHDDqXJpZW5jZSB1dGlsaXNhdGV1ciDDoCBub3MgY2xpZW50cy48L3A+PHA+LSBUcmF2YWlsbGVyIGF2ZWMgbGVzIGluZ8OpbmlldXJzLCBsZXMgY2hlZnMgZGUgcHJvZHVpdCwgbCfDqXF1aXBlIGQnYXNzaXN0YW5jZSBldCBsYSBkaXJlY3Rpb248L3A+PHA+Z8OpbsOpcmFsZS48L3A+PHA+LSBBam91dGVyIHVuZSDDqW5lcmdpZSBwb3NpdGl2ZSBldCB1bmUgY3LDqWF0aXZpdMOpIHRhbmdpYmxlIMOgIGNoYXF1ZSByw6l1bmlvbiwgZXQgZmFpcmUgZW4gc29ydGUgcXVlPC9wPjxwPnZvcyBjb2xsw6hndWVzIHNlIHNlbnRlbnQgaW5jbHVzIGRhbnMgY2hhcXVlIGludGVyYWN0aW9uLjwvcD48cD48c3Ryb25nPlN1cHBvcnQ8L3N0cm9uZz48L3A+PHA+LSDDinRyZSBkaXNwb25pYmxlIGV0IMOgIGzigJnDqWNvdXRlIHBvdXIgcsOpZ2xlciBkZXMgcHJvYmzDqG1lcyB1dGlsaXNhdGV1cnMgbsOpY2Vzc2l0YW50IGRlczwvcD48cD5jb3JyZWN0aW9ucyBkZSBjb2RlLlJlc3BvbnNhYmlsaXTDqXMgOjwvcD48cD5Ew6l2ZWxvcHBlbWVudCBkJ2FwcGxpY2F0aW9ucyBmcm9udGVuZCAoUmVhY3QpPC9wPjxwPi0gQ29uY2VwdGlvbiwgZMOpdmVsb3BwZW1lbnQgZXQgbWFpbnRlbmFuY2UgZCdhcHBsaWNhdGlvbnMgZnJvbnRlbmQgw6l2b2x1dGl2ZXMgZXQ8L3A+PHA+cGVyZm9ybWFudGVzLjwvcD48cD4tIEltcGzDqW1lbnRhdGlvbiBkZSBub3V2ZWxsZXMgZm9uY3Rpb25uYWxpdMOpcyBzdXIgZHUgY29kZSBleGlzdGFudCwgdG91dCBlbiByZXNwZWN0YW50IGxlczwvcD48cD5zdGFuZGFyZHMgZGUgcXVhbGl0w6kgZGUgY29kZSAobGlzaWJpbGl0w6ksIHLDqXV0aWxpc2FiaWxpdMOpKS48L3A+PHA+QXZlYyBub3RhbW1lbnQgbGVzIGV4aWdlbmNlcyBzdWl2YW50ZXMgOjwvcD48cD4tIENvbmNldm9pciBldCBpbXBsw6ltZW50ZXIgZGVzIGFyY2hpdGVjdHVyZXMgbG9naWNpZWxsZXMgZGFucyBsZXMgcsOoZ2xlcyBkZSBs4oCZYXJ0LjwvcD48cD4tIETDqXZlbG9wcGVyIGV0IG1haW50ZW5pciB1biBmcm9udGVuZCByb2J1c3RlIGV0IGTigJl1dGlsaXNhdGlvbiBmbHVpZGUuPC9wPjxwPi0gQXNzdXJlciBsZSBmb25jdGlvbm5lbWVudCBkdSBmcm9udGVuZCBhdXNzaSBiaWVuIHN1ciBsYSBwYXJ0aWUgd2ViIHF1ZSBwb3VyIGxhIHBhcnRpZTwvcD48cD5hcHBsaWNhdGlvbiBtb2JpbGUgKEFuZHJvaWQgZXQgaU9TKS48L3A+PHA+LSBJbXBsw6ltZW50ZXIgZGVzIHRlc3RzIHJlcHLDqXNlbnRhdGlmcyBkdSBmb25jdGlvbm5lbWVudCBkZSBsYSBwbGF0ZWZvcm1lLjwvcD48cD4tIE9wdGltaXNlciBsZXMgcGVyZm9ybWFuY2VzIGV0IGFzc3VyZXIgbGEgc8OpY3VyaXTDqSBkZXMgYXBwbGljYXRpb25zLjwvcD48cD4tIFBhcnRpY2lwZXIgYXV4IHJldnVlcyBkZSBjb2RlIGV0IGFtw6lsaW9yZXIgbGVzIHByYXRpcXVlcyBkZSBkw6l2ZWxvcHBlbWVudC48L3A+PHA+Rm9yY2UgZGUgcHJvcG9zaXRpb24gZXQgZOKAmWlubm92YXRpb248L3A+PHA+LSBQcm9wb3NlciBldCBtZXR0cmUgZW4gb2V1dnJlIGRlcyBzb2x1dGlvbnMgdGVjaG5pcXVlcyBwb3VyIGzigJlpbXBsw6ltZW50YXRpb24gZGUgbm91dmVsbGVzPC9wPjxwPmZvbmN0aW9ubmFsaXTDqXMgcHJvcG9zw6llcyBwYXIgbGUgcHJvZHVpdC48L3A+PHA+LSBDb2xsYWJvcmVyIGF2ZWMgbGVzIMOpcXVpcGVzIHByb2R1aXQsIGRlc2lnbiBldCBiYWNrZW5kIHBvdXIgcHJvcG9zZXIgbGVzIHNvbHV0aW9ucyBmcm9udGVuZDwvcD48cD5hZGFwdMOpZXMgZXQgZG9ubmVyIGxhIG1laWxsZXVyZSBleHDDqXJpZW5jZSB1dGlsaXNhdGV1ciDDoCBub3MgY2xpZW50cy48L3A+PHA+LSBUcmF2YWlsbGVyIGF2ZWMgbGVzIGluZ8OpbmlldXJzLCBsZXMgY2hlZnMgZGUgcHJvZHVpdCwgbCfDqXF1aXBlIGQnYXNzaXN0YW5jZSBldCBsYSBkaXJlY3Rpb248L3A+PHA+Z8OpbsOpcmFsZS48L3A+PHA+LSBBam91dGVyIHVuZSDDqW5lcmdpZSBwb3NpdGl2ZSBldCB1bmUgY3LDqWF0aXZpdMOpIHRhbmdpYmxlIMOgIGNoYXF1ZSByw6l1bmlvbiwgZXQgZmFpcmUgZW4gc29ydGUgcXVlPC9wPjxwPnZvcyBjb2xsw6hndWVzIHNlIHNlbnRlbnQgaW5jbHVzIGRhbnMgY2hhcXVlIGludGVyYWN0aW9uLjwvcD48cD48c3Ryb25nPlN1cHBvcnQ8L3N0cm9uZz48L3A+PHA+LSDDinRyZSBkaXNwb25pYmxlIGV0IMOgIGzigJnDqWNvdXRlIHBvdXIgcsOpZ2xlciBkZXMgcHJvYmzDqG1lcyB1dGlsaXNhdGV1cnMgbsOpY2Vzc2l0YW50IGRlczwvcD48cD5jb3JyZWN0aW9ucyBkZSBjb2RlLjwvcD4=	FR	Paris	+33	0663115426	benoit.test1@goodhive.io	benoitk14	\N	256	PHA+UmVzcG9uc2FiaWxpdMOpcyA6PC9wPjxwPkTDqXZlbG9wcGVtZW50IGQnYXBwbGljYXRpb25zIGZyb250ZW5kIChSZWFjdCk8L3A+PHA+LSBDb25jZXB0aW9uLCBkw6l2ZWxvcHBlbWVudCBldCBtYWludGVuYW5jZSBkJ2FwcGxpY2F0aW9ucyBmcm9udGVuZCDDqXZvbHV0aXZlcyBldDwvcD48cD5wZXJmb3JtYW50ZXMuPC9wPjxwPi0gSW1wbMOpbWVudGF0aW9uIGRlIG5vdXZlbGxlcyBmb25jdGlvbm5hbGl0w6lzIHN1ciBkdSBjb2RlIGV4aXN0YW50LCB0b3V0IGVuIHJlc3BlY3RhbnQgbGVzPC9wPjxwPnN0YW5kYXJkcyBkZSBxdWFsaXTDqSBkZSBjb2RlIChsaXNpYmlsaXTDqSwgcsOpdXRpbGlzYWJpbGl0w6kpLjwvcD48cD5BdmVjIG5vdGFtbWVudCBsZXMgZXhpZ2VuY2VzIHN1aXZhbnRlcyA6PC9wPjxwPi0gQ29uY2V2b2lyIGV0IGltcGzDqW1lbnRlciBkZXMgYXJjaGl0ZWN0dXJlcyBsb2dpY2llbGxlcyBkYW5zIGxlcyByw6hnbGVzIGRlIGzigJlhcnQuPC9wPjxwPi0gRMOpdmVsb3BwZXIgZXQgbWFpbnRlbmlyIHVuIGZyb250ZW5kIHJvYnVzdGUgZXQgZOKAmXV0aWxpc2F0aW9uIGZsdWlkZS48L3A+PHA+LSBBc3N1cmVyIGxlIGZvbmN0aW9ubmVtZW50IGR1IGZyb250ZW5kIGF1c3NpIGJpZW4gc3VyIGxhIHBhcnRpZSB3ZWIgcXVlIHBvdXIgbGEgcGFydGllPC9wPjxwPmFwcGxpY2F0aW9uIG1vYmlsZSAoQW5kcm9pZCBldCBpT1MpLjwvcD48cD4tIEltcGzDqW1lbnRlciBkZXMgdGVzdHMgcmVwcsOpc2VudGF0aWZzIGR1IGZvbmN0aW9ubmVtZW50IGRlIGxhIHBsYXRlZm9ybWUuPC9wPjxwPi0gT3B0aW1pc2VyIGxlcyBwZXJmb3JtYW5jZXMgZXQgYXNzdXJlciBsYSBzw6ljdXJpdMOpIGRlcyBhcHBsaWNhdGlvbnMuPC9wPjxwPi0gUGFydGljaXBlciBhdXggcmV2dWVzIGRlIGNvZGUgZXQgYW3DqWxpb3JlciBsZXMgcHJhdGlxdWVzIGRlIGTDqXZlbG9wcGVtZW50LjwvcD48cD5Gb3JjZSBkZSBwcm9wb3NpdGlvbiBldCBk4oCZaW5ub3ZhdGlvbjwvcD48cD4tIFByb3Bvc2VyIGV0IG1ldHRyZSBlbiBvZXV2cmUgZGVzIHNvbHV0aW9ucyB0ZWNobmlxdWVzIHBvdXIgbOKAmWltcGzDqW1lbnRhdGlvbiBkZSBub3V2ZWxsZXM8L3A+PHA+Zm9uY3Rpb25uYWxpdMOpcyBwcm9wb3PDqWVzIHBhciBsZSBwcm9kdWl0LjwvcD48cD4tIENvbGxhYm9yZXIgYXZlYyBsZXMgw6lxdWlwZXMgcHJvZHVpdCwgZGVzaWduIGV0IGJhY2tlbmQgcG91ciBwcm9wb3NlciBsZXMgc29sdXRpb25zIGZyb250ZW5kPC9wPjxwPmFkYXB0w6llcyBldCBkb25uZXIgbGEgbWVpbGxldXJlIGV4cMOpcmllbmNlIHV0aWxpc2F0ZXVyIMOgIG5vcyBjbGllbnRzLjwvcD48cD4tIFRyYXZhaWxsZXIgYXZlYyBsZXMgaW5nw6luaWV1cnMsIGxlcyBjaGVmcyBkZSBwcm9kdWl0LCBsJ8OpcXVpcGUgZCdhc3Npc3RhbmNlIGV0IGxhIGRpcmVjdGlvbjwvcD48cD5nw6luw6lyYWxlLjwvcD48cD4tIEFqb3V0ZXIgdW5lIMOpbmVyZ2llIHBvc2l0aXZlIGV0IHVuZSBjcsOpYXRpdml0w6kgdGFuZ2libGUgw6AgY2hhcXVlIHLDqXVuaW9uLCBldCBmYWlyZSBlbiBzb3J0ZSBxdWU8L3A+PHA+dm9zIGNvbGzDqGd1ZXMgc2Ugc2VudGVudCBpbmNsdXMgZGFucyBjaGFxdWUgaW50ZXJhY3Rpb24uPC9wPjxwPlN1cHBvcnQ8L3A+PHA+LSDDinRyZSBkaXNwb25pYmxlIGV0IMOgIGzigJnDqWNvdXRlIHBvdXIgcsOpZ2xlciBkZXMgcHJvYmzDqG1lcyB1dGlsaXNhdGV1cnMgbsOpY2Vzc2l0YW50IGRlczwvcD48cD5jb3JyZWN0aW9ucyBkZSBjb2RlLjwvcD4=	Solidity,EtherJS,Tailwind,IPFS,NextJS,JavaScript,Python,Java,C++,C#,HTML,CSS,React,Angular,Vue.js,Node.js,Express.js,Django,Flask,SQL,NoSQL,MongoDB,PostgreSQL,MySQL,Firebase,AWS,Azure,Google Cloud,Docker,Kubernetes,Git,RESTful APIs,GraphQL,TensorFlow,PyTorch,Machine Learning,Data Science,Big Data,Artificial Intelligence,Blockchain,Cybersecurity,DevOps,Microservices,Responsive Web Design,UI/UX Design,Agile Methodologies,Scrum,Kanban,Jira,Continuous Integration/Continuous Deployment (CI/CD),Linux,Shell Scripting,Algorithms,Data Structures,Object-Oriented Programming (OOP),Functional Programming,Web Development,Mobile App Development,Game Development,Embedded Systems	https://goodhive.s3.us-east-005.backblazeb2.com/image_f09153f1-6c85-464a-a69d-799e1d15724b.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_d7bbfcb1-c281-4be0-8082-268a61e7c858.pdf	\N	\N	\N	\N	t	\N	t	\N	\N	\N	\N	\N	\N	2025-04-07 18:41:14.415+00	230dd894-d5b8-4eda-9b97-8d00ea196c71	f	t
1183	Marie	BRESSE	MSB	\N	FR	Bagnols sur Cèze	+33	0466897329	marie.bresse@sfr.fr	\N	\N	\N	PHA+dm91cyByZWNvbW1hbmRlciBwb3VyIHJlY3J1dGV1cnMgcG90ZW50aWVsczwvcD4=	Mentoring	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	t	\N	\N	\N	2025-04-17 07:30:48.852+00	e1334ca6-1cad-4c1a-bbc6-92372024a27c	f	f
1186	Tanmay	Sharma	Blockchain Developer	\N	IN	Gurgaon	+91	6375666706	tanmaysharma0852@gmail.com	@codeol123	\N	40	\N	\N	\N	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_cbf07baf-2bed-47b4-83a9-caee1f173bcd.pdf	https://linkedin.com/in/tanmay-codeol	https://github.com/Tanmay-codeol	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://x.com/Tanmay_Codeol/	2025-04-24 19:03:56.963411+00	78479e98-f7e0-475a-903f-055bcefe07e8	f	f
1178	Nakshatra	Goel	IIT Roorkee | Fellow @Wormhole @WH_India | Web3 x AI | Blockchain Developer | 8x Hackathon Winner	PHA+PHNwYW4gc3R5bGU9ImNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuOSk7Ij5BcyBhIEJsb2NrY2hhaW4gRW50aHVzaWFzdCwgRnVsbCBTdGFjayBXZWIgRGV2ZWxvcGVyIChNRVJOIFN0YWNrKSwgYW5kIFNlY3VyaXR5IFJlc2VhcmNoZXIgZnJvbSBJbmRpYW4gSW5zdGl0dXRlIG9mIFRlY2hub2xvZ3kgUm9vcmtlZSAoSUlUUiksIEkgYW0gcGFzc2lvbmF0ZSBhYm91dCBkZWNlbnRyYWxpemF0aW9uIGFuZCBkcml2aW5nIGlubm92YXRpb24gd2l0aGluIHRoZSBXZWIzIGVjb3N5c3RlbS4gTXkgZXhwZXJ0aXNlIGluIFNvbGlkaXR5IGhhcyBlbmFibGVkIG1lIHRvIGRldmVsb3AgREFwcHMsIGltcGxlbWVudCBzbWFydCBjb250cmFjdHMsIGFuZCB3b3JrIGV4dGVuc2l2ZWx5IHdpdGggRVJDNzIxIGFuZCBFUkMyMCBzdGFuZGFyZHMgdG8gYnVpbGQgc2NhbGFibGUsIHNlY3VyZSBibG9ja2NoYWluIHNvbHV0aW9ucy48L3NwYW4+PC9wPjxwPjxicj48L3A+PHA+PHNwYW4gc3R5bGU9ImNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuOSk7Ij5JIGFtIHBhcnRpY3VsYXJseSBkcmF3biB0byB0aGUgRGVGaSBzcGFjZSwgWmVyby1Lbm93bGVkZ2UgUHJvb2ZzIChaS1BzKSwgTGF5ZXIgMiBTY2FsaW5nIFNvbHV0aW9ucywgYW5kIENyeXB0b2dyYXBoeS4gTXkgZm9jdXMgbGllcyBpbiBlbmhhbmNpbmcgdGhlIHNlY3VyaXR5LCBwcml2YWN5LCBhbmQgc2NhbGFiaWxpdHkgb2YgZGVjZW50cmFsaXplZCBzeXN0ZW1zLiBBcyBhIHNwZWNpYWxpc3QgaW4gU21hcnQgQ29udHJhY3QgU2VjdXJpdHkgYW5kIEF1ZGl0aW5nLCBJIGVuc3VyZSB0aGUgaW50ZWdyaXR5IGFuZCByb2J1c3RuZXNzIG9mIGJsb2NrY2hhaW4gYXBwbGljYXRpb25zLjwvc3Bhbj48L3A+PHA+PGJyPjwvcD48cD48c3BhbiBzdHlsZT0iY29sb3I6IHJnYmEoMCwgMCwgMCwgMC45KTsiPkhhdmluZyB3b24gNSBoYWNrYXRob25zLCBJIHRocml2ZSBpbiBoaWdoLXByZXNzdXJlLCBmYXN0LXBhY2VkIGVudmlyb25tZW50cyB3aGVyZSBpbm5vdmF0aW9uIGlzIGtleS4gSSBhbSBhbiBhY3RpdmUgY29udHJpYnV0b3IgdG8gT3BlbiBTb3VyY2UgcHJvamVjdHMsIGFuZCBJIGNvbnRpbnVvdXNseSBlbmdhZ2Ugd2l0aCBlbWVyZ2luZyB0ZWNobm9sb2dpZXMgc3VjaCBhcyBDcnlwdG8gYW5kIEdlbmVyYXRpdmUgQUkgKEdlbiBBSSkgZGV2ZWxvcG1lbnQuPC9zcGFuPjwvcD48cD48YnI+PC9wPjxwPjxzcGFuIHN0eWxlPSJjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjkpOyI+QWRkaXRpb25hbGx5LCBJIHBhcnRpY2lwYXRlIGluIENvbXBldGl0aXZlIFByb2dyYW1taW5nIHRvIHNoYXJwZW4gbXkgcHJvYmxlbS1zb2x2aW5nIHNraWxscywgd2hpY2ggSSBhcHBseSB0byByZWFsLXdvcmxkIGJsb2NrY2hhaW4gY2hhbGxlbmdlcy4gTXkgZHJpdmUgdG8gcHVzaCB0aGUgYm91bmRhcmllcyBvZiBXZWIzIGFuZCBibG9ja2NoYWluIHRlY2hub2xvZ3kga2VlcHMgbWUgY29tbWl0dGVkIHRvIGV4cGxvcmluZyBuZXcgb3Bwb3J0dW5pdGllcyBhbmQgY29udHJpYnV0aW5nIHRvIHRoZSBncm93dGggb2YgdGhlIGRlY2VudHJhbGl6ZWQgZWNvc3lzdGVtLjwvc3Bhbj48L3A+	IN	Delhi	+91	8586892675	nakshatragoel05@gmail.com	Naksh012	\N	\N	PHA+Jm5ic3A7QWN0aXZlbHkgZXhwbG9yaW5nIG9wcG9ydHVuaXRpZXMgaW4gZ3Jvd3RoLCBidXNpbmVzcyBkZXZlbG9wbWVudCwgYW5kIGRldmVsb3BlciByZWxhdGlvbnMgcm9sZXMuJm5ic3A7PC9wPg==	Solidity,EtherJS,Tailwind,NextJS,JavaScript,Python,C++,IPFS,React,SQL,business development,growth	https://goodhive.s3.us-east-005.backblazeb2.com/image_0f3b7c0e-4756-4eaf-9114-e5c9231c4e8c.jpeg	\N	https://goodhive.s3.us-east-005.backblazeb2.com/pdf_4910f5f4-7baa-4336-b0e7-4b80884b416e.pdf	https://www.linkedin.com/in/nakshatra-goel/	https://github.com/Nakshatra05	\N	https://linktr.ee/nakshatragoel	\N	\N	t	t	f	\N	\N	t	https://x.com/Naksh005	2025-05-28 13:53:40.229+00	ebd3909c-394a-472a-ad45-183ae8521540	f	f
1175	\N	\N	Abir Hossain Shuvo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	JavaScript	https://goodhive.s3.us-east-005.backblazeb2.com/image_7cb2a634-c0d2-4065-be03-b9530b74e454.png	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 18:14:36.896+00	60cad285-0cb1-45d0-a470-9ba339670b09	f	f
1191	Benoît	K.	#Web3 #Decentralization #CollaborativeEconomy #FutureOfWork | Connecting Talent & Builders	PHA+SSBoYXZlIG92ZXIgZWlnaHQgeWVhcnMgb2YgZXhwZXJpZW5jZSBhcyBhbiBlbnRyZXByZW5ldXIgYW5kIGEgcmVjcnVpdGVyIGluIHRoZSBibG9ja2NoYWluIGFuZCBXZWIzIHNwYWNlLiBJJ20gcGFzc2lvbmF0ZSBhYm91dCBkZWNlbnRyYWxpemF0aW9uLCBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aW9uLCBhbmQgSSBhcHBseSB0aGVzZSBwcmluY2lwbGVzIHRvIG15IHdvcmsgYW5kIHByb2plY3RzLjwvcD48cD5BcyB0aGUgZm91bmRlciBvZiBHb29kSGl2ZSBhbmQgV2ViM1RhbGVudEZhaXIsIEknbSBvbiBhIG1pc3Npb24gdG8gc29sdmUgdGhlIHRhbGVudCBzaG9ydGFnZSBwcm9ibGVtIGluIHRoZSBXZWIzIGVjb3N5c3RlbS4gSSBsZXZlcmFnZSBteSBuZXR3b3JrLCBza2lsbHMsIGFuZCBrbm93bGVkZ2UgdG8gY29ubmVjdCB0b3AgSVQgdGFsZW50cyB3aXRoIGN1dHRpbmctZWRnZSBibG9ja2NoYWluIGpvYnMsIGJvdGggb25saW5lIGFuZCBvZmZsaW5lLiBJIGFsc28gYWltIHRvIGVtcG93ZXIgYW5kIGVkdWNhdGUgdGhlIFdlYjMgY29tbXVuaXR5IGJ5IGNyZWF0aW5nIGlubm92YXRpdmUgYW5kIGluY2x1c2l2ZSBwbGF0Zm9ybXMgYW5kIGV2ZW50cy4gSm9pbiBtZSBvbiB0aGlzIGV4Y2l0aW5nIGpvdXJuZXkgdG93YXJkcyBhIGRlY2VudHJhbGl6ZWQgZnV0dXJlITwvcD4=	\N	Paris, Île-de-France	\N	\N	\N	\N	\N	\N	PHA+SSBoYXZlIG92ZXIgZWlnaHQgeWVhcnMgb2YgZXhwZXJpZW5jZSBhcyBhbiBlbnRyZXByZW5ldXIgYW5kIGEgcmVjcnVpdGVyIGluIHRoZSBibG9ja2NoYWluIGFuZCBXZWIzIHNwYWNlLiBJJ20gcGFzc2lvbmF0ZSBhYm91dCBkZWNlbnRyYWxpemF0aW9uLCBzaGFyaW5nIGVjb25vbXksIGFuZCBjb2xsYWJvcmF0aW9uLCBhbmQgSSBhcHBseSB0aGVzZSBwcmluY2lwbGVzIHRvIG15IHdvcmsgYW5kIHByb2plY3RzLjwvcD48cD5BcyB0aGUgZm91bmRlciBvZiBHb29kSGl2ZSBhbmQgV2ViM1RhbGVudEZhaXIsIEknbSBvbiBhIG1pc3Npb24gdG8gc29sdmUgdGhlIHRhbGVudCBzaG9ydGFnZSBwcm9ibGVtIGluIHRoZSBXZWIzIGVjb3N5c3RlbS4gSSBsZXZlcmFnZSBteSBuZXR3b3JrLCBza2lsbHMsIGFuZCBrbm93bGVkZ2UgdG8gY29ubmVjdCB0b3AgSVQgdGFsZW50cyB3aXRoIGN1dHRpbmctZWRnZSBibG9ja2NoYWluIGpvYnMsIGJvdGggb25saW5lIGFuZCBvZmZsaW5lLiBJIGFsc28gYWltIHRvIGVtcG93ZXIgYW5kIGVkdWNhdGUgdGhlIFdlYjMgY29tbXVuaXR5IGJ5IGNyZWF0aW5nIGlubm92YXRpdmUgYW5kIGluY2x1c2l2ZSBwbGF0Zm9ybXMgYW5kIGV2ZW50cy4gSm9pbiBtZSBvbiB0aGlzIGV4Y2l0aW5nIGpvdXJuZXkgdG93YXJkcyBhIGRlY2VudHJhbGl6ZWQgZnV0dXJlITwvcD4=	Gestion de start-ups,Corporate Finance,Mergers & Acquisitions,Business Strategy,Strategic Planning,Financial Analysis,Finance,Strategy,Business Development,International Business,Business Planning,Investments,Management,Mergers,Management Consulting,Performance Management,Financial Modeling,Restructuring,Valuation,Project Finance,Business Valuation,Process Improvement,Marketing,Joint Ventures,Corporate Development,Project Planning,Team Management,Contract Negotiation,Divestitures,Planning,Sharing Economy,Collaborative Economy,Fund Raising,Business Process Improvement,Start-ups,Plant Start-ups,blockchain,DAO,P2P,Fundraising,Technical Recruiting,DeFi ,Tokenomics,Dyslexic Thinking	https://media.licdn.com/dms/image/v2/C4D03AQESUUrjZR1JZw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1556718768578?e=1751500800&v=beta&t=E0yocSGxhV3nl8M2ZKlWHAjseRBdYGquDksgS2cspE8	\N	\N	https://linkedin.com/in/benoitkulesza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-04-30 16:25:03.746719+00	9264edf3-cd9d-4fa7-9fa9-be3aaa164f1d	f	f
1190	Will	Davis	The IDEA Engineer - Building a Better Tomorrow	PHA+V2lsbCBzZXJ2ZXMgYXMgYSBQcm9ncmFtIEFuYWx5c3QgZm9yIE5BU0EuIEhlIGlzIGhvdXNlZCBpbiB0aGUgT2ZmaWNlIG9mIERpdmVyc2l0eSBhbmQgRXF1YWwgT3Bwb3J0dW5pdHkgKE9ERU8pIHdoaWNoIHByb3ZpZGVzIGxlYWRlcnNoaXAgdG8gbWFrZSBOQVNBIGEgbW9kZWwgRXF1YWwgRW1wbG95bWVudCBPcHBvcnR1bml0eSAoRUVPKSBhZ2VuY3kgdGhyb3VnaCBldmlkZW5jZS1iYXNlZCBwb2xpY2llcyBhbmQgcHJvZ3JhbXMuIFdpbGwgbGVhZHMgT0RFT+KAmXMgRGF0YSBBbmFseXRpY3MgZWZmb3J0cy48L3A+PHA+UHJpb3IgdG8gam9pbmluZyB0aGUgQWdlbmN5IE9ERU8gdGVhbSwgV2lsbCB3YXMgYSBQcm9ncmFtIE1hbmFnZXIgYXQgdGhlIEpvaG5zb24gU3BhY2UgQ2VudGVyIHdoZXJlIGhlIGFsc28gc2VydmVkIGFzIHRoZSBFUkcgTWFuYWdlciBhbmQgYW4gRXF1YWwgRW1wbG95bWVudCBPcHBvcnR1bml0eSBTcGVjaWFsaXN0LiBQcmlvciB0byBqb2luaW5nIE9ERU8sIGhlIHNlcnZlZCBmb3IgMTIgeWVhcnMgYXMgYW4gZW5naW5lZXIgd2l0aCB0aGUgU2FmZXR5IGFuZCBNaXNzaW9uIEFzc3VyYW5jZSBEaXJlY3RvcmF0ZSB3aGVyZSBoZSB3YXMgYSBzdWJqZWN0IG1hdHRlciBleHBlcnQgaW4gdGhlIGFyZWFzIG9mIG1hdGVyaWFscyBhbmQgcHJvY2Vzc2VzIGVuZ2luZWVyaW5nLCBxdWFsaXR5IGVuZ2luZWVyaW5nLCBzdXBwbGllciBxdWFsaXR5LCBtZWNoYW5pY2FsIHBhcnRzLCBhbmQgYW50aS1jb3VudGVyZmVpdGluZy4gSW4gdGhpcyByb2xlIGhlIHN1cHBvcnRlZCB0aGUgU3BhY2UgU2h1dHRsZSBQcm9ncmFtLCBPcmlvbiBQcm9ncmFtLCBJbnRlcm5hdGlvbmFsIFNwYWNlIFN0YXRpb24gUHJvZ3JhbSwgYW5kIENvbW1lcmNpYWwgQ3JldyBQcm9ncmFtLjwvcD48cD5IZSBpcyBhIDIwMDkgZ3JhZHVhdGUgb2YgTkFTQeKAmXMgRklSU1QgKEZvdW5kYXRpb25zIG9mIEluZmx1ZW5jZSwgUmVsYXRpb25zaGlwcywgU3VjY2VzcywgYW5kIFRlYW13b3JrKSBQcm9ncmFtIGFuZCBob2xkcyBhIE5BU0EgR3JlZW4gQmVsdCBDZXJ0aWZpY2F0aW9uIGluIExlYW4gU2l4IFNpZ21hLjwvcD48cD5IZSBlYXJuZWQgYSBCLlMuIGFuZCBNLlMuIGluIE1ldGFsbHVyZ2ljYWwgYW5kIE1hdGVyaWFscyBFbmdpbmVlcmluZyBmcm9tIFRoZSBVbml2ZXJzaXR5IG9mIFRleGFzIGF0IEVsIFBhc28uPC9wPjxwPkhlIGlzIGFjdGl2ZSBpbiBzZXZlcmFsIG5hdGlvbmFsIG5vbi1wcm9maXQgY29ycG9yYXRpb25zIGZvY3VzZWQgb24gaW5jcmVhc2luZyB0aGUgcXVhbGl0eSBhbmQgcXVhbnRpdHkgb2YgdW5kZXJzZXJ2ZWQgaW5kaXZpZHVhbHMsIGVzcGVjaWFsbHkgdGhvc2UgZnJvbSB0aGUgSGlzcGFuaWMgYW5kIExHQlRRIGNvbW11bml0aWVzLCBpbiBTVEVNLCBhbmQgY3VycmVudGx5IHNlcnZlcyBhcyBCb2FyZCBDaGFpciBmb3IgdGhlIFNvY2lldHkgb2YgSGlzcGFuaWMgUHJvZmVzc2lvbmFsIEVuZ2luZWVycyAoU0hQRSksIHRoZSBsYXJnZXN0IEhpc3BhbmljIHRlY2huaWNhbCBtZW1iZXJzaGlwLWJhc2VkIG9yZ2FuaXphdGlvbiBpbiB0aGUgVW5pdGVkIFN0YXRlcy48L3A+	\N	Houston, Texas	\N	\N	\N	\N	\N	\N	PHA+V2lsbCBzZXJ2ZXMgYXMgYSBQcm9ncmFtIEFuYWx5c3QgZm9yIE5BU0EuIEhlIGlzIGhvdXNlZCBpbiB0aGUgT2ZmaWNlIG9mIERpdmVyc2l0eSBhbmQgRXF1YWwgT3Bwb3J0dW5pdHkgKE9ERU8pIHdoaWNoIHByb3ZpZGVzIGxlYWRlcnNoaXAgdG8gbWFrZSBOQVNBIGEgbW9kZWwgRXF1YWwgRW1wbG95bWVudCBPcHBvcnR1bml0eSAoRUVPKSBhZ2VuY3kgdGhyb3VnaCBldmlkZW5jZS1iYXNlZCBwb2xpY2llcyBhbmQgcHJvZ3JhbXMuIFdpbGwgbGVhZHMgT0RFT+KAmXMgRGF0YSBBbmFseXRpY3MgZWZmb3J0cy48L3A+PHA+UHJpb3IgdG8gam9pbmluZyB0aGUgQWdlbmN5IE9ERU8gdGVhbSwgV2lsbCB3YXMgYSBQcm9ncmFtIE1hbmFnZXIgYXQgdGhlIEpvaG5zb24gU3BhY2UgQ2VudGVyIHdoZXJlIGhlIGFsc28gc2VydmVkIGFzIHRoZSBFUkcgTWFuYWdlciBhbmQgYW4gRXF1YWwgRW1wbG95bWVudCBPcHBvcnR1bml0eSBTcGVjaWFsaXN0LiBQcmlvciB0byBqb2luaW5nIE9ERU8sIGhlIHNlcnZlZCBmb3IgMTIgeWVhcnMgYXMgYW4gZW5naW5lZXIgd2l0aCB0aGUgU2FmZXR5IGFuZCBNaXNzaW9uIEFzc3VyYW5jZSBEaXJlY3RvcmF0ZSB3aGVyZSBoZSB3YXMgYSBzdWJqZWN0IG1hdHRlciBleHBlcnQgaW4gdGhlIGFyZWFzIG9mIG1hdGVyaWFscyBhbmQgcHJvY2Vzc2VzIGVuZ2luZWVyaW5nLCBxdWFsaXR5IGVuZ2luZWVyaW5nLCBzdXBwbGllciBxdWFsaXR5LCBtZWNoYW5pY2FsIHBhcnRzLCBhbmQgYW50aS1jb3VudGVyZmVpdGluZy4gSW4gdGhpcyByb2xlIGhlIHN1cHBvcnRlZCB0aGUgU3BhY2UgU2h1dHRsZSBQcm9ncmFtLCBPcmlvbiBQcm9ncmFtLCBJbnRlcm5hdGlvbmFsIFNwYWNlIFN0YXRpb24gUHJvZ3JhbSwgYW5kIENvbW1lcmNpYWwgQ3JldyBQcm9ncmFtLjwvcD48cD5IZSBpcyBhIDIwMDkgZ3JhZHVhdGUgb2YgTkFTQeKAmXMgRklSU1QgKEZvdW5kYXRpb25zIG9mIEluZmx1ZW5jZSwgUmVsYXRpb25zaGlwcywgU3VjY2VzcywgYW5kIFRlYW13b3JrKSBQcm9ncmFtIGFuZCBob2xkcyBhIE5BU0EgR3JlZW4gQmVsdCBDZXJ0aWZpY2F0aW9uIGluIExlYW4gU2l4IFNpZ21hLjwvcD48cD5IZSBlYXJuZWQgYSBCLlMuIGFuZCBNLlMuIGluIE1ldGFsbHVyZ2ljYWwgYW5kIE1hdGVyaWFscyBFbmdpbmVlcmluZyBmcm9tIFRoZSBVbml2ZXJzaXR5IG9mIFRleGFzIGF0IEVsIFBhc28uPC9wPjxwPkhlIGlzIGFjdGl2ZSBpbiBzZXZlcmFsIG5hdGlvbmFsIG5vbi1wcm9maXQgY29ycG9yYXRpb25zIGZvY3VzZWQgb24gaW5jcmVhc2luZyB0aGUgcXVhbGl0eSBhbmQgcXVhbnRpdHkgb2YgdW5kZXJzZXJ2ZWQgaW5kaXZpZHVhbHMsIGVzcGVjaWFsbHkgdGhvc2UgZnJvbSB0aGUgSGlzcGFuaWMgYW5kIExHQlRRIGNvbW11bml0aWVzLCBpbiBTVEVNLCBhbmQgY3VycmVudGx5IHNlcnZlcyBhcyBCb2FyZCBDaGFpciBmb3IgdGhlIFNvY2lldHkgb2YgSGlzcGFuaWMgUHJvZmVzc2lvbmFsIEVuZ2luZWVycyAoU0hQRSksIHRoZSBsYXJnZXN0IEhpc3BhbmljIHRlY2huaWNhbCBtZW1iZXJzaGlwLWJhc2VkIG9yZ2FuaXphdGlvbiBpbiB0aGUgVW5pdGVkIFN0YXRlcy48L3A+	STEM,Board Governance,US Hispanic Market,Special Emphasis Programs,Hispanic,Disability,Inclusive Leadership Training,Workforce Data Analytics,Technology Integration,Organizational Culture,Workforce Analytics,Strategic Program Planning Process,Diversity, Equity, Inclusion, and Accessibility,LGBTQ+,Employee Resource Groups (ERG),Diversity Training,Program Evaluation,Unconscious Bias Awareness Training,Training,Engineering,Public Speaking,Aerospace,Program Management,Failure Analysis,Research,Project Management,Systems Engineering,Technical Writing,Materials Science,Meeting Planning,Testing,Risk Management,Requirements Management,Quality Engineering,Quality Control,Process Improvement,Strategic Planning,Lean Six Sigma,Engineering Management,Leadership Development,Fundraising,Workshop Facilitation,Non-profit Leadership,Standards Development,Equal Employment Opportunity (EEO),Diversity & Inclusion,Mechanical Parts,Leadership,Six Sigma,Data Analysis	https://media.licdn.com/dms/image/v2/C4E03AQH-8i_OvMMR8w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1522194358360?e=1751500800&v=beta&t=5fT1PgQxDhz97ldBDpHz0gG7ZBbxeutteHWrpcqmlMU	\N	\N	https://linkedin.com/in/williamcdavis1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-04-30 17:05:53.798+00	bc725176-5fcf-49e2-86da-686fb7504833	f	f
\.


--
-- Data for Name: user_otp_verifications; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.user_otp_verifications (id, email, wallet_address, otp_code, expires_at, attempts, created_at, last_attempt_at) FROM stdin;
\.


--
-- Data for Name: user_wallet_history; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.user_wallet_history (id, user_id, wallet_address, wallet_type, action, auth_provider, session_id, ip_address, user_agent, device_info, location_info, metadata, created_at) FROM stdin;
1	ca5493de-39e1-40ab-9e18-08f98cc7126d	0x9876543210987654321098765432109876543210	thirdweb	connected	metamask	\N	::1	curl/8.7.1	\N	\N	"{\\"isNewUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":4569}"	2025-08-27 09:03:53.701363
2	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	wagmi_migration	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isWagmiMigration\\":true,\\"originalWallet\\":\\"0xed948545Ec9e86678979e05cbafc39ef92BBda80\\",\\"authMethod\\":\\"wallet\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"migrationTime\\":7060}"	2025-08-27 13:55:15.354223
3	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":5524}"	2025-08-27 18:03:59.724893
4	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":5306}"	2025-08-27 18:07:16.247685
5	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":5461}"	2025-08-27 18:08:01.401256
6	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":5490}"	2025-09-01 17:21:10.270832
7	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":7403}"	2025-09-01 17:26:58.21044
8	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":4323}"	2025-09-01 17:44:06.821902
9	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":8177}"	2025-09-02 17:51:21.20534
10	3d1f864f-b7a6-4f7f-b44b-aca34ec92b72	0xed948545Ec9e86678979e05cbafc39ef92BBda80	thirdweb	connected	io.metamask	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	"{\\"isReturningUser\\":true,\\"authMethod\\":\\"external\\",\\"walletType\\":\\"io.metamask\\",\\"smartAccount\\":false,\\"connectionTime\\":4863}"	2025-09-02 18:26:29.714355
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.users (id, email, passwordhash, userid, talent_status, mentor_status, recruiter_status, wallet_address, last_active, referred_by, approved_roles, first_name, last_name, thirdweb_smart_account_address, auth_method, merged_wallet_addresses, merged_from_user_ids, email_verified, email_verification_token, email_verification_sent_at, is_deleted, deleted_at, thirdweb_wallet_address, wallet_type) FROM stdin;
713	\N	\N	abe49c83-3e27-4ec0-8d7d-2ad810ac4d37	pending	pending	pending	0x8dc39348bd815682ee49c368e8d2ac29867d50e8	2025-09-04 15:34:16.830836+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
715	\N	\N	9234c809-85b9-4e4d-9b17-7c5efb6c517d	pending	pending	pending	0x94dc20e479e6ee59fee06d305eed903a1bf83726	2025-09-04 16:08:52.216561+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	\N
624	chaharane05@gmail.com	\N	e3b3042d-f6a4-41c4-9c93-a7461a59e5d8	pending	pending	pending	0x4Ca6F241c65Fa523472e1860d9b1875e26aD8Ace	2025-07-11 12:11:11.064886+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	0xb0bceeef7ede1c4ef1852b102ae0903ab5dcaa75	both
709	\N	\N	b44be5f1-f560-49f6-a410-514b9c134649	pending	pending	pending	0x255531ce714b343508b8031902da770c568d7823	2025-09-03 09:40:52.585107+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
710	\N	\N	e9f86bb0-75f0-4395-9cf5-64c9cc1bfc68	pending	pending	pending	0x5fb91eb66d7f498aad38f3692bd88ce021d6fda6	2025-09-03 16:44:23.214473+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
648	\N	\N	9b2d4d87-1b9e-45ce-9348-9e33ebd798db	pending	pending	pending	0xadbF34FcFF0c8C96661A99e29339e94A1CaEAaF3	2025-07-23 16:57:59.950911+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
649	\N	\N	3ae6cd6a-0b68-419a-8667-55489e436ab7	pending	pending	pending	0x3Dd1BC3021e9CD98F5C99f90bCad06ca470DD9Ec	2025-07-24 01:55:57.123675+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
661	\N	\N	bfe2f0f8-660a-4842-a00d-c35489f76a90	pending	pending	pending	0x899Ab5245cc3Da21e850313Fe097b1d2436c6601	2025-07-28 03:03:00.642192+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
662	\N	\N	f0be414a-0aaa-40ed-b6d8-ceb762c5f4ff	pending	pending	pending	0xAf55B8A7A607cb61f36990b212D1f143BeDDeA66	2025-07-28 03:03:11.788238+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
663	\N	\N	a681d3c6-857d-4230-a9e8-574cafbaa586	pending	pending	pending	0xBED5D317Ccc0Ef662278E0956dBb02fa4d811273	2025-07-28 15:25:54.741228+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
666	\N	\N	35947cc0-e44b-4044-8c21-ec3515831e30	pending	pending	pending	0x65720Aa2959D745a2a24bC779f05100A0217d905	2025-08-01 00:09:20.04199+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
667	\N	\N	c492a88d-c9c0-447b-bdb5-04fafef0270a	pending	pending	pending	0xDB470D49F028823449BB0de20f471A7D89EEf978	2025-08-01 00:09:32.535694+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
669	\N	\N	3f0771e5-cc18-4aba-aab1-9bb1182cb29a	pending	pending	pending	0xeA5eAd09602Fb88bf2a2B93eb8d779B719De0119	2025-08-01 00:56:28.930365+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
670	\N	\N	e22afb48-b54b-46fa-be9c-229498ace2c5	pending	pending	pending	0xA04D6F5Ee5a1F3a1baE645e840eb8602dfc2D5C5	2025-08-01 00:56:34.376697+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
673	\N	\N	316c16f0-b978-4948-9c5e-772efcbab356	pending	pending	pending	0x42610a844e26E88238Fa2750A29247267e33aa8e	2025-08-07 21:23:55.694121+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
672	jofemo6955@bizmud.com	\N	b30cec96-f736-4c06-9621-8bc5cae43839	pending	pending	pending	0x51Db8012e5A64F62f2F69dCE0fd2507cC4b2c333	2025-08-04 15:17:11.132816+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
73	\N	\N	4a29da7a-57a2-4499-b658-d32c80ae51da	pending	pending	pending	0x99DFADCD62593325BcF82ED1f55d87840E93a966	2024-12-17 15:46:50.144176+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
75	\N	\N	dcb0b4a4-3470-4f00-bf88-ce9176d2ff85	pending	pending	pending	0xB8310eD475b3a80a3279004EAdAA296842ba8cBA	2024-12-17 15:46:50.26551+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
78	\N	\N	788139f6-5c96-49b8-9158-5f0468a58079	pending	pending	pending	0x509EDa2E50D13AD431aa11CCf17477452158110B	2024-12-17 15:46:50.942734+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
81	\N	\N	5bd1d8e0-ae63-455e-8a4e-27d3f90bb633	pending	pending	pending	0x5EfD53A349bfF45FdB259dEa631236900eAe2E4a	2024-12-17 15:46:51.059638+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
354	\N	\N	99e3b1af-ee1e-4434-9021-8290ea6a1dbc	pending	pending	pending	0x7eA5BD0d561Ce1Fc857c18b1E517A181e7298107	2024-12-19 20:13:29.913867+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
355	\N	\N	e2555353-a362-49ba-b5d6-8c2cd4dc6346	pending	pending	pending	0x32b439729aF49cd6e2a763DD535140e0F37E3656	2024-12-19 20:13:29.914478+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
356	\N	\N	965ecbc7-5337-4f46-b809-0e27c9da90e2	pending	pending	pending	0x182a17D8efbf8cBd94a375A022aEf7147B0A483e	2024-12-19 20:13:29.914932+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
357	\N	\N	5525c302-d7eb-4ad3-a4e0-843b33c79d4d	pending	pending	pending	0xE918ab0dB467D9Ea345a36C35270D5d04C04892C	2024-12-19 20:13:29.91557+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
358	\N	\N	43bb842a-f894-420a-92f6-27b4b95b3c6f	pending	pending	pending	0x5Ee3d6D4C90ce70694c8Ef70a7553A386bE4C138	2024-12-19 20:13:29.91606+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
359	\N	\N	b7a46298-d477-4e59-93f1-081888841b07	pending	pending	pending	0xE36f15926d108b6C4E8C6Dfa68e19d4b0A89d89d	2024-12-19 20:13:29.916545+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
360	\N	\N	21056ed7-fa0e-42f1-8b06-af56056a738f	pending	pending	pending	0x4DDDC204cF4079dF60e4712de9870Bb396A1b5C9	2024-12-19 20:13:29.917032+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
361	\N	\N	1a6067ed-c02f-4490-88dc-094831bffc34	pending	pending	pending	0x493F7211420D7245420FEaf0982a33f7A82A315B	2024-12-19 20:13:29.917605+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
362	\N	\N	212b5dfb-8923-44cc-a6b4-4c6eceb6e869	pending	pending	pending	0x34df34e4386Ca53d83C9d9B45552bb2910254566	2024-12-19 20:13:29.918085+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
363	\N	\N	9bfd979a-48fc-43c2-9e61-32423eb676b8	pending	pending	pending	0xC28019f496ada193E579E6133D5Ba75f017735a8	2024-12-19 20:13:29.918532+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
364	\N	\N	ed739426-f5eb-4106-b229-89f9323af6d2	pending	pending	pending	0xFa64BBa8f5d330C31682676F2509CE8D0E134D10	2024-12-19 20:13:29.918981+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
365	\N	\N	1625d0a9-eb96-4f4a-81ed-f630aac418e1	pending	pending	pending	0x117190D26c4948a3f1bd9F6D546d316Be9105536	2024-12-19 20:13:29.919433+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
366	\N	\N	a19e4656-5ed8-49a8-ab2e-713829694605	pending	pending	pending	0xc71c31e5cdD2c921b588f543562901BB1ABfE904	2024-12-19 20:13:29.919973+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
652	rosekaremeri@gmail.com	\N	59234fc2-4c34-41d8-a3ec-bec3e2fd1f71	pending	pending	pending	\N	2025-07-24 08:27:33.353962+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
367	\N	\N	e2723d15-76ad-49ff-a405-f8a6f303ab2f	pending	pending	pending	0xBC462a561605Db22eaFF75d4212ec14efAdA6A14	2024-12-19 20:13:29.920426+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
368	\N	\N	76eac557-5d52-45ab-9491-760060558147	pending	pending	pending	0x6057a62A9f6F92042d2C4095bd7E561d43bEf97D	2024-12-19 20:13:29.921079+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
369	\N	\N	65f1081e-6323-4a66-b859-f4ec43c9d0d5	pending	pending	pending	0x4e289B0C919B656D9c07f99df3898Ecdf11C346f	2024-12-19 20:13:29.92151+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
370	\N	\N	b2137ee7-a863-4988-a204-a8a2a3ea7ffe	pending	pending	pending	0xe999CFCc85b48226508a920f5e934E2366229fd7	2024-12-19 20:13:29.921976+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
371	\N	\N	b39b610e-50d7-45b9-b61b-67aebe287a41	pending	pending	pending	0xF7412Fdf2C7460d2E843943C43479C64fA12E44b	2024-12-19 20:13:29.922524+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
372	\N	\N	28758277-e28c-486e-8802-7865853bad14	pending	pending	pending	0x612E9da3ff793c0ec454105fE6eE7C6CD87778e9	2024-12-19 20:13:29.922954+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
623	goodhivee@gmail.com	\N	de64e667-9a38-41ab-bcd3-cbbf89f5d982	pending	pending	pending	0xE4af69F492151Ae8C7528998f564365A40cE9157	2025-07-10 11:41:34.044099+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	0x82f46459a777934263329cf61edee919f1a1e236	both
612	hello@cogentibs.com	$2b$10$ZmazdHGTt/r2OV8L2hs5i.o7wwgJUaZcBezZSgR4BaByvFK12T8Vy	8d21f59e-85aa-4770-868c-d2735ba31fc4	pending	pending	pending	\N	2025-06-16 01:29:06.84418+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
714	\N	\N	359e8832-35d8-4ab6-a31b-cd054c580db5	pending	pending	pending	0x3221eb91e4d1b5328880355e5578fd1317d19783	2025-09-04 15:41:10.03325+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
716	\N	\N	d7c6694d-63a2-4e87-81b9-0a590b6625bf	pending	pending	pending	0xb9cb79c69e84330a246e8ff23d479f1a1f03eba8	2025-09-04 16:10:41.219408+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	\N
717	\N	\N	64adca83-c64e-4078-b18b-b49571b0c0be	pending	pending	pending	0x6d3d2aaa932f1eaac1eea87b3f2b9ed26c5f3a9c	2025-09-04 16:19:37.243198+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	\N
668	\N	\N	dc56967f-75dc-4776-83c7-88d8dc10135c	pending	pending	pending	0xDAa056D2D71e697CA070CAEFf247dd1b7404B078	2025-08-01 00:09:50.666094+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
671	\N	\N	7adc369f-8dc5-4a33-a1ad-465612eef718	pending	pending	pending	0xb5e24f3c5726B765a73F1c63D7bab91eff92795a	2025-08-01 00:57:17.216731+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
679	web3jobsbot@gmail.com	\N	90f2fb5e-fe8b-42ca-8051-1a39a6f7651f	pending	pending	pending	\N	2025-08-12 19:48:50.533256+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
711	\N	\N	99b72f5f-806e-44ee-85b5-375b3dbf239c	pending	pending	pending	0x816e2ef9d55a33dc3fa3cdb1c576335f52b25c62	2025-09-03 17:01:57.343923+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
643	jubayarjuhan11@gmail.com	\N	6680120f-7d7f-4729-a071-0ddad10dd87f	pending	pending	pending	0x4fFF28258234f82cBAb25083Fe949E23d02A3267	2025-07-18 16:43:34.600175+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
616	benoit@goodhive.io	\N	1959c578-be98-43f7-b727-2452a815ee34	pending	pending	pending	0x71F84aA585E1EdA8852Dad8dfF3a69D114366dbA	2025-06-16 16:26:09.849024+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	0x6d3d2aaa932f1eaac1eea87b3f2b9ed26c5f3a9c	both
626	cenat75504@hosintoy.com	\N	65647913-af99-456b-8c32-e17088985566	pending	pending	pending	\N	2025-07-13 19:42:03.022246+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
650	suncoder925@gmail.com	\N	82b1b588-74be-4f0d-8faf-c8592c4a6ba8	pending	pending	pending	\N	2025-07-24 01:56:56.061498+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
631	benoit.junkmail@gmail.com	\N	b276088e-c7e2-4969-bd60-2473ae1a9d81	pending	pending	pending	\N	2025-07-16 17:00:19.76403+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
620	\N	\N	be277147-15d0-4420-be52-7f226e22343d	pending	pending	pending	0x2Cfd7FbDc410AE4cBe5638E9355FA4a3B1df907F	2025-07-04 20:20:04.083309+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
619	sistersfurniture.cloud@gmail.com	\N	6e9cd09e-ee78-4523-b2f6-4ba7fa3bd7f2	pending	pending	approved	0x5d4c6C03Aa31B2A86982d46305529b10e53ec626	2025-07-03 18:30:55.966493+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
314	\N	\N	61061bf3-41e3-48bb-9eb2-1a9690200429	pending	pending	pending	0x5F0c0f3D153529949B35D67a30eE0a33423FB901	2024-12-19 20:13:29.331896+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
315	\N	\N	6da67fc7-660e-4f5f-8561-88cdf1b15717	pending	pending	pending	0x0B1C14d9B7E6B34D0f9D9E49eF93BDAAa447D77F	2024-12-19 20:13:29.351349+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
753	jubayerjuhan.info@gmail.com	\N	df9a41bb-1b61-4865-b878-7e514a1d9655	approved	pending	approved	0xed948545Ec9e86678979e05cbafc39ef92BBda80	2025-10-27 14:19:56.679086+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-11-03T16:25:19.266738+00:00\\"}"}	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x3a54c89932ab697166a23bb0f40f988cf15b96ef	in-app
316	\N	\N	898a3440-d445-49ff-9136-d164ba94d90b	pending	pending	pending	0x6A9e25CF38eC58854eab0c010A7D59bBC18702d7	2024-12-19 20:13:29.35361+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
792	fanouni.abdelhali@gmail.com	\N	709717d4-e730-41ef-9ac6-7b8a81cd50be	pending	pending	pending	\N	2025-11-24 10:10:48.18647+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x998bc52c2803090938c48c6c14ff2d0520c2bfa6	in-app
793	renault.gab@gmail.com	\N	ff50fa34-463e-4f45-87ea-dab8ea50f026	pending	pending	pending	\N	2025-11-24 14:54:22.089486+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x95291be841475bf4014ffcf36f5593ff690f1211	in-app
794	\N	\N	e6bb6067-d2a0-4d04-a325-e9d0b4e5bb39	pending	pending	pending	0x5932849cf53ad44633ac3a343858c346ea92281e	2025-11-24 15:04:42.957122+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
795	bigex76093@aikunkun.com	\N	4120f79f-43b5-4983-9c8e-3f2cb347f6f7	pending	pending	pending	\N	2025-11-24 17:15:58.696348+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x2a74ebcc473902aef1b1a4a4df3552479c792756	in-app
651	emilio.ambrosio@gmail.com	\N	ff25c2d5-42f3-4a61-a4b9-3400908b191c	pending	pending	pending	\N	2025-07-24 07:46:11.480359+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
657	hamada.cero@gmail.com	\N	1c16c804-7529-41f4-8a16-ded4f858054b	pending	pending	pending	\N	2025-07-25 17:16:27.454881+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
658	ndiayemor164@gmail.com	\N	aa64582c-3f27-4c3c-9e17-cfdc5c3aea0f	pending	pending	pending	\N	2025-07-26 05:34:46.436703+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
659	belguith.chachia@gmail.com	\N	52cecf36-56c0-4111-9aac-f2f066b656f0	pending	pending	pending	\N	2025-07-26 13:21:12.649327+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
660	artur.dranhoi1025@gmail.com	\N	0aeebcc8-6f1d-4f1a-bc65-145204e70453	pending	pending	pending	\N	2025-07-27 17:29:28.608737+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
674	jejogal926@bizmud.com	\N	e20954d8-bd66-4b78-9bc3-4e7b8bf741e5	pending	pending	pending	\N	2025-08-09 18:39:13.31455+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
675	pascal.tran@outlook.fr	\N	29176e29-5c23-4eaa-9efa-8a06bedb22a6	pending	pending	pending	\N	2025-08-10 19:36:16.104775+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
373	\N	\N	a253a14c-ae64-4259-aec0-81a35c5ed7ff	pending	pending	pending	0xc579638e0399eB77727a3506Fa76C5112147BA45	2024-12-19 20:13:29.923395+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
684	\N	\N	15268884-f89d-49b0-960e-9a4ae39c5a37	pending	pending	pending	0xFfC4a7304cf955c579f4F6553f77c5b0C0f6E480	2025-08-14 06:28:52.64956+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
695	\N	\N	39f5034e-063b-43f3-8f18-1cb0da141f2b	pending	pending	pending	0x25C2aBe46d3e5Ad99f788279c71e89377a8C2386	2025-08-14 15:33:44.278505+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
317	\N	\N	2c8aba17-f37d-431e-aa1c-47c7ebfbb492	pending	pending	pending	0x3dE34183ddde4aFBFe1e57bee2539BCefFcA6b0B	2024-12-19 20:13:29.355651+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
686	\N	\N	c7213810-179b-49a9-bf68-15c5f17e4819	pending	pending	pending	0xc294413F8BD1261c5d18316a55399c6438Fd1136	2025-08-14 07:01:39.387688+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
687	\N	\N	4b4a0fbb-814f-42a2-9419-64e9fc826935	pending	pending	pending	0x6AfbeECC9D44e3a4418054c93186e43457384FB0	2025-08-14 07:39:34.77024+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
688	\N	\N	0e109252-7100-47f8-a19b-4af4bc563190	pending	pending	pending	0xf4aD8D479CA0c24c72b1b08097d8e44638E81e64	2025-08-14 07:39:52.040364+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
676	fikabak737@aravites.com	\N	9fda0c8e-9484-43e6-bc03-eaa30d7c71e5	pending	pending	pending	\N	2025-08-11 08:53:02.252024+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
689	\N	\N	7a2f8d1c-5819-4fa7-b754-c425b65d8fcf	pending	pending	pending	0x16f76e6989a58708530507feF474001A55Ef9fbb	2025-08-14 09:10:47.009632+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
690	\N	\N	88f36a45-dc76-45eb-8c07-168d32ddd886	pending	pending	pending	0x2F3a6647a35b78A38638D05A7E37aeA7Dd1C0590	2025-08-14 09:11:21.493727+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
691	\N	\N	43203edf-2a7e-4dd5-9d57-d4f4368fd39e	pending	pending	pending	0x3A396cdc552666F0DE462F63027e862c314E7F10	2025-08-14 09:11:39.653348+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
692	\N	\N	3a927a7b-4d13-41e6-ac4b-5c750270d7d0	pending	pending	pending	0x8aF23496c4F79bE78616DaF6b6d69bCF99577Bff	2025-08-14 10:08:29.01025+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
693	\N	\N	876f2c72-5288-4e16-9222-a202a1e343c0	pending	pending	pending	0xC1C870760A6d35DDF36763CAddeCF4Fb353570Ca	2025-08-14 10:09:11.733095+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
696	\N	\N	1af1b75b-db2a-4b7e-ab01-0647f33f783b	pending	pending	pending	0xb2b00F67c4f3A6a19474f310716531F4D8b90e39	2025-08-14 15:33:53.745848+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
318	\N	\N	b4659eeb-65d4-4d50-b870-e7852a5159bb	pending	pending	pending	0xc6B9cbfb2D6A68Cb93678fCfe1B2278d3207F9e8	2024-12-19 20:13:29.355978+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
320	\N	\N	603fd932-f622-43f3-8a27-be6629fee52e	pending	pending	pending	0xa3C5020862736CF3a48ba2BF8a996D67ce0efA18	2024-12-19 20:13:29.358132+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
322	\N	\N	1f93cbef-f864-433a-a811-f4b2d24687ec	pending	pending	pending	0xfdFd81e03305Acc833ab8C86f26AAe4f300CD454	2024-12-19 20:13:29.362444+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
87	\N	\N	50cce8eb-db75-4f1c-8a8c-ba0e472516ea	approved	pending	pending	0x005f16f017aA933bb41965b52848cEb8ee48b171	2024-12-17 15:46:51.061273+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:43.727206+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
699	\N	\N	2a5d434c-8779-44d3-9de0-08f11d086f7b	pending	pending	pending	0x015687D4999C5E5BC8246eFAb84A109daD1dbCb6	2025-08-22 14:54:59.261206+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
532	benoit@web3talentfair.tech	$2b$10$2jP6SgJiyMVFNmwNkt5bAeHLQiZrXkCdn3UztRkurtQQaC6x5pnK.	d324ae2c-c57e-4327-9de5-2efd97bc9eaa	pending	pending	approved	0x42B7aB0153f366123C84cDE581d1cE82AC6CB930	2025-01-14 16:10:11.909467+00	lxD1JW	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
698	\N	\N	bb98dc12-9f4a-4de2-b009-56d08320ece7	pending	pending	pending	0xAc50cd96C33850C6A766905A37Fe5dB75D2BB6B2	2025-08-22 14:53:59.11752+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
324	\N	\N	4a33a7d6-4c14-4dd1-bef2-ef11e7f229ca	pending	pending	pending	0x76cF8EDc975a04555C76bef739e34df2B5c0730b	2024-12-19 20:13:29.367655+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
326	\N	\N	3d044161-4ec9-44b3-871d-73667ae33659	pending	pending	pending	0xB5E4467CD4dfEB5EE3CefEc710DB8B0a235afE64	2024-12-19 20:13:29.379941+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
605	\N	\N	6a5210c7-b86e-4665-be2d-a33273ee9f39	pending	pending	pending	0x9Cf51BD589deD991E8DBF6e26c97A854F588a372	2025-06-09 01:43:11.631194+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
437	\N	\N	12275b16-c4d2-4804-8ef6-494966cb6dea	pending	pending	approved	0xe68D4c4C2704F601865F1d77b6bF3C1c6eEc858F	2024-12-19 20:13:30.507803+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
438	\N	\N	d603fd9d-4f63-470a-bbf6-ac5bb2a999e2	pending	pending	approved	0xC9293f2184d72eeB39e35aa005ecbBb860f31A04	2024-12-19 20:13:30.508344+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
439	\N	\N	7209e8d9-089d-4e48-8445-7a13232d73ab	pending	pending	approved	0x2744532faf9370cD0B4005A6CfC9CC64Fa8ecA38	2024-12-19 20:13:30.510012+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
440	\N	\N	ae3524fb-ee20-42b7-88b3-0730e62e8918	pending	pending	approved	0x7e6a20cD96bB885797F07F919BAc14370f64613e	2024-12-19 20:13:30.511983+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
441	\N	\N	48d6dcc9-83e1-4e74-a7e0-1594b1e4e333	pending	pending	approved	0x0e84c6057351C922F3F9FA0D3b2f621369F8eB0e	2024-12-19 20:13:30.513513+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
547	\N	\N	93019161-8b5b-4621-ae7e-44460ebde768	pending	pending	pending	0x43721F8CEa8FB321767D4eeB945a70db72108280	2025-01-31 14:40:48.117+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
335	\N	\N	3748fe63-cb8f-4552-be2e-f57d01fade3a	pending	pending	pending	0x062F3139e47957c77d214608290005D6FE457FcC	2024-12-19 20:13:29.904275+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
336	\N	\N	21c98d07-4448-4225-9b62-d19200c80b5c	pending	pending	pending	0x9ddd1C42426b6AD00BD85C6276d79b8045728d4D	2024-12-19 20:13:29.904818+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
337	\N	\N	6ccf4825-7497-465c-8c38-bc097902927c	pending	pending	pending	0xf1432A25412668b96Ab6D3EC93A4AD0531b5aBc3	2024-12-19 20:13:29.90528+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
338	\N	\N	a32f26c4-a80c-4b88-b273-7e7ac15057f7	pending	pending	pending	0x3DeF3Ee6c2434f3090976E40AeFd4245Ed888fB5	2024-12-19 20:13:29.905768+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
339	\N	\N	721043ac-84f6-45b8-8a73-6521e3e39533	pending	pending	pending	0x60251eB95C31A8bFc45345FDB789E722B07223c9	2024-12-19 20:13:29.906289+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
340	\N	\N	3a9d9e33-1e99-45e2-a3af-811d9c1c9c03	pending	pending	pending	0x3eaC241Ea3FdD9B1971bD990e87940aD5Fedabeb	2024-12-19 20:13:29.906729+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
341	\N	\N	5642b83a-17d0-4498-aeb0-216b92667119	pending	pending	pending	0xeeC713ffcbe66379480c9ec428f774adbA372F05	2024-12-19 20:13:29.907297+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
342	\N	\N	7dc5b82f-4325-425c-8c94-8a0b0565abac	pending	pending	pending	0x732cde2277472E22B5595160724B60c566AfdBd2	2024-12-19 20:13:29.907791+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
343	\N	\N	a4bd836d-8879-40c2-a824-57a2f7c8afb8	pending	pending	pending	0x4854d27fE24BE0170482F9f2269DD58850cC6cDF	2024-12-19 20:13:29.908247+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
344	\N	\N	d0aff9b3-207f-454e-87b7-e3672ff5954e	pending	pending	pending	0x4B9Ce06f037C0f3631868C962Bc7ff16EB56A47D	2024-12-19 20:13:29.908765+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
718	\N	\N	9006c669-9fcb-446e-8536-a5143af1682f	pending	pending	pending	0x0E07D202984A878333DA0546a45B4fE0BEe95960	2025-09-08 05:56:54.70402+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
719	\N	\N	d330512c-2c06-400a-a4bb-2ac6cd63d268	pending	pending	pending	0xac4915A8eb5bc95f6E5BCD02Fc49731617bcACD5	2025-09-08 05:57:06.741082+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
74	\N	\N	0f128a65-9bbc-4f7c-adee-1f166a00be85	approved	pending	pending	0x3B6B12fd2a042A82b2E3e4BB94611C4e054004bC	2024-12-17 15:46:50.196979+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:41.767157+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
415	\N	\N	bc131ddb-4ff0-4ae1-82d8-6a73992f22eb	pending	pending	pending	0xD09359F793119cfd84edb4e2B60b9F711aD25624	2024-12-19 20:13:29.945048+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
416	\N	\N	5536233e-4462-4869-889d-eaf65a148369	pending	pending	pending	0x33508719bb10246EB53F04b1dBb017d2AB4A7a70	2024-12-19 20:13:29.945517+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
681	\N	\N	db37e009-45b7-41b5-b4df-3e263fc0f3ce	pending	pending	pending	0x578B6C5309689795cA4fE69Fc05Bb995f518317D	2025-08-13 16:07:57.138918+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
720	\N	\N	b110de11-035f-479d-b141-ae523473cca5	pending	pending	pending	0x974D5a0C24630bE91b9f96AF2C6E6Fe395784E4d	2025-09-08 05:57:17.034175+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
682	\N	\N	4df18ffa-5e28-4127-b4e6-e73fbd26be2e	pending	pending	pending	0x28cfe33bFf93Ede8eD041133cD8C63d704Fd9B5a	2025-08-13 16:08:41.002492+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
683	\N	\N	6827fd48-9cfe-4f3a-a7a7-e0eec246b5a6	pending	pending	pending	0xD8703fc6046d63CB2293384eF91ff493803c6Aa6	2025-08-14 06:27:36.235075+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
677	amolinsdiaz@gmail.com	\N	63c4dba7-7606-4b2c-9117-064dc0fae2b1	pending	pending	pending	\N	2025-08-11 20:05:36.600724+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
678	anonymiis@protonmail.com	\N	333b7230-8bd8-454e-94ac-7699b78a67b1	pending	pending	pending	\N	2025-08-12 15:29:05.930133+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
644	benoit.kulesza2@gmail.com	\N	a4e905c3-3c8c-4110-8594-8e45281b227d	pending	pending	pending	0x3494Af98177DCE2ee69e18da191C159f43463064	2025-07-18 17:17:57.892638+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	0x4932bb2e2cb11a888ebeffdb5bd752477d8fc0fd	both
685	\N	\N	3b605df3-ea03-40df-8500-0a5744221bab	pending	pending	pending	0x975F7004354E933c4D5f735A8abcc8bc62a4F35C	2025-08-14 07:00:42.900191+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
796	pagohoj538@bablace.com	\N	e9df90b1-026b-498b-bc2e-46e2a286adb5	pending	pending	pending	\N	2025-11-24 17:19:03.817771+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x6a544b41e2c05bdaa40652922400b9827fa1c84d	in-app
680	m.free@1inch.io	\N	3aa8d04b-db8b-4861-a42d-5b6efe06a6ad	pending	pending	pending	\N	2025-08-13 08:03:57.846801+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
609	sloe2029@verizon.net	$2b$10$TYVpFygAroa842hTa8QSkujEqNX2NXMTTmeG0.FtKPne92jPxDjo2	73966e80-09a1-4c29-a6a1-c1466783937a	pending	pending	pending	\N	2025-06-12 23:04:32.99064+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
105	nogacir741@cctoolz.com	$2b$10$EA7eVKaqfv0yV8.ATv5OX.XHSN4ACqM12mWBgSpd/0YqJi93UszEm	ae02405c-b1dc-42e7-a126-ba84ec63a8ed	approved	pending	pending	\N	2024-12-19 18:44:43.350097+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
374	\N	\N	485482a4-475d-43a1-8a47-d83a63b16f68	pending	pending	pending	0xD0FD20065AF96eB327f7B5547009F0cBe47a3A45	2024-12-19 20:13:29.923957+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
702	\N	\N	ca5493de-39e1-40ab-9e18-08f98cc7126d	pending	pending	pending	0x9876543210987654321098765432109876543210	2025-08-27 09:03:53.060138+00	\N	\N	\N	\N	\N	external	{}	{}	f	\N	\N	f	\N	\N	external
375	\N	\N	5fd356f5-9995-4319-a955-e5d8786d9dbe	pending	pending	pending	0xF1d8144f846df04Ee2c6D203168f8c08cb930dA7	2024-12-19 20:13:29.924401+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
376	\N	\N	b8e9f507-12a2-4aca-901f-d4b39d999a81	pending	pending	pending	0x58Cc0e6C877292Fc494595E4Dc127bf2B57bD688	2024-12-19 20:13:29.924897+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
377	\N	\N	c145bf96-264b-4734-aec2-997c6aced12f	pending	pending	pending	0x88C2F2EAdEd5216C8ff6816136C426f58D41c193	2024-12-19 20:13:29.925364+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
378	\N	\N	0db9d3b3-c042-465c-9090-217ea7293db6	pending	pending	pending	0x6F8ffC2f744ed0CdF5492e43B57745717334Db1C	2024-12-19 20:13:29.925805+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
379	\N	\N	bf3738fe-51b2-489f-bee4-7d2064a45756	pending	pending	pending	0x59Aa4cBdde2B060EDb9735E944f90881EeDC2bC7	2024-12-19 20:13:29.926293+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
380	\N	\N	d641d07a-b4e9-4829-8958-c5612114eb1a	pending	pending	pending	0x08a8850a1dD724C83cB9cd983503a2Ac788DB6cD	2024-12-19 20:13:29.926776+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
381	\N	\N	3d4b18cc-3597-4733-b002-a31cc1c85332	pending	pending	pending	0xcC4e8f7EeFA163323B8aA234991D1f3EAB7A46eD	2024-12-19 20:13:29.927343+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
382	\N	\N	2765a4a4-08c8-4dbc-8fca-b2568f5c7a25	pending	pending	pending	0xD734C04481dEcC22145b86A5e0Ffc3Ab761B4995	2024-12-19 20:13:29.927806+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
345	\N	\N	f2011f89-b8fb-4ea0-8276-c5129a206db5	pending	pending	pending	0x3e0B1cCB4115311aD3e488ff7Ee317f46Ef8Dcec	2024-12-19 20:13:29.909242+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
724	\N	\N	64f61ef2-d0af-44fa-aeb5-8a43abca70d9	pending	pending	pending	0xc05e9BCB8747ca03C8Eb972Ce18851Fdf93074D0	2025-09-08 06:54:13.316452+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
346	\N	\N	f67c4130-6f3a-44d0-bd6e-42fdd714dea7	pending	pending	pending	0x76bF68a1695Fb499fF00C0B685C04e5616AeF716	2024-12-19 20:13:29.909802+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
725	\N	\N	260e878b-46f5-4f02-ae0d-d262050d1cfa	pending	pending	pending	0x3a54c89932ab697166a23bb0f40f988cf15b96ef	2025-09-09 11:39:32.987562+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
347	\N	\N	336c5b17-47fb-4116-8a30-69253f8d3013	pending	pending	pending	0x58021A92aB7BfDC9Ca097819819aA83237f38531	2024-12-19 20:13:29.910403+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
726	\N	\N	5531ac6d-17dc-4424-ae8d-7384c07c0e8a	pending	pending	pending	0xBc0ED665757b88FD1a3F79b1071d66872331c7DF	2025-09-09 16:19:38.461069+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
727	\N	\N	011bde35-a1d5-43b1-a9e6-1c8f2134e633	pending	pending	pending	0xC230098759f0De32287E7a2D92D1F7Bc0503F4EF	2025-09-09 16:19:59.620932+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
728	parvezahammed.info@gmail.com	\N	23c4bbc7-c2ac-4633-894d-d115cbce2150	pending	pending	pending	\N	2025-09-11 16:24:37.543407+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xbe9612afe715bef149a4cf0effb470d80d5ec9a3	in-app
639	chaharane@goodhive.io	\N	5a54167d-e76b-4c3a-8b22-5351cd3a767a	pending	pending	pending	0x3301178b88702089ec2fA9477414824D73C63906	2025-07-18 10:31:30.247572+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	0x6472f442a295accea4086e596b73e3b5dfaadbab	both
348	\N	\N	15590105-1085-4100-a1fd-8b2b3964564e	pending	pending	pending	0xf23C3CAdF790AA26918d0e57E21Eb2c8951F9C55	2024-12-19 20:13:29.911029+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
349	\N	\N	ac3a4bc9-b42f-4937-9084-6e2e4fca79fd	pending	pending	pending	0x38bD1B475DEC3cF1F2fCb7bdf1B3a097a20c4513	2024-12-19 20:13:29.911479+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
350	\N	\N	05371ca1-be56-4f09-b90a-4fb343f7a540	pending	pending	pending	0x1886536fe953aD56473DfBFe3fa61F35802Ce84A	2024-12-19 20:13:29.911987+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
731	\N	\N	2ecf38e1-e49c-4b4e-893c-faadac82e499	pending	pending	pending	0x47694210254fd19f57f8635a6e1fd1587a150965	2025-09-17 14:35:58.246659+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
732	\N	\N	65524495-cf29-4b5f-b9ea-bece035b094e	pending	pending	pending	0x2388e0370d84a22f0d30373d16f841bd77cab806	2025-09-24 16:07:58.719474+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
351	\N	\N	eb41122c-de27-4e82-b124-3b0d8a218184	pending	pending	pending	0x79b9C5E3797a03EedD279Ca47BbAb5CF92288d37	2024-12-19 20:13:29.912423+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
352	\N	\N	04c979f6-e5ba-4c1d-ade1-fad40d92838c	pending	pending	pending	0x31334aa3B1a257F40a67043ef33503CdB1Fd306B	2024-12-19 20:13:29.912887+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
353	\N	\N	15afa5d6-da2d-4d8b-9fe1-1b75ad0b0ea4	pending	pending	pending	0x56DAC0454a5e2cC44343f3D13Da2e23447815f1B	2024-12-19 20:13:29.913331+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
72	\N	\N	c7ffec4c-d4f0-4c0a-a2dd-0997d4c35f9c	approved	pending	approved	0x56f77403a0491a0E571E081889aCe69B808Ae448	2024-12-17 15:46:49.489766+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:40.858648+00:00\\"}","{\\"role\\": \\"recruiter\\", \\"approval_time\\": \\"2025-01-15T21:04:41.48214+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
76	\N	\N	c4f0495c-913f-4385-80f4-f7d5d339d576	approved	pending	pending	0x8758fEbf2a1831CF456ab0e197951900817e8FaA	2024-12-17 15:46:50.397682+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:42.059817+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
80	\N	\N	15781da0-2bf0-4239-873c-398470acb7b9	approved	pending	pending	0x4eF27B6eb11b645139596a0b5E27e4B1662b0EC5	2024-12-17 15:46:51.056266+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:42.363495+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
85	\N	\N	4abc6a71-dc75-46b5-95ed-093ececc78c7	approved	pending	pending	0x32371bF3079A597566925bb539e68b76C617B752	2024-12-17 15:46:51.0096+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:43.441254+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
101	\N	\N	3137edb6-1af1-4749-bdb2-16ad8cd97718	approved	pending	pending	0x8488B81757074B0558ebB05D59A81F43F55bf0C8	2024-12-17 15:46:53.456906+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:44.604563+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
606	\N	\N	20dcf8e8-a294-4516-9773-772ca3c3a838	pending	pending	pending	0x196c17c9bC9b32d5f8A3d76995930d7C12e1e886	2025-06-09 01:44:26.955715+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
610	cinedi6912@finfave.com	\N	73c0b353-9c55-48db-960d-b2af9049026c	pending	pending	pending	0x1f85d3022b8AE3B0e8B3F3C6421456083d731c41	2025-06-14 18:03:56.265784+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
387	\N	\N	65569139-e11a-4224-ae21-e28778842223	pending	pending	pending	0x25dD3F778bF839A7b4f21F025452a90637Cce7D6	2024-12-19 20:13:29.930273+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
388	\N	\N	2cfe1030-dc9c-47d6-b94d-ef0f0bd0e8e4	pending	pending	pending	0xBd0A7F9ef527A7FF3ed0ee0C21eF7a87124d5FFa	2024-12-19 20:13:29.930906+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
389	\N	\N	6275478c-89a0-4a03-ad4b-a324fceb0843	pending	pending	pending	0xf9d2357Deedcc8424e9AB06AeCE0474044A716B5	2024-12-19 20:13:29.931745+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
390	\N	\N	2d5ab7e2-2dd2-4ada-a42d-0d483264669d	pending	pending	pending	0xb33EC212D7ed98098732D52817479f764a7ea681	2024-12-19 20:13:29.932359+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
391	\N	\N	6a99af1a-1e45-477b-bf85-f6a3b95e91ab	pending	pending	pending	0x4d6C4c4Fae4Fb1C9D6dA450bD842220c9e88A793	2024-12-19 20:13:29.933041+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
392	\N	\N	f08aefcc-3281-42a0-b9bd-a74a031aadb8	pending	pending	pending	0x0Df7196093FB7109fc1D1f1D0741910a2FE63c26	2024-12-19 20:13:29.933541+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
383	\N	\N	ed52fbfc-537b-44f4-9e4a-e2184500c566	pending	pending	pending	0x7C6D50A11fc4f4798Ce8208F618C518FEF53d9Bb	2024-12-19 20:13:29.928249+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
384	\N	\N	f1ad28c0-1f42-4c8a-b9f4-f896c327be77	pending	pending	pending	0xEAFb3E57F054600629334d82dd5e05324E1e683f	2024-12-19 20:13:29.928814+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
436	\N	\N	272bbee7-efd0-4753-b627-06851aba91f7	pending	pending	approved	0xa170DeF88f544A51A1535eeDA346461B3D627319	2024-12-19 20:13:30.504686+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
385	\N	\N	4aad8cda-6e6a-4291-85c2-44c3bc361a3f	pending	pending	pending	0xDB6B972F975E915d999cFa6cEBcFCaba81BB7B5D	2024-12-19 20:13:29.929324+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
386	\N	\N	b03676a9-5073-4dbc-95c1-4d4d30db2d6a	pending	pending	pending	0x3ABa91E75E0F4f7B23054e8181c2e055d4574c5c	2024-12-19 20:13:29.929819+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
722	\N	\N	5eda4079-85e3-4efd-8bed-d54f87fbba7b	pending	pending	pending	0x3cB3661411a5679b852E89D57132849d474E234C	2025-09-08 06:53:35.47996+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
723	\N	\N	8f20c6db-9d1b-489a-98ff-d8e594cb3ea7	pending	pending	pending	0xe570cD64BFd9D71e196a29dE029285A00A557d6B	2025-09-08 06:54:12.995211+00	\N	\N	\N	\N	\N	\N	{}	{}	f	\N	\N	f	\N	\N	\N
613	web3jobfair@gmail.com	\N	e1265438-795b-436c-b273-99a673b4a1f7	pending	pending	pending	0x59118E38DE5FA54C6D033b43EDbA540B24Ff645C	2025-06-16 14:41:43.52464+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	0x9d3fcc3885f4935008b1bf22311d0b066c87c06d	both
729	\N	\N	fa401c30-0f74-473c-924d-1bd71007e785	pending	pending	pending	0x73ebf8139c737fe33bf7a6b740a44d8a2d500ec6	2025-09-11 16:26:42.526343+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
665	976salim@gmail.com	\N	e5e635d6-c258-46e3-a271-e784423a6dfc	pending	pending	approved	0x4Bf7B9EBb5EFC67927536B346d5E0e1f23C1a7c7	2025-07-31 11:27:14.910318+00	\N	{"{\\"role\\": \\"recruiter\\", \\"approval_time\\": \\"2025-08-01T14:28:00.996384+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
697	joxexoc920@ahanim.com	\N	ffd3171f-8bcb-4181-a2f8-2ead59281b3d	pending	pending	pending	\N	2025-08-22 09:32:46.060052+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
700	jeremypetitpas03@gmail.com	\N	b6f67952-c438-44ea-b9d3-65393da3bca8	pending	pending	pending	\N	2025-08-26 11:57:26.648855+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
707	\N	\N	fd95d5fa-bba8-40d7-8da3-2004c4588a23	pending	pending	pending	0x9d3fcc3885f4935008b1bf22311d0b066c87c06d	2025-09-03 09:20:10.360831+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
328	\N	\N	129c2193-8364-4319-8606-d88f042fc77c	pending	pending	pending	0x46326b0eBC74A4A04D438edf81B2f5B227ea434e	2024-12-19 20:13:29.384716+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
329	\N	\N	a462df5b-69ad-4d13-8d31-48583ccb2b26	pending	pending	pending	0x40A02964904D176BD66A48F80b14AF808D354830	2024-12-19 20:13:29.898599+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
330	\N	\N	1f2e007a-0fad-48d2-986d-d0257a1ff7c1	pending	pending	pending	0x34e7659f04404aD544074F7E9CBa9Ba5853030d1	2024-12-19 20:13:29.899284+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
331	\N	\N	de026250-0283-4754-be32-0395211ef81f	pending	pending	pending	0xaecc660c9b823d5a2520174D5532436A779b8322	2024-12-19 20:13:29.899812+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
332	\N	\N	0cab87f5-c7d6-4aeb-9440-dda98f1fd76f	pending	pending	pending	0xdE64003ACfdF11CFB47fD2A918624cb07D8D188C	2024-12-19 20:13:29.900314+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
333	\N	\N	b07bd0bd-7fd4-4a90-b8c1-9b8e2a2a2698	pending	pending	pending	0xCccE99C9f7f86F948D93f67cC3A6DE41B01988Fd	2024-12-19 20:13:29.903094+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
334	\N	\N	7564a89e-b44d-4862-9daf-b63dfe6910ad	pending	pending	pending	0x4EBCD5E13954e62828aC197F352cbfA8FC382ABc	2024-12-19 20:13:29.903641+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
393	\N	\N	c5847f7b-97a7-4db6-8a6d-9f8596185209	pending	pending	pending	0xffd2ab12983daD65e10F9B8e9c70C51A57432C3E	2024-12-19 20:13:29.933993+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
394	\N	\N	fa7e5b90-f73a-412a-a774-7c048c6c2dbe	pending	pending	pending	0xf0aA336B093016f95D497A64b37451a3cCE8fD2A	2024-12-19 20:13:29.93462+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
395	\N	\N	0ff6ff91-21f8-402e-b444-7fc965e277a5	pending	pending	pending	0x1F6D86E39C484228b02F6f87B31F7c843E9AdF98	2024-12-19 20:13:29.935117+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
396	\N	\N	1ecc0505-88fd-4b36-9bb6-9879de4c41cc	pending	pending	pending	0xa347f65D3a3BFA75Ef17d852074bA88E20E817e7	2024-12-19 20:13:29.935611+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
397	\N	\N	712a1087-2c54-4e9b-b322-e1caae888dd8	pending	pending	pending	0x1B08A4C0E187Fea21a0b2682aF8F7Ae6c50D1F20	2024-12-19 20:13:29.936069+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
398	\N	\N	a9940515-403b-4e13-ade3-0495c5547b7f	pending	pending	pending	0x5f887F9479C95488b9CD2dD8594f0B6dD51A2d33	2024-12-19 20:13:29.936661+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
399	\N	\N	864aab9e-f5ab-4deb-9482-83f929f6babf	pending	pending	pending	0x757C17a31303C7939C730D66AB51646f92Af3bED	2024-12-19 20:13:29.937128+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
400	\N	\N	208186bd-851e-4202-b578-03af4872f205	pending	pending	pending	0xa04D10f2b4e5Bfa1d14b15c64327749Aaf7d5cd4	2024-12-19 20:13:29.937562+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
401	\N	\N	cca55f69-5baa-4ecb-bdf5-9578b627fa32	pending	pending	pending	0xB153d159a5Be23C27e88c97f6E3bCfEE20F73B03	2024-12-19 20:13:29.938157+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
402	\N	\N	994261b3-c6cc-47cf-ab22-53e042ba50e7	pending	pending	pending	0x7fC5eEA89877a51b70cD1d659461d7f5Bd6b86d8	2024-12-19 20:13:29.938596+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
403	\N	\N	12e0fd6a-9c4f-47e8-a0dd-0a0a3df244fb	pending	pending	pending	0x188D52624450498fc52223500F6200eC8085035F	2024-12-19 20:13:29.939044+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
404	\N	\N	c796338b-859d-402d-9274-a6d152950673	pending	pending	pending	0x91b7C91B34F1D5119329A2e119B034295e032f13	2024-12-19 20:13:29.939519+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
405	\N	\N	76414614-e8b5-4a40-9c2f-ca95601c2af2	pending	pending	pending	0xf011Afd112dFE40291f0fF2E7e7eE89E522190A1	2024-12-19 20:13:29.939969+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
406	\N	\N	cebc4705-1bcb-436d-a935-01d2a0006284	pending	pending	pending	0xb8afe1dA417ff351db04C3Be12DD2359130E0416	2024-12-19 20:13:29.940415+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
407	\N	\N	d174d0e2-934e-4398-b433-c20dc0bae985	pending	pending	pending	0x64b2785b807ec5685537972De5F0FAc6e855D6B2	2024-12-19 20:13:29.941376+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
408	\N	\N	88ab38f7-fb4a-4766-a2d1-5d8b6dbb548c	pending	pending	pending	0xc01C7042fCA3e21C64b5407a9452A4F8BB4Eb131	2024-12-19 20:13:29.941841+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
409	\N	\N	782aac00-97b0-4380-95dc-1a386775076c	pending	pending	pending	0x199105EF81f15bfC5cD7dd9e60ab5B7481AfD7Eb	2024-12-19 20:13:29.942267+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
410	\N	\N	26e26e8f-4dcd-41d4-b5b7-5fe7e5605de3	pending	pending	pending	0x1cb5781F6eC713551AAEac15e0f317D15a3362D0	2024-12-19 20:13:29.942708+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
411	\N	\N	c14102a3-3d40-46fd-9eb5-dc1a9252cb60	pending	pending	pending	0x2a5b965A5F26E232A55A02d30Ad0CA646131170c	2024-12-19 20:13:29.94314+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
412	\N	\N	f8abdf9c-2a0c-4278-aa6b-8832e690418e	pending	pending	pending	0xBC3363f2e66772886392a0d18bC08573F94de0EA	2024-12-19 20:13:29.943598+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
413	\N	\N	caa640ac-fdba-4dce-8118-3e4c837eb917	pending	pending	pending	0x89973123427CB09F2b233b371A0dE4aD9B140F36	2024-12-19 20:13:29.944033+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
414	\N	\N	dac03284-9f96-46af-b352-a21ce18a4ad9	pending	pending	pending	0xe8aAdC2B742FDF6282f0D228F4485C6DEF86CE3C	2024-12-19 20:13:29.944607+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
545	\N	\N	ff854ab4-6c5f-47d8-9375-d94c402127b3	pending	pending	pending	0x5BAfb8858fe242b9545b86d1C5b8609bE050a8bb	2025-01-31 14:38:29.876+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
704	\N	\N	252285b6-c777-408d-94d1-b2a0c0b4d6c3	pending	pending	pending	0x4C38085358617C52F2942527698A410ea2Be317A	2025-09-01 16:30:06.622262+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
705	\N	\N	2af31526-6917-4c3f-93be-f3f7412d5aef	pending	pending	pending	0x3dd92437DeAF620DA4705429C9331Ac9D4d6a890	2025-09-01 16:30:45.471797+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
549	\N	\N	670ce1ad-7df8-49e0-83ec-ff85ae8270a4	pending	pending	pending	0x84c8bd1388a3Be3FEf86182D6020D79942D7b666	2025-02-10 22:16:48.843344+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
508	\N	\N	e131886e-a780-4a16-a034-788eb75cf70f	pending	pending	pending	0x468320c7d5B2F45E9EAF157609efD2AA0047525c	2025-01-13 20:39:44.167969+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
706	\N	\N	5bd317c6-5342-4f50-9031-079f7eec23a4	pending	pending	pending	0xf819Ac00fA83A28FB56A70E384dbf0E47473BE5E	2025-09-01 16:31:27.411047+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
92	\N	\N	85abf727-b5f8-41f0-be45-d425b5c44bff	approved	approved	approved	0x580B9ca15035B8C99bda7B959EAB185b40b19704	2024-12-17 15:46:51.491566+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:39.962123+00:00\\"}","{\\"role\\": \\"recruiter\\", \\"approval_time\\": \\"2025-01-15T21:04:40.266013+00:00\\"}","{\\"role\\": \\"mentor\\", \\"approval_time\\": \\"2025-01-15T21:04:40.557669+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
730	benoit.kulesza@gmail.com	\N	ea59f6f3-4201-4fc2-8c55-4330a41c7880	pending	pending	pending	\N	2025-09-11 16:36:53.380933+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x4f9f28b227e2bf4f4aa9bdba026940f6a596f4ad	in-app
735	\N	\N	95c96ccb-74e0-4d4a-bfaa-2efbb9aaa3c4	pending	pending	pending	0xfca53097013c05083cf2aef0d2a4cfe8d2b8d90b	2025-09-24 16:09:24.408549+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
614	movab28666@ethsms.com	\N	69e50ef7-c6d1-4eda-81a0-723cb54431b6	pending	pending	pending	0xFF6933F821CD930214Ad98c5C91d114a4d958C78	2025-06-16 14:53:01.111328+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
615	yekos49931@hosliy.com	\N	8a952758-affc-49f1-b23b-2b4b021354a4	pending	pending	pending	0x48319e78fb6a6f0aaA8f632B425305699A54cE55	2025-06-16 16:18:41.861486+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
618	ssrifat2277@gmail.com	\N	f79efcf6-51c4-44bf-baab-e267fbe81ca9	pending	pending	pending	0xc3913d6a4e43E8fb0cD1eB19ad2FB7D99A2D5c3d	2025-07-01 11:40:44.626635+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
628	\N	\N	7975815b-b2d1-4aab-a587-7c8f140b7ee3	pending	pending	pending	0xCe276E74e9E99490672Ad02F64E48aD8D3F95BF6	2025-07-16 11:59:45.950686+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
629	\N	\N	66e65fbe-2590-4133-8b08-fe3c978ba953	pending	pending	pending	0x3CdE4D5Aeec35C73ecEAB1b7B9c64B96A4f61d4a	2025-07-16 12:22:41.740916+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
640	kuleszabenoit@gmail.com	\N	d7d05301-7c63-49ab-b226-b3a85919a7a4	pending	pending	pending	0x0a77d64EE50074D9d0d0d7896Caf9A6A4165d2dA	2025-07-18 14:05:35.915572+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
645	\N	\N	6fea6ca6-d2b4-41cc-a631-20a3bb66c5f7	pending	pending	pending	0x299e97A4DCD0C60DdeD8e642E8aFfFCdB583A71E	2025-07-19 10:26:18.431537+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
546	\N	\N	1b75a1a1-27f6-4105-84fd-51721fb6926e	pending	pending	pending	0xCFf580Ed2Cb75779481Bf2f68f81053B8664Ba13	2025-01-31 14:38:35.989+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
83	\N	\N	3841fcd4-7107-4071-a764-f746a2f55154	approved	pending	pending	0xD48866517E3a82A661054ABEf966B3336F248490	2024-12-17 15:46:50.261013+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-01-15T21:04:42.910715+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
504	davidjuhan23@gmail.com	$2b$10$DJK3Z9LoARZpdisOjnAATeSjkaDQhmKuzlF.ynQk4CNk51VukKxa6	37046e38-c2ef-48de-b6c2-4c61b97fcb8f	approved	pending	approved	0xB597426f2049f2585c0EfBe1f68899ED79D92b8F	2025-01-10 05:47:39.640853+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
573	\N	\N	0896f52d-bd5c-4505-9b51-e8de883c5bd6	pending	pending	pending	0xd6c52bd280cc15D928C88458cC287b16638eEcC9	2025-03-19 07:09:33.982692+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
736	benoit.kulesza@hotmail.com	\N	912611b4-8fed-454e-b3ce-9ce64754c0d5	pending	pending	pending	\N	2025-09-24 16:23:29.943499+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xd5d3883b9121f7565212c6dd7d8d9e9a2b3f9ef7	in-app
617	puzenate@gmail.com	$2b$10$Nltc1FF4DT5OL0PxFCgaf.i8scpHglnxSL5VGGR8xnyjtVO85LLYS	0437e17f-da9f-4fb9-908b-b7524809e094	pending	pending	pending	\N	2025-06-23 16:03:19.658602+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
653	julesgabriel.dayaux@gmail.com	\N	c6b77df6-3b07-4b06-b1c3-1e6dd038289e	pending	pending	pending	\N	2025-07-24 21:45:44.711066+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
552	julian.schmerkin@gmail.com	$2b$10$uVoo4QXtGFzk/pJBXLO6xOedQo0MMBZtP/XrOYB5Grw4H0jibXuTS	b37981dd-ed30-4dab-b989-e5e862988338	pending	pending	pending	\N	2025-03-12 03:25:25.498394+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
604	\N	\N	1c92d493-bc25-47b3-a23f-5d130e10c44f	pending	pending	pending	0x10a81f69f0B4303662223BCBd1FF20c45c4f98ab	2025-06-09 01:41:55.498376+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
581	jubayarjuhan20@gmail.com	\N	7df8da7c-8e40-4fa3-8623-710d75ea3a32	pending	pending	pending	0x61FEa00b296566232CC87584D544DE2f17EBc5F4	2025-04-07 21:17:17.172128+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
630	\N	\N	d9fbe13c-7a27-4ca4-a68e-51ee1c793c41	pending	pending	pending	0x92ED8F6A9211F9eb0F16c83A052E75099B7bf4A5	2025-07-16 16:49:20.726604+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
741	\N	\N	55198785-5820-4103-ac3d-c1b28290f78a	pending	pending	approved	0x750c3479217c24689266d991569920469027d1e0	2025-09-30 16:43:59.905871+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
743	\N	\N	945bbf74-69cd-4354-8750-ff3bf4412b7d	pending	pending	pending	0x4793fed632140f2018dc76e3495357edb0a54eb3	2025-10-01 18:21:53.226236+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
592	benoit.test5@gmail.com	$2b$10$YgdFiv73.lpYXi2q5217Zevp761KrsceR9Aj8QMfUCkaVFPMt4RKW	9264edf3-cd9d-4fa7-9fa9-be3aaa164f1d	pending	pending	pending	\N	2025-04-30 16:23:40.283499+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
593	benoit.test6@gmail.com	$2b$10$/Y0W2Dq76DcMWOgVhj8LHOX92fdxgKp0IBK/YIpwpGE8g6/hYMw3W	9580d2f2-765c-4a57-a7a2-8936208075e7	pending	pending	pending	\N	2025-04-30 23:33:10.633403+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
744	\N	\N	51aac7df-a63f-4dc1-8eb3-525384dc2ccc	pending	pending	pending	0x31382a8fd8b7ee5ebc7d2f7a1506791d703183f9	2025-10-01 18:31:45.391357+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
594	benoit.test7@gmail.com	$2b$10$S3wB.m9/8IUERqxZmjLqGe1ZAPNVyuVjHZmGttYuXwdRcFpdGY/R2	88af641f-526b-4da6-a3d0-ee16d0841c44	pending	pending	pending	\N	2025-05-02 14:39:00.197455+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
595	tofojis249@benznoi.com	$2b$10$5Hp.uorb.d/8ONRU/1ROVe1X3UmulMEsPJNnjpex8Tyhe1deJo0qK	58143297-0541-47a8-9bf1-8c931582da82	pending	pending	pending	\N	2025-05-07 11:40:39.68785+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
596	benoit.test8@gmail.com	$2b$10$3QFFLbaqUr1F90enzkR0wuRlrPTMe9oygYwf.daR5ioU.1VuQ4vse	76855267-9a5b-4da9-a4f4-a96b59a00f30	pending	pending	pending	\N	2025-05-07 16:06:40.904774+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
601	elayar.yacine@gmail.com	$2b$10$QQOHyHlAvvm8kr.UFKNZNu7tjS.SYYTrNcPIhDDhIRe0Q69LjOx5S	340cf96e-f943-417d-882a-a9fa12553f8a	pending	pending	pending	\N	2025-05-30 15:35:16.657618+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
600	benoit.test10@goodhive.io	$2b$10$gd09vysqsFCscmY/YpGvousjC6D5XzgOb0/Is89klvSr1cdWq3vmC	4df98c30-b27c-4cf4-bf27-20331420b2bd	pending	pending	pending	\N	2025-05-29 19:29:09.032767+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
745	\N	\N	943bdea4-3cfc-4c2f-b0ce-a291f2452d2c	pending	pending	pending	0xe1e43444bb8962f7e4a81442835b1124424ac55e	2025-10-01 18:32:21.405034+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
746	\N	\N	74ade06c-d014-4c73-a486-a6e5fe50fa67	pending	pending	pending	0x03725fde39d00868a8544663943ea38fba112456	2025-10-06 12:33:52.372066+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
747	jubayarjuhan4@gmail.com	\N	9bcc503f-f217-4e13-89a6-0ca0cf221c17	pending	pending	pending	\N	2025-10-20 13:58:01.182792+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x9a257fb1dfae8943504f4be8cd1821bd7a12ada8	in-app
654	ioannis.kokkoros@gmail.com	\N	ea9f7888-4efa-4c51-a619-9ad721d8eecc	pending	pending	pending	\N	2025-07-25 09:29:34.5784+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
748	\N	\N	2958533c-5397-4af5-82df-5b47629dc8fd	pending	pending	pending	0xb33aef5aef25197bd856d478799fdce8be944940	2025-10-20 14:09:09.020226+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
749	\N	\N	326fb719-4e60-4a40-bbd3-5a549749bc1e	pending	pending	pending	0x08a1d19c8d57497fb5bc12fedc90c7f5476acfcb	2025-10-20 15:44:30.891693+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
655	zainsubhanidev@gmail.com	\N	ffed3cf1-30c9-4193-bf9c-21e70817343d	pending	pending	pending	\N	2025-07-25 13:09:29.414668+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
664	pacosuna2104@gmail.com	\N	446f4550-c48e-4365-9157-ce3eaa7728be	pending	pending	pending	\N	2025-07-30 18:02:54.567521+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
656	yvelinestechnologies@gmail.com	\N	306e35d3-a787-4682-b91c-5dcfd45ae50c	pending	pending	pending	\N	2025-07-25 13:17:32.229669+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
764	tiyotim447@ametitas.com	\N	6c4d2b91-3466-4189-8610-56712bbfcf4d	pending	pending	pending	\N	2025-10-30 11:53:31.721432+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x3be7614450a366a21381c3c9eabbe4c87393d6de	in-app
765	xiciboj437@ametitas.com	\N	5b372c20-62a4-4b31-9c67-50a004e14831	pending	pending	pending	\N	2025-10-30 17:05:27.691134+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x626de5d30d91c19cf025d6c0c10572c6ada4c3ea	in-app
768	\N	\N	594e0e1e-f530-4d99-a603-44273ac458e9	pending	pending	pending	0x56299e60a80fdae9e195071ff220f1d196030abc	2025-11-07 13:05:42.761615+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
755	\N	\N	1be67cf6-563e-4b2d-a603-41d2c766a2b8	pending	pending	pending	0x43b61ec18acc17cbf5d14cbe7aa22cc28c1e33d8	2025-10-28 13:20:46.920344+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
756	\N	\N	5cf6533e-4d3a-4d94-a8c9-1175d2a3d625	pending	pending	pending	0x648d77a674b09000879c8e35c22bf900a7f4c850	2025-10-28 13:22:10.156035+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
757	\N	\N	a7598830-aad2-4225-a493-1b8dc40c2a8a	pending	pending	pending	0x83c4fb40866553348bd57a3c484512e072aebf5b	2025-10-28 13:23:10.704413+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
759	feceyi6829@filipx.com	\N	8e2e9ecc-1579-41c5-8caa-c0d2d2477804	pending	pending	pending	\N	2025-10-28 16:38:05.877305+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xfc91ddf5076f9d34be5a9982d70581873bfa55ea	in-app
760	pilepa5559@filipx.com	\N	7f317f71-96fe-43e4-862c-101e37dfc65b	pending	pending	pending	\N	2025-10-28 17:09:56.59465+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x4bf43a43ebe482e1a7a6c44f6d7ba16f2ab8c2b2	in-app
761	\N	\N	f16547b2-4f47-410d-8f66-f0b8ac41abfc	pending	pending	pending	0x51979dfffbd3f1b37714e2660ab7ad588552667f	2025-10-28 17:47:53.666007+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
762	bastien.rigaud@live.fr	\N	6ab10578-102f-41b4-8084-1f17eeb6e6bb	pending	pending	pending	\N	2025-10-29 09:57:54.082319+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x6831f6946e06d3e8198378f21f4cbf2ccb1a06ac	in-app
763	\N	\N	372b5dfb-9c1c-41cc-b99c-934ad55c0375	pending	pending	pending	0x3cfc539282026236970006c7042c807cb71f856a	2025-10-30 11:29:09.481076+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
769	12306deepakraja@gmail.com	\N	b6631555-ba74-44ae-ae9f-12d7455ed79a	pending	pending	pending	\N	2025-11-07 13:16:46.752622+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xd0242534b01a8442857ed484de664b2fba10c58e	in-app
766	naveensudhagar0308@gmail.com	\N	261d937b-d080-48f6-8013-ac545f2399d0	pending	pending	pending	\N	2025-11-05 15:30:47.730015+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x66aef112a85524883baed0ed55d5311d2ef5be04	in-app
770	join@bctzn.com	\N	f289f446-9cdb-4008-86ff-c7c494333bbd	pending	pending	pending	\N	2025-11-09 03:10:46.082607+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x646db78b13e427be615a4184d857d61b5b253995	in-app
771	david.fradel@gmail.com	\N	8517d6fb-cb82-4dd0-858f-035cdd478335	pending	pending	pending	\N	2025-11-12 09:41:20.385565+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x2c6e04c607fb0f223ce27ec70972f11da6e05707	in-app
767	cedric@smartt.dev	\N	eb835f9b-cee8-4cf0-b64c-ff9ef76aade5	approved	pending	pending	\N	2025-11-05 22:32:47.696819+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-11-10T22:21:07.518955+00:00\\"}"}	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x1076dde83de1394949274652d28432d5424423fd	in-app
772	aswinak0330@gmail.com	\N	89003a11-290a-4cea-b060-410ee4b3b0f1	pending	pending	pending	\N	2025-11-12 14:59:11.157369+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x1af667fd191685861a267d7321b1dc366a7cdef1	in-app
773	praveenvaduvanthan@gmail.com	\N	620bbdc3-3cfc-4bc6-a86c-f8bdac397428	pending	pending	pending	\N	2025-11-12 15:14:25.311943+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xd1dc66315fc1e8f88635f535e8d36b1e340889a1	in-app
751	myfanzio.shop@gmail.com	\N	a787d03c-2659-482d-b4b7-2c2143cfea2e	pending	pending	pending	\N	2025-10-20 16:10:07.095369+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xcbe5b2b9e080a86cd5d81daa646e099ccc36c5bf	in-app
774	\N	\N	c1e02e3f-f139-4ff6-bb95-133b6a2c2510	pending	pending	pending	0x90d7d505c62ad4e5205519d97e0b8967dfd5d566	2025-11-12 15:18:16.635891+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
775	mohangokul515@gmail.com	\N	a0b82281-d13b-4bd0-a80f-216fed2993fc	pending	pending	pending	\N	2025-11-12 15:59:08.666221+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x6fb74df1fccbb7f7d5e2280579fbda99bcc4276f	in-app
754	\N	\N	2a35401e-2814-4093-8075-0374fe3d5492	pending	pending	pending	0xed948545ec9e86678979e05cbafc39ef92bbda81	2025-10-27 14:31:15.611299+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
776	\N	\N	bbe9e92d-3227-4f77-bceb-1103b4d60caa	pending	pending	pending	0x7f657fbe1afad45ac0335dc345f7257421b32656	2025-11-12 16:29:34.190058+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
777	ilyesseeladaoui2@gmail.com	\N	99c5500a-46cb-455c-be49-21a626671677	pending	pending	pending	\N	2025-11-13 10:18:36.068627+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x57359a27962caca2bde1022281b46118b16c328f	in-app
780	jigarvyasidea@gmail.com	\N	35bdb432-11cc-407b-9c64-6e9051ab79be	pending	pending	pending	\N	2025-11-13 20:56:40.97201+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x5e354c6e8acfcdc40ee9618d8fcdceee2426a1b3	in-app
703	imaneelyaqoti@gmail.com	\N	4bfdb04c-3913-4a17-b866-5329e651bd4b	pending	pending	pending	\N	2025-08-28 11:48:37.312054+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
781	ithegreat816@gmail.com	\N	59934a42-07a7-4e4d-91a6-8df3bc3e8f39	pending	pending	pending	\N	2025-11-14 05:39:32.216016+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xc0a38b2cee3d88f20c0e996fe113eb43f9d3d5eb	in-app
782	\N	\N	4cf490e1-1815-40f0-8e4d-c57b37a1b366	pending	pending	pending	0x60f411242c1460aab066b5060cf3015762a94fd1	2025-11-16 16:28:09.883429+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
505	reftest@gmail.com	$2b$10$nYzgJaPVBFtQ0IKFGHic9O5n8a1cW4diiANwgfE6BoWuJqEHVbW6a	2723547b-dc87-4e8a-aab0-1269b3440ff0	approved	pending	pending	\N	2025-01-12 18:29:32.899315+00	ZW6cSv	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
506	jenniferlopez@gmail.com	$2b$10$KChuUuZeWrKmR2jIjJPct.CNNJAqQ/KYN7yIRPmX9IdBx/iCpDK1C	9ddc730f-0391-43f9-9bc1-33ec013e3376	approved	pending	pending	\N	2025-01-13 16:40:28.793904+00	hMXTac	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
507	mariahill@gmail.com	$2b$10$FIS7myMtfKspT5MXSjJrzeEhI4CWRyqJfqfNzu4UBCuHq9av4w12q	344691d4-62ef-4f98-99bd-b7dd9aa824a7	approved	pending	pending	\N	2025-01-13 17:08:49.724563+00	hMXTac	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
783	franck@maussand.net	\N	34343987-8dab-49fe-a0f9-d404a118b976	pending	pending	pending	\N	2025-11-17 10:33:43.086784+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xc17d2151819f6de40b5a33589c584d1960292a4c	in-app
784	shivanshu.maci@gmail.com	\N	6aa488c4-9ad2-498c-99e9-e12eb8dd1bf6	pending	pending	pending	\N	2025-11-18 12:43:22.402858+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xa19887cf524425435f22f65ddbd00e619994d2f2	in-app
785	guillaume.verbiguie@gmail.com	\N	f0068f99-5f53-4ae1-abb5-4ab1d6757aff	pending	pending	pending	\N	2025-11-19 10:48:15.840562+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x8922b390f302330bd14f8775097974ffe50eba39	in-app
531	benoit@web3talentfair.io	$2b$10$S.cTtF8rk7Wj.glsN4V1beEQogU01irlCu0Z.yrwbOv7oKBRC1r6u	0719124a-9836-40c9-a82d-e8026dc372db	pending	pending	approved	\N	2025-01-14 16:06:31.934766+00	\N	{"{\\"role\\": \\"recruiter\\", \\"approval_time\\": \\"2025-01-15T21:02:38.864124+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
786	\N	\N	42b191d5-e149-4b24-b9a6-3c0dce344d1a	pending	pending	pending	0x6c74829d66d1ea68fcc3ed7309ad56eebe07a784	2025-11-19 18:35:18.864883+00	\N	\N	\N	\N	\N	wallet	{}	{}	\N	\N	\N	f	\N	\N	external
787	ax.juste@gmail.com	\N	88d2794b-c972-48aa-8452-1a8a77d1daeb	pending	pending	pending	\N	2025-11-20 07:51:05.630975+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0xd42bbb04017fe153cfb9a5cc186c9a57aaae1d2c	in-app
551	rick@postquant.xyz	$2b$10$kFgh4Jrc5CRO9j9UUuS4FO.744dL.j2wjvohbI94i95zPfljiWy4S	be44c4a6-0a9d-4593-9a92-ebfef3b895e7	pending	pending	pending	\N	2025-03-02 00:48:45.451972+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
563	socek45103@erapk.com	$2b$10$yZLMBqt4sHJga4andBOMOuel9iLEHfkOxRk3/ZzROFzvjNIF0g3FG	571a58a0-0f17-419a-b0cd-b0359ec169ef	pending	pending	pending	\N	2025-03-13 16:36:34.529779+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
548	sandrine.mazeres@paymium.com	$2b$10$GSmsSyimelNWa8kHaqGDee3U/Sq2pVoQQLdxsZWxC3PnvjDxZkZq2	3fffd0c5-44b4-4352-9331-3ec927181efa	pending	pending	approved	\N	2025-02-10 14:58:01.770797+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
788	yasixi6583@okcdeals.com	\N	3f185d15-29b5-4fc1-8392-f265a8337982	pending	pending	pending	\N	2025-11-20 19:41:30.700641+00	JphxS8	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x50492ddf38c95dbd24e2399860520369305f451d	in-app
553	benoit.junkmail2@gmail.com	$2b$10$kn7Xm/H63a2bgdM4zYZBCOgJTRRgyfQt/ltoLFBHhFii3b.0hAZYC	29752320-a130-4079-b5ae-bb13d4abb166	pending	pending	approved	\N	2025-03-12 14:23:12.127025+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
554	gosak83236@payposs.com	$2b$10$kkd6rH/XNAHZvHJV3igt1eRJXdCMyzZ2HAUjFnM/P3oYKAyG.6O/m	06843ad5-a9cf-44b5-bf8e-a938193986c4	pending	pending	pending	\N	2025-03-12 15:05:36.546239+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
557	abirjjuhan@gmail.com	$2b$10$X5Y63/aV1ma0xBOnO/vqneM3N/.C021zTn8FxVi9/HirDLv/qGc5S	d9b5c92c-d82f-48e6-a370-4a4702a9b313	pending	pending	pending	\N	2025-03-12 17:18:53.67802+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
558	abir1212@gmail.com	$2b$10$likdBXyLufbvWzeekDcqqO8jdWTVR06XCKou23q5cqlhZGItN0aXW	291d3cce-003f-4fdb-8776-620e79c019a6	pending	pending	pending	\N	2025-03-12 18:26:34.943446+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
559	nicolascindon@gmail.com	$2b$10$gXtpyd5JLspjU391zNcNtO8mrYkY.chmmBDYtAcX2EWPb131QcHDO	9c6b0e2d-54dc-4129-87c8-5a252361273a	pending	pending	pending	\N	2025-03-12 20:47:22.447502+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
560	gazopunk@tuta.io	$2b$10$pvbraCaZStkfXBpdOjBi1Ozj8Q1gBu1Gq9jLjV.dp803ts5wNQoRW	5fa564a6-27a7-4ef6-851c-e8580fe9ea7e	pending	pending	pending	\N	2025-03-12 22:17:41.585393+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
561	benoit.test@gmail.com	$2b$10$Cf4zlmcM.YoyTDWIW7LYqesVcnaMh.tAB9FN2g18L2ay557j7ccQe	c3176c3a-1705-447b-8571-3bbd0f51c99a	pending	pending	pending	\N	2025-03-13 15:18:13.611349+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
564	toniv22598@erapk.com	$2b$10$IMxlaCBTWIQ0K4DvZWNvEuirrYM0Wg/BjFOGCkm.oUFNISHDYmUsq	5052175f-f082-4f66-b439-7763c76265ac	pending	pending	pending	\N	2025-03-13 17:11:31.864242+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
565	benoit.test2@gmail.com	$2b$10$TcElz5qq.qxPp6JwBxN29unbnRyB6uojXlwxf/zUpH2semionS/2e	c8195796-7430-4847-9c2b-5ac79df96237	pending	pending	pending	\N	2025-03-14 17:15:57.452287+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
567	lawit85807@bankrau.com	$2b$10$N6Kz5A7WR9t3Ki5wqLrq.e5AXGP3AT6l9OnFasaL.OHRBclvrmTY6	3fa26651-fcde-48f0-9543-a0cd52d0ce0b	pending	pending	pending	\N	2025-03-15 16:19:56.662088+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
570	kemob60260@bankrau.com	$2b$10$YzYFiisIJm6QHB6YIM69j.glMiMWZex7G5LteJPCvk2tgBTSvYYlW	de127d98-1aad-4253-83bc-3ce9a4fb5b10	pending	pending	pending	\N	2025-03-15 17:20:40.367522+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
571	benoit.test4@gmail.com	$2b$10$Sx4MiDP6MtEgbWjtYId/3ek.WyCRhvaaQV3rBk5ITJoDWDHvNVcNm	0462724f-b06e-4459-bd78-7a7e7b751e6b	pending	pending	pending	\N	2025-03-15 18:01:12.022292+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
555	hilap81436@payposs.com	$2b$10$1VWKKsRZRIv0hl.x6dkZre.GA6kadIyaXDmz.AoTncTjM/4zATR0.	ddef2d80-6720-4d56-931b-1c42dbcb71be	pending	pending	pending	\N	2025-03-12 15:12:37.975899+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
562	locap58070@excederm.com	$2b$10$1QpmZtYuv0iz4s781G52dOq2J3aY3ZXOO8Hq1Iwd.6jsgnj/o4vqu	2a1e4942-f5da-4281-8a75-c11bccbdd177	pending	pending	pending	\N	2025-03-13 15:27:03.371811+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
566	benoit.test3@gmail.com	$2b$10$sZAmupp3PvwhUE/o2YzR7.y3vByILUfL3XBqxcRBu0k/6OqcGc/c6	39ed4eb5-109a-40ea-ac0a-c5b85f5ce170	pending	pending	pending	\N	2025-03-14 18:42:40.276327+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-03-17T23:28:52.693093+00:00\\"}","{\\"role\\": \\"recruiter\\", \\"approval_time\\": \\"2025-03-17T23:28:52.723152+00:00\\"}"}	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
597	benoit.test9@gmail.com	$2b$10$B1v6Fo2NJ8tLDLG0iBGae.byyAQFUNumKpqWq/LikrtGYLVx/XoP.	58fdce27-32fe-4b66-a93d-bdad7175be80	pending	pending	pending	\N	2025-05-09 13:57:12.648278+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
556	yefih78410@payposs.com	$2b$10$i0xTh2gu4jgFnPzRJv3KWunLIZoG2IcQGY70t2d7GfZOt2jvqmZwO	4a2ba82f-3c18-41e4-94c6-9a84057e2f92	pending	pending	pending	\N	2025-03-12 15:42:52.802254+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
779	samriddhigupta426@gmail.com	\N	8f321e38-0d72-4db2-b15b-2c66da92c295	approved	pending	pending	\N	2025-11-13 14:43:09.110196+00	\N	{"{\\"role\\": \\"talent\\", \\"approval_time\\": \\"2025-11-20T15:11:18.769927+00:00\\"}"}	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x721bb272724a7800f58b6459a0aefa97195179bf	in-app
574	barkovskis.m@gmail.com	$2b$10$wvPSnd2XFINqoMfO1Pgj4.rMI93.gJeaNJjucOaTPaLYr2oEn.9lO	fe2d7aa9-4b19-4683-ad04-3f520c3369e0	pending	pending	pending	\N	2025-03-24 20:13:38.062934+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
575	sergecarmel@gmail.com	$2b$10$zravdAbto9fsntOhVJ/q1eAxlyjs1VwoeFuC2asDBroiD4YKK1BgW	ee5ae03d-735f-4894-9cac-fd2702c01c13	pending	pending	pending	\N	2025-03-25 09:26:44.048393+00	2z96g9	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
789	hayode2381@aikunkun.com	\N	084f9fdb-df8a-4390-9e08-4307552ece32	pending	pending	pending	\N	2025-11-20 19:54:36.360259+00	JphxS8	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x21e2fe0dd8ae5b061ea164a54281b9e5cdf5d169	in-app
576	s@6120.eu	$2b$10$fV/lyfvfLZDNZTfLSDxm2u.npD5OPi7XpAbec0PQDKEuTHXQwjZza	23dd106d-062f-4886-b131-5132996a1962	pending	pending	pending	\N	2025-03-25 13:34:24.627375+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
578	benoit.test1@goodhive.io	$2b$10$d8LUlLdWtoMyC3sErkeKgucJ.y7D/6.2CETHQIOKpMwxoTo6mQD0W	230dd894-d5b8-4eda-9b97-8d00ea196c71	pending	pending	pending	\N	2025-04-07 18:32:42.672472+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
582	aaaa33aa@gmail.com	$2b$10$slW8TYpjFpXSuT/OxjdE0.oTLrVUvmgBVrlI2Ry475MW7tVTqBVwu	a19dab41-fb5f-4c99-8860-7bf020f9483a	pending	pending	pending	\N	2025-04-10 19:26:38.226093+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
585	marie.bresse@sfr.fr	$2b$10$ceh6Gjr9eXn0X6wWDUalhufySCHrELLmW0WOmtsXShwqwjTBFwOwu	e1334ca6-1cad-4c1a-bbc6-92372024a27c	pending	pending	pending	\N	2025-04-16 17:06:36.975288+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
586	hello@bbschool.fr	$2b$10$2AzO0kj8BnFJBjNUIemOPe.HEQaXN5OyhhfRs.SjU8.DAaWKRPIvy	0dca6ab0-914b-42cb-b181-55aae8f6af80	pending	pending	pending	\N	2025-04-17 06:38:53.616506+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
587	shed-slaw-mumbo@duck.com	$2b$10$6BFS/eqgDrY5h/h.JXUSzOSUX32siJG99.2gMgRmef6Eu2oVJw1wm	7034418d-4326-401f-9ff3-de59f7bf8942	pending	pending	pending	\N	2025-04-21 14:46:25.421119+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
589	cleverclass.dev@gmail.com	\N	b69263f4-eac8-4f45-ac50-5fc1140920d1	pending	pending	pending	\N	2025-04-28 18:09:37.10899+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
590	vifeyol366@harinv.com	$2b$10$Lv54tn/31fmH7lnS0kbD1OvZMdXfAlRAp/2BiCDrL8RMQsICFS8Ei	bc725176-5fcf-49e2-86da-686fb7504833	pending	pending	pending	\N	2025-04-30 11:42:18.751121+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
591	abc123abc@gmail.com	$2b$10$DpGmZM9JUHI1vgz.s9HCCO1WDap8OlcktqxEUsLKb9./NIQNC/Nmm	036829ed-4b22-4e7f-9415-2267c0ac42c1	pending	pending	pending	\N	2025-04-30 16:08:17.026628+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	\N
778	bryankeyslim@gmail.com	\N	5ecb5d0c-2178-45e7-9e77-9d38de24acd8	pending	pending	pending	\N	2025-11-13 10:20:23.389933+00	\N	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x1090eac2bae36009aaa6889e2936993326a39be1	in-app
790	pofovi1605@bablace.com	\N	4fad4e9f-dc00-4930-9066-b3e7bceb40e9	pending	pending	pending	\N	2025-11-20 20:00:53.576795+00	JphxS8	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x656db0d72e1975c0592f16ce3fcd31a72b01acfd	in-app
583	\N	\N	ebd3909c-394a-472a-ad45-183ae8521540	pending	pending	pending	0x42C6C1e5D904065a749ed3ccBB56208f7B843042	2025-04-12 05:12:20.307303+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
588	\N	\N	78479e98-f7e0-475a-903f-055bcefe07e8	pending	pending	pending	0xD807dca404c11F1C181680C372Ea5Fe6488eBd5c	2025-04-24 18:52:59.408334+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
579	jubayerjuhan.dev@gmail.com	\N	4f6f9a95-47c0-4fac-91bd-4f2ea7348029	pending	pending	pending	0x5042F642Eba3171139826bb9c46687E5F05f0F19	2025-04-07 20:17:16.00645+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
580	2nddavidjuhan23@gmail.com	\N	60cad285-0cb1-45d0-a470-9ba339670b09	pending	pending	pending	0xD6bb7F08742D70dCd19Ae02e7FDE86d2083a424F	2025-04-07 20:17:48.696928+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
611	dropshipninja23@gmail.com	\N	1296ca14-9956-4d26-83a5-f162f9dc2581	pending	pending	pending	0xEFaCc79899411122086c7Ec42d05c257C4b2F88D	2025-06-14 18:19:42.144331+00	\N	\N	\N	\N	\N	email	{}	{}	f	\N	\N	f	\N	\N	external
708	test@goodhive.io	\N	fc6c8a60-e087-4c2d-b0f4-dcb1d821af87	pending	pending	pending	0x742d35cc6634c0532925a3b8d8de0c0bfe8ecc9f	2025-09-03 09:36:32.074038+00	\N	\N	\N	\N	\N	wallet	{}	{}	f	\N	\N	f	\N	\N	external
791	devayaj512@izeao.com	\N	fb645b07-0d08-4404-90fd-265c8d99090e	pending	pending	pending	\N	2025-11-20 20:29:56.949953+00	JphxS8	\N	\N	\N	\N	hybrid	{}	{}	f	\N	\N	f	\N	0x763d1f8b719d34f80c036b66383f76c7ce61fb09	in-app
\.


--
-- Data for Name: wallet_migrations; Type: TABLE DATA; Schema: goodhive; Owner: -
--

COPY goodhive.wallet_migrations (id, user_id, okto_wallet_address, thirdweb_wallet_address, smart_account_address, migration_status, migration_type, error_message, error_stack, retry_count, metadata, started_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_offers (id, user_id, title, type_engagement, description, duration, budget, chain, currency, skills, city, country, company_name, image_url, job_type, project_type, talent, recruiter, mentor, wallet_address, escrow_amount, posted_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (wallet_address, referral_code, talents, companies, approved_talents, approved_companies) FROM stdin;
\.


--
-- Data for Name: your_new_table_name; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.your_new_table_name (wallet_address, referral_code, talents, companies, approved_talents, approved_companies) FROM stdin;
\.


--
-- Data for Name: your_table_name; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.your_table_name (user_id, wallet_address, referral_code, talents, companies, approved_talents, approved_companies) FROM stdin;
\.


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.admin_id_seq', 3, true);


--
-- Name: job_offers_job_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.job_offers_job_id_seq', 70, true);


--
-- Name: job_sections_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.job_sections_id_seq', 66, true);


--
-- Name: otps_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.otps_id_seq', 45, true);


--
-- Name: talents_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.talents_id_seq', 1404, true);


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.user_otp_verifications_id_seq', 1, false);


--
-- Name: user_wallet_history_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.user_wallet_history_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.users_id_seq', 796, true);


--
-- Name: wallet_migrations_id_seq; Type: SEQUENCE SET; Schema: goodhive; Owner: -
--

SELECT pg_catalog.setval('goodhive.wallet_migrations_id_seq', 1, false);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: job_offers block_id_unique; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers
    ADD CONSTRAINT block_id_unique UNIQUE (block_id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (user_id);


--
-- Name: job_offers job_offers_job_id_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers
    ADD CONSTRAINT job_offers_job_id_key UNIQUE (job_id);


--
-- Name: job_offers job_offers_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (id);


--
-- Name: job_sections job_sections_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_sections
    ADD CONSTRAINT job_sections_pkey PRIMARY KEY (id);


--
-- Name: otps otps_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.otps
    ADD CONSTRAINT otps_email_key UNIQUE (email);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (user_id);


--
-- Name: talents talents_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT talents_email_key UNIQUE (email);


--
-- Name: talents talents_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT talents_pkey PRIMARY KEY (id);


--
-- Name: user_otp_verifications unique_email_otp; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_otp_verifications
    ADD CONSTRAINT unique_email_otp UNIQUE (email);


--
-- Name: talents unique_user_id; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);


--
-- Name: user_otp_verifications user_otp_verifications_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_otp_verifications
    ADD CONSTRAINT user_otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: user_wallet_history user_wallet_history_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_wallet_history
    ADD CONSTRAINT user_wallet_history_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_userid_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users
    ADD CONSTRAINT users_userid_key UNIQUE (userid);


--
-- Name: wallet_migrations wallet_migrations_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.wallet_migrations
    ADD CONSTRAINT wallet_migrations_pkey PRIMARY KEY (id);


--
-- Name: job_offers job_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (id);


--
-- Name: your_table_name your_table_name_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.your_table_name
    ADD CONSTRAINT your_table_name_pkey PRIMARY KEY (user_id);


--
-- Name: idx_job_sections_job_id; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_job_sections_job_id ON goodhive.job_sections USING btree (job_id);


--
-- Name: idx_job_sections_sort_order; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_job_sections_sort_order ON goodhive.job_sections USING btree (job_id, sort_order);


--
-- Name: idx_otp_email; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otp_email ON goodhive.user_otp_verifications USING btree (lower((email)::text));


--
-- Name: idx_otp_expires; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otp_expires ON goodhive.user_otp_verifications USING btree (expires_at);


--
-- Name: idx_otp_wallet; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otp_wallet ON goodhive.user_otp_verifications USING btree (lower((wallet_address)::text));


--
-- Name: idx_otps_email; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otps_email ON goodhive.otps USING btree (email);


--
-- Name: idx_users_auth_method; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_auth_method ON goodhive.users USING btree (auth_method);


--
-- Name: idx_users_email_lower; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_email_lower ON goodhive.users USING btree (lower((email)::text));


--
-- Name: idx_users_merged_wallets; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_merged_wallets ON goodhive.users USING gin (merged_wallet_addresses);


--
-- Name: idx_users_smart_account; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_smart_account ON goodhive.users USING btree (thirdweb_smart_account_address);


--
-- Name: idx_users_thirdweb_wallet; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_thirdweb_wallet ON goodhive.users USING btree (lower(thirdweb_wallet_address));


--
-- Name: idx_users_wallet_address_lower; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE UNIQUE INDEX idx_users_wallet_address_lower ON goodhive.users USING btree (lower((wallet_address)::text)) WHERE (wallet_address IS NOT NULL);


--
-- Name: idx_wallet_history_user_action; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_history_user_action ON goodhive.user_wallet_history USING btree (user_id, action);


--
-- Name: idx_wallet_history_wallet; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_history_wallet ON goodhive.user_wallet_history USING btree (wallet_address);


--
-- Name: idx_wallet_migrations_date; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_migrations_date ON goodhive.wallet_migrations USING btree (created_at);


--
-- Name: idx_wallet_migrations_user; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_migrations_user ON goodhive.wallet_migrations USING btree (user_id, migration_status);


--
-- Name: job_offers auto_generate_block_id; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER auto_generate_block_id BEFORE INSERT ON goodhive.job_offers FOR EACH ROW EXECUTE FUNCTION public.set_block_id_if_null();


--
-- Name: job_offers trg_set_block_id; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER trg_set_block_id BEFORE INSERT ON goodhive.job_offers FOR EACH ROW WHEN ((new.block_id IS NULL)) EXECUTE FUNCTION public.set_random_block_id();


--
-- Name: job_offers trg_validate_block_id; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER trg_validate_block_id BEFORE INSERT OR UPDATE ON goodhive.job_offers FOR EACH ROW EXECUTE FUNCTION public.validate_or_generate_block_id();


--
-- Name: referrals unique_talents_trigger; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER unique_talents_trigger BEFORE INSERT OR UPDATE ON goodhive.referrals FOR EACH ROW EXECUTE FUNCTION public.ensure_unique_talents();


--
-- Name: talents fk_user_talents; Type: FK CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT fk_user_talents FOREIGN KEY (user_id) REFERENCES goodhive.users(userid) ON DELETE CASCADE;


--
-- Name: job_sections job_sections_job_id_fkey; Type: FK CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_sections
    ADD CONSTRAINT job_sections_job_id_fkey FOREIGN KEY (job_id) REFERENCES goodhive.job_offers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PFXE8VcbRPElkOMkfw8w01Y2VesjMPPjXI4HOmoU5qvDkBzhAlZjXDEkjgsGCtR

