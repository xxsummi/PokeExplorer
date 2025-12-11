import React, { Component } from 'react';
import {
  ViroARScene,
  ViroARImageMarker,
  ViroImage,
  ViroARTrackingTargets,
} from '@viro-community/react-viro';

// Register tracking targets dynamically
const createPokemonTarget = (pokemonId = 25) => {
  ViroARTrackingTargets.createTargets({
    pokemonMarker: {
      source: { uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png` },
      orientation: "Up",
      physicalWidth: 0.15
    }
  });
};

export default class ARImageTracker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      placed: false,
      arObjectPosition: [0, 0, 0],
      arObjectRotation: [0, 0, 0],
    };
    
    // Create target with Pikachu sprite as marker
    createPokemonTarget(25);
  }

  // Called when image marker is first detected
  onAnchorFound = (anchor) => {
    if (!this.state.placed) {
      // Extract world position from transform matrix
      const transform = anchor.transform;
      const position = [
        transform[12], // X translation
        transform[13], // Y translation  
        transform[14], // Z translation
      ];

      // Extract rotation from anchor
      const rotation = anchor.rotation || [0, 0, 0];

      // Place AR object at anchor position + offset
      this.setState({
        placed: true,
        arObjectPosition: [position[0], position[1] + 0.1, position[2]], // Slightly above marker
        arObjectRotation: rotation,
      });

      console.log('Pokemon placed at world position:', position);
      
      // Notify parent component
      if (this.props.onPokemonPlaced) {
        this.props.onPokemonPlaced();
      }
    }
  };

  render() {
    const { pokemonImageUri } = this.props;

    return (
      <ViroARScene>
        {/* Image marker detector */}
        <ViroARImageMarker
          target="pokemonMarker"
          onAnchorFound={this.onAnchorFound}
        >
          {/* Empty - marker is just for detection */}
        </ViroARImageMarker>

        {/* World-anchored AR Pokemon (only rendered after placement) */}
        {this.state.placed && (
          <ViroImage
            source={{ uri: pokemonImageUri }}
            position={this.state.arObjectPosition}
            rotation={this.state.arObjectRotation}
            width={0.2}
            height={0.2}
            // Object stays fixed in world coordinates, not attached to camera
          />
        )}
      </ViroARScene>
    );
  }
}