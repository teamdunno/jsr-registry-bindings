/** Empty object, instead of using `{}` */
export type EmptyObject = Record<string|number|symbol, never>
/** Functions provider for `version` property on {@link RootMeta}  */
export interface RootMetaVersionFunctions {
    /** Convert {@link RootMetaVersion} to unyanked versions */
    toUnyanked():RootMetaVersion
    /** Convert {@link RootMetaVersion} to yanked versions */
    toYanked():RootMetaVersion
}
/** Properties provider for `version` property on {@link RootMeta}  */
export interface RootMetaVersionProps {
    /** Detect if the version was yanked (archived) */
    yanked:boolean
}
export type RootMetaVersion = Record<string, ({[key:string]:RootMetaVersionProps} & RootMetaVersionFunctions)> 

/** Root Meta. For the version-specific, go to {@link Meta} */
export interface RootMeta {
    scope:string,
    name:string,
    version:RootMetaVersion
}

/** File manifest for {@link Meta.manifest} */
export interface MetaManifestProps {
    /** How many Bytes that the file has */
    size:number,
    /** The auto-generated checksum for the file */
    checksum:`sha256-${string}`
}
/** Dependecies interface for the file */
export interface MetaModuleGraph2Dependecies {
    /** Dependecy type, usually this can be found if you are using the `import` keyword or the `import()` dynamic function */
    type:'static'|'dynamic',
    /** Dependecy kind */
    kind:'export'|'import',
    /** Requested path to import/export, from this module */
    specifier:string,
    /** Specifier range for {@link MetaModuleGraph2Dependecies.specifier} */
    specifierRange:[[number, number], [number, number]],
    /** Detect if {@link MetaModuleGraph2Dependecies.specifier} is a file */
    isFile():boolean
    /** Detect if {@link MetaModuleGraph2Dependecies.specifier} is a package */
    isPackage():boolean
}
/** Import/exported modules that are used in some modules */
export interface MetaModuleGraph2Props {
    /** Dependecies that are used in the file */
    dependecies:MetaModuleGraph2Dependecies
}

/** Version Meta. For the root version that has the scope and name, go to {@link RootMeta} */
export interface Meta{
    /** Meta manifest properties. The keys usually start with `/` on it */
    manifest:{[key:`/${string}`]:MetaManifestProps};
    /** Module graph v2. Import/exported modules that are used in some modules, including specifier, and more */
    moduleGraph2:{[key:`./${string}`]:MetaModuleGraph2Props|EmptyObject}|undefined;
    /** Module graph v1. Some of the early JSR packages have this, but it quickly changed to {@link Meta.moduleGraph2} */
    moduleGraph1:{[key:`./${string}`]:object}|undefined;
    /** Module exports. For the default, the key is `.` no matter what */
    exports:{[key:`./${string}`]:`./${string}`}&{'.':`./${string}`}
}

/** Package option */
export interface PackageOption {
    /** Package name */
    scope:string
    /** Package name */
    name:string
    /** Auto fetch on package init? */
    autoFetch?:boolean
}

/** JSR Package. But when initialization, the package dosent actually fetch automatically. If you want to, set {@link PackageOption.autoFetch} on the constructor option to `true` */
export class Package {
    /** Auto fetch on package init? */
    public readonly autoFetch:boolean=false;
    /** use {@link Package.firstFetch} instead */
    private _firstFetch:boolean=false;
    /** Package scope */
    public readonly scope:string;
    /** Package name */
    public readonly name:string;
    /** use {@link Package.meta} instead */
    private _meta:RootMeta|undefined;
    /** use {@link Package.versionMeta} instead */
    private _versionMeta:{[key:string]:Meta};
    /** 
     * Package constructor 
     * 
     * @param option Package option
     */
    constructor(option:PackageOption) {
        this.scope = option.scope
        this.name = option.name
        if (option.autoFetch) {
            this.autoFetch = option.autoFetch;
            this.refresh().catch((e)=>{throw e}).then(()=>{

            })
        }
    }
    /** If package was successfully fetched for the first time */
    public get firstFetch(){
        return this._firstFetch
    }
    /**  */
    public get meta(){
        return this._firstFetch
    }
    refresh():Promise<void>{
        
        this._firstFetch = true
    }
}
export function tryFindPackage(scope:string, name:string):Package|undefined{
    let pkg:Package;
    try {
        pkg = new Package(scope, name)
    } catch (_) {return};
    return pkg
}
const test = new Package('o', '')
