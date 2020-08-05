import {API_URL} from './Constants'

export const get = (path, opts = {}) => {
  return makeRequest(path, opts)
}

export const post = (path, data, opts) => {
  return makeRequest(path, {
    method: "POST",
    params: JSON.stringify(data),
    opts: opts
  })
}

export const put = (path, data, opts) => {
  return makeRequest(path, {
    method: "PUT",
    params: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
}

export const patch = (path, data, opts) => {
  return makeRequest(path, {
    method: "PATCH",
    params: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
}

export const destroy = (path, opts) => {
  return makeRequest(path, { method: "DELETE" })
}

export const makeRequest = async (path, opts) => {
  let token = localStorage.getItem('token')
  let url = API_URL + path
  let method = opts.method || "GET"
  opts.headers = opts.headers || {}
//   opts.headers["Locale"] = i18n.locale
//   opts.headers["Timezone"] = Localization.timezone
  opts.headers["Accept"] = "application/json"
  opts.headers["Content-Type"] = "application/json"
  if (token !== null) {
    opts.headers["Authorization"] = `Token ${token}`
  }

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    var params = opts.params;

    xhr.open(method, url);
    xhr.onload = function () {
      resolve(this)
    };

    xhr.onerror = function () {
      reject({
        status: xhr.status,
        response: JSON.parse(xhr.response),
      });
    };

    // Need to stringify if we've been given an object
    // If we have a string, this is skipped.
    if (params && typeof params === 'object') {
      params = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }

    if (opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        xhr.setRequestHeader(key, opts.headers[key]);
      });
    }

    xhr.send(params);
  });
}