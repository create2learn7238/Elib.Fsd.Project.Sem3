-- =============================================
-- BookHeaven E-Library — Neon PostgreSQL Setup
-- Run this in Neon SQL Editor or psql
-- =============================================

-- BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100),
  author VARCHAR(100),
  category VARCHAR(50),
  price NUMERIC(10,2) DEFAULT 0,
  is_free SMALLINT DEFAULT 0,
  cover_url VARCHAR(255),
  book_url VARCHAR(255),
  description TEXT
);

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  membership_plan VARCHAR(50) DEFAULT 'free',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  role VARCHAR(20) DEFAULT 'user',
  age INTEGER,
  favorite_author VARCHAR(100),
  favorite_genre VARCHAR(80),
  reading_goal VARCHAR(80),
  reading_level VARCHAR(80),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  item_name VARCHAR(255),
  amount NUMERIC(10,2),
  transaction_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'success',
  payment_method VARCHAR(30) DEFAULT 'Card'
);

-- CAROUSEL SLIDES TABLE
CREATE TABLE IF NOT EXISTS carousel_slides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  image_url VARCHAR(255)
);

-- Safe upgrades for existing Neon databases
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS favorite_author VARCHAR(100),
  ADD COLUMN IF NOT EXISTS favorite_genre VARCHAR(80),
  ADD COLUMN IF NOT EXISTS reading_goal VARCHAR(80),
  ADD COLUMN IF NOT EXISTS reading_level VARCHAR(80),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

UPDATE users SET created_at = NOW() WHERE created_at IS NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'Card';

