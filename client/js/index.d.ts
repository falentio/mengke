declare class Mengke {
	constructor(secret: string, baseUrl: string)
	create(target: string): Promise<string>
}
