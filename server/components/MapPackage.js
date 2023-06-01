const mapnik = require('mapnik');

const mercator = require('./sphericalmercator');

const TMS_SCHEME = false;

mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

function handleError(err, defaultMessage) {
    // if (err == null || Object.keys(err).length == 0) {
    //     return {
    //         message: defaultMessage
    //     }
    // }

    return err
}

class MapPackage {
    constructor() {
        this.map = null
    }

    LoadMapFromString(content) {
        return new Promise((resolve, reject) => {
            const map = new mapnik.Map(256, 256);
            map.fromString(content, (err,_) =>{
                if (err) reject(handleError(err, "Error when loading map"))
                this.map = map
                resolve(map)
            })
        })
    }

    RenderVectorTile(x,y,z) {
        return new Promise((resolve, reject) => {
            const bbox = mercator.xyz_to_envelope(x, y, z, TMS_SCHEME)
            this.map.extent = bbox
            const vt = new mapnik.VectorTile(z, x, y)
            this.map.render(vt, function(err, _vt) {
                if (err) reject(handleError(err, "Error when setting data to vectortile"))
                vt.getData({compression: 'none'}, (err2, data) => {
                    if (err2) reject(handleError(err, "Error when rendering vector tile"))
                    resolve(data)
                })
            });
        })
    }
    AddGeoJSON(geojson,name){
        return new Promise((resolve,reject) => {
            const vt = new mapnik.VectorTile(z,x,y)
            vt.addGeoJSON(JSON.stringify(geojson),name)
        })
    }
}

module.exports = MapPackage