# Unofficial JSR registry bindings
## Current changelog
Release!
## Installing 
You can install this in Node! (Yes, without transpilling manually) By running
```shell
$ npx jsr add @dunno/jsr-registry-bindings
```
Or in Yarn
```shell
$ yarn dlx jsr add @dunno/jsr-registry-bindings
```
Or in pnpm
```shell
$ pnpm dlx jsr add @dunno/jsr-registry-bindings
```
---
Or in Deno (they provide their built in JSR system, so just do this)
```shell
$ deno add jsr:@dunno/jsr-registry-bindings
```
Or in Bun
```shell
$ bunx jsr add @dunno/jsr-registry-bindings
```
## Importing
By default, the module dosent have a default export. You can do it like this
```js
import * as obj from "@dunno/jsr-registry-bindings"
```
Or for [Deno](https://deno.com) users
```js
import * as obj from "jsr:@dunno/jsr-registry-bindings"
```
## Contributing
If you want to report a bug, or suggestion, make a new issue under our repository (see on the 'Links' section)
## License
This package is licensed under MIT. You can see at [LICENSE](./LICENSE)
## Links
- Repository https://github.com/teamdunno/jsr-registry-bindings
## Example
#### Find manifest for @std/tar version 0.1.3 
```js
import * as jsr from "@dunno/jsr-registry-bindings"
/* make a `main` function, because node.js dosent tolerate async functions on top-level module */
async function main(){
/*
Why im not using `new jsr.Package()`?
Because on initialization, constructor cant have asyncronous functions
so on the default class, the package dosent automatically looks for itself

But, on `jsr.Package.find()` static function, they automatically find itself
But the function returns to the same `jsr.Package` class
*/
const package = await jsr.Package.find({scope:'std', name:'tar'})
// get the version 0.1.3
const ver = await package.getVersionMeta("0.1.3")
/*
The output would something like

{
  "manifest": {
    "/tar_stream_test.ts": {
      "size": 10042,
      "checksum": "sha256-009052721c195f29a281c4c9619916fe1f41032f099d8220455f5ecd6ac0158a"
    },
    "/LICENSE": {
      "size": 1075,
      "checksum": "sha256-0961f97da6619d5fe9ddb98649191d5ca6e958856ea5252f4cce7c9b85513819"
    }, ...
*/
console.log(ver.manifest)
}
// run the main function
main().catch((e)=>{throw e}).then(()=>{})
```
