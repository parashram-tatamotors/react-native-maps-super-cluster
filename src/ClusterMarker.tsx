// base libs
import React from 'react';
import PropTypes from 'prop-types';
import { TClusterInfo, IClusterMarkerProps } from './types';

function ClusterMarkerComponent(
  props: IClusterMarkerProps,
): React.ReactElement<IClusterMarkerProps> {
  if (typeof props.renderCluster !== 'function') {
    throw 'Implement renderCluster method prop to render correctly cluster marker!';
  }

  const pointCount = props.feature.properties.point_count;
  const longitude = props.feature.geometry.coordinates[0];
  const latitude = props.feature.geometry.coordinates[1];

  const clusterInfo: TClusterInfo = {
    pointCount,
    coordinate: { latitude, longitude },
    clusterId: props.feature.properties.cluster_id,
  };

  const onPress = () => {
    props.onPress(props.feature);
  };

  return props.renderCluster(clusterInfo, onPress);
}

ClusterMarkerComponent.propTypes = {
  renderCluster: PropTypes.func,
  onPress: PropTypes.func.isRequired,
};

export const ClusterMarker = React.memo(ClusterMarkerComponent);
