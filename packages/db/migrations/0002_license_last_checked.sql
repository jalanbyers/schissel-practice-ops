-- Records when a state's board requirements were last verified against the
-- official source. Nullable: an unset value means "never verified" and is
-- treated as stale by any freshness check.
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS last_checked TEXT;