-- =============================================
-- SEED DATA — BOOKS
-- =============================================
INSERT INTO books (id, title, author, category, price, is_free, cover_url, book_url, description) VALUES
(1,  'The Great Gatsby',    'F. Scott Fitzgerald', 'Fiction',     0.00, 1, 'https://www.gutenberg.org/cache/epub/64317/pg64317.cover.medium.jpg', 'https://www.gutenberg.org/files/64317/64317-h/64317-h.htm', 'A story of wealth, love, and the American Dream in the Roaring Twenties.'),
(2,  '1984',                'George Orwell',        'Fiction',   149.00, 0, 'https://placehold.co/400x600/1c1b29/f25f4c?text=1984', 'https://www.gutenberg.org/ebooks/11', 'A dystopian novel about a totalitarian surveillance state.'),
(3,  'Sapiens',             'Yuval Noah Harari',    'Non-Fiction',180.00, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Sapiens', 'https://www.gutenberg.org/ebooks/20203', 'A brief history of humankind from the Stone Age to the present.'),
(4,  'Alice in Wonderland', 'Lewis Carroll',        'Fantasy',     0.00, 1, 'https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg', 'https://www.gutenberg.org/files/11/11-h/11-h.htm', 'A young girl falls through a rabbit hole into a subterranean fantasy world.'),
(5,  'Atomic Habits',       'James Clear',          'Self-Help',  150.00, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Habits', '', 'Tiny changes, remarkable results — the #1 habits book.'),
(6,  'Sherlock Holmes',     'Arthur Conan Doyle',   'Mystery',     0.00, 1, 'https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg', 'https://www.gutenberg.org/files/1661/1661-h/1661-h.htm', 'A collection of detective stories featuring the world''s most famous investigator.'),
(7,  'Deep Work',           'Cal Newport',          'Self-Help',  120.00, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Deep+Work', '', 'Rules for focused success in a distracted world.'),
(8,  'The Alchemist',       'Paulo Coelho',         'Fantasy',    110.00, 0, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Alchemist', '', 'A philosophical novel about following your dreams.'),
(9,  'Red Oleanders',       'Rabindranath Tagore',  'Drama',      130.00, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Red+Oleanders', '', 'A symbolic play about oppression and the human spirit.'),
(10, 'Frankenstein',        'Mary Shelley',         'Horror',       0.00, 1, 'https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg', 'https://www.gutenberg.org/files/84/84-h/84-h.htm', 'A scientist creates a sentient creature in a social experiment that goes horribly wrong.'),
(11, 'Pride and Prejudice', 'Jane Austen',          'Romance',      0.00, 1, 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg', 'https://www.gutenberg.org/files/1342/1342-h/1342-h.htm', 'A classic novel of manners, marriage, and morality in Regency-era England.'),
(12, 'Moby Dick',           'Herman Melville',      'Adventure',  170.00, 0, 'https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg', 'https://www.gutenberg.org/files/2701/2701-h/2701-h.htm', 'The narrative of Captain Ahab''s obsessive quest to kill the giant white whale.'),
(13, 'Metamorphosis',       'Franz Kafka',          'Fiction',      0.00, 1, 'https://www.gutenberg.org/cache/epub/5200/pg5200.cover.medium.jpg', 'https://www.gutenberg.org/files/5200/5200-h/5200-h.htm', 'A traveling salesman wakes up to find himself transformed into a giant insect.'),
(14, 'Dracula',             'Bram Stoker',          'Horror',       0.00, 1, 'https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg', 'https://www.gutenberg.org/files/345/345-h/345-h.htm', 'The legendary tale of the vampire Count Dracula''s attempt to move to England.'),
(15, 'Ulysses',             'James Joyce',          'Modernism',  170.00, 0, 'https://www.gutenberg.org/cache/epub/4300/pg4300.cover.medium.jpg', 'https://www.gutenberg.org/files/4300/4300-h/4300-h.htm', 'A complex, stream-of-consciousness novel chronicling a single day in Dublin.'),
(16, 'Dorian Gray',         'Oscar Wilde',          'Philosophy', 120.00, 0, 'https://www.gutenberg.org/cache/epub/174/pg174.cover.medium.jpg', 'https://www.gutenberg.org/files/174/174-h/174-h.htm', 'A man sells his soul so that his portrait ages while he remains young.'),
(17, 'Fairy Tales',         'Brothers Grimm',       'Children',   150.00, 0, 'https://www.gutenberg.org/cache/epub/2591/pg2591.cover.medium.jpg', 'https://www.gutenberg.org/files/2591/2591-h/2591-h.htm', 'A collection of folklore including Cinderella, Hansel and Gretel, and more.'),
(18, 'War of the Worlds',   'H. G. Wells',          'Sci-Fi',     120.00, 0, 'https://www.gutenberg.org/cache/epub/36/pg36.cover.medium.jpg', 'https://www.gutenberg.org/files/36/36-h/36-h.htm', 'One of the earliest stories to detail a conflict between mankind and aliens.'),
(19, 'A Tale of Two Cities','Charles Dickens',      'History',    100.00, 0, 'https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg', 'https://www.gutenberg.org/files/98/98-h/98-h.htm', 'Set in London and Paris before and during the French Revolution.'),
(20, 'Heart of Darkness',   'Joseph Conrad',        'Fiction',    110.00, 0, 'https://www.gutenberg.org/cache/epub/219/pg219.cover.medium.jpg', 'https://www.gutenberg.org/files/219/219-h/219-h.htm', 'A journey up the Congo River into the center of the African continent.'),
(21, 'Meditations',         'Marcus Aurelius',      'Philosophy', 120.00, 0, 'https://www.gutenberg.org/cache/epub/264/pg264.cover.medium.jpg', 'https://www.gutenberg.org/files/2680/2680-h/2680-h.htm', 'Private reflections and Stoic philosophy from the Roman Emperor.')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence so new inserts start after 21
SELECT setval('books_id_seq', (SELECT MAX(id) FROM books));

-- =============================================
-- SEED DATA — ADMIN USER
-- Password is "Admin@123" (bcrypt hashed)
-- Change this immediately after first login!
-- =============================================
INSERT INTO users (username, email, password, membership_plan, role) VALUES
('Master Admin', 'admin@bookhaven.com', '$2b$10$wpS25FQGhjFQzZOfjR0l9OycMJW3XIAW474PLuHvUg/8chVVAl7GG', 'pro', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- SEED DATA — SAMPLE PAYMENTS (optional)
-- =============================================
INSERT INTO payments (user_email, item_name, amount, transaction_date, status) VALUES
('admin@bookhaven.com', 'Membership: 1 Month', 499.00, NOW() - INTERVAL '10 days', 'success')
ON CONFLICT DO NOTHING;
