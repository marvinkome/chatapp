import * as React from 'react';
import { View } from 'react-native';
import { FormInput, Button } from 'react-native-elements';
import { withApollo, WithApolloClient } from 'react-apollo';
import { chatFormStyles as styles } from '../styles';

import { setTypingState } from './gql';
import theme from '../../../../../lib/colors';
import { contextConnect } from '../../../../../lib/context';
import context from '../../context';
import { ViewProps } from '../../types';

type IProps = WithApolloClient<{
    sendMsg: (data: string) => void;
    groupId: string;
}>;

type IState = {
    message: string;
};

class ChatForm extends React.Component<IProps, IState> {
    stopTypingTimeout: NodeJS.Timer | undefined = undefined;
    isTyping: boolean = false;

    state = {
        message: ''
    };

    setTypingState = async (state: boolean) => {
        try {
            await this.props.client.mutate({
                mutation: setTypingState,
                variables: {
                    groupId: this.props.groupId,
                    state
                }
            });
        } catch (e) {
            return;
        }
    };

    resetStopTypingTimeout = () => {
        if (this.stopTypingTimeout) {
            clearTimeout(this.stopTypingTimeout);
        }

        this.stopTypingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.setTypingState(this.isTyping);
            this.stopTypingTimeout = undefined;
        }, 3000);
    };

    onMessageChange = (message: string) => {
        const stateCb = () => {
            const isMsgEmpty = this.state.message.length === 0;
            if (isMsgEmpty === false) {
                if (this.isTyping === false) {
                    this.isTyping = true;
                    this.setTypingState(true);
                    this.resetStopTypingTimeout();
                } else {
                    this.resetStopTypingTimeout();
                }
            } else {
                if (this.isTyping === true) {
                    this.isTyping = false;
                    this.setTypingState(this.isTyping);

                    if (this.stopTypingTimeout) {
                        clearTimeout(this.stopTypingTimeout);
                        this.stopTypingTimeout = undefined;
                    }
                }
            }
        };

        this.setState(
            {
                message
            },
            stateCb
        );
    };

    sendMessage = () => {
        this.props.sendMsg(this.state.message);
        this.setState({
            message: ''
        });
    };

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.formContainer}>
                    <FormInput
                        placeholder="Write a message..."
                        underlineColorAndroid="transparent"
                        placeholderTextColor={theme.primary.typo.text}
                        inputStyle={styles.input}
                        onChangeText={this.onMessageChange}
                        value={this.state.message}
                        multiline
                    />
                </View>
                <View style={styles.btnCont}>
                    <Button
                        iconRight={{ name: 'md-send', type: 'ionicon' }}
                        title="BTN"
                        onPress={this.sendMessage}
                        containerViewStyle={styles.btn}
                        buttonStyle={styles.btnStyle}
                        textStyle={styles.btnText}
                        disabled={this.state.message.length <= 0}
                        disabledStyle={styles.btnDisabled}
                        large
                    />
                </View>
            </View>
        );
    }
}

const mapper = ({ group, user, sendMsg }: ViewProps) => ({
    groupId: group.id,
    sendMsg: (msg: any) =>
        sendMsg({ msg, groupId: group.id, userId: user.id, username: user.username })
});

export default withApollo(contextConnect(context, mapper)(ChatForm));
