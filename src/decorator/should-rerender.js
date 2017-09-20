import difference from 'lodash.difference'
import every from 'lodash.every'
import get from 'lodash.get'
import deepEqual from 'deep-equal'

function getDataPropertyKeys(obj) {
    const enumerableKeys = Object.keys(obj)
    const allKeys = Object.getOwnPropertyNames(obj)
    return difference(allKeys, enumerableKeys)
}

const keysWithCustomComparators = ['actions', 'request', 'allObjects']
function areCustomDataEqual(prevResource, nextResource) {
    const prevDataKeys = getDataPropertyKeys(prevResource)
    const nextDataKeys = getDataPropertyKeys(nextResource)
    const prevExtraProps = difference(prevDataKeys, keysWithCustomComparators)
    const nextExtraProps = difference(nextDataKeys, keysWithCustomComparators)
    if (prevExtraProps.length !== nextExtraProps.length) {
        console.log(
            'extraProps length difference',
            prevExtraProps,
            nextExtraProps,
        )
        return false
    }
    return every(nextExtraProps, extraPropKey => {
        const result = deepEqual(
            get(prevResource, extraPropKey),
            get(nextResource, extraPropKey),
        )
        if (!result) {
            console.log(
                'extraProps value difference',
                get(prevResource, extraPropKey),
                get(nextResource, extraPropKey),
            )
        }
        return result
    })
}

function areRequestsEqual(prevRequests, nextRequests) {
    const result =
        get(prevRequests, 'status') === get(nextRequests, 'status') &&
        get(prevRequests, 'fetchedAt') === get(nextRequests, 'fetchedAt')
    if (!result) {
        console.log('request difference', prevRequests, nextRequests)
    }
    return result
}

function flattenEntities(entitiesTree) {
    if (!entitiesTree) {
        return []
    }
    const result = []
    const entityTypes = Object.keys(entitiesTree).sort()
    entityTypes.forEach(entityType => {
        const entitiesById = entitiesTree[entityType]
        const ids = Object.keys(entitiesById).sort()
        ids.forEach(entityId => {
            result.push(entitiesById[entityId])
        })
    })
    return result
}

function areEntitiesEqual(prevEntity, nextEntity) {
    const prevEntityKeys = Object.keys(prevEntity).sort()
    const nextEntityKeys = Object.keys(nextEntity).sort()
    if (prevEntityKeys.length !== nextEntityKeys.length) {
        console.log(
            'entityKeys length difference',
            prevEntityKeys,
            nextEntityKeys,
        )
        return false
    }

    return every(nextEntityKeys, entityKey => {
        const prevValue = prevEntity[entityKey]
        const nextValue = nextEntity[entityKey]
        if (get(nextValue, '_ref')) {
            return true
        }
        const result = deepEqual(prevValue, nextValue)
        if (!result) {
            console.log('entities value difference', prevValue, nextValue)
        }
        return result
    })
}

function areEntityListsEqual(prevFlatEntities, nextFlatEntities) {
    if (prevFlatEntities.length !== nextFlatEntities.length) {
        console.log(
            'flat entities length difference',
            prevFlatEntities,
            nextFlatEntities,
        )
        return false
    }

    for (let index = 0; index < nextFlatEntities.length; index++) {
        const prevEntity = prevFlatEntities[index]
        const nextEntity = nextFlatEntities[index]
        if (!areEntitiesEqual(prevEntity, nextEntity)) {
            return false
        }
    }

    return true
}

export function areMergedPropsEqual(nextProps, props) {
    const keysToIgnore = ['_initializeDataKey', 'updateEntity', '_declarations']
    const prevNionKeys = difference(Object.keys(props.nion), keysToIgnore)
    const nextNionKeys = difference(Object.keys(nextProps.nion), keysToIgnore)
    if (prevNionKeys.length !== nextNionKeys.length) {
        console.log('nion keys length difference', prevNionKeys, nextNionKeys)
        return false
    }
    return every(nextNionKeys, propKey => {
        // Compare this particular nion's object and request state
        const prevResource = props.nion[propKey]
        const nextResource = nextProps.nion[propKey]

        // Compare all extra properties, except those which have custom comparators
        const customDataEqualityResult = areCustomDataEqual(
            prevResource,
            nextResource,
        )
        if (!customDataEqualityResult) {
            console.log('custom data unequal')
            return false
        }

        // Compare request state
        const requestsEqualityResult = areRequestsEqual(
            get(prevResource, 'request'),
            get(nextResource, 'request'),
        )
        if (!requestsEqualityResult) {
            console.log('requests unequal')
            return false
        }

        // Compare entity data
        const prevFlatEntities = flattenEntities(
            get(prevResource, 'allObjects'),
        )
        const nextFlatEntities = flattenEntities(
            get(nextResource, 'allObjects'),
        )
        const result = areEntityListsEqual(prevFlatEntities, nextFlatEntities)
        if (!result) {
            console.log('entity lists unequal')
        }
        return result
    })
}
