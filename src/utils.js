import { useState, useRef, useEffect } from "react";
import { prepareSearch } from "@filigrana/schema";
import { ObjectStore } from "@filigrana/schema";

export function useObjectSet(source, options = null) {

    const searchQuery = options && options.searchQuery || '';
    const ref = useRef();

    if (!ref.current || source !== ref.current.source) {
        ref.current = {
            source,
            searchQuery,
            resolvedObjects: source instanceof Array ? resolvedObjects : null
        };
    }

    const state = ref.current;
    const [resolvedObjects, setResolvedObjects] = useState(state.resolvedObjects);

    let mounted = true;

    useEffect(
        () => (() => mounted = false),
        []
    );

    if (!resolvedObjects) {

        if (!state.promise) {
            if (source instanceof ObjectStore) {
                state.promise = source.list();
            }
            else {
                state.promise = source;
            }
        }

        state.promise.then(
            results => {
                if (mounted) {
                    setResolvedObjects(results);
                }
            }
        );
        return null;
    }

    if (searchQuery) {
        const searchChanged = searchQuery != state.searchQuery;

        if (searchChanged) {
            state.searchQuery = searchQuery;
            state.search = prepareSearch(searchQuery);
        }

        if (!state.filteredObjects || searchChanged) {
            state.filteredObjects = resolvedObjects.filter(
                object => state.search(object.getSearchableText())
            );
        }

        return state.filteredObjects;
    }

    return resolvedObjects;
}

export function mergeClassName(className, extraClassName) {
    if (extraClassName) {
        className += ' ' + extraClassName;
    }
    return className;
}

const VALUES = Symbol('VALUES');

export class ParameterSet {

    constructor (values, className = null) {
        this[VALUES] = Object.assign({}, values);
        if (className) {
            this.prependClassName(className);
        }
    }

    get remaining() {
        return this[VALUES];
    }

    setDefault(key, defaultValue) {
        if (this[VALUES][key] === undefined) {
            this[VALUES][key] = defaultValue;
        }
    }

    pop(key, defaultValue = undefined) {
        let value = this[VALUES][key];
        if (value === undefined) {
            value = defaultValue;
            if (value === undefined) {
                throw new MissingRequiredParameterError(key);
            }
        }
        delete this[VALUES][key];
        return value;
    }

    appendClassName(name) {
        let className = this[VALUES].className;
        if (className) {
            this[VALUES].className = `${className} ${name}`;
        }
        else {
            this[VALUES].className = name;
        }
    }

    prependClassName(baseName) {
        let className = this[VALUES].className;
        if (baseName && className) {
            this[VALUES].className = `${baseName} ${className}`;
        }
        else {
            this[VALUES].className = baseName;
        }
    }
}

const KEY = Symbol('KEY');

class MissingRequiredParameterError extends Error {

    constructor(key) {
        super(`Missing required parameter ${key}`);
        this[KEY] = key;
    }

    get key() {
        return this[KEY];
    }
}
