-- Add slug column to packages if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'slug') THEN
        ALTER TABLE packages ADD COLUMN slug TEXT UNIQUE;
        CREATE INDEX idx_packages_slug ON packages(slug);
    END IF;
END $$;

-- Add slug column to tours if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'slug') THEN
        ALTER TABLE tours ADD COLUMN slug TEXT UNIQUE;
        CREATE INDEX idx_tours_slug ON tours(slug);
    END IF;
END $$;

-- Function to generate a slug from a title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
    new_slug TEXT;
BEGIN
    -- Lowercase and replace non-alphanumeric with hyphens
    new_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
    new_slug := regexp_replace(new_slug, '\s+', '-', 'g');
    
    -- Trim hyphens
    new_slug := trim(both '-' from new_slug);
    
    -- If slug is empty (e.g. title was only symbols), fallback to random
    IF new_slug = '' OR new_slug IS NULL THEN
        new_slug := 'item-' || substring(md5(random()::text) from 1 for 6);
    END IF;

    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-assign slugs
CREATE OR REPLACE FUNCTION set_slug_trigger() RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 1;
    table_name TEXT;
    slug_exists BOOLEAN;
BEGIN
    -- Determine table name for uniqueness check
    table_name := TG_TABLE_NAME;

    -- Only generate if slug is null or empty
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Generate base slug
        IF table_name = 'packages' THEN
            base_slug := generate_slug(NEW.name);
        ELSE
            base_slug := generate_slug(NEW.title);
        END IF;

        final_slug := base_slug;

        -- Loop to handle collisions
        LOOP
            IF table_name = 'packages' THEN
                SELECT EXISTS(SELECT 1 FROM packages WHERE slug = final_slug AND id != NEW.id) INTO slug_exists;
            ELSE
                SELECT EXISTS(SELECT 1 FROM tours WHERE slug = final_slug AND id != NEW.id) INTO slug_exists;
            END IF;

            EXIT WHEN NOT slug_exists;

            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        NEW.slug := final_slug;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS ensure_package_slug ON packages;
CREATE TRIGGER ensure_package_slug
BEFORE INSERT OR UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION set_slug_trigger();

DROP TRIGGER IF EXISTS ensure_tour_slug ON tours;
CREATE TRIGGER ensure_tour_slug
BEFORE INSERT OR UPDATE ON tours
FOR EACH ROW EXECUTE FUNCTION set_slug_trigger();

-- Backfill existing records
UPDATE packages SET slug = NULL WHERE slug IS NULL;
UPDATE tours SET slug = NULL WHERE slug IS NULL;
