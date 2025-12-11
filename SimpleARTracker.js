import React, { Component } from 'react';
import {
  ViroARScene,
  ViroARImageMarker,
  ViroImage,
  ViroARTrackingTargets,
} from '@viro-community/react-viro';

ViroARTrackingTargets.createTargets({
  pokemonMarker: {
    source: { uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
    orientation: "Up",
    physicalWidth: 0.15
  }
});

export default class SimpleARTracker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      placed: false,
      arObjectPosition: [0, 0.1, 0],
    };
  }

  onAnchorFound = (anchor) => {
    if (!this.state.placed) {
      const transform = anchor.transform;
      const position = [transform[12], transform[13] + 0.1, transform[14]];
      
      this.setState({
        placed: true,
        arObjectPosition: position,
      });
      
      console.log('Pokemon placed at:', position);
    }
  };

  render() {
    const { pokemonImageUri } = this.props;

    return (
      <ViroARScene>
        <ViroARImageMarker
          target="pokemonMarker"
          onAnchorFound={this.onAnchorFound}
        />

        {this.state.placed && (
          <ViroImage
            source={{ uri: pokemonImageUri }}
            position={this.state.arObjectPosition}
            width={0.2}
            height={0.2}
          />
        )}
      </ViroARScene>
    );
  }
}