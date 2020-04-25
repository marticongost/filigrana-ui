
export function mergeClassName(className, extraClassName) {
    if (extraClassName) {
        className += ' ' + extraClassName;
    }
    return className;
}
