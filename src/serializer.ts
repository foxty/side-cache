interface Serializer<T> {
    serialize(obj: T): string
    deserialize(value: string): T
}

class DefaultSerializer implements Serializer<Object> {

    private typeInfoKey = '$$cacheable.$$objectType'
    private dataKey = '$$cacheable.$$object'
    private supportedTypes = [Map, Set]
    private type2name: Map<Function, string> = new Map<Function, string>([[Map, 'map'], [Set, 'set']])
    private name2converter: Map<string, Function> = new Map<string, Function>([
        ['map', (obj: Array<[any, any]>) => {
            return new Map(obj)
        }],
        ['set', (obj: []) => {
            return new Set(obj)
        }]
    ])

    private replacer = (key, value): any => {
        const type = typeof (value)
        if (type !== 'object') return value
        const matchedType = this.supportedTypes.find(type => value instanceof type)
        if (matchedType) {
            if (value.hasOwnProperty(this.typeInfoKey))
                throw Error(`Reserved key ${this.typeInfoKey} was used in ${key}->${value}!`)
            return {
                [this.typeInfoKey]: this.type2name.get(matchedType),
                [this.dataKey]: [...value]
            }
        } else {
            return value
        }
    }

    private reviver = (key, value: any): any => {
        const type = typeof value
        const typeInfo = value[this.typeInfoKey]
        if (type !== 'object' || !this.name2converter.has(typeInfo)) return value
        const data = value[this.dataKey]
        const converter = this.name2converter.get(typeInfo)
        return converter(data)
    }

    serialize(obj: any): string {
        return JSON.stringify(obj, this.replacer)
    }
    deserialize(value: string) {
        return JSON.parse(value, this.reviver)
    }
}

export { Serializer, DefaultSerializer }