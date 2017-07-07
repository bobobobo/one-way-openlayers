// @flow
import ol from 'openlayers'

import changesets from 'diff-json'
// import jsonpatch from 'fast-json-patch'
import parseLayer from './parseLayer'

import type {Layer, Change, Diff, Map, CRS} from './types'

const GeoJSON = ol.format.GeoJSON

const getDefaultDataProjection = () => 'EPSG:4326'

const getProjectionFromCRS = (crs: CRS) => {
  if (crs.type && crs.properties && crs.properties.code) {
    return `${crs.type}:${crs.properties.code}`
  } else {
    console.warn(crs, 'Is an invalid CRS definition. Example of valid definition: ', {
      'type': 'EPSG',
      'properties': {
         'code': 4326
      }
    })
    return getDefaultDataProjection()
  }
}

const getFeaturesFromGeoJson = (geoJson: ?Object, featureProjection: string | Object): Object[] => {
  if (!geoJson) return []
  const format = new GeoJSON()

  return format.readFeatures(geoJson, {
    featureProjection: featureProjection,
    dataProjection: geoJson.crs ? getProjectionFromCRS(geoJson.crs) : getDefaultDataProjection()
  })

}

const getLayerFromChange = (layers: Layer[]): Function => (change: Change): Layer => {
  return layers[getChangeIndex(change)]
}

const getChangeIndex = (change: Change): number => {
  return parseInt(change.key)
}

const typeFilter = (type: string): Function => (obj: *): boolean => {
  return type === obj.type
}

const isVectorDataLayer = (layer: Layer): boolean => {
  if (layer && layer.type === 'Vector' && layer.source && layer.source.type === 'Vector' && layer.source.data) {
    return true
  } else {
    return false
  }
}

const attachVectorData = (olLayer: Object, geoJSON: ?Object, projection: Object): void => {
  const features = getFeaturesFromGeoJson(geoJSON, projection)
  olLayer.getSource().addFeatures(features)
}

export const addLayer = (map: Map) => (layer: Layer): Object => {
  const olLayer = parseLayer(layer)

  if(Promise.resolve(olLayer) == olLayer) {
    olLayer.then((asyncLayer) => { 
      console.log(asyncLayer)
      addParsedLayer(map, layer, asyncLayer)
      console.log(asyncLayer.getSource())
    })
    return {}
  }

  return addParsedLayer(map, layer, olLayer)
}

const addParsedLayer = (map: Map, layer: Layer, olLayer: Object) => {
  if (isVectorDataLayer(layer)) {
    attachVectorData(olLayer, layer.source.data, map.getView().getProjection())
  }

  map.addLayer(olLayer)

  return olLayer
}

const removeLayers = (map: Map, layers: Layer[], diff: Diff): void => {
  const olLayers = map.getLayers()
  const removedIndexes = diff.changes
    .filter(typeFilter('remove'))
    .map(change => parseInt(change.key))

  removedIndexes
    .map(index => olLayers.item(index))
    .forEach(olLayer => olLayers.remove(olLayer))
}

const addLayers = (map: Map, layers: Layer[], diff: Diff): void => {
  diff.changes
    .filter(typeFilter('add'))
    .map(getLayerFromChange(layers))
    .forEach(addLayer(map))
}

const updateVectorDataLayer = (map: Map, layer: Layer, index: number) => {
  const olLayers = map.getLayers()
  const olLayer = parseLayer(layer)
  const features = getFeaturesFromGeoJson(layer.source.data, map.getView().getProjection())
  olLayer.getSource().addFeatures(features)

  olLayers.removeAt(index)
  olLayers.insertAt(index, olLayer)
}

const updateLayer = (map: Map, layer: Layer, index: number) => {
  const olLayers = map.getLayers()
  const olLayer = parseLayer(layer)

  if (isVectorDataLayer(layer)) {
    attachVectorData(olLayer, layer.source.data, map.getView().getProjection())
  }
  olLayers.removeAt(index)
  olLayers.insertAt(index, olLayer)
}

const updateLayers = (map: Map, layers: Layer[], diff: Diff): void => {
  diff.changes
    .filter(typeFilter('update'))
    .forEach((change: Change) => {
      const layer = getLayerFromChange(layers)(change)
      updateLayer(map, layer, getChangeIndex(change))
    })
}

const renderLayers = (map: Map, prevLayers: Layer[], nextLayers: Layer[]): void => {
  const applyDiffUpdate = (diff: Diff): void => {
    updateLayers(map, nextLayers, diff)
    removeLayers(map, nextLayers, diff)
    addLayers(map, nextLayers, diff)
  }
  // const patches = jsonpatch.compare (prevLayers, nextLayers)
  const diffs: Diff[] = changesets.diff(prevLayers, nextLayers)

  diffs
    .filter(typeFilter('update'))
    .forEach(applyDiffUpdate)
}

export default renderLayers
