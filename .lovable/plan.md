Apply the provided burn parameter set as the new default values for the burn-through shader.

## What I will do

1. Update `src/components/BurnDebugPanel.tsx`:
   - Replace the current `DEFAULT_BURN_PARAMS` object with the exact values you provided:
     ```json
     {
       "warpAmp": 0.55,
       "warpFreq": 1.3,
       "streakAmp": 0.28,
       "streakFreq": 6,
       "angularAmp": 0.55,
       "angularFreq": 0.55,
       "chromaAberration": 0.34,
       "shardDisplace": 0.55,
       "grainAmount": 1,
       "glitchFlicker": 0,
       "coreRimAlpha": 0.95,
       "hotHaloAlpha": 0.55,
       "cloudDiffuseAlpha": 0.29,
       "mistAlpha": 0.2,
       "haloFalloff": 0.52
     }
     ```
   - Keep all slider ranges, groups, and panel behavior unchanged.

2. Verify the change propagates automatically:
   - `IntroVideo.tsx` already initializes its shader uniforms from `DEFAULT_BURN_PARAMS` and resets the panel with it, so no second source of truth needs to be edited.

3. Validate:
   - Run a build check / typecheck to ensure no errors after editing the object literal.

## What is not changing

- Shader logic, scroll/wheel behavior, video playback, UI components, layout, navigation, or any other source files besides `BurnDebugPanel.tsx`.

## Outcome

The debug panel will open with these values, and the burn-through effect will use them from the first render. Resetting the panel will also revert to these values.