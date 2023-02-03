# UnityAssetParser
parse UnityAsset store images using preview

``` 
$ npm install
```

After installing the packages, you need to change the load resource ID and RPS to the Unity API in **index.ts** file

```javascript
//asset id and extension
const ASSET_ID = "####";
const FILE_EXT = "png";
const RPS = 150;
```

To start parsing and downloading
```
$ npm run start
```
files will be placed in a folder **./content/{ASSET_ID}**
