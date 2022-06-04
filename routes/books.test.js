// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

const Book = require("../models/book")

let testBook
const data = {
    isbn: "0691161518",
    amazon_url: "http://a.co/eobPtX2",
    author: "Matthew Lane Update",
    language: "english",
    pages: 264,
    publisher: "Princeton University Press",
    title: "Power-Up: Unlocking Hidden Math in Video Games",
    year: 2017
}

beforeEach(async () => {
  let result = await db.query(
    `INSERT INTO books (
      isbn,
      amazon_url,
      author,
      language,
      pages,
      publisher,
      title,
      year) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING isbn,
                amazon_url,
                author,
                language,
                pages,
                publisher,
                title,
                year`,
  [
    data.isbn,
    data.amazon_url,
    data.author,
    data.language,
    data.pages,
    data.publisher,
    data.title,
    data.year
  ])

  testBook = result.rows[0]
})

describe("GET /books", () => {
  test("Gets a list of 1 books", async () => {
    const response = await request(app).get(`/books`)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({
      books: [testBook]
    })
  })
})

describe("GET /books/:isbn", () => {
  test("Gets information of a specific book", async () => {
    const response = await request(app).get(`/books/${testBook.isbn}`)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({
      book: testBook
    })
  })
  test("Responds with 404 if can't find bookx", async () => {
    const response = await request(app).get(`/books/0`)
    expect(response.statusCode).toEqual(404)
  })
})

describe("POST /books", () => {
  test("Creates a book", async () => {
    const response = await request(app).post(`/books`).send({
      book: {
        isbn: '32794782',
        amazon_url: "https://taco.com",
        author: "mctest",
        language: "english",
        pages: 1000,
        publisher: "yeah right",
        title: "amazing times",
        year: 2000
      }
    })
  expect(response.statusCode).toBe(201)
  expect(response.body.book).toHaveProperty("isbn")
  })
  test("Prevents creating book without required data", async function () {
    const response = await request(app).post(`/books`).send({year: 2000});
    expect(response.statusCode).toBe(400);
  })
})

describe("PUT /books/:isbn", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
        .put(`/books/${testBook.isbn}`)
        .send({
          book: {
            amazon_url: "https://taco.com",
            author: "mctest",
            language: "english",
            pages: 1000,
            publisher: "yeah right",
            title: "UPDATED BOOK",
            year: 2000
          }
        });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("UPDATED BOOK");
  });

  test("Prevents a bad book update", async function () {
    const response = await request(app)
        .put(`/books/${testBook.isbn}`)
        .send({
          book: {
            author: "mctest",
            language: "english",
            pages: 1000,
            publisher: "yeah right",
            title: "UPDATED BOOK",
            year: 2000
          }
        })
    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if can't find book in question", async function () {
    // delete book first
    const response = await request(app).delete(`/books/0`);
    expect(response.statusCode).toBe(404);
  });
});


describe("DELETE /books/:isbn", function () {
  test("Deletes a single a book", async function () {
    const response = await request(app)
        .delete(`/books/${testBook.isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
  });
});

afterEach(async () => {
  // delete any data created by test
  await db.query("DELETE FROM books")
})

afterAll(async () => {
  // close db connection
  await db.end()
})