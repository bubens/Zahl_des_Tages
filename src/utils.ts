export const padLeft = (str: string, l: number, padWith: string): string => {
    if (String.prototype["padStart"] !== undefined) {
        return str.padStart(l, padWith);
    }
    else {
        while (str.length < l) {
            str = padWith + str;
        }
    }
    return str;
};

export const saveData = <A>(key: string, data: A): boolean => {
    const dataStr = JSON.stringify(data);
    try {
        localStorage.setItem(key, dataStr);
        return true;
    } catch (e) {
        return false;
    }
};

export const loadData = <A>(key: string, defaultValue: A): A => {
    const data = localStorage.getItem(key);
    if (data === null) {
        return defaultValue;
    } else {
        try {
            const dataJSON = <A>JSON.parse(data);
            return dataJSON;
        } catch (e) {
            return defaultValue;
        }
    }
};