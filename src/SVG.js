import React, { useState, useEffect, useRef } from "react";

export function SVG(props) {

    const {src, ...attr} = props;
    const [svgDocument, setSVGDocument] = useState(null);
    const ref = useRef();

    useEffect(
        () => {
            if (svgDocument) {
                ref.current.appendChild(svgDocument.rootElement);
            }
        },
        [src, !svgDocument]
    );

    if (!svgDocument) {
        fetch(src)
            .then(response => response.text())
            .then(text => (
                new window.DOMParser()).parseFromString(text, "text/xml")
                )
                .then(setSVGDocument);
    }

    return <div ref={ref} className="flg-SVG" {...attr}></div>;
}
