import { getSongList } from '../util';
import { save, clear } from './storage';
import { downloadVideo, getRelatedVideos } from '../yt-util';

import { Middleware, Song } from '../types';

export const logger: Middleware = () => next => action => {
  console.log(action);
  return next(action);
};

export const queueSong: Middleware = store => next => action => {
  const result = next(action);
  const newState = store.getState();

  if (
    action.type !== 'SKIP_NEXT' &&
    action.type !== 'SELECT_SONG' &&
    action.type !== 'SET_SHUFFLE'
  ) {
    // Ignore middleware
    return result;
  }

  const { queue } = newState;
  const { curr } = queue;
  if (curr == null) {
    // Nothing playing
    return result;
  }

  const currSong = newState.songs[curr] ?? queue.cache[curr]?.song;
  if (currSong == null) {
    // Error state
    console.log('invalid queue.curr');
    return result;
  }

  if (queue.next.length > 0) {
    // Songs already in queue
    return result;
  }

  // Enable autoplay for youtube only if shuffle is on
  if (currSong.source === 'YOUTUBE') {
    if (newState.shuffle) {
      getRelatedVideos(currSong.id).then(related => {
        store.dispatch({ type: 'QUEUE_SONG', song: related[0] });
      });
    }
    return result;
  }

  // Shuffle from library
  if (newState.shuffle) {
    const songs = getSongList(newState.songs, newState.currScreen).filter(
      song => song.id !== currSong.id
    );
    const nextSong = songs[0 | (Math.random() * songs.length)];

    store.dispatch({ type: 'QUEUE_SONG', song: nextSong });
    return result;
  }

  // Add next song in library
  const songs = getSongList(newState.songs, newState.currScreen, newState.sort);
  const index = songs.findIndex(song => song.id === currSong.id);
  if (index >= 0 && index < songs.length - 1) {
    store.dispatch({ type: 'QUEUE_SONG', song: songs[index + 1] });
  }

  return result;
};

export const saveToStorage: Middleware = store => next => action => {
  const result = next(action);
  const newState = store.getState();

  switch (action.type) {
    case 'LOAD_STORAGE':
    case 'SELECT_SONG':
    case 'SELECT_PLAYLIST':
    case 'ADD_SONGS':
    case 'REMOVE_SONG':
    case 'CREATE_PLAYLIST':
    case 'DELETE_PLAYLIST':
    case 'SET_PLAYLISTS':
    case 'CHANGE_VOLUME':
    case 'SKIP_PREVIOUS':
    case 'SKIP_NEXT':
    case 'UPDATE_TAGS':
    case 'SET_SORT':
    case 'SET_SHUFFLE':
    case 'QUEUE_SONG':
    case 'ADD_TO_HISTORY':
    case 'REMOVE_FROM_HISTORY':
      save(newState);
      break;

    case 'DOWNLOAD_ADD':
    case 'DOWNLOAD_FINISH': {
      // There's already a song being downloaded
      if (action.type === 'DOWNLOAD_ADD' && newState.dlQueue.length > 1) {
        break;
      }

      // There are no more songs to download
      if (action.type === 'DOWNLOAD_FINISH' && newState.dlQueue.length === 0) {
        break;
      }

      const id = newState.dlQueue[0];
      downloadVideo(id)
        .on('progress', (progress: number) =>
          store.dispatch({ type: 'DOWNLOAD_PROGRESS', progress })
        )
        .on('end', (song: Song | null) => {
          if (song != null) {
            store.dispatch({ type: 'DOWNLOAD_FINISH', song });
          }
        });
      break;
    }

    case 'CLEAR_DATA':
      clear();
      break;

    // Any types that don't trigger a save
    case 'MUTE':
    case 'DOWNLOAD_PROGRESS':
      break;

    // Ensure that all action types are handled
    default:
      unreachable(action);
  }

  return result;
};

function unreachable(_: never) {}
