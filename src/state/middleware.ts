import { Middleware, Song } from '../types';
import { getSongList } from '../util';
import { downloadVideo, getRelatedVideos } from '../yt-util';
import { clear, save } from './storage';

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
    const nextSong = songs[Math.floor(Math.random() * songs.length)];

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

export const checkQueue: Middleware = store => next_ => action => {
  const result = next_(action);

  if (process.env.NODE_ENV === 'production') {
    return result;
  }

  const {
    songs,
    queue: { cache, curr, next, prev }
  } = store.getState();

  // Sanity checks in queue
  const ids = [...prev, curr, ...next].filter((id): id is string => id != null);
  const map = ids.reduce((acc, id) => {
    if (acc[id] == null) {
      acc[id] = 1;
    } else {
      acc[id]++;
    }
    return acc;
  }, {} as { [id: string]: number });

  Object.keys(map).forEach(id => {
    if (cache[id] != null) {
      if (cache[id].count !== map[id]) {
        console.warn(
          `Mismatch count in cache for ${id}: got ${cache[id].count}, expected ${map[id]}`
        );
        cache[id].count = map[id];
      }
    } else {
      if (songs[id] == null) {
        console.warn(`Unknown song in queue: ${id}`);
      }
    }
  });

  return result;
};
