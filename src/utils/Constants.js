
if (process.env.NODE_ENV == 'development') {
    var API_URL =  'http://localhost:8000/'
} else {
    var API_URL =  'https://localhost:8000/'
}

export var API_URL
export const APP_NAME = 'TraderServer'