// Got & adapted from from https://github.com/koopjs/FeatureServer/blob/master/src/utils.js

const moment = require('moment')
const DATE_FORMATS = [moment.ISO_8601]

function convertToEsriFields (obj) {
  return Object.entries(obj).map(([key,value]) => getField(key,value));
}

function getField (k,v) {
  return {
    name: k,
    type: esriTypeMap(detectType(v)),
    alias: k,
    nullable: true
  }
}

function detectType (value) {
  var type = typeof value

  if (type === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Double'
  } else if (type && moment(value, DATE_FORMATS, true).isValid()) {
    return 'Date'
  } else {
    return 'String'
  }
}

function esriTypeMap (type) {
  switch (type.toLowerCase()) {
    case 'double':
      return 'esriFieldTypeDouble'
    case 'integer':
      return 'esriFieldTypeInteger'
    case 'date':
      return 'esriFieldTypeDate'
    case 'blob':
      return 'esriFieldTypeBlob'
    case 'geometry':
      return 'esriFieldTypeGeometry'
    case 'globalid':
      return 'esriFieldTypeGlobalID'
    case 'guid':
      return 'esriFieldTypeGUID'
    case 'raster':
      return 'esriFieldTypeRaster'
    case 'single':
      return 'esriFieldTypeSingle'
    case 'smallinteger':
      return 'esriFieldTypeSmallInteger'
    case 'xml':
      return 'esriFieldTypeXML'
    case 'string':
    default:
      return 'esriFieldTypeString'
  }
}

module.exports = {
  convertToEsriFields: convertToEsriFields
}
