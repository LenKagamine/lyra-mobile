/*
  YouTube related utility methods

  Some of the packages that are used for YouTube integration
  require some setup before running (e.g. ffmpeg, googleapis).
  Moving all of them to this file helps centralize the setup
  code, and avoid duplication across the codebase.
*/

import { SongID, VideoSong } from './types';

// if (!process.env.LYRA_URL) throw 'LYRA_URL missing!';
// const LYRA_URL = process.env.LYRA_URL;

// const USE_API = process.env.LYRA_USE_API ? '1' : '';

const LYRA_URL = 'http://localhost:5000';
const USE_API = '';

export async function getStreamURL(id: SongID): Promise<string> {
  const res = await fetch(`${LYRA_URL}/yt/url?id=${id}&api=${USE_API}`);
  const url = res.text();
  return url;
}

// Mock EventEmitter for browser
class DownloadEventEmitter {
  on(key: string, callback: (arg?: any) => void) {
    callback();
    return this;
  }
}

export function downloadVideo(_: string) {
  const emitter = new DownloadEventEmitter();
  return emitter;
}

export async function ytSearch(keyword: string): Promise<VideoSong[]> {
  const res = await fetch(
    `${LYRA_URL}/yt/search?query=${keyword}&api=${USE_API}`
  );
  const json = res.json();
  return json;
}

export async function getRelatedVideos(id: SongID): Promise<VideoSong[]> {
  const res = await fetch(`${LYRA_URL}/yt/related?id=${id}&api=${USE_API}`);
  const videos = res.json();
  return videos;
}

export async function ytSuggest(keyword: string) {
  if (!keyword) return [];

  const res = await fetch(
    `${LYRA_URL}/yt/suggest?query=${keyword}&api=${USE_API}`
  );
  const json = res.json();
  return json;
}
