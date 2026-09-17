# Media caption inventory — September 17, 2026

This inventory distinguishes media bytes that are actually stored from Drive-linked catalog entries. It does not claim inaccessible linked files were inspected.

## Stored video

| Asset | Duration | Audio | Publication state | Caption handling |
| --- | ---: | --- | --- | --- |
| Classroom orientation.mp4 | 14.16s | No | Published company Classroom recording | Burned-in instructions plus exact transcript satisfy the video-only text alternative; no dialogue track is invented. |
| EXT Ensemble Door CU Grills Glass 01.mov | 6.97s | Yes | Private company asset only | Not published. If source audio is unmuted in a creative, save now requires the scene caption/audible-speech transcript that becomes the render caption track. |
| EXT Ensemble Door Cottage Grove MW Pan R.mov | 11.01s | Yes | Private company asset only | Not published. The same unmuted-audio caption requirement applies. |

All two currently stored generated MP4 outputs have durable SRT caption files and load those captions through authenticated WebVTT endpoints. New generated-video publications copy the caption file into the explicit public derivative and hosted snapshot.

## Linked but not imported

The catalog contains 30 additional video records whose original bytes are not present. Their `discovered` state and Drive provenance are retained. Audio, speech and existing caption tracks cannot be audited until authorized Drive access imports the originals and records checksums/probe metadata.

## Enforcement added

- Community video with detected audio is rejected before transcoding unless validated, duration-bounded WebVTT is supplied.
- Classroom managers can provide WebVTT for audio recordings or inherit captions from a generated publication.
- Unmuted source audio in Video & UGC requires a non-empty scene caption/audible-speech transcript. The deterministic render emits that text in the timed caption artifact.
- Silent video remains eligible when an equivalent written alternative exists.

## Remaining release check

After the 30 originals are imported, probe each file for audio and embedded captions. Audio-bearing media must receive an accurate caption/transcript review before publication; asset availability alone is not publication approval.

