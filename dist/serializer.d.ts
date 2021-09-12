interface Serializer<T> {
    serialize(obj: T): string;
    deserialize(value: string): T;
}
declare class DefaultSerializer implements Serializer<Object> {
    private typeInfoKey;
    private dataKey;
    private supportedTypes;
    private type2name;
    private name2converter;
    private replacer;
    private reviver;
    serialize(obj: any): string;
    deserialize(value: string): any;
}
export { Serializer, DefaultSerializer };
