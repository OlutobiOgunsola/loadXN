module.exports = {
    send: ({url, method, body, data}) => {
        return fetch(url, {
            body,
            data,
            method
        })
    }
}