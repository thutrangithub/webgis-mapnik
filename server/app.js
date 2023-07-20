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

app.get("/map/vectors/:z/:x/:y", async (req, res) => {
  try {
    const db = new connectDb()
    let z = +req.params.z
    let x = +req.params.x
    let y = +req.params.y
    let input = await db.GetLinkBuffer(x, y, z)
    const buffer = await fs.readFile(input)
    res.header('Content-Type', 'application/protobuf');
    res.send(buffer);
  } catch (err) {
    res.send(err?.stack);
  }
})
app.get('/map/prerender', async (req, res) => {
  try {
    const map = new MapPackage()
    const db = new connectDb()
    let array = []
    array = await db.GetBboxLatLon()
    let z = 0
    for (z; z < 9; z++) {
      let xmax = map.GetTiles(array[2], array[0], z)[0]
      let ymin = map.GetTiles(array[2], array[0], z)[1]
      let xmin = map.GetTiles(array[3], array[1], z)[0]
      let ymax = map.GetTiles(array[3], array[1], z)[1]
      for (let x = xmin; x < xmax + 1; x++) {
        for (let y = ymin; y < ymax + 1; y++) {
          console.log(z, x, y)
          const xml = await db.callLayer('acdbase')
          await map.LoadMapFromString(xml)
          const buffer = await map.RenderVectorTile(x, y, z)
          console.log(1)
          let output = `./server/savedpbf/${x}-${y}-${z}.pbf`
          await fs.writeFile(output, buffer)
          console.log(2)
          // await db.LinkBuffer(x,y,z,output)
          // console.log(3)
        }
      }
    }
  } catch (err) {
    res.send(err?.stack);
  }
  res.send('done')
})
const user = [
  {
    username: 'admin',
    password: '12345678'
  }
];
app.use('/login', (req, res) => {
  res.send({
    success: true,
    token: 'test123'
  });
});

const port = 8000;
// Start server tại cổng ${port}
app.listen(port, () => {
  console.log('Server is running at http://localhost:' + port);
});