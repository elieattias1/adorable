-- Owner notification contacts for pay-at-pickup order alerts
-- notification_email : override email for order notifications (defaults to auth email)
-- notification_phone : SMS number in E.164 format (e.g. +33612345678)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_phone TEXT;
