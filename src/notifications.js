import React, { createContext, useContext, useReducer, useEffect } from "react";
import { ParameterSet } from "./utils";
import { SVG } from "./SVG";

const NotificationDispatch = createContext(null);

const NOTIFICATIONS = Symbol('NOTIFICATIONS');

let notificationNumber = 0;

function notificationsReducer(notifications, action) {
    if (action.type == 'clear') {
        return [];
    }
    else if (action.type == 'push') {
        action.notification.id = notificationNumber++;
        return [...notifications, action.notification];
    }
    else {
        throw new Error(`Unknown action type: ${action.type}`);
    }
}

export function NotificationsContainer(props) {

    const parameters = new ParameterSet(props, 'flg-NotificationsContainer');
    const [notifications, dispatch] = useReducer(notificationsReducer, []);

    function clearNotifications() {
        dispatch({type: 'clear'});
    }

    useEffect(
        () => {
            document.body.addEventListener(
                'mousedown',
                clearNotifications,
                {capture: true}
            );
            return () => {
                document.body.removeEventListener(
                    'mousedown',
                    clearNotifications
                );
            };
        },
        [true]
    );

    return (
        <NotificationDispatch.Provider value={dispatch}>
            <div {...parameters.remaining}>
                {notifications.map(
                    notification => {
                        const attr = {};
                        if (notification.type) {
                            attr['data-type'] = notification.type;
                        }
                        return (
                            <div
                                key={notification.id}
                                className="flg-Notification"
                                {...attr}>
                                <SVG src={notification.icon}/>
                                <div className="label">{notification.text}</div>
                            </div>
                        );
                    }
                )}
            </div>
            {props.children}
        </NotificationDispatch.Provider>
    );
}

export function useNotifications() {
    const dispatch = useContext(NotificationDispatch);
    return notification => dispatch({type: 'push', notification});
}
