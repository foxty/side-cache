import { DefaultSerializer } from '../src/serializer';
const CACHE_VALUE = JSON.stringify({ username: 'isaac', password: '123456', address: 'XX street' })


describe('Test DefaultSerializer', () => {
    ``
    const serializer = new DefaultSerializer()

    test('String/Number/Boolean should be ser/deser', () => {
        expect(serializer.serialize('abc')).toBe('"abc"')
        expect(serializer.deserialize('"bcd"')).toBe('bcd')

        expect(serializer.serialize(123)).toBe('123')
        expect(serializer.deserialize('123')).toBe(123)

        expect(serializer.serialize(true)).toBe('true')
        expect(serializer.deserialize('true')).toBe(true)

        expect(serializer.serialize(false)).toBe('false')
        expect(serializer.deserialize('false')).toBe(false)
    })

    test('Array should be ser/deser', () => {
        const arr = [1, 2, [1, 2, 3], 'a', 'b', ['a', 'b', 'c']]
        const serializedArr = serializer.serialize(arr)
        expect(serializedArr).toBe(JSON.stringify(arr))
        expect(serializer.deserialize(serializedArr)).toEqual(arr)
    })

    test('Object should be ser/deser', () => {
        const user = { name: 'foxty', age: 16, address: { city: 'Shenzhen', county: 'CN' } }
        const serializedUser = serializer.serialize(user)
        expect(serializedUser).toBe(JSON.stringify(user))
        expect(serializer.deserialize(serializedUser)).toEqual(user)
    })

    test('Set should be ser/deser', () => {
        const cards = new Set([1, 2, 3, new Set(['A', 'B', 'B']), new Set(['J', 'J', 'J'])])
        const serializedCards = serializer.serialize(cards)
        expect(serializedCards).toBe(JSON.stringify({
            '$$cacheable.$$objectType': 'set',
            '$$cacheable.$$object': [1, 2, 3,
                {
                    '$$cacheable.$$objectType': 'set',
                    '$$cacheable.$$object': ['A', 'B']
                },
                {
                    '$$cacheable.$$objectType': 'set',
                    '$$cacheable.$$object': ['J']
                }
            ]
        }))
        expect(serializer.deserialize(serializedCards)).toEqual(cards)
    })

    test('Map should be ser/deser', () => {
        const userFoxty = new Map<string, any>([['name', 'foxty'], ['age', 16]])
        const userIsaac = new Map<string, any>([['name', 'isaac'], ['age', 18]])
        const users = new Map([[1, userFoxty], [2, userIsaac]])
        const serializedUsers = serializer.serialize(users)
        expect(serializedUsers).toBe(JSON.stringify({
            '$$cacheable.$$objectType': 'map',
            '$$cacheable.$$object': [
                [1, {
                    '$$cacheable.$$objectType': 'map',
                    '$$cacheable.$$object': [...userFoxty]
                }],
                [2, {
                    '$$cacheable.$$objectType': 'map',
                    '$$cacheable.$$object': [...userIsaac]
                }]
            ]
        }))
        expect(serializer.deserialize(serializedUsers)).toEqual(users)
    })
})