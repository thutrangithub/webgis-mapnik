const initOptions = {
    // global event notification;
    error(error, e) {
        if (e.cn) {
            // A connection-related error;
            //
            // Connections are reported back with the password hashed,
            // for safe errors logging, without exposing passwords.
            console.log('CN:', e.cn);
            console.log('EVENT:', error.message || error);
        }
    }
  };
  
  const pgp = require('pg-promise')(initOptions);
  const db = pgp('postgresql://postgres:1@localhost:5432/webgis')
  
  function getTableName(name){
    return new Promise((resolve, reject) => {
        const sql = `Select layers.tablename, spatial_ref_sys.proj4text
        from layers 
        join spatial_ref_sys
        on layers.crs = spatial_ref_sys.srid
        where layers.layername = '${name}'`
        db.one(sql, null, data => {
            resolve([data.tablename,data.proj4text])
        })
    })
  }
  function getDb(name){
    return new Promise((resolve, reject) => {
        const sql = `Select db_info from layers where layername = '${name}'`
        db.one(sql, null, data => {
            resolve(data.db_info)
        })
    })  
  }
  function getLonMax(){
    return new Promise((resolve,reject) => {
        const sql = `select st_xmax(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql,null,data => {
            resolve(data.st_xmax)
        })
    })
  }
  function getLonMin(){
    return new Promise((resolve,reject) => {
        const sql = `select st_xmin(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql,null,data => {
            resolve(data.st_xmin)
        })
    })
  }
  function getLatMax(){
    return new Promise((resolve,reject) => {
        const sql = `select st_ymax(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql,null,data => {
            resolve(data.st_ymax)
        })
    })
  }
  function getLatMin(){
    return new Promise((resolve,reject) => {
        const sql = `select st_ymin(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql,null,data => {
            resolve(data.st_ymin)
        })
    })
  }
  
  class connectDb{
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
    `
    return new Promise(async(resolve,reject) => {
        var array = [];
        array = await getTableName(layerName);
        const tableName = array[0];
        const proj_string = array[1];
        const dbInfo = await getDb(layerName);
        var xml = template.replace(/{table-name}/, tableName);
        xml = xml.replace(/{proj_string}/, proj_string);
        xml = xml.replace(/{layer-name}/g, layerName);
        xml = xml.replace(/{database}/, dbInfo.database);
        xml = xml.replace(/{host}/, dbInfo.dbHost);
        xml = xml.replace(/{user}/, dbInfo.user);
        xml = xml.replace(/{password}/, dbInfo.password);
        resolve(xml);
  
    })
    }
    LinkBuffer(x,y,z,link){
        return new Promise(async(resolve,reject) => {
            const sql = `INSERT INTO public.savedpbf(z, x, y, linkpbf) VALUES (${z},${x},${y},'${link}');`
                await db.none(sql)
        })
    }
    GetLinkBuffer(x,y,z){
        return new Promise(async(resolve,reject) =>{
            const sql = `SELECT linkpbf FROM public.savedpbf where x = ${x} and y = ${y} and z = ${z};`
            db.one(sql,null,data => {
                resolve(data.linkpbf)
            })
        })
    }
    DoesIntersect(bbox){
        return new Promise((resolve,reject) =>{
            const sql = `select`
        })
    }
    NewUser(user,pass){
        return new Promise(async(resolve,reject) => {
            const sql = `INSERT INTO public.login_info(
                username, password)
                VALUES (${user}, ${pass});`
            await db.none(sql)
        })
  
    }
    GetBboxLatLon(){
        return new Promise(async(resolve,reject) => {
        const lonmax = await getLonMax()
        const lonmin = await getLonMin()
        const latmax = await getLatMax()
        const latmin = await getLatMin()
        resolve([lonmax,lonmin,latmax,latmin])
        })
    }
  }
  
  module.exports = connectDb