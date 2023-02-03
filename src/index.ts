import fs from "fs";
import ax from "axios";
import axiosRateLimit from "axios-rate-limit";

//asset id and extension
const assetId = "####";
const fileExt = "png";



const axios = axiosRateLimit(ax.create(), {
  maxRequests: 100,
  perMilliseconds: 1000,
});

const download_image = async (url: string, image_path: string) => {
  return axios({
    url,
    responseType: "stream",
  }).then(
    (response) =>
      new Promise<any>((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on("finish", () => resolve(response))
          .on("error", (e: Error) => reject(e));
      })
  );
};

/* ============================================================
  Download Images in Order
============================================================ */

const graphqlUrl = "https://assetstore.unity.com/api/graphql/batch";

let baseHeaders = {};

const getPicture = async (
  id: string,
  guid: string
): Promise<{ id: string; assetThumbnail: string }> => {
  const body = [
    {
      query:
        `query PreviewAssetThumbnail($id: ID!, $guid: String!) {
          product(id: $id) {
            id
            assetThumbnail(guid: $guid)
          }
        }`,
      variables: { id: id, guid: guid },
      operationName: "PreviewAssetThumbnail",
    },
  ];
  const res = await axios.post(graphqlUrl, body, {
    headers: baseHeaders,
    withCredentials: true,
  });

  return res.data[0].data.product;
};

const getContent = async (
  id: string
): Promise<{ guid: string; label: string; type: "file" | "folder" }[]> => {
  const body = [
    {
      query: `query PreviewAssets($id: ID!, $page: Int) { 
        product(id: $id) {
          assets(page: $page){
             guid assetId: asset_id label level type __typename
          } 
        }
      }`,
      variables: { id },
      operationName: "PreviewAssets",
    },
  ];
  const res = await axios.post(graphqlUrl, body, {
    headers: baseHeaders,
    withCredentials: true,
  });
  return res.data[0].data.product.assets;
};

const main = async () => {
  const scrfRes = await axios.get("https://assetstore.unity.com/", {
    withCredentials: true,
  });
  const csrfCookie = scrfRes.headers["set-cookie"]!;

  const csrf = csrfCookie[0].slice(6, 38);
  
  baseHeaders = {
    "X-Requested-With": "XMLHttpRequest",
    "X-Csrf-Token": csrf,
    cookie: `_csrf=${csrf}`,
  };

  if (!fs.existsSync(`content`)) fs.mkdirSync(`content`);
  if (!fs.existsSync(`content/${assetId}`)) fs.mkdirSync(`content/${assetId}`);
  const content = await getContent(assetId);
  console.log("content loaded");
  const items = content.filter(
    (el) => el.type == "file" && el.label.toLowerCase().endsWith(fileExt)
  );
  console.log("images filtered");
  const count = items.length
  let downloadSuccessCount = 0
  let urlGetSuccessCount = 0
  items.forEach(async (el) => {
    if (fs.existsSync(`content/${assetId}/${el.guid}.${fileExt}`)) return;
    const pic = await getPicture(assetId, el.guid);
    console.log(`url loaded ${urlGetSuccessCount++}/${count}`);
    await download_image(
      "https:" + pic.assetThumbnail,
      `content/${assetId}/${el.guid}.${fileExt}`
    );

    console.log(`downloaded ${downloadSuccessCount++}/${count}`);
  });
};

main();
