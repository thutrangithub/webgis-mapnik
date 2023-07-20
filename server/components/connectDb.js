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

const dbHost = "postgres-postgis";
// const dbHost = "localhost";
const pgp = require("pg-promise")(initOptions);
const db = pgp(`postgresql://postgres:1@${dbHost}:5432/webgis`);

function getTableName(name) {
    return new Promise((resolve, reject) => {
        const sql = `Select layers.tablename, spatial_ref_sys.proj4text
        from layers 
        join spatial_ref_sys
        on layers.crs = spatial_ref_sys.srid
        where layers.layername = '${name}'`
        db.one(sql, null, data => {
            resolve([data.tablename, data.proj4text])
        })
    })
}
function getDb(name) {
    return new Promise((resolve, reject) => {
        const sql = `Select db_info from layers where layername = '${name}'`
        db.one(sql, null, data => {
            resolve(data.db_info)
        })
    })
}
function getLonMax() {
    return new Promise((resolve, reject) => {
        const sql = `select st_xmax(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql, null, data => {
            resolve(data.st_xmax)
        })
    })
}
function getLonMin() {
    return new Promise((resolve, reject) => {
        const sql = `select st_xmin(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql, null, data => {
            resolve(data.st_xmin)
        })
    })
}
function getLatMax() {
    return new Promise((resolve, reject) => {
        const sql = `select st_ymax(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql, null, data => {
            resolve(data.st_ymax)
        })
    })
}
function getLatMin() {
    return new Promise((resolve, reject) => {
        const sql = `select st_ymin(st_transform(st_envelope(st_collect(st_force2d(mymap.geom))),4326))
        from public.acdbase as mymap`
        db.one(sql, null, data => {
            resolve(data.st_ymin)
        })
    })
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
    `
        return new Promise(async (resolve, reject) => {
            var array = []
            array = await getTableName(`${layerName}`)
            const tableName = array[0]
            const proj_string = array[1]
            const dbInfo = await getDb(`${layerName}`)
            var xml = template.replace(/{table-name}/, `"${tableName}"`)
            xml = xml.replace(/{proj_string}/, `${proj_string}`)
            xml = xml.replace(/{layer-name}/g, `${layerName}`)
            xml = xml.replace(/{database}/, `${dbInfo.database}`)
            xml = xml.replace(/{host}/, `${dbHost}`)
            xml = xml.replace(/{user}/, `${dbInfo.user}`)
            xml = xml.replace(/{password}/, `${dbInfo.password}`)
            resolve(xml)
        })
    }
    LinkBuffer(x, y, z, link) {
        return new Promise(async (resolve, reject) => {
            const sql = `insert into public.savedpbf(z,x,y,linkpbf)
            select ${z},${x},${y},'${link}'
            where not exists(
            Select z,x,y from public.savedpbf where z = ${z} and x = ${x} and y = ${y}
            )`
            await db.none(sql)
        })
    }
    GetLinkBuffer(z, x, y) {
        return new Promise(async (resolve, reject) => {
            const sql = `SELECT linkpbf FROM public.savedpbf where x = ${x} and y = ${y} and z = ${z};`
            db.oneOrNone(sql, null, data => {
                if (data == null) {
                    resolve(111221)
                } else {
                    resolve(data.linkpbf)
                }
            })
        })
    }
    DoesIntersect(bbox) {
        return new Promise((resolve, reject) => {
            const sql = `select`
        })
    }
    NewUser(user, pass) {
        return new Promise(async (resolve, reject) => {
            const sql = `INSERT INTO public.login_info(
                username, password)
                VALUES (${user}, ${pass});`
            await db.none(sql)
        })

    }
    GetBboxLatLon() {
        return new Promise(async (resolve, reject) => {
            const lonmax = await getLonMax()
            const lonmin = await getLonMin()
            const latmax = await getLatMax()
            const latmin = await getLatMin()
            resolve([lonmax, lonmin, latmax, latmin])
        })
    }
    LoginCheck(username, password) {
        return new Promise(async (resolve, reject) => {
            const sql = `select username,password from public.account where username = '${username}'`
            await db.oneOrNone(sql, null, data => {
                if (data == null) {
                    resolve(0)
                } else {
                    if (password === data.password) {
                        resolve(1)
                    }
                    else {
                        resolve(2)
                    }
                }
            })
        })
    }
    MoveObject(id, x, y) {
        const e = 2.7182818284
        const X = 20037508.34
        const lat3857 = y
        const long3857 = x
        const long4326 = (long3857 * 180) / X
        let lat4326 = lat3857 / (X / 180)
        const exponent = (Math.PI / 180) * lat4326
        lat4326 = Math.atan(e ** exponent)
        lat4326 = lat4326 / (Math.PI / 360)
        lat4326 = lat4326 - 90
        return ([id, long4326, lat4326])
    }
    saveMovetoDB(id, x, y) {
        return new Promise(async (resolve, reject) => {
            const sql = `update public.gdam1 
        set geom = st_translate(geom,${x},${y})
        where gid = ${id} `
            await db.none(sql)
            resolve('done')
        })
    }
}

module.exports = connectDb

