import React, { useState, useRef } from "react";
import { ParameterSet, useWindowEventListener } from "./utils";
import { resourceURL } from "./resources";
import { SVG } from "./SVG";

let activeDropdownSetExpanded;

export function Dropdown(props) {

    const parameters = new ParameterSet(props, "flg-Dropdown");
    const buttonContent = parameters.pop("buttonContent");
    const controller = parameters.pop("controller", null);
    const children = parameters.pop("children", null);
    const onKeyDown = parameters.pop("onKeyDown", null);
    const xAlignment = parameters.pop("xAlignment", "start");
    const yAlignment = parameters.pop("yAlignment", "below");
    const [expanded, _setExpanded] = useState(false);

    const buttonRef = useRef();

    function setExpanded(value) {
        if (value) {
            if (activeDropdownSetExpanded) {
                activeDropdownSetExpanded(false);
            }
            activeDropdownSetExpanded = _setExpanded;
        }
        else if (expanded) {
            activeDropdownSetExpanded = null;
        }
        _setExpanded(value);
    }

    useWindowEventListener("click", e => setExpanded(false));

    function handleButtonClicked(e) {
        setExpanded(!expanded);
        e.stopPropagation();
    }

    function handleKeyDown(e) {

        if (e.key == "Escape") {
            setExpanded(false);
        }

        if (onKeyDown) {
            onKeyDown(e);
        }
    }

    if (controller) {
        controller.close = () => {
            setExpanded(false);
            buttonRef.current.focus();
        }
        controller.focus = () => buttonRef.current.focus();
    }

    return (
        <div
            data-expanded={expanded}
            data-x-alignment={xAlignment}
            data-y-alignment={yAlignment}
            {...parameters.remaining}>
            <button
                className="flg-Dropdown-button"
                type="button"
                ref={buttonRef}
                onClick={handleButtonClicked}
                onKeyDown={handleKeyDown}>
                <div className="flg-Dropdown-button-content">
                    {buttonContent}
                </div>
                <SVG
                    className="flg-Dropdown-arrow"
                    src={resourceURL("@filigrana/ui", "icons/dropdown.svg")}/>
            </button>
            <div className="flg-Dropdown-panel" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
