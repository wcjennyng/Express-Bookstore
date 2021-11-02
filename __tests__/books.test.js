const request = require("supertest");
const app = require("../app");
const db = require("../db");

process.env.NODE_ENV = "test"

let test_isbn;

beforeEach(async ()=> {
    let res = await db.query(`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
                            VALUES ('12345', 'https://amazon.com/Jenny', 'Jenny', 'English', 10, 'Jenny Ng', 'Top ten', '2021')
                            RETURNING isbn`)

    test_isbn = res.rows[0].isbn 
})


describe('GET /books', function() {
    test('Gets list of books', async function () {
        const res = await request(app).get(`/books`)
        const booksList = res.body.books
        expect(booksList[0]).toHaveProperty('isbn')
        expect(booksList[0]).toHaveProperty('author')
    })

})

describe('GET /books/:isbn', function() {
    test('Gets a book by isbn', async function() {
        const res = await request(app).get(`/books/${test_isbn}`)
        expect(res.body.book).toHaveProperty('isbn')
        expect(res.body.book.isbn).toBe(test_isbn)
    })

    test('If book not found, responds with 404', async function () {
        const res = await request(app).get(`/books/0`)
        expect(res.statusCode).toBe(404)
    })
})

describe('POST /books', function() {
    test('Creates a new book', async function() {
        const res = await request(app).post(`/books`)
                    .send({isbn: '678910', author: 'Jennytest', language: 'English', 
                            pages: 100, publisher: 'Jennytest Ng', title: "Test", year: 2021})
        expect(res.body.book).toHaveProperty('isbn')
        expect(res.statusCode).toBe(201)
    })

    test('Requires isbn when book is created', async function () {
        const res = await request(app).post(`/books`).send({author: 'Not an author'})
        expect(res.statusCode).toBe(400)
    })
})

describe('PUT /books/:isbn', function () {
    test('Updates a book', async function() {
        const res = await request(app).put(`/books/${test_isbn}`).send({
            author: 'Jennyupdate', language: "English", pages: 100, publisher: 'Jennyupdate Ng', title: "Update", year: 2021
        })
        expect(res.body.book).toHaveProperty('isbn')
        expect(res.body.book.author).toBe('Jennyupdate')
    })

    test('If book not found, responds with 404', async function () {
        const res = await request(app).get(`/books/0`)
        expect(res.statusCode).toBe(404)
    })

})

describe('DELETE /books/:isbn', function() {
    test('Deletes a book', async function() {
        const res = await request(app).delete(`/books/${test_isbn}`)
        expect(res.body).toEqual({message: "Book deleted"})
    })
})


afterEach(async function() {
    await db.query('DELETE FROM BOOKS')
})

afterAll(async function(){
    await db.end()
})
