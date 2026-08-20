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
    scout: "/images/logos/scout-logo.jpg",
    church: "/images/logos/church-logo.jpg",
  },
  hero: {
    heroScoutImage: "/images/hero/scout.jpg",
    heroChurchImage: "/images/hero/church.jpg",
    heroAdventureImage: "/images/hero/adventure.jpg",
  },
  gallery: {
    assemblyHall: "/images/gallery/assembly-hall.jpg",
    courtyardMeeting: "/images/gallery/courtyard-meeting.jpg",
    courtyardFormation: "/images/gallery/courtyard-formation.jpg",
    workshop: "/images/gallery/workshop.jpg",
    scoutCircle: "/images/gallery/scout-circle.jpg",
  },
  products: {
    whistle: "/images/products/whistle.jpg",
    scarf: "/images/products/scarf.jpg",
    uniform: "/images/products/uniform.jpg",
    belt: "/images/products/belt.jpg",
  },
  footer: {
    fayoumMap: "/images/footer/fayoum-map.jpg",
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
