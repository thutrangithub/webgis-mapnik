const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const MapPackage = require("./components/MapPackage");
const { callLayer } = require("./components/connectDb");
const connectDb = require("./components/connectDb");
const cors = require('cors');
const app = express();

app.use(cors({
  origin: '*'
}));

app.use('/', express.static(path.join(__dirname, '../dist')));
app.use('/', express.static(path.join(__dirname, '../client')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));


app.get("/api/vector/:layerId/:z/:x/:y", async (req, res) => {
  try {
    const map = new MapPackage();
    const db = new connectDb();
    const xml = await db.callLayer(req.params.layerId);
    await map.LoadMapFromString(xml);
    const buffer = await map.RenderVectorTile(
      +req.params.x,
      +req.params.y,
      +req.params.z
    );
    res.header("Content-Type", "application/protobuf");
    res.send(buffer);
  } catch (err) {
    res.send(err?.stack);
  }
});

// Đường dẫn tới thư mục chứa các tệp tĩnh (như HTML, CSS, JS)
const publicDir = path.join(__dirname, '../client');

// Đặt đường dẫn mặc định cho trang login
app.get('/', (req, res) => {
  res.render('login');
});


// Xử lý đường dẫn /dashboard
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/map.html'));
});

app.use('/login', (req, res) => {
  res.send({
    token: 'test123'
  });
});

const port = 3000;
// Start server tại cổng ${port}
app.listen(port, () => {
  console.log('Server is running at http://localhost:' + port);
});