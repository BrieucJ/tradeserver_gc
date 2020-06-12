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

export const refresh_token = async () => {
  console.log('refresh_token')
  let token = localStorage.getItem('refresh')
  let headers = {}
  let url = API_URL + 'api/token/refresh/'
  headers["Accept"] = "application/json"
  headers["Content-Type"] = "application/json"

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    var params = JSON.stringify({refresh: token});

    xhr.open('POST', url);
    xhr.onload = function () {
      if (this.status === 200) {
        console.log(this.response)
        localStorage.setItem('refresh', JSON.parse(this.response).refresh)
        localStorage.setItem('access', JSON.parse(this.response).access)
        resolve(true)
      }
    };

    xhr.onerror = function () {
      console.log('onerror')
      reject(); 
    };

    // Need to stringify if we've been given an object
    // If we have a string, this is skipped.
    if (params && typeof params === 'object') {
      params = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }

    if (headers) {
      Object.keys(headers).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
    }
    xhr.send(params);
  });
}

export const verify_token = async () => {
  console.log('verify_token')
  let token = localStorage.getItem('access')
  let headers = {}
  let url = API_URL + 'api/token/verify/'
  headers["Accept"] = "application/json"
  headers["Content-Type"] = "application/json"

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    var params = JSON.stringify({token: token});

    xhr.open('POST', url);
    xhr.onload = function () {
      if (this.status === 200) {
        resolve(true);
      } else {
        refresh_token()
      }
    };

    xhr.onerror = function () {
      console.log('onerror')
      reject();
    };

    // Need to stringify if we've been given an object
    // If we have a string, this is skipped.
    if (params && typeof params === 'object') {
      params = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }

    if (headers) {
      Object.keys(headers).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
    }
    xhr.send(params);
  });
}

export const makeRequest = async (path, opts) => {
  console.log('REQUEST')
  let token = localStorage.getItem('access')
  let url = API_URL + path

  let method = opts.method || "GET"
  opts.headers = opts.headers || {}
//   opts.headers["Locale"] = i18n.locale
//   opts.headers["Timezone"] = Localization.timezone
  opts.headers["Accept"] = "application/json"
  opts.headers["Content-Type"] = "application/json"
  if (token !== null) {
    await verify_token()
    opts.headers["Authorization"] = `Bearer ${token}`
  }

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    var params = opts.params;

    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        console.log(this)
        resolve(JSON.parse(this.response));
      } else {
        resolve({ 
          status: this.status,
          response: JSON.parse(this.response),
        });
      }
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