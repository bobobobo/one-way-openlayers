// @flow
import ol from 'openlayers'

import type { Layer } from './types'
import assign from 'lodash/assign'
import parseSource from './parseSource'
const Tile =  ol.layer.Tile
const Vector = ol.layer.Vector
const Image = ol.layer.Image
const VectorTile = ol.layer.VectorTile

const layerCreator = (layerOptions: Layer): Function => (layerClass: Class<*>): Object => {
  const source = parseSource(layerOptions.source)
  let sourceOptions = {}
  if (Promise.resolve(source) == source){
    return new Promise((resolve, reject) => {
      source.then((source) => {
         resolve(new layerClass(assign({}, layerOptions, { source: source })))
      }).catch(reject)
    })
  } else {
    return new layerClass(assign({}, layerOptions, { source: source }))
  }
  
}

const parseLayer = (layerOptions: Layer): Object => {
  const createLayer = layerCreator(layerOptions)
  switch (layerOptions.type) {
    case 'Vector':
      return createLayer(Vector)
    case 'Tile':
      return createLayer(Tile)
    case 'Image':
      return createLayer(Image)
    case 'VectorTile':
      return createLayer(VectorTile)
    default:
      console.warn('No layer parser found for', layerOptions.type)
      return {}
  }
}

export default parseLayer
