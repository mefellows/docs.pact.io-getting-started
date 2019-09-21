const request = require('superagent')
const API_HOST = process.env.API_HOST || 'http://localhost'
const API_PORT = process.env.API_PORT || 9123
const API_ENDPOINT = `${API_HOST}:${API_PORT}`
const { Order } = require('./order')

const fetchOrders = () => {
  return request.get(`${API_ENDPOINT}/orders`).then(
    res => {
      return res.body.reduce((acc, o) => {
        acc.push(new Order(o.id, o.items))
        return acc
      }, [])
    },
    err => {
      throw new Error(`Error from response: ${err.body}`)
    }
  )
}

module.exports = {
  fetchOrders,
}
