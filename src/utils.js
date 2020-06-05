
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
