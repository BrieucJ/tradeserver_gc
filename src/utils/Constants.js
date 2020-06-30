
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    var server =  'http://localhost:8000/'
} else {
    var server =  'https://localhost:8000/'
}

export var API_URL = server
export const APP_NAME = 'TraderServer'