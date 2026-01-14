export namespace main {
	
	export class ConversionResult {
	    outputPath: string;
	    inputSize: string;
	    outputSize: string;
	
	    static createFrom(source: any = {}) {
	        return new ConversionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.outputPath = source["outputPath"];
	        this.inputSize = source["inputSize"];
	        this.outputSize = source["outputSize"];
	    }
	}

}

