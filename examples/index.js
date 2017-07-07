//import OneWayOpenLayers from '../src'
import ol from 'openlayers'
// const config = {
//   view: {
//     projection: 'EPSG:3006',
//     center: [ 616542, 6727536 ],
//     extent: [ -1200000, 4700000, 2600000, 8500000 ],
//     resolutions: [ 4096.0, 2048.0, 1024.0, 512.0, 256.0, 128.0, 64.0, 32.0, 16.0, 8.0 ],
//     zoom: 1
//   },
//   layers: [
//     {
//       type: 'Tile',
//       visible: true,
//       extent: [ -1200000, 4700000, 2600000, 8500000 ],
//       source: {
//         type: 'WMTSCapabilites',
//         url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
//       },
//       projection: 'EPSG:3006'
//     }
//   ],
//   events: {
//     click: (e) => console.log(e.coordinate)
//   }
// }

// const map = OneWayOpenLayers({
//   target: 'map',
//   renderer: 'canvas'
// })

// map.render(config)
const extent = [ -1200000, 4700000, 2600000, 8500000 ];
      const resolutions = [ 4096.0, 2048.0, 1024.0, 512.0, 256.0, 128.0, 64.0, 32.0, 16.0, 8.0 ];
      const matrixIds = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
      const tileGrid = new ol.tilegrid.WMTS({
        tileSize : 256,
        extent : extent,
        resolutions : resolutions,
        matrixIds : matrixIds
      });


      var parser = new ol.format.WMTSCapabilities();
      var map;

      fetch('https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/be52375416d219b757ccfecb27fb7a15/?request=GetCapabilities&version=1.0.0&service=wmts').then(function(response) {
        return response.text();
      }).then(function(text) {
        var result = parser.read(text);
        var options = ol.source.WMTS.optionsFromCapabilities(result, {
          layer: 'topowebb',
          matrixSet: '3006'
        });

        map = new ol.Map({
          layers: [
            new ol.layer.Tile({
              opacity: 1,
              source: new ol.source.WMTS({
          url : 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/be52375416d219b757ccfecb27fb7a15/',
          layer : 'topowebb',
          format : 'image/png',
          matrixSet : '3006',
          tileGrid : tileGrid,
          version : '1.0.0',
          style : 'default',
          crossOrigin: 'anonymous'
      	})
            })
          ],
          target: 'map',
          view: new ol.View({
            projection: 'EPSG:3006',
            center: [6924032.199, 637403.351],
            zoom: 5
          })
          
        });
      });