import { useState, useRef, useEffect } from "react";
import { prepareSearch, ObjectStore, Model } from "@filigrana/schema";

export function useEventListener(ref, eventName, handler) {
    useEffect(() => {
        ref.current.addEventListener(eventName, handler);
        return () => {
            ref.current.removeEventListener(eventName, handler);
        }
    }, []);
}

export function useWindowEventListener(eventName, handler) {
    useEffect(() => {
        window.addEventListener(eventName, handler);
        return () => {
            window.removeEventListener(eventName, handler);
        }
    }, []);
}

export function useObjectSet(source, options = null) {

    const searchQuery = options && options.searchQuery || '';
    const filters = options && options.filters || null;
    const order = options && options.order || null;
    const ref = useRef();

    if (!ref.current || source !== ref.current.source) {
        ref.current = {
            source,
            searchQuery,
            order,
            resolvedObjects: source instanceof Array ? resolvedObjects : null
        };
    }

    const state = ref.current;

    // Await object sets produced by a promise
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

    let objectSet = resolvedObjects;

    // Apply filters
    if (filters && !filters.isBlank()) {
        if (!Model.equal(filters, state.filters)) {
            state.filterResults = Array.from(filters.filterObjects(objectSet));
            state.searchResults = null;
            state.sortedObjects = null;
        }
        objectSet = state.filterResults;
        state.filters = filters;
    }
    else {
        if (state.filters && !state.filters.isBlank()) {
            state.searchResults = null;
            state.sortedObjects = null;
        }
        state.filters = null;
        state.filterResults = null;
    }

    // Apply text search
    if (searchQuery || state.searchQuery) {
        const searchChanged = searchQuery != state.searchQuery;

        if (searchChanged) {
            state.searchQuery = searchQuery;
            state.search = prepareSearch(searchQuery);
        }

        if (!state.searchResults || searchChanged) {
            state.searchResults = objectSet.filter(
                object => state.search(object.getSearchableText())
            );
            state.sortedObjects = null;
        }

        objectSet = state.searchResults;
    }

    // Sort results
    if (order) {
        const orderChanged = order != state.order;

        if (orderChanged) {
            state.order = order;
        }

        if (!state.sortedObjects || orderChanged) {
            state.sortedObjects = objectSet;

            let memberName;
            let direction;

            if (order.charAt(0) == '-') {
                direction = -1;
                memberName = order.substr(1);
            }
            else {
                direction = 1;
                memberName = order;
            }

            state.sortedObjects.sort((object1, object2) => {
                const value1 = object1.getValue(memberName);
                const value2 = object2.getValue(memberName);
                if (value1 > value2) {
                    return direction;
                }
                else if (value1 < value2) {
                    return -direction;
                }
                return 0;
            });
        }

        objectSet = state.sortedObjects;
    }

    return objectSet;
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

export class ParameterError extends Error {

    constructor(message = null) {
        super(message || `Error in parameter`);
    }
}

const KEY = Symbol('KEY');

export class MissingRequiredParameterError extends ParameterError {

    constructor(key, message = null) {
        super(message || `Missing required parameter ${key}`);
        this[KEY] = key;
    }

    get key() {
        return this[KEY];
    }
}
