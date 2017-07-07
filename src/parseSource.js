// @flow
import ol from 'openlayers/dist/ol-debug.js'

import assign from 'lodash/assign'
import type {Source} from './types'

import parseFormat from './parseFormat'
import parseTileGrid from './parseTileGrid'

const XYZ = ol.source.XYZ
const TileGrid = ol.tilegrid.TileGrid
const TileWMS = ol.source.TileWMS
const ImageWMS = ol.source.ImageWMS
const TileImage = ol.source.TileImage
const VectorTile = ol.source.VectorTile
const Vector = ol.source.Vector
const WMTS = ol.source.WMTS

const sourceCreator = (sourceOptions: Source): Function => (sourceClass: Class<*>): Object => {
  const tileGrid = sourceOptions.tileGrid ? parseTileGrid(sourceOptions.tileGrid) : undefined
  const format = sourceOptions.format ? parseFormat(sourceOptions.format) : undefined
  return new sourceClass(assign({}, sourceOptions, {
    tileGrid: tileGrid,
    format: format
  }))
}

const createAsyncSource = () => {
  return new Promise((resolve, reject) => {
    fetch('https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/be52375416d219b757ccfecb27fb7a15/?request=GetCapabilities&version=1.0.0&service=wmts').then(function(response) {
        return response.text();
      }).then(function(text) {
        var parser = new ol.format.WMTSCapabilities();

        var result = parser.read(text);
        console.log('parsed',result)
        window.parsed = result
        var options = ol.source.WMTS.optionsFromCapabilities(result, {
          layer : 'topowebb',
          matrixSet : '3006'
        });
        window.parsedTileGrid = options.tileGrid
        console.log('apa',options.tileGrid)
         const extent = [ -1200000, 4700000, 2600000, 8500000 ];
      const resolutions = [ 4096.0, 2048.0, 1024.0, 512.0, 256.0, 128.0, 64.0, 32.0, 16.0, 8.0 ];
      const matrixIds = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
      const tileGrid = new ol.tilegrid.WMTS({
        tileSize : 256,
        extent : extent,
        resolutions : resolutions,
        matrixIds : matrixIds
      });
      options.tileGrid = tileGrid
      window.tileGrid = tileGrid
      const src = new ol.source.WMTS({
          url : 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/be52375416d219b757ccfecb27fb7a15/',
          layer : 'topowebb',
          format : 'image/png',
          matrixSet : '3006',
          tileGrid : tileGrid,
          version : '1.0.0',
          style : 'default',
          crossOrigin: 'anonymous'
      	})
        resolve(new ol.source.WMTS(options))
      })
  })
}

const parseSource = (sourceOptions: Source): Object => {
  const createSource = sourceCreator(sourceOptions)
  switch (sourceOptions.type) {
    case 'XYZ':
      return createSource(XYZ)
    case 'TileWMS':
      return createSource(TileWMS)
    case 'ImageWMS':
      return createSource(ImageWMS)
    case 'TileImage':
      return createSource(TileImage)
    case 'VectorTile':
      return createSource(VectorTile)
    case 'Vector':
      return createSource(Vector)
    case 'WMTS':
      return createSource(WMTS)
    case 'WMTSCapabilites':
      return createAsyncSource()
    default:
      console.warn('No source parser found for', sourceOptions.type)
      return {}
  }
}




export default parseSource
