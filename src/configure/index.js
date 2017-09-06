import reducers from '../reducers'
import ApiManager from '../api'

import map from 'lodash.map'

export default ({ apiModules, defaultApi, headersProvider, defaultApiUrl }) => {
    if (apiModules) {
        map(apiModules, (apiModule, name) => {
            ApiManager.registerApi(name, apiModule)
        })

        ApiManager.setDefaultApi(defaultApi)
    }

    if (headersProvider) {
        ApiManager.setHeadersProvider(headersProvider)
    }

    // eventually we need to break this out and make it an config
    // setting within the api-module interface
    if (defaultApiUrl) {
        ApiManager.setDefaultApiUrl(defaultApiUrl)
    }

    return {
        reducer: reducers,
    }
}
