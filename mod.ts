import * as obj from "jsr:@dunno/object"
/** Empty object, instead of using `{}` */
export type EmptyObject = Record<string|number|symbol, never>
/** Functions provider for {@link MetaVersions}  */
export interface MetaVersionsConvert {
    /** Convert {@link MetaVersions} to unyanked version */
    toUnyanked():MetaVersions
    /** Convert {@link MetaVersions} to yanked version */
    toYanked():MetaVersions
}
/** Properties provider for {@link MetaVersion}  */
export interface MetaVersionsProps {
    /** Detect if the version was yanked (archived) */
    yanked:boolean
}
/** List of version with infos for {@link Meta} */
export type MetaVersions = {[key:string]:MetaVersionsProps}
/** Meta. For the version-specific, go to {@link VersionMeta} */
export interface Meta {
    /** Package scope */
    scope:string
    /** Package name */
    name:string
    /** List of version with infos for {@link Meta} */
    versions:MetaVersions
    /** Converter for {@link Meta.versions} */
    versionsConvert:MetaVersionsConvert
}

/** File manifest for {@link VersionMeta.manifest} */
export interface VersionMetaManifestProps {
    /** How many Bytes that the file has */
    size:number,
    /** The auto-generated checksum for the file */
    checksum:`sha256-${string}`
}
/** Dependecy interface for the file */
export interface VersionMetaModuleGraph2Dependecy {
    /** Dependecy type, usually this can be found if you are using the `import` keyword or the `import()` dynamic function */
    type:'static'|'dynamic'
    /** Dependecy kind */
    kind:'export'|'import'
    /** Requested path to import/export, from this module */
    specifier:string
    /** Specifier range for {@link VersionMetaModuleGraph2Dependecy.specifier} */
    specifierRange:[[number, number], [number, number]]
}
/** Dependencies interface for the file */
export type VersionMetaModuleGraph2Dependencies = VersionMetaModuleGraph2Dependecy[]
/** Import/exported modules that are used in some modules */
export interface VersionMetaModuleGraph2Props {
    /** Dependencies that are used in the file */
    dependencies:VersionMetaModuleGraph2Dependencies
}

/** Version Meta. For the root version that has the scope and name, go to {@link Meta} */
export interface VersionMeta{
    /** Meta manifest properties. The keys usually start with `/` on it */
    manifest:{[key:string]:VersionMetaManifestProps};
    /** Module graph v2. Import/exported modules that are used in some modules, including specifier, and more */
    moduleGraph2:{[key:string]:VersionMetaModuleGraph2Props|EmptyObject}|undefined;
    /** Module graph v1. Some of the early JSR packages have this, but it quickly changed to {@link Meta.moduleGraph2} */
    moduleGraph1:{[key:string]:object}|undefined;
    /** Module exports. For the default, the key is `.` no matter what */
    exports:{[key:string]:string}&{'.':string}
}
/** Package option */
export interface PackageOption {
    /** Package name */
    scope:string
    /** Package name */
    name:string
    /** No Caching for {@link VersionMeta}? If true, {@link Package.cachedVersionMeta} will be empty */
    noCache?:boolean
    /** Disable serializer? (MAY EXPOSE SECURITY BREACH) */
    noSerializer?:boolean
    /** Host for the JSR packages */
    host?:string
}

/** Package option */
export interface NonNullishPackageOption {
    /** Package name */
    scope:string
    /** Package name */
    name:string
    /** No Caching for {@link VersionMeta}? If true, {@link Package.cachedVersionMeta} will be empty */
    noCache:boolean
    /** Disable serializer? (MAY EXPOSE SECURITY BREACH) */
    noSerializer:boolean
    /** Host for the JSR packages */
    host:string
}

