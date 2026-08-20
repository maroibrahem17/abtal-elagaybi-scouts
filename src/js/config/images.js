const publicImage = (path) => `${import.meta.env.BASE_URL}images/${path}`;

/**
 * Central image configuration.
 * Replace file paths here — do not scatter URLs across components.
 *
 * Hero keys:
 *   heroScoutImage      left diagonal panel
 *   heroChurchImage     center diagonal panel
 *   heroAdventureImage  right diagonal panel
 */
export const images = {
  logos: {
    scout: publicImage("logos/scout-logo.jpg"),
    church: publicImage("logos/church-logo.jpg"),
  },
  hero: {
    heroScoutImage: publicImage("hero/scout.jpg"),
    heroChurchImage: publicImage("hero/church.jpg"),
    heroAdventureImage: publicImage("hero/adventure.jpg"),
  },
  gallery: {
    assemblyHall: publicImage("gallery/assembly-hall.jpg"),
    courtyardMeeting: publicImage("gallery/courtyard-meeting.jpg"),
    courtyardFormation: publicImage("gallery/courtyard-formation.jpg"),
    workshop: publicImage("gallery/workshop.jpg"),
    scoutCircle: publicImage("gallery/scout-circle.jpg"),
  },
  products: {
    whistle: publicImage("products/whistle.jpg"),
    scarf: publicImage("products/scarf.jpg"),
    uniform: publicImage("products/uniform.jpg"),
    belt: publicImage("products/belt.jpg"),
  },
  footer: {
    fayoumMap: publicImage("footer/fayoum-map.jpg"),
  },
};

export const photoAlbum = [
  { id: "assembly-hall", src: images.gallery.assemblyHall, alt: "لقاء تدريبي داخل قاعة كشافة أبطال العجايبي" },
  { id: "courtyard-meeting", src: images.gallery.courtyardMeeting, alt: "تجمع كشفي في فناء الكنيسة" },
  { id: "courtyard-formation", src: images.gallery.courtyardFormation, alt: "فريق الكشافة في فناء الكنيسة" },
  { id: "workshop", src: images.gallery.workshop, alt: "ورشة عمل للمرشدات والكشافة" },
  { id: "scout-circle", src: images.gallery.scoutCircle, alt: "صيحات كشفية في ساحة الكنيسة" },
];

export const {
  heroScoutImage,
  heroChurchImage,
  heroAdventureImage,
} = images.hero;
