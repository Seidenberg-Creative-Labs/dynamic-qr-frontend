function query<T>(key: string, queryFn: (...args: any) => T): T {
    return queryFn();
}
