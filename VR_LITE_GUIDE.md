# VR Lite - Pokémon Habitats Guide

## Overview
The VR Lite feature provides a 360-degree immersive view of Pokémon habitats using your device's gyroscope for natural head tracking.

## Features
- **Habitat Selection**: Choose from Forest, Ocean, and Mountain environments
- **Gyroscopic Controls**: Move your device to look around the habitat
- **Pokémon Overlays**: See which Pokémon inhabit each environment
- **Seamless Toggle**: Switch between normal and VR modes instantly

## How to Use
1. Navigate to the 🌐 VR tab in the bottom navigation
2. Select a habitat (Forest, Ocean, or Mountain)
3. Tap "🥽 Enter VR Mode" to activate touch controls
4. Touch and move on screen to explore the 360-degree environment
5. Tap "🥽 Exit VR" to return to normal mode

## Technical Implementation
- **Touch Controls**: Simple touch-based navigation for 360° exploration
- **360° Panoramic Images**: High-resolution habitat images (1200x600) for immersive backgrounds
- **Real-time Transforms**: Touch coordinates mapped to CSS transforms (rotateX, rotateY)
- **Motion Constraints**: Pitch limited to prevent disorientation (-45°/+45°)
- **Pokémon Overlays**: Dynamic positioning based on habitat and rotation state

## Touch Mapping
- **Vertical Touch**: Up/down movement → rotateX transform (pitch)
- **Horizontal Touch**: Left/right movement → rotateY transform (yaw)

## Requirements
- React Native 0.60+
- iOS 9.0+ / Android API 21+
- No additional dependencies