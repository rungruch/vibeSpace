const domain = "http://TC001MFDS1P"
const port = "4080"

const root = 'elearning'

let url = `${domain}:${port}`
let url_api = `${domain}:${port}/${root}`
if (process.env.NODE_ENV === 'development') {
    url_api = `http://localhost:4080/${root}`
    // url = `http://localhost:4080/`
}

export const ENDPOINT_URL = url
export const LOGIN_URL = `${domain}/login/`
export const EMPLOYEE_IMAGE_URL = `${url}/common/user/avatar`
export const MASTER_NANO_USER_INFO_URL = `${url}/common/user/info`
export const MASTER_NANO_USER_INFO_AVATAR_URL = `${url}/common/user/info/avatar`

export const MASTER_HS_URL = `${url}/common/master/headofsale`
export const MASTER_RL_URL = `${url}/common/master/region`
export const MASTER_ZM_URL = `${url}/common/master/zone`
export const MASTER_BM_URL = `${url}/common/master/branch`
export const MASTER_CA_URL = `${url}/common/master/employee`
export const POSITION_FILTER_URL = `${url}/common/master/employee/position`

export const ELEARNING_URL = `${url_api}`

// export const SOCKET_IO_PORT = `${url}`

// export const SOCKET_IO_PORT = `${url}`

// export const DASHBOARD_URL = `${url_api}/dashboard`

