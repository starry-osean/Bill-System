import request from '../utils/request.ts'
export function loginApi(formData) {
    return request({ 
        url: '/authorizations',
        method: 'POST',
        data: formData
    })
}