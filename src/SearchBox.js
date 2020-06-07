import React, { useState, useRef, useEffect } from "react";
import { SVG } from "./SVG";
import { resourceURL } from "./resources";
import { ParameterSet } from "./utils";

export function SearchBox(props) {
    const parameters = new ParameterSet(props, 'flg-SearchBox');
    const autofocus = parameters.pop('autofocus', false);
    const onChange = parameters.pop('onChange', null);
    const initialValue = parameters.pop('value', '');
    const [value, setValue] = useState(initialValue);

    const ref = useRef();
    useEffect(() => {
            if (autofocus) {
                ref.current.focus();
            }
        },
        [true]
    );

    function handleChange(e) {
        setValue(e.target.value);
        if (onChange) {
            onChange(e);
        }
    }

    return (
        <div {...parameters.remaining}>
            <SVG src={resourceURL('@filigrana/ui', 'icons/search.svg')}/>
            <input
                ref={ref}
                type="search"
                onChange={handleChange}
                value={value}/>
        </div>
    );
}
