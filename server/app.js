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
// app.use('/', express.static(path.join(__dirname, '../dist')));
app.get("/api/vector/:layerId/:z/:x/:y", async (req, res) => {
  try {
    const map = new MapPackage();
    const db = new connectDb();
    const xml = await db.callLayer(req.params.layerId);
    // console.log(xml)
    // const content = await fs.readFile(`${__dirname}/data/stylesheetG3.xml`, 'utf8')
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
app.listen(8000, () => {
  console.log("App is running...");
});
