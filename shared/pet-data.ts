// Common pet species and breeds
export const PET_SPECIES = {
  dog: { en: "Dog", zh: "狗" },
  cat: { en: "Cat", zh: "貓" },
  rabbit: { en: "Rabbit", zh: "兔" },
  hamster: { en: "Hamster", zh: "倉鼠" },
  bird: { en: "Bird", zh: "雀鳥" },
  fish: { en: "Fish", zh: "魚" },
  turtle: { en: "Turtle", zh: "龜" },
  other: { en: "Other", zh: "其他" },
} as const;

// Top 20 dog breeds in Hong Kong
export const DOG_BREEDS = [
  { en: "Golden Retriever", zh: "金毛尋回犬" },
  { en: "Labrador Retriever", zh: "拉布拉多犬" },
  { en: "Poodle", zh: "貴婦犬" },
  { en: "Chihuahua", zh: "芝娃娃" },
  { en: "Shih Tzu", zh: "西施犬" },
  { en: "Pomeranian", zh: "松鼠狗" },
  { en: "French Bulldog", zh: "法國鬥牛犬" },
  { en: "Corgi", zh: "哥基犬" },
  { en: "Yorkshire Terrier", zh: "約瑟爹利" },
  { en: "Beagle", zh: "比高犬" },
  { en: "Samoyed", zh: "薩摩耶犬" },
  { en: "Husky", zh: "哈士奇" },
  { en: "German Shepherd", zh: "德國牧羊犬" },
  { en: "Schnauzer", zh: "史納莎" },
  { en: "Maltese", zh: "馬爾濟斯" },
  { en: "Pug", zh: "八哥犬" },
  { en: "Dachshund", zh: "臘腸犬" },
  { en: "Akita", zh: "秋田犬" },
  { en: "Shiba Inu", zh: "柴犬" },
  { en: "Mixed Breed", zh: "唐狗" },
];

// Top 20 cat breeds in Hong Kong
export const CAT_BREEDS = [
  { en: "British Shorthair", zh: "英國短毛貓" },
  { en: "American Shorthair", zh: "美國短毛貓" },
  { en: "Persian", zh: "波斯貓" },
  { en: "Scottish Fold", zh: "蘇格蘭摺耳貓" },
  { en: "Ragdoll", zh: "布偶貓" },
  { en: "Maine Coon", zh: "緬因貓" },
  { en: "Exotic Shorthair", zh: "異國短毛貓" },
  { en: "Siamese", zh: "暹羅貓" },
  { en: "Bengal", zh: "孟加拉貓" },
  { en: "Abyssinian", zh: "阿比西尼亞貓" },
  { en: "Russian Blue", zh: "俄羅斯藍貓" },
  { en: "Sphynx", zh: "無毛貓" },
  { en: "Munchkin", zh: "曼赤肯貓" },
  { en: "Norwegian Forest", zh: "挪威森林貓" },
  { en: "Birman", zh: "緬甸貓" },
  { en: "Burmese", zh: "緬甸貓" },
  { en: "Oriental", zh: "東方貓" },
  { en: "Devon Rex", zh: "德文卷毛貓" },
  { en: "Chinchilla", zh: "金吉拉" },
  { en: "Mixed Breed", zh: "唐貓" },
];

// Other pet breeds/types
export const OTHER_BREEDS: Record<string, { en: string; zh: string }[]> = {
  rabbit: [
    { en: "Holland Lop", zh: "荷蘭垂耳兔" },
    { en: "Mini Lop", zh: "迷你垂耳兔" },
    { en: "Netherland Dwarf", zh: "荷蘭侏儒兔" },
    { en: "Lionhead", zh: "獅子兔" },
    { en: "Mixed Breed", zh: "混種兔" },
  ],
  hamster: [
    { en: "Syrian Hamster", zh: "敘利亞倉鼠" },
    { en: "Dwarf Hamster", zh: "侏儒倉鼠" },
    { en: "Roborovski", zh: "老公公倉鼠" },
    { en: "Campbell's Dwarf", zh: "坎培爾倉鼠" },
  ],
  bird: [
    { en: "Budgie", zh: "虎皮鸚鵡" },
    { en: "Cockatiel", zh: "玄鳳鸚鵡" },
    { en: "Lovebird", zh: "情侶鸚鵡" },
    { en: "Canary", zh: "金絲雀" },
    { en: "Finch", zh: "文鳥" },
  ],
  fish: [
    { en: "Goldfish", zh: "金魚" },
    { en: "Betta", zh: "鬥魚" },
    { en: "Guppy", zh: "孔雀魚" },
    { en: "Koi", zh: "錦鯉" },
    { en: "Tropical Fish", zh: "熱帶魚" },
  ],
  turtle: [
    { en: "Red-eared Slider", zh: "巴西龜" },
    { en: "Box Turtle", zh: "箱龜" },
    { en: "Map Turtle", zh: "地圖龜" },
    { en: "Musk Turtle", zh: "麝香龜" },
  ],
  other: [
    { en: "Custom", zh: "自訂" },
  ],
};

export function getBreedOptions(species: string): { en: string; zh: string }[] {
  switch (species) {
    case "dog":
      return DOG_BREEDS;
    case "cat":
      return CAT_BREEDS;
    default:
      return OTHER_BREEDS[species] || [{ en: "Custom", zh: "自訂" }];
  }
}
