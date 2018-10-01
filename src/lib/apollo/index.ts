import ApolloClient from 'apollo-client';
import { DefaultOptions } from 'apollo-client/ApolloClient';
import { AsyncStorage, NetInfo } from 'react-native';
// @ts-ignore
import introspectionQueryResultData from './fragmentTypes.json';

// links
import Link from './link';

import { SyncOfflineMutation } from './syncMutation';

import {
    InMemoryCache,
    IntrospectionFragmentMatcher
} from 'apollo-cache-inmemory';
import { CachePersistor } from 'apollo-cache-persist';
import { clientId } from '../helpers';

const defaultOptions: DefaultOptions = {
    watchQuery: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all'
    },
    query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all'
    },
    mutate: {
        errorPolicy: 'all'
    }
};

export default async () => {
    const token = await clientId();

    const fragmentMatcher = new IntrospectionFragmentMatcher({
        introspectionQueryResultData
    });

    const cache = new InMemoryCache({
        cacheRedirects: {
            User: {
                group: (_, args, { getCacheKey }) =>
                    getCacheKey({ __typename: 'Group', id: args.groupId })
            }
        },
        fragmentMatcher
    });

    const persistor = new CachePersistor({
        cache,
        storage: AsyncStorage,
        trigger: 'write'
    });

    const { link, messageQueue } = Link(token, cache);

    const client = new ApolloClient({
        link,
        cache,
        defaultOptions
    });

    // add listeners to queue operations
    NetInfo.isConnected.addEventListener(
        'connectionChange',
        async (isConnected) => {
            if (isConnected) {
                await messageQueue.resync(client);
            }
        }
    );

    // try resyncing on app load
    NetInfo.isConnected.fetch().then(async (isConnected) => {
        if (isConnected) {
            await messageQueue.resync(client);
        }
    });

    // DEV only!!
    // messageQueue.clearQueue();
    // persistor.purge();

    return {
        cache,
        client,
        persistor
    };
};
