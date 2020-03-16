const PORT = process.env.PORT || 8080
const { Server } = require('./server')
const { MemoryStorage } = require('./results')
const app = Server({
    resultService: MemoryStorage()
})

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
})
