# Sound Assets for HydraJTS

## Ominous Hover Sound - Web Audio API Generated

The creepy old-way button now uses **Web Audio API** to generate ominous sounds procedurally, eliminating the need for external audio files.

### Technical Implementation:
- **Web Audio API**: Browser-native audio synthesis
- **No external files needed**: All sounds generated in JavaScript
- **Cross-browser compatible**: Fallback for unsupported browsers
- **Automatic resume**: Handles suspended audio contexts

### Sound Characteristics:
- **Duration**: 1.5 seconds
- **Type**: Industrial sawtooth wave with metallic resonance
- **Frequency**: 80Hz → 60Hz → 40Hz (descending rumble)
- **Filter**: Bandpass at 200Hz with high Q factor
- **Volume**: Quick attack, long decay envelope

### Why Web Audio API?
1. **No file dependencies** - Works immediately
2. **Consistent quality** - Same sound on all devices
3. **Small footprint** - No additional downloads
4. **Browser native** - Best performance
5. **Customizable** - Easy to tweak parameters

### Browser Support:
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile: Full support

The ominous sound is now completely self-contained and will work immediately when users hover over the creepy button!
