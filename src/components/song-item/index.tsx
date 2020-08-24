import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { Colors } from '../../constants';
import { useCurrSong, useDispatch } from '../../hooks';
import { Options } from '../../icons';
import { h3 } from '../../styles';
import { PlaylistID, Song } from '../../types';
import { formatDuration } from '../../util';
import ContextMenu from '../context';
import AddToPlaylist from './add';

interface Props {
  song: Song;
  onSelect?: (song: Song) => void;
}

const SongItem = ({ song, onSelect }: Props) => {
  const currSong = useCurrSong();
  const isPlaying = currSong?.id === song.id;

  const [showModal, setModal] = React.useState<boolean>(false);

  const dispatch = useDispatch();

  const items = [
    {
      label: 'Add to Playlist',
      onPress: () => setModal(true)
    },
    {
      label: 'Add to Queue',
      onPress: () => dispatch({ type: 'QUEUE_SONG', song })
    },
    {
      label: 'Remove Song',
      onPress: () => dispatch({ type: 'REMOVE_SONG', id: song.id })
    }
  ];

  const onItemPress = React.useCallback(() => onSelect && onSelect(song), [
    onSelect,
    song
  ]);

  const onAdd = React.useCallback(
    (pids: PlaylistID[]) => {
      dispatch({ type: 'SET_PLAYLISTS', sid: song.id, pids });
      setModal(false);
    },
    [song, dispatch]
  );

  const onCancel = React.useCallback(() => setModal(false), [setModal]);

  return (
    <View style={styles.root}>
      <AddToPlaylist
        current={song.playlists}
        visible={showModal}
        onAdd={onAdd}
        onCancel={onCancel}
      />
      <RectButton rippleColor="#111" onPress={onItemPress} style={styles.rect}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songArtist}>
          {song.artist || 'Unknown Artist'} • {formatDuration(song.duration)}
        </Text>
        {isPlaying && <Text style={styles.songArtist}>Playing</Text>}
      </RectButton>

      <ContextMenu items={items} style={styles.options}>
        <Options width={25} height={25} />
      </ContextMenu>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rect: {
    flexDirection: 'column',
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    flex: 1
  },
  songTitle: h3,
  songArtist: {
    fontSize: 12,
    color: Colors.subtext
  },
  options: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40
  }
});

export default React.memo(SongItem);