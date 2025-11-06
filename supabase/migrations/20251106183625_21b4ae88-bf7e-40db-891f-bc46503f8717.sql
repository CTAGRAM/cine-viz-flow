-- Make year column nullable in books table
ALTER TABLE books ALTER COLUMN year DROP NOT NULL;