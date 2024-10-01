// base libs
import React from 'react';
import { Dimensions, LayoutAnimation } from 'react-native';
// components / views
import { ClusterMarker } from './ClusterMarker';
// libs / utils
import {
  createIndex,
  computeClusters,
  getCoordinatesFromItem,
} from './helpers';
import { IClusteredMapViewProps, IMapRegion, TGeoJSONFeature } from './types';

////////////////////////////////////////////////////////////
// This is to support Huawei Mobile Services Map
import MapView from 'react-native-maps';
// let MapView: any = null;
// try {
//   MapView = require('react-native-maps').default;
// } catch (_) {}
////////////////////////////////////////////////////////////
export function ClusteredMapView({
  width = Dimensions.get('window').width,
  height = Dimensions.get('window').height,
  extent = 512,
  minZoom = 1,
  maxZoom = 16,
  maxLeaves = 100,
  accessor = 'location',
  animateClusters = true,
  clusteringEnabled = true,
  preserveClusterPressBehavior = true,
  layoutAnimationConf = LayoutAnimation.Presets.spring,
  edgePadding = { top: 10, left: 10, right: 10, bottom: 10 },
  ...props
}: IClusteredMapViewProps): React.ReactElement<IClusteredMapViewProps> {
  const mapViewRef = React.useRef<any>();
  const dataIndexRef = React.useRef<any>();
  const [region, setRegion] = React.useState<IMapRegion>();
  const [clusters, setClusters] = React.useState<TGeoJSONFeature[]>([]);

  function safeOnClusterPressProp(clusterId: string, markers?: any[]) {
    if (typeof props.onClusterPress === 'function') {
      props.onClusterPress(clusterId, markers);
    }
  }

  function onRegionChangeComplete(region: IMapRegion) {
    setRegion(region);
  }

  function internalOnClusterPress(feature: TGeoJSONFeature) {
    if (!preserveClusterPressBehavior) {
      safeOnClusterPressProp(feature.properties.cluster_id);
      return;
    }

    const leaves: TGeoJSONFeature[] = dataIndexRef.current.getLeaves(
      feature.properties.cluster_id,
      maxLeaves,
    );
    const markers = leaves.map(feature => feature.properties.item);
    const coordinates = markers.map(item =>
      getCoordinatesFromItem(item, accessor, false),
    );

    mapViewRef?.current?.fitToCoordinates(coordinates, {
      edgePadding: edgePadding,
    });

    safeOnClusterPressProp(feature.properties.cluster_id, markers);
  }

  function updateClusters(keepIndex: boolean = true) {
    if (!region || !props.radius) {
      return;
    }

    if (!dataIndexRef.current || !keepIndex) {
      dataIndexRef.current = createIndex(props.data, {
        extent,
        radius: props.radius,
        minZoom,
        maxZoom,
        width,
        accessor,
      });
    }

    const newClusters = computeClusters(
      dataIndexRef.current,
      region,
      width,
      height,
      minZoom,
    );
    setClusters(newClusters);
  }

  React.useEffect(() => {
    updateClusters(); // re-use index if data didn't change
  }, [region]);

  React.useEffect(() => {
    updateClusters(false); // re-create index if data changed
  }, [props.data]);

  return (
    <MapView
      {...props}
      ref={mapViewRef}
      onRegionChangeComplete={onRegionChangeComplete}>
      {!clusteringEnabled
        ? props.data.map(item => props.renderMarker(item))
        : clusters.map(item => {
            if (item.properties.point_count === 0) {
              return props.renderMarker(item);
            }

            return (
              <ClusterMarker
                feature={item}
                onPress={internalOnClusterPress}
                renderCluster={props.renderCluster}
              />
            );
          })}
      {props.children}
    </MapView>
  );
}
