import React from 'react';
import { StyleProp, LayoutAnimationConfig, ViewStyle } from 'react-native';

// general
type TClusterId = string;
type TGenericCallback = () => void;
export type TBoundingBox = {
  ws: ICoordinate;
  en: ICoordinate;
};

// supercluster / mapbox / mapview
interface IPOI {
  location: ICoordinate;
}
export type TGeoJSONCoordinate = readonly [number, number];

export interface ICoordinate {
  latitude: number;
  longitude: number;
}
export type TGeoJSONPoint = {
  type: 'Point';
  coordinates: TGeoJSONCoordinate;
};
export type TGeoJSONFeatureProperties = {
  cluster_id: TClusterId;
  point_count: number;
  item?: IPOI;
};
export type TGeoJSONFeature = {
  type: 'Feature';
  geometry: TGeoJSONPoint;
  properties: TGeoJSONFeatureProperties;
};

// React Components
type TRenderCluster = (
  clusterInfo: TClusterInfo,
  onPress: TGenericCallback,
) => React.ReactElement<IClusterMarkerProps>;

export interface MapEdgePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface IMapRegion extends ICoordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

export type TClusterInfo = {
  pointCount: number;
  coordinate: ICoordinate;
  clusterId: TClusterId;
};

export interface IClusterMarkerProps {
  feature: TGeoJSONFeature;
  onPress: (feature: TGeoJSONFeature) => void;
  renderCluster?: TRenderCluster;
}

export interface IClusteredMapViewProps extends IMapViewProps {
  style: StyleProp<ViewStyle>;
  children: React.ReactElement | React.ReactElement[];
  radius?: number;
  width: number;
  height: number;
  extent: number;
  minZoom: number;
  maxZoom: number;
  maxLeaves: number;
  data: any[];
  onClusterPress: (clusterId: TClusterId, markers?: any[]) => void;
  renderMarker: (item: TGeoJSONFeature) => React.ReactElement;
  renderCluster: TRenderCluster;
  animateClusters: boolean;
  clusteringEnabled: boolean;
  preserveClusterPressBehavior: boolean;
  layoutAnimationConf: LayoutAnimationConfig;
  edgePadding: MapEdgePadding;
  accessor: TLocationAccessor;
}

export interface IMapViewProps {
  initialRegion: IMapRegion;
}

export type TLocationAccessor =
  | string
  | ((item: any) => TGeoJSONCoordinate)
  | ((item: any) => ICoordinate);
