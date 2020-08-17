const URI = require('urijs')
const _ = require('lodash')
const https = require('https')

const originalRequest = https.request

const buildUrl = requestOptions => {
  var uri = new URI({
    protocol: 'https',
    hostname: requestOptions.host,
    path: requestOptions.path,
  })
  return uri.toString()
}

const buildBodyArgs = body => {
  return _.map(body, (value, key) => {
    const needsUrlEncoding = URI.encode(value) !== value
    if (needsUrlEncoding) {
      return `--data-urlencode "${key}=${value}"`
    }
    return `-d ${key}=${value}`
  })
}

const methodArg = (request, bodyArgs) => {
  if (request.method === 'DELETE') {
    return '-X DELETE'
  }
  if (request.method === 'GET' && !_.isEmpty(bodyArgs)) {
    return '-G'
  }
  return null
}

const queryParamsToBody = (requestOptions, bodyAsQueryParams) => {
  if (bodyAsQueryParams) {
    return {
      requestOptions: requestOptions,
      body: URI.parseQuery(`?${bodyAsQueryParams}`),
    }
  }
  const uri = new URI(requestOptions.path)
  const queryAsJson = uri.query()
  return {
    requestOptions: { ...requestOptions, path: uri.path() },
    body: uri.query(true),
  }
}

const requestToCurlString = (originalRequestOptions, bodyAsQueryParams) => {
  const { requestOptions, body } = queryParamsToBody(
    originalRequestOptions,
    bodyAsQueryParams
  )
  const url = buildUrl(requestOptions)
  const bodyArgs = buildBodyArgs(body)
  const args = _.compact([
    url,
    `-u ${requestOptions.headers.Authorization.slice(7)}:`,
    ...bodyArgs,
    methodArg(requestOptions, bodyArgs),
  ])
  return `curl ${args.join(' \\\n')}\n`
}

const shouldPrintRequest = requestOptions =>
  requestOptions.host !== 'files.stripe.com'

const interceptHttpRequestsAndLogCurl = () => {
  https.request = function wrapMethodRequest(requestOptions) {
    const result = originalRequest.apply(this, arguments)
    const originalResultWrite = result.write
    result.write = function(body) {
      if (shouldPrintRequest(requestOptions)) {
        console.log(requestToCurlString(requestOptions, body))
      }
      return originalResultWrite.apply(this, arguments)
    }
    return result
  }
}

module.exports = interceptHttpRequestsAndLogCurl
