import GeoViewport from '@mapbox/geo-viewport';
import Supercluster from 'supercluster';
import {
  ICoordinate,
  IMapRegion,
  TBoundingBox,
  TGeoJSONCoordinate,
  TGeoJSONFeature,
  TLocationAccessor,
} from './types';

/**
 * Compute clusters and return clustered data.
 */
export const computeClusters = (
  index: Supercluster,
  region: IMapRegion,
  width: number,
  height: number,
  minZoom: number,
): any => {
  const bbox = regionToBoundingBox(region);

  const size = toGeoViewportFormat(width, height);
  const viewport =
    region.longitudeDelta >= 40
      ? { zoom: minZoom }
      : GeoViewport.viewport(bbox, size);

  return index.getClusters(bbox, viewport.zoom);
};

/**
 * Load given dataset into a newly created
 * Supercluster instance
 */
interface ICreateIndexAdditionalsParams {
  extent: number;
  radius: number;
  minZoom: number;
  maxZoom: number;
  width: number;
  accessor: TLocationAccessor;
}
export const createIndex = (
  dataset: any[],
  {
    extent,
    radius,
    minZoom,
    maxZoom,
    width,
    accessor,
  }: ICreateIndexAdditionalsParams,
): Supercluster => {
  const index = new Supercluster({
    // eslint-disable-line new-cap
    extent,
    minZoom,
    maxZoom,
    radius: radius || width * 0.045, // 4.5% of screen width
  });

  // get formatted GeoPoints for cluster
  const rawData: any = dataset.map(item =>
    itemToGeoJSONFeature(item, accessor),
  );

  // load geopoints into Supercluster
  index.load(rawData);

  return index;
};

/**
 * Format width and height for `GeoViewport`
 */
export const toGeoViewportFormat = (
  width: number,
  height: number,
): [number, number] => {
  return [width, height];
};

/**
 * Compute bounding box for the given region
 * @param {Object} region - Google Maps/MapKit region
 * @returns {Object} - Region's bounding box as WSEN array
 */
export const regionToBoundingBox = (
  region: IMapRegion,
): [number, number, number, number] => {
  let lngD = region.longitudeDelta;
  if (lngD < 0) {
    lngD += 360;
  }

  return [
    region.longitude - lngD, // westLng - min lng
    region.latitude - region.latitudeDelta, // southLat - min lat
    region.longitude + lngD, // eastLng - max lng
    region.latitude + region.latitudeDelta, // northLat - max lat
  ];
};

/**
 * Calculate region from the given bounding box.
 * Bounding box must be represented as WSEN:
 * {
 *   ws: { longitude: minLon, latitude: minLat }
 *   en: { longitude: maxLon, latitude: maxLat }
 * }
 */
export const boundingBoxToRegion = (bbox: TBoundingBox) => {
  const minLon = (bbox.ws.longitude * Math.PI) / 180;
  const maxLon = (bbox.en.longitude * Math.PI) / 180;

  const minLat = (bbox.ws.latitude * Math.PI) / 180;
  const maxLat = (bbox.en.latitude * Math.PI) / 180;

  const dLon = maxLon - minLon;
  const dLat = maxLat - minLat;

  const x = Math.cos(maxLat) * Math.cos(dLon);
  const y = Math.cos(maxLat) * Math.sin(dLon);

  const latRad = Math.atan2(
    Math.sin(minLat) + Math.sin(maxLat),
    Math.sqrt((Math.cos(minLat) + x) * (Math.cos(minLat) + x) + y * y),
  );
  const lonRad = minLon + Math.atan2(y, Math.cos(minLat) + x);

  const latitude = (latRad * 180) / Math.PI;
  const longitude = (lonRad * 180) / Math.PI;

  return {
    latitude,
    longitude,
    latitudeDelta: (dLat * 180) / Math.PI,
    longitudeDelta: (dLon * 180) / Math.PI,
  };
};

export const getCoordinatesFromItem = (
  item: any,
  accessor: TLocationAccessor,
  asArray = true,
): ICoordinate | TGeoJSONCoordinate => {
  let coordinates: ICoordinate | TGeoJSONCoordinate;

  if (typeof accessor === 'string') {
    coordinates = [item[accessor].longitude, item[accessor].latitude];
  } else if (typeof accessor === 'function') {
    coordinates = accessor(item);
  } else {
    throw new Error(
      'Invalid location accessor, see documentation about "accessor" prop.',
    );
  }

  if (asArray) {
    return coordinates;
  }

  return {
    latitude: coordinates[1],
    longitude: coordinates[0],
  };
};

/**
 * Compute a RFC-compliant GeoJSON Feature object
 * from the given JS object
 * RFC7946: https://tools.ietf.org/html/rfc7946#section-3.2
 * @param {Object} item - JS object containing marker data
 * @param {Function|String} accessor - accessor for item coordinate values. Could be a string (field name) or a function (that describe how to access to coordinate data).
 * @returns {Object} - GeoJSON Feature object
 */
export const itemToGeoJSONFeature = (
  item: any,
  accessor: TLocationAccessor,
): TGeoJSONFeature => {
  const coordinates = getCoordinatesFromItem(
    item,
    accessor,
  ) as TGeoJSONCoordinate;

  return {
    type: 'Feature',
    geometry: {
      coordinates,
      type: 'Point',
    },
    properties: { point_count: 0, item, cluster_id: '' }, // eslint-disable-line camelcase
  };
};
