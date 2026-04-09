-- Add 'bakery' to the sites type check constraint
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_type_check;
ALTER TABLE sites ADD CONSTRAINT sites_type_check
  CHECK (type IN ('business','portfolio','restaurant','shop','blog','saas','landing','bakery','wellness','blank'));
