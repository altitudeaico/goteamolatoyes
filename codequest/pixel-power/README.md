# Song Gallery

A small website that plays songs. Each track can have an audio version, a video version, or both.

## What's in here

```
index.html     the website
songs.json     the list of tracks
songs/         the actual music and video files
README.md      this file
```

## Adding a song

1. Download the song from Suno. Choose **MP3** or **WAV** for audio, **MP4** for video.
2. Put the file in the `songs` folder.
3. Add it to `songs.json` inside the square brackets:

```json
{
  "title": "Golden Hour",
  "audio": "songs/golden-hour.mp3",
  "video": "songs/golden-hour.mp4"
}
```

Put a comma after the previous track's closing brace. If a track has no video, leave the
`"video"` line out. Same for `"audio"`.

The `"note"` line is optional and shows a small line of text under the title.

**Filename rule:** no spaces. Use dashes instead. `golden-hour.mp3`, not `Golden Hour.mp3`.

## Deleting the test track

Once your own songs are in, remove the Test Beep block from `songs.json` and delete
`songs/test-beep.mp3` and `songs/test-beep.mp4`.

## Publishing it

The site has to live on a web address to work properly. Opening the files straight off a
phone or computer will show the page but block the song list from loading.

To publish with GitHub Pages:

1. Make a new repository on GitHub.
2. Upload everything in this folder, keeping the `songs` folder as a folder.
3. Go to **Settings**, then **Pages**.
4. Under Source pick **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
5. Wait a minute or two. The address will be `https://YOURNAME.github.io/REPO-NAME/`.

## Notes

- GitHub repositories are best kept under about 1 GB, so WAV files will fill it up fast.
  MP3 for listening and MP4 for watching is the sensible combination.
- Videos only load when someone presses Watch, so the page stays quick even with lots of tracks.
