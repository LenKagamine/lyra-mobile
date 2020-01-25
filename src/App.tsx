import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator, BottomTabBar } from 'react-navigation-tabs';

import Library from './components/library';
import Search from './components/search';
import Queue from './components/queue';
import Playback from './components/playback';
import { Play, Search as SearchIcon, Queue as QueueIcon } from './icons';

import store from './state/store';
import { Colors } from './constants';

const TabBarComponent = (props: React.ComponentProps<typeof BottomTabBar>) => {
  return (
    <>
      <Playback />
      <BottomTabBar {...props} />
    </>
  );
};

const Icons = {
  Library: Play,
  Search: SearchIcon,
  Queue: QueueIcon
};

const Navigator = createBottomTabNavigator(
  {
    Library,
    Search,
    Queue
  },
  {
    initialRouteName: 'Library',
    tabBarOptions: {
      activeTintColor: Colors.text,
      style: {
        backgroundColor: Colors.playback,
        borderTopWidth: 0
      }
    },
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused }) => {
        const { routeName } = navigation.state;
        const Icon = Icons[routeName as keyof typeof Icons];
        if (Icon == null) {
          return null;
        }
        return <Icon width={25} height={25} fillOpacity={focused ? 1 : 0.5} />;
      }
    }),
    tabBarComponent: props => <TabBarComponent {...props} />
  }
);

const Root = createAppContainer(Navigator);

const App = () => {
  return (
    <Provider store={store}>
      <StatusBar barStyle="default" />
      <Root />
    </Provider>
  );
};

export default App;
