// 常用機場資料庫（以台灣出發的常見航點為主）。
// zh: 中文顯示名；en: 英文名（供模糊搜尋）；region: 地區分組（瀏覽模式用）。

export type Airport = {
  code: string;
  zh: string;
  en: string;
  region: string;
};

export const REGIONS = ["台灣", "日本", "韓國", "港澳・中國", "東南亞", "南亞・中東", "大洋洲・太平洋", "北美", "歐洲"] as const;

// [代碼, 中文名, 英文名]
const DATA: Record<string, [string, string, string][]> = {
  "台灣": [
    ["TPE", "台北桃園", "Taipei Taoyuan"],
    ["TSA", "台北松山", "Taipei Songshan"],
    ["KHH", "高雄小港", "Kaohsiung"],
    ["RMQ", "台中清泉崗", "Taichung"],
    ["TNN", "台南", "Tainan"],
    ["HUN", "花蓮", "Hualien"],
    ["TTT", "台東", "Taitung"],
    ["KNH", "金門", "Kinmen"],
    ["MZG", "澎湖馬公", "Penghu Magong"],
  ],
  "日本": [
    ["NRT", "東京成田", "Tokyo Narita"],
    ["HND", "東京羽田", "Tokyo Haneda"],
    ["KIX", "大阪關西", "Osaka Kansai"],
    ["ITM", "大阪伊丹", "Osaka Itami"],
    ["UKB", "神戶", "Kobe"],
    ["NGO", "名古屋中部", "Nagoya Chubu"],
    ["CTS", "札幌新千歲", "Sapporo New Chitose"],
    ["HKD", "函館", "Hakodate"],
    ["AOJ", "青森", "Aomori"],
    ["SDJ", "仙台", "Sendai"],
    ["KIJ", "新潟", "Niigata"],
    ["KMQ", "小松（金澤）", "Komatsu Kanazawa"],
    ["FSZ", "靜岡", "Shizuoka"],
    ["FUK", "福岡", "Fukuoka"],
    ["KKJ", "北九州", "Kitakyushu"],
    ["OKA", "沖繩那霸", "Okinawa Naha"],
    ["ISG", "石垣島", "Ishigaki"],
    ["OKJ", "岡山", "Okayama"],
    ["HIJ", "廣島", "Hiroshima"],
    ["TAK", "高松", "Takamatsu"],
    ["MYJ", "松山（愛媛）", "Matsuyama"],
    ["KCZ", "高知", "Kochi"],
    ["KOJ", "鹿兒島", "Kagoshima"],
    ["KMJ", "熊本", "Kumamoto"],
    ["NGS", "長崎", "Nagasaki"],
    ["OIT", "大分", "Oita"],
  ],
  "韓國": [
    ["ICN", "首爾仁川", "Seoul Incheon"],
    ["GMP", "首爾金浦", "Seoul Gimpo"],
    ["PUS", "釜山金海", "Busan Gimhae"],
    ["CJU", "濟州", "Jeju"],
    ["TAE", "大邱", "Daegu"],
  ],
  "港澳・中國": [
    ["HKG", "香港", "Hong Kong"],
    ["MFM", "澳門", "Macau"],
    ["PVG", "上海浦東", "Shanghai Pudong"],
    ["SHA", "上海虹橋", "Shanghai Hongqiao"],
    ["PEK", "北京首都", "Beijing Capital"],
    ["PKX", "北京大興", "Beijing Daxing"],
    ["CAN", "廣州白雲", "Guangzhou"],
    ["SZX", "深圳寶安", "Shenzhen"],
    ["XMN", "廈門", "Xiamen"],
    ["FOC", "福州", "Fuzhou"],
    ["CTU", "成都雙流", "Chengdu Shuangliu"],
    ["TFU", "成都天府", "Chengdu Tianfu"],
    ["CKG", "重慶", "Chongqing"],
    ["KMG", "昆明", "Kunming"],
    ["XIY", "西安", "Xian"],
    ["HGH", "杭州", "Hangzhou"],
    ["NKG", "南京", "Nanjing"],
    ["WUH", "武漢", "Wuhan"],
    ["CSX", "長沙", "Changsha"],
    ["TAO", "青島", "Qingdao"],
    ["DLC", "大連", "Dalian"],
    ["SHE", "瀋陽", "Shenyang"],
    ["HRB", "哈爾濱", "Harbin"],
    ["TSN", "天津", "Tianjin"],
  ],
  "東南亞": [
    ["BKK", "曼谷蘇凡納布", "Bangkok Suvarnabhumi"],
    ["DMK", "曼谷廊曼", "Bangkok Don Mueang"],
    ["CNX", "清邁", "Chiang Mai"],
    ["HKT", "普吉島", "Phuket"],
    ["KBV", "喀比", "Krabi"],
    ["USM", "蘇美島", "Koh Samui"],
    ["SIN", "新加坡樟宜", "Singapore Changi"],
    ["KUL", "吉隆坡", "Kuala Lumpur"],
    ["PEN", "檳城", "Penang"],
    ["BKI", "亞庇（沙巴）", "Kota Kinabalu"],
    ["SGN", "胡志明市", "Ho Chi Minh City"],
    ["HAN", "河內", "Hanoi"],
    ["DAD", "峴港", "Da Nang"],
    ["CXR", "芽莊金蘭", "Nha Trang Cam Ranh"],
    ["PQC", "富國島", "Phu Quoc"],
    ["MNL", "馬尼拉", "Manila"],
    ["CEB", "宿霧", "Cebu"],
    ["CRK", "克拉克", "Clark"],
    ["KLO", "卡利博（長灘島）", "Kalibo Boracay"],
    ["PPS", "公主港（巴拉望）", "Puerto Princesa Palawan"],
    ["RGN", "仰光", "Yangon"],
    ["PNH", "金邊", "Phnom Penh"],
    ["REP", "暹粒（吳哥窟）", "Siem Reap Angkor"],
    ["VTE", "永珍", "Vientiane"],
    ["LPQ", "龍坡邦", "Luang Prabang"],
    ["DPS", "峇里島", "Bali Denpasar"],
    ["CGK", "雅加達", "Jakarta"],
    ["SUB", "泗水", "Surabaya"],
    ["BWN", "汶萊", "Brunei"],
  ],
  "南亞・中東": [
    ["DEL", "德里", "Delhi"],
    ["BOM", "孟買", "Mumbai"],
    ["CMB", "可倫坡", "Colombo"],
    ["MLE", "馬爾地夫馬累", "Maldives Male"],
    ["KTM", "加德滿都", "Kathmandu"],
    ["DXB", "杜拜", "Dubai"],
    ["AUH", "阿布達比", "Abu Dhabi"],
    ["DOH", "杜哈", "Doha"],
    ["IST", "伊斯坦堡", "Istanbul"],
  ],
  "大洋洲・太平洋": [
    ["SYD", "雪梨", "Sydney"],
    ["MEL", "墨爾本", "Melbourne"],
    ["BNE", "布里斯本", "Brisbane"],
    ["PER", "伯斯", "Perth"],
    ["AKL", "奧克蘭", "Auckland"],
    ["CHC", "基督城", "Christchurch"],
    ["GUM", "關島", "Guam"],
    ["SPN", "塞班島", "Saipan"],
  ],
  "北美": [
    ["HNL", "檀香山（夏威夷）", "Honolulu Hawaii"],
    ["LAX", "洛杉磯", "Los Angeles"],
    ["SFO", "舊金山", "San Francisco"],
    ["SAN", "聖地牙哥", "San Diego"],
    ["SEA", "西雅圖", "Seattle"],
    ["PDX", "波特蘭", "Portland"],
    ["LAS", "拉斯維加斯", "Las Vegas"],
    ["PHX", "鳳凰城", "Phoenix"],
    ["DEN", "丹佛", "Denver"],
    ["DFW", "達拉斯", "Dallas"],
    ["IAH", "休士頓", "Houston"],
    ["ORD", "芝加哥", "Chicago"],
    ["DTW", "底特律", "Detroit"],
    ["ATL", "亞特蘭大", "Atlanta"],
    ["MIA", "邁阿密", "Miami"],
    ["MCO", "奧蘭多", "Orlando"],
    ["JFK", "紐約甘迺迪", "New York JFK"],
    ["EWR", "紐華克", "Newark"],
    ["BOS", "波士頓", "Boston"],
    ["IAD", "華盛頓杜勒斯", "Washington Dulles"],
    ["YVR", "溫哥華", "Vancouver"],
    ["YYZ", "多倫多", "Toronto"],
    ["YUL", "蒙特婁", "Montreal"],
  ],
  "歐洲": [
    ["LHR", "倫敦希斯洛", "London Heathrow"],
    ["LGW", "倫敦蓋威克", "London Gatwick"],
    ["CDG", "巴黎戴高樂", "Paris CDG"],
    ["AMS", "阿姆斯特丹", "Amsterdam"],
    ["FRA", "法蘭克福", "Frankfurt"],
    ["MUC", "慕尼黑", "Munich"],
    ["ZRH", "蘇黎世", "Zurich"],
    ["VIE", "維也納", "Vienna"],
    ["PRG", "布拉格", "Prague"],
    ["FCO", "羅馬", "Rome Fiumicino"],
    ["MXP", "米蘭", "Milan Malpensa"],
    ["MAD", "馬德里", "Madrid"],
    ["BCN", "巴塞隆納", "Barcelona"],
    ["LIS", "里斯本", "Lisbon"],
    ["BRU", "布魯塞爾", "Brussels"],
    ["CPH", "哥本哈根", "Copenhagen"],
    ["ARN", "斯德哥爾摩", "Stockholm"],
    ["OSL", "奧斯陸", "Oslo"],
    ["HEL", "赫爾辛基", "Helsinki"],
    ["WAW", "華沙", "Warsaw"],
    ["BUD", "布達佩斯", "Budapest"],
    ["ATH", "雅典", "Athens"],
  ],
};

