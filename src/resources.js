
const repositories = {};

export function defineResourceRepository(repositoryName, rootPath) {
    if (rootPath.charAt(repositoryName.length - 1) != '/') {
        rootPath += '/';
    }
    repositories[repositoryName] = rootPath;
}

export function resourceURL(repositoryName, path) {
    let url = repositories[repositoryName];
    if (!url) {
        throw new InvalidRepositoryError(repositoryName);
    }
    return url + path;
}

const REPOSITORY_NAME = Symbol('REPOSITORY_NAME');

class InvalidRepositoryError extends Error {

    constructor(repositoryName) {
        super(
            `No resource repository named '${repositoryName}' `
            + 'has been defined; did you forget to call '
            + 'defineResourceRepository()?'
        );
        this[REPOSITORY_NAME] = repositoryName;
    }

    get repositoryName() {
        return this[REPOSITORY_NAME];
    }
}
