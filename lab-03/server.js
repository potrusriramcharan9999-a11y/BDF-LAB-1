const express = require('express');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize database schema and initial records before listening
db.initializeDatabase().catch((err) => {
  console.error('[Server] Critical: Database initialization failed:', err);
});

// Root endpoint with student information and API guide
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 3: Books REST API',
    student: {
      name: 'POTRU. SRI RAMCHARAN',
      registrationNumber: '252U1R1199',
      section: 'CSE-2D'
    },
    documentation: '/books'
  });
});

// GET /books - Retrieve books with filtering, searching, sorting, and pagination
app.get('/books', async (req, res, next) => {
  try {
    const {
      search_q,
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price
    } = req.query;

    // 1. Validate order_by against allowlist
    const allowedSortColumns = ['id', 'title', 'author', 'price'];
    const lowerOrderBy = String(order_by).toLowerCase();
    if (!allowedSortColumns.includes(lowerOrderBy)) {
      return res.status(400).json({
        message: `Invalid sorting column: '${order_by}'. Allowed columns: ${allowedSortColumns.join(', ')}`
      });
    }

    // 2. Validate order direction against allowlist
    const upperOrder = String(order).toUpperCase();
    if (upperOrder !== 'ASC' && upperOrder !== 'DESC') {
      return res.status(400).json({
        message: `Invalid sorting direction: '${order}'. Allowed values: ASC, DESC`
      });
    }

    // 3. Validate pagination limit
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: 'Invalid limit parameter: must be a positive integer'
      });
    }

    // 4. Validate pagination offset
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: 'Invalid offset parameter: must be a non-negative integer'
      });
    }

    // 5. Build dynamic query with parameterization
    const conditions = [];
    const params = [];

    // Search query filter (partial title search with LIKE)
    if (search_q !== undefined && search_q !== null && String(search_q).trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${String(search_q).trim()}%`);
    }

    // Minimum price filter
    let parsedMinPrice = null;
    if (min_price !== undefined) {
      parsedMinPrice = Number(min_price);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          message: 'Invalid min_price: must be a non-negative number'
        });
      }
      conditions.push('price >= ?');
      params.push(parsedMinPrice);
    }

    // Maximum price filter
    let parsedMaxPrice = null;
    if (max_price !== undefined) {
      parsedMaxPrice = Number(max_price);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          message: 'Invalid max_price: must be a non-negative number'
        });
      }
      conditions.push('price <= ?');
      params.push(parsedMaxPrice);
    }

    // Check if min_price > max_price
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        message: 'Invalid price range: min_price cannot be greater than max_price'
      });
    }

    // Construct SQL
    let sql = 'SELECT * FROM books';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY ${lowerOrderBy} ${upperOrder} LIMIT ? OFFSET ?`;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(sql, params);

    return res.status(200).json({
      message: 'Books retrieved successfully',
      data: books
    });
  } catch (error) {
    next(error);
  }
});

// GET /books/:id - Retrieve a single book by ID
app.get('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID: must be a positive integer'
      });
    }

    const book = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({
        message: `Book not found with ID ${bookId}`
      });
    }

    return res.status(200).json({
      message: 'Book retrieved successfully',
      data: book
    });
  } catch (error) {
    next(error);
  }
});

// POST /books - Create a new book
app.post('/books', async (req, res, next) => {
  try {
    const { title, author, price } = req.body;

    // Validate title
    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: 'Title is required and cannot be empty'
      });
    }

    // Validate author
    if (author === undefined || author === null || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: 'Author is required and cannot be empty'
      });
    }

    // Validate price
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        message: 'Price is required and must be a non-negative number'
      });
    }

    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanPrice = Number(price);

    const result = await db.run(
      'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
      [cleanTitle, cleanAuthor, cleanPrice]
    );

    return res.status(201).json({
      message: 'Book created successfully',
      data: {
        id: result.lastID,
        title: cleanTitle,
        author: cleanAuthor,
        price: cleanPrice
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /books/:id - Update an existing book
app.put('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID: must be a positive integer'
      });
    }

    // Check if book exists
    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book not found with ID ${bookId}`
      });
    }

    const { title, author, price } = req.body;

    // Validate title
    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: 'Title is required and cannot be empty'
      });
    }

    // Validate author
    if (author === undefined || author === null || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: 'Author is required and cannot be empty'
      });
    }

    // Validate price
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        message: 'Price is required and must be a non-negative number'
      });
    }

    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanPrice = Number(price);

    await db.run(
      'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
      [cleanTitle, cleanAuthor, cleanPrice, bookId]
    );

    return res.status(200).json({
      message: 'Book updated successfully',
      data: {
        id: bookId,
        title: cleanTitle,
        author: cleanAuthor,
        price: cleanPrice
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /books/:id - Delete an existing book
app.delete('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID: must be a positive integer'
      });
    }

    // Check if book exists
    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book not found with ID ${bookId}`
      });
    }

    await db.run('DELETE FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 404 Route Not Found catch-all handler
app.use((req, res) => {
  res.status(404).json({
    message: '404 - Route Not Found'
  });
});

// Global internal error handler (does not expose raw DB errors)
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    message: 'Internal server error'
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
});

module.exports = { app, server };