export const AIRPORTS: Airport[] = Object.entries(DATA).flatMap(
  ([region, list]) => list.map(([code, zh, en]) => ({ code, zh, en, region }))
);

const byCode = new Map(AIRPORTS.map((a) => [a.code, a]));

export function findAirport(code: string | null | undefined): Airport | null {
  if (!code) return null;
  return byCode.get(code.toUpperCase()) ?? null;
}

/** 顯示用："東京成田（NRT）"；查無代碼時退回原始代碼。 */
export function airportLabel(code: string): string {
  const airport = findAirport(code);
  return airport ? `${airport.zh}（${airport.code}）` : code;
}

/**
 * 模糊搜尋：支援 IATA 代碼（前綴）、中文名、英文名（子字串）。
 * 空字串回傳全部機場（UI 端以地區分組呈現）。
 */
export function searchAirports(query: string, limit = 10): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS;

  const scored: { airport: Airport; score: number }[] = [];
  for (const airport of AIRPORTS) {
    const code = airport.code.toLowerCase();
    let score = -1;
    if (code === q) score = 0;
    else if (code.startsWith(q)) score = 1;
    else if (airport.zh.includes(query.trim())) score = 2;
    else if (airport.en.toLowerCase().includes(q)) score = 3;
    if (score >= 0) scored.push({ airport, score });
  }
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.airport);
}
