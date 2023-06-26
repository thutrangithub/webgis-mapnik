const initOptions = {
  // global event notification;
  error(error, e) {
    if (e.cn) {
      // A connection-related error;
      //
      // Connections are reported back with the password hashed,
      // for safe errors logging, without exposing passwords.
      console.log("CN:", e.cn);
      console.log("EVENT:", error.message || error);
    }
  },
};
const dbHost = "postgres-postgis";
const pgp = require("pg-promise")(initOptions);
const db = pgp(`postgresql://postgres:1@${dbHost}:5432/webgis`);

function getTableName(name) {
  return new Promise((resolve, reject) => {
    const sql = `Select layers.tablename, spatial_ref_sys.proj4text
        from layers 
        join spatial_ref_sys
        on layers.crs = spatial_ref_sys.srid
        where layers.layername = '${name}'`;
    db.one(sql, null, (data) => {
      resolve([data.tablename, data.proj4text]);
    });
  });
}
function getDb(name) {
  return new Promise((resolve, reject) => {
    const sql = `Select db_info from layers where layername = '${name}'`;
    db.one(sql, null, (data) => {
      resolve(data.db_info);
    });
  });
}

class connectDb {
  callLayer(layerName) {
    var template = `<?xml version="1.0" encoding="utf-8"?>
    <Map srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over" background-color="black">
        <Layer name="{layer-name}" srs="{proj_string}">
            <StyleName>style</StyleName>
            <Datasource>
            <Parameter name="type">postgis</Parameter>
            <Parameter name="host">{host}</Parameter>
            <Parameter name="dbname">{database}</Parameter>
            <Parameter name="user">{user}</Parameter>      
            <Parameter name="password">{password}</Parameter>
            <Parameter name="table">(select * from {table-name}) as {layer-name}</Parameter>
            </Datasource>
        </Layer>
    </Map>
    `;
    return new Promise(async (resolve, reject) => {
      var array = [];
      array = await getTableName(layerName);
      const tableName = array[0];
      const proj_string = array[1];
      const dbInfo = await getDb(layerName);
      var xml = template.replace(/{table-name}/, tableName);
      xml = xml.replace(/{proj_string}/, proj_string);
      xml = xml.replace(/{layer-name}/g, layerName);
      xml = xml.replace(/{database}/, dbInfo.database);
      xml = xml.replace(/{host}/, dbHost);
      xml = xml.replace(/{user}/, dbInfo.user);
      xml = xml.replace(/{password}/, dbInfo.password);
      resolve(xml);
    });
  }
}

module.exports = connectDb;
