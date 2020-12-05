import React, { useState, useRef, useEffect } from 'react';
import { ParameterSet, ParameterError } from './utils';

export function Tooltip(props) {
    const parameters = new ParameterSet(props, 'flg-Tooltip');
    const position = parameters.pop('position', 'below');
    const children = parameters.pop('children', null);

    const [visible, setVisible] = useState(false);
    const ref = useRef();
    const listeners = useRef();

    if (!listeners.current) {
        listeners.current = {
            mouseenter: (e) => {
                console.log('SHOW');
                setVisible(true);
            },
            mouseleave: (e) => setVisible(false)
        };
    }

    useEffect(() => {
        const container = ref.current.parentNode;
        container.classList.add("flg-Tooltip-container");
        for (let eventType in listeners.current) {
            container.addEventListener(eventType, listeners.current[eventType]);
        }
        return () => {
            for (let eventType in listeners.current) {
                container.removeEventListener(eventType, listeners.current[eventType]);
            }
        }
    }, []);

    return (
        <div
            ref={ref}
            data-position={position}
            data-visible={visible}
            {...parameters.remaining}>
            {children}
        </div>
    );
}