const { Server } = require('./server')
const { MemoryStorage } = require('./results')

const request = require('supertest')

let app

beforeEach(() => {
    app = Server({
        resultService: MemoryStorage()
    })
})

describe('workloads', () => {
    describe('create', () => {
        test('simple case', async () => {
            const res = await request(app)
            .post('/create/workload')
            .send([
                {
                    metadata: {
                        browser: "chrome"
                    }
                }
            ])
            expect(res.statusCode).toEqual(200)
            expect(res.body).toMatchObject([
                {
                    metadata: {
                        browser: 'chrome'
                    }
                }
            ])
        })
    })
})
