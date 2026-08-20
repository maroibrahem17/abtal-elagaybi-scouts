/**
 * Official contact and destination links.
 * Maps uses the church name + the address provided by the client.
 */
const mapsQuery = "كنيسة الشهيد العظيم مارمينا بالفيوم شارع العريان بعد فرع اورنج";

export const site = {
  name: "كشافة أبطال العجايبي",
  church: "كنيسة الشهيد العظيم مارمينا بالفيوم",
  address: "شارع العريان بعد فرع اورنج",
  phoneDisplay: "0100 123 4567",
  phoneHref: "tel:01001234567",
  email: "scouts@stmarkfayoum.org",
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
  facebook: "https://www.facebook.com/abtal.3gaiby",
  instagram: "https://www.instagram.com/stminascouts/",
};
