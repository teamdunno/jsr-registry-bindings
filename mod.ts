/** Empty object, instead of using `{}` */
export type EmptyObject = Record<string|number|symbol, never>
/** Functions provider for `version` property on {@link RootMeta}  */
export interface MetaVersionFunctions {
    /** Convert {@link MetaVersion} to unyanked version */
    toUnyanked():MetaVersion
    /** Convert {@link MetaVersion} to yanked version */
    toYanked():MetaVersion
}
/** Properties provider for `version` property on {@link RootMeta}  */
export interface MetaVersionProps {
    /** Detect if the version was yanked (archived) */
    yanked:boolean
}
export type MetaVersion = {[key:string]:MetaVersionProps} & MetaVersionFunctions
/** Meta. For the version-specific, go to {@link VersionMeta} */
export interface Meta {
    scope:string
    name:string
    version:MetaVersion
}

/** File manifest for {@link Meta.manifest} */
export interface MetaManifestProps {
    /** How many Bytes that the file has */
    size:number,
    /** The auto-generated checksum for the file */
    checksum:`sha256-${string}`
}
/** Dependecies interface for the file */
export interface VersionMetaModuleGraph2Dependecies {
    /** Dependecy type, usually this can be found if you are using the `import` keyword or the `import()` dynamic function */
    type:'static'|'dynamic',
    /** Dependecy kind */
    kind:'export'|'import',
    /** Requested path to import/export, from this module */
    specifier:string,
    /** Specifier range for {@link VersionMetaModuleGraph2Dependecies.specifier} */
    specifierRange:[[number, number], [number, number]],
    /** Detect if {@link VersionMetaModuleGraph2Dependecies.specifier} is a file */
    isFile():boolean
    /** Detect if {@link VersionMetaModuleGraph2Dependecies.specifier} is a package */
    isPackage():boolean
}
/** Import/exported modules that are used in some modules */
export interface VersionMetaModuleGraph2Props {
    /** Dependecies that are used in the file */
    dependecies:VersionMetaModuleGraph2Dependecies
}

/** Version Meta. For the root version that has the scope and name, go to {@link Meta} */
export interface VersionMeta{
    /** Meta manifest properties. The keys usually start with `/` on it */
    manifest:{[key:`/${string}`]:VersionMetaManifestProps};
    /** Module graph v2. Import/exported modules that are used in some modules, including specifier, and more */
    moduleGraph2:{[key:`./${string}`]:VersionMetaModuleGraph2Props|EmptyObject}|undefined;
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
    private _meta:Meta|undefined;
    /** use {@link Package.versionMeta} instead */
    private _versionMeta:{[key:string]:VersionMeta}|undefined;
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
            this.refresh().catch((e)=>{throw e}).then(()=>{})
        }
    }
    /** Detect if package was successfully fetched for the first time */
    public get firstFetch(){
        return this._firstFetch
    }
    /** Get the metadata of this package */
    public get meta(){
        return this._meta
    }
    /** Get version-specific metadata from this package */
    public get versionMeta(){
        return this._versionMeta
    }
    /** Refresh the package, except for the metadata */
    refresh():Promise<void>{
      this._firstFetch = true
    }
}
export async function tryFindPackage(scope:string, name:string):Package|undefined{
    let pkg:Package = pkg = new Package(scope, name);
    try {
        await pkg.refresh()
    } catch (_) {return};
    return pkg
}
const test = new Package('o', '')
