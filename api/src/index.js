
// app.get('/healthz', async (req, res) => {
//     try {
//       await sequelize.authenticate();
//       res.json({ status: 'ok' })
//     } catch (error) {
//       res.status(503).json({ status: 'db not ready' })
//     }
// })



app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
})
