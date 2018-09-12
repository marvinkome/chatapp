import * as React from 'react';
import { NavigationScreenProps as NSP } from 'react-navigation';
import { Query, Mutation } from 'react-apollo';
import { SubscribeToMoreOptions as STMO } from 'apollo-client';

import View from './view';
import query, { sendMsg, querySubscription } from './gql';

export default class Main extends React.Component<NSP> {
    static navigationOptions = {
        header: null
    };

    id = this.props.navigation.getParam('groupId');
    subscribeToMessages = (fn: (options: STMO<any, any>) => void) => {
        fn({
            document: querySubscription,
            variables: { groupId: this.id },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) {
                    return prev;
                }

                const newMsg = subscriptionData.data.messageSent;
                const prevGroup = prev.user.userGroup.group;
                const msgList = [...prevGroup.messages, newMsg];

                return {
                    ...prev,
                    user: {
                        ...prev.user,
                        userGroup: {
                            ...prev.user.userGroup,
                            group: {
                                ...prev.user.userGroup.group,
                                messages: msgList
                            }
                        }
                    }
                };
            }
        });
    };
    render() {
        return (
            <Query query={query} variables={{ id: this.id }}>
                {({ error, loading, data, subscribeToMore }) => {
                    if (error) {
                        // TODO: Use error component
                        console.warn(error);
                        return null;
                    }

                    if (loading) {
                        // TODO: Use info component
                        return null;
                    }

                    const props = {
                        data,
                        groupId: this.id,
                        moreMessages: () =>
                            this.subscribeToMessages(subscribeToMore)
                    };

                    return (
                        <Mutation mutation={sendMsg}>
                            {(fn) => {
                                const viewProps = {
                                    ...props,
                                    sendMsg: fn
                                };

                                return <View {...viewProps} />;
                            }}
                        </Mutation>
                    );
                }}
            </Query>
        );
    }
}
