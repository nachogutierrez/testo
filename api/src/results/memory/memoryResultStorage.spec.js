const { passesFilter } = require('./memoryResultStorage')

test('passesFilter', () => {
    const filter = passesFilter({ metadata: { browser: "chrome" } })
    expect(filter({ metadata: { browser: "chrome", shard: 1 } })).toBe(true)
    expect(filter({ metadata: { browser: "firefox", shard: 1 } })).toBe(false)
})