/** JSR Package. But when initialization, the package dosent actually fetch automatically. If you want to, run {@link Package.find} without having to add the `new` keyword */
export class Package {
    /** 
     * Find the package itself, without having to use `new` everytime
     * 
     * But throws an error everytime it fails
     * 
     * @param option Package Option
    */
    static async find(option:PackageOption):Promise<Package>{
        const pkg:Package = new this(option);
        await pkg.refresh()
        return pkg
    }
    /** 
     * Try to find the package itself, without having to use `new` everytime
     * 
     * Returns `undefined` everytime it fails
     * 
     * @param option Package Option
    */
    static async tryFind(option:PackageOption):Promise<Package|undefined>{
        const pkg:Package = new this(option);
        try {
            await pkg.refresh()
        } catch (_) {return};
        return pkg
    }
    /** use {@link Package.firstFetch} instead */
    private _firstFetch:boolean=false;
    /** Package scope */
    public readonly scope:string;
    /** Package name */
    public readonly name:string;
    /** use {@link Package.meta} instead */
    private _meta:Meta|undefined;
    /** use {@link Package.cachedVersionMeta} instead */
    private _cachedVersionMeta:{ [key: string]: VersionMeta; }={};
    /** No Caching for {@link VersionMeta}? If true, {@link Package.versionMeta} will be 'removed' */
    public readonly noCache:boolean;
    /** Disable serializer? (MAY EXPOSE SECURITY BREACH) */
    public readonly noSerializer:boolean
    /** Package option proto from the constructor. Use the normal keys at {@link Package} instead */
    public readonly optionProto:PackageOption;
    /** Host for the JSR packages */
    public readonly host:string;
    /** 
     * Package constructor 
     * 
     * @param option Package option
     */
    constructor(option:PackageOption) {
        this.optionProto = option
        this.scope = option.scope
        this.name = option.name
        this.noCache = option.noCache??false
        this.noSerializer = option.noSerializer??false
        this.host = option.host??"https://jsr.io"
    }
    /** Detect if package was successfully fetched for the first time */
    public get firstFetch(){
        return this._firstFetch
    }
    /** Get the metadata of this package */
    public get meta(){
        return this._meta
    }
    /** Get CACHED version-specific metadata from this package. Use {@link Package.getVersionMeta} if you want to refresh */
    public get cachedVersionMeta(){
        return this._cachedVersionMeta
    }
    /** Refresh MAIN metadata. If you want to refresh {@link VersionMeta}, use {@link Package.getVersionMeta} */
    async refresh():Promise<Meta>{
      const metaRes = await fetch(`${this.host}/@${this.scope}/${this.name}/meta.json`)
      if (metaRes.status!==200) throw new ReferenceError(`Fetch returned '${metaRes.status}': ${metaRes.statusText}`)
      const metaJson = await metaRes.json()
      const ynk:<T extends "toYanked"|"toUnyanked">(t:T)=>MetaVersionsConvert[T] = <T extends "toYanked"|"toUnyanked">(t:T)=>{
        return ()=>{
        const vMeta:MetaVersions = {}
        for (const [k, v] of Object.entries(this._meta!.versions as MetaVersions)) {
            if ((t==="toYanked" && v.yanked)||(t==="toUnyanked" && !v.yanked)) vMeta[k] = v
        }
        return vMeta
        }
      }
      const meta:Meta = {...(this.noSerializer?metaJson:serializeMeta(metaJson, this.optionProto)), ...{versionsConvert:{toYanked:(ynk("toYanked")),toUnyanked:(ynk("toUnyanked"))}}}
      this._meta = meta
      if (!this._firstFetch) this._firstFetch = true
      return meta
    }
    /** 
     * Get version meta
     * 
     * @param version Version that you want to find
    */
    async getVersionMeta(version:string):Promise<VersionMeta>{
      if (!this._firstFetch) this._firstFetch = true
      const metaRes = await fetch(`${this.host}/@${this.scope}/${this.name}/${version}_meta.json`)
      if (metaRes.status!==200) throw new ReferenceError(`Fetch result returned '${metaRes.status}': ${metaRes.statusText}`)
      const metaJson = await metaRes.json()
      const res:VersionMeta = this.noSerializer?metaJson:serializeVersionMeta(metaJson)
      if (!this.noCache) {
        this._cachedVersionMeta[version] = res
      }
      return res
    }
    /** 
     * Get version meta. But on error, returns `undefined`
     * 
     * @param version Version that you want to find
    */
    async tryGetVersionMeta(version:string):Promise<VersionMeta|undefined> {
      let res:VersionMeta;
      try {
        res = await this.getVersionMeta(version)
      } catch (_) {
        return
      }
      return res
    }
}
export class SerializeError extends Error{
    constructor(msg:string){
        super()
        this.message = msg
    }
}
// the power of NATURAL SERIALIZERRR
/** 
 * Serialize Object for {@link Meta}. May need an option 
 * 
 * @param input The object input
 * @param option The option
*/
export function serializeMeta(input:unknown, option:PackageOption):Meta{
    const opt:NonNullishPackageOption = {...option, ...{noCache:false, noSerializer:false, host:"https://jsr.io"}}
    if (!(typeof input === "object" && !obj.isArray(input))) throw new SerializeError("The input MUST be an object")
    const o = Object(input)
    if (Object.keys(o??{}).length!==4) throw new SerializeError("The object keys MUST exactly 4 in length")
    const processedKeys:string[] = []
    let latest:string|undefined = undefined
    let latestVersionIncluded = false 
    for (const [k, v] of Object.entries(o)) {
       if (processedKeys.includes(k)) throw new SerializeError(`Duplicate '${k}' key was found on the output`)
       switch (k) {
        case "scope":{
            if (typeof v !== "string") throw new SerializeError("scope MUST be a string")
            if (v!==opt.scope) throw new SerializeError("The scope is diffrent than the original option.scope")
            processedKeys.push(k)
            break
        }
        case "name":{
            if (typeof v !== "string") throw new SerializeError("name MUST be a string")
            if (v!==opt.name) throw new SerializeError("The package name is diffrent than the original option.name")
            processedKeys.push(k)
            break
        }
        case "latest":{
            if (typeof v !== "string") throw new SerializeError("The latest version MUST be a string")
            latest = v
            processedKeys.push(k)
            break
        }
        case "versions":{
            if (!(typeof v === "object" && !obj.isArray(v))) throw new SerializeError("The versions MUST be an object")
            if (Object.keys(v??{}).length<1) throw new SerializeError("The versions atleast need one key to proceed")
            const processedKeys2:string[] = []
            for (const [k2, v2] of Object.entries(v??{})) {
               if (processedKeys2.includes(k2)) throw new SerializeError(`Duplicate '${k}' key was found on the versions`)
               if (typeof latest !== "undefined") {
                if (k2===latest) latestVersionIncluded=true
               }
               if (!(typeof v2 === "object" && !obj.isArray(v2))) throw new SerializeError("Each of versions MUST be an object")
               const keys = Object.keys(v2??{})
               if (keys.length<1) {
                o.versions[k2] = {
                    yanked:false
                }
                continue
               }
               if (keys.length!==1) throw new SerializeError("Each of versions MUST only contain one key")
               for (const [k3, v3] of Object.entries(v2??{})) {
                if (k3!=="yanked") throw new SerializeError("Each of versions NEEDS to have 'yanked' property, IF the key length has more than zero")
                if (typeof v3 !== "boolean") throw new SerializeError("'yanked' MUST be a boolean")
               }
               processedKeys2.push(k2)
            }
            processedKeys.push(k)
            break
        }
        default:{
            throw new SerializeError(`Key ${k} dosent exist on type Meta`)
        }
       }
    }
    if (!latestVersionIncluded) throw new SerializeError(`Latest version ${typeof latest === "undefined"?'':`(${latest}) `}dosent included in the list of versions`)
    return o as Meta
}
/** 
 * Serialize Object for {@link VersionMeta}
 * 
 * @param input The object input
*/
export function serializeVersionMeta(input:unknown):VersionMeta{
    if (!(typeof input === "object" && !obj.isArray(input))) throw new SerializeError("The input needs to be an object")
    const o = Object(input)
    if (Object.keys(o??{}).length!==3) throw new SerializeError("The object keys MUST exactly 4 in length")
    const processedKeys:string[] = []
    for (const [k, v] of Object.entries(o??{})) {
       if (processedKeys.includes(k)) throw new SerializeError(`Duplicate '${k}' key was found on the output`)
       switch (k) {
        case "manifest":{
            if (!(typeof v === "object" && !obj.isArray(v))) throw new SerializeError("manifest MUST be an object")
            if (Object.keys(v??{}).length<1) throw new SerializeError("manifest atleast need one key to proceed")
            const processedKeys2:string[] = []
            for (const [k2, v2] of Object.entries(v??{})) {
                if (!(String(k2).startsWith("/"))) throw new SerializeError("The module path MUST be exactly start with `/` without single dot beforehand")
                if (processedKeys2.includes(k2)) throw new SerializeError(`Duplicate '${k2}' file has found in manifest`)
                if (typeof v2 !== "object") throw new SerializeError("Each of file manifest MUST be an object")
                const processedKeys3:string[] = []
                for (const [k3, v3] of Object.entries(v2)){
                if (processedKeys3.includes(k3)) throw new SerializeError(`Duplicate '${k2}' file has found in one of the manifest`);
                switch (k3) {
                    case "size":{
                      if (typeof v3 !== "number") throw new SerializeError("size on VersionMeta.manifest MUST be a number")
                      processedKeys3.push(k3)
                      break;
                    }
                    // sha256 is flexible, so theres no way to validate this without using node:crypto or such
                    case "checksum":{
                      if (typeof v3 !== "string") throw new SerializeError("checksum on VersionMeta.manifest MUST be a string")
                      if (!v3.startsWith("sha256-")) throw new SerializeError("checksum must starts with the sha256 hash prefix")
                      processedKeys3.push(k3)
                      break;
                    }
                    default:{
                      throw new SerializeError(`Key '${k3}' dosent exist for VersionMeta.manifest`)
                    }
                }
                }
            }
            processedKeys.push(k)
            break
        }
        // not enough info from the JSR itself, and its already been migrated to moduleGraph2 quickly
        case "moduleGraph1":{
            if (processedKeys.includes("moduleGraph2"))  throw new SerializeError("moduleGraph1 and moduleGraph2 cannot be on the same object, just provide either one of them")
            if (!(typeof v === "object" && !obj.isArray(v))) throw new SerializeError("moduleGraph1 MUST be an object")
            processedKeys.push(k)
            break
        }
        case "exports":{
            if (!(typeof v === "object" && !obj.isArray(v))) throw new SerializeError("exports MUST be an object")
            if (Object.keys(v??{}).length<1) throw new SerializeError("exports atleast need one key to proceed")
            const processedKeys2:string[] = []
            for (const [k2, v2] of Object.entries(v??{})) {
               if (processedKeys2.includes(k2)) throw new SerializeError(`Duplicate '${k2}' module path was found on the exports`)
               if ((k2!==".")&&!(String(k2).startsWith("./"))) throw new SerializeError("The module path MUST be exactly `.` OR starts with `./`")
               if (typeof v2 !== "string") throw new SerializeError("Each of module path MUST be a string")
                if ((v2!==".")&&!(String(v2).startsWith("./"))) throw new SerializeError("The module path MUST be exactly `.` OR starts with `./`")
               processedKeys2.push(k2)
            }
            processedKeys.push(k)
            break
        }
        case "moduleGraph2":{
            if (processedKeys.includes("moduleGraph1"))  throw new SerializeError("moduleGraph1 and moduleGraph2 cannot be on the same object, just provide either one of them")
            if (!(typeof v === "object" && !obj.isArray(v))) throw new SerializeError("moduleGraph2 MUST be an object")
            if (Object.keys(v??{}).length<1) throw new SerializeError("moduleGraph2 need at least one module to proceed")
            const processedKeys2:string[]=[]
            for (const [k2, v2] of Object.entries(v??{})) {
              if (processedKeys2.includes(k2)) throw new SerializeError(`Duplicate '${k2}' file was found on moduleGraph2`)
              if (!(String(k2).startsWith("/"))) throw new SerializeError("moduleGraph2 MUST start with `/` without a single dot beforehand")
              if (!(typeof v2 === "object" && !obj.isArray(v2))) throw new SerializeError("Each of moduleGraph2 MUST be an object")
              const keys = Object.keys(v2??{})
              if (keys.length<1) {
                processedKeys2.push(k2)
                continue
              }
              if (keys.length!==1) throw new SerializeError("Each of moduleGraph MUST only contain one key, which is 'dependencies'")
              for (const [k3, v3] of Object.entries(v2??{})) {
                switch (k3) {
                    case "dependencies":{
                        if (!obj.isLiteralArray(v3)) throw new SerializeError("dependencies MUST be an array of object")
                        if (Array(v3).length<1) throw new SerializeError("dependencies need at least one module to proceed")
                        for (const [_, v4] of Array(v3[0]).entries()) {
                            if (!(typeof v4 === "object" && !obj.isArray(v4))) throw new SerializeError("dependencies MUST be an array of object")
                            const processedKeys4:string[] = []
                            for (const [k5, v5] of Object.entries(v4??{})) {
                              if (processedKeys4.includes(k5)) throw new SerializeError(`Duplicate '${k5}' key was found on one dependecy`)
                              switch (k5) {
                                case "type":{
                                    if (typeof v5 !== "string") throw new SerializeError("type MUST be a string")
                                    if (v5!=="static"&&v5!=="dynmaic") throw new SerializeError("type value MUST be either 'static' or 'dynamic'")
                                    processedKeys4.push(k5)
                                    break
                                }
                                case "kind":{
                                    if (typeof v5 !== "string") throw new SerializeError("'kind' MUST be a string")
                                    if (v5!=="export"&&v5!=="import") throw new SerializeError("'kind' value MUST be either 'export' or 'import'")
                                    processedKeys4.push(k5)
                                    break
                                }
                                case "specifier":{
                                    if (typeof v5 !== "string") throw new SerializeError("specifier MUST be a string")
                                    processedKeys4.push(k5)
                                    break
                                }
                                case "specifierRange":{
                                    if (!obj.isArray(v5)) throw new SerializeError("specifierRange MUST be an tuple of 2 array of 2 numbers")
                                    const arr = v5 as unknown[]
                                    if (arr.length!==2) throw new SerializeError("specifierRange length MUST be 2")
                                    for (const [_, v6] of Object.entries(arr??{})) {
                                        if (!obj.isLiteralArray(v6)) throw new SerializeError("specifierRange MUST be an tuple of 2 array")
                                        const arr2 = v6 as unknown[]
                                        if (arr2.length!==2) throw new SerializeError("specifierRange MUST be an tuple of 2 array of 2 numbers")
                                        if (typeof arr2[0] !== "number" && typeof arr2[1] !== "number") throw new SerializeError("specifierRange MUST be an tuple of 2 array of 2 numbers")
                                    }
                                    processedKeys4.push(k5)
                                    break
                                }
                                default:{
                                    throw new SerializeError(`Each of dependencies dosent have '${k5}' key`)
                                }
                              }
                            }
                        }
                        break
                    }
                    default:{
                        throw new SerializeError("Each of moduleGraph MUST only contain one key, which is 'dependencies'")
                    }
                }
              }
              processedKeys2.push(k2)
            }
            processedKeys.push(k)
            break
        }
        default:{
            throw new SerializeError(`Key ${k} dosent exist on type VersionMeta`)
        }
       }
    }
    if (processedKeys.includes("moduleGraph1")&&processedKeys.includes("moduleGraph2"))  throw new SerializeError("moduleGraph1 and moduleGraph2 cannot be on the same object, just provide either one of them")
    return o as VersionMeta
}
