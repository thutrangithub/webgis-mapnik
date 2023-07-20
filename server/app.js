const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const MapPackage = require("./components/MapPackage");
const { callLayer } = require("./components/connectDb");
const connectDb = require("./components/connectDb");
const cors = require('cors');
const app = express();
const manageToken = require('./components/manageToken.js');
const { v4: uuidv4 } = require('uuid');


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
          const xml = await db.callLayer('acdbase')
          await map.LoadMapFromString(xml)
          const buffer = await map.RenderVectorTile(x, y, z)
          let output = `./server/savedpbf/${x}-${y}-${z}.pbf`
          await fs.writeFile(output, buffer)
          // await db.LinkBuffer(x,y,z,output)
        }
      }
    }
  } catch (err) {
    res.send(err?.stack);
  }
  res.send('done')
})

app.get('/api/style/:a', async (req,res) => {
  try{
      const style = new getStyle()
      const queue = await style.callStyle(req.params.a)
      res.send(queue)
  }catch(err) {
  res.send(err?.stack);
}
})
app.get('/api/showpbf/:z/:x/:y', async (req,res) =>{
  try{
      const db = new connectDb()
      const buffer = await db.getPbf(+req.params.z, +req.params.x, +req.params.y)
      res.header('Content-Type', 'application/protobuf');
      res.send(buffer);
  }catch(err){
      console.log(err?.stack);
  }
})
app.get('/api/geojson/:z/:x/:y', async (req,res) =>{
  try{
      const map = new MapPackage()
      const db = new connectDb()
      const xml = await db.callLayer('testgeojson')
      await map.LoadMapFromString(xml)
      map.ToGeoJSON(+req.params.z, +req.params.x, +req.params.y)
  }catch(err){
      console.log(err?.stack);
  }
})
app.get('/api/generate-token', async (req,res) => {
  try{
      const db = new connectDb()
      const mtk = new manageToken()
      const uuid = uuidv4()
      const resp = await db.LoginCheck('admin','admin')
      if(resp == 0){res.send('Username khong ton tai')}
      else if(resp == 2){res.send('Sai Password')}
      else if(resp ==1){
      const tok = await mtk.GenerateToken(uuid)
      res.send(tok)
  }
  }catch(err){
      console.log(err?.stack);
  }
})
app.get('/api/validate-token',async(req,res)=>{
      const tok = req.headers.authorization
      const mtk = new manageToken()
      if (!tok) {
          return res.status(401).json({ message: 'No token provided.' })
      }
      try{
      await mtk.verifyToken(tok)
      {res.json({ message: 'Protected route accessed successfully!' })} //sua o day
      } catch (err) {
         res.status(403).json({ message: 'Invalid token.' })
  }
})
app.put('/api/modifications/drag', async(req, res) => {
  console.log("req", req)
if (!req.body || !req.body.modifications) {
  return res.status(400).send('Bad request. Missing modifications data.')
}
const modifications = req.body.modifications
const db = new connectDb()
try{
  let i = 0
  for(i;i < modifications.length; i++){
  const resp = db.MoveObject(modifications[i][0],modifications[i][1],modifications[i][2])
  const save = await db.saveMovetoDB(resp[0],resp[1],resp[2])
  if(i+1 ==modifications.length){
      res.send('done')
    }
}
}catch(err){
      console.log(err?.stack);
}
});


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

const port = 1234;
// Start server tại cổng ${port}
app.listen(port, () => {
  console.log('Server is running at http://localhost:' + port);
});