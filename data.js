/*
 * RollRoute — configuration (categories / statuses / features) and seed dataset.
 * All seed place names are fictional, invented for demo purposes and anchored
 * near real neighbourhoods across Thailand (Bangkok, Chiang Mai, Khon Kaen,
 * Phuket, and Pattaya/Chonburi) so the map convincingly demonstrates
 * nationwide coverage. No real business names, brands or logos are used.
 * Clearly labelled isSeed:true throughout the app.
 */
(function (global) {
  "use strict";

  var CATEGORIES = [
    { id: "restaurant", th: "ร้านอาหาร", en: "Restaurant", icon: "catRestaurant" },
    { id: "cafe", th: "ร้านกาแฟ", en: "Cafe", icon: "catCafe" },
    { id: "hospital", th: "โรงพยาบาล/คลินิก", en: "Hospital / clinic", icon: "catHospital" },
    { id: "government", th: "หน่วยงานราชการ", en: "Government office", icon: "catGovernment" },
    { id: "transit", th: "ระบบขนส่ง", en: "Transit station", icon: "catTransit" },
    { id: "shop", th: "ร้านค้า/ห้างสรรพสินค้า", en: "Shop / mall", icon: "catShop" },
    { id: "school", th: "โรงเรียน/มหาวิทยาลัย", en: "School / university", icon: "catSchool" },
    { id: "park", th: "สวนสาธารณะ", en: "Park", icon: "catPark" },
    { id: "temple", th: "วัด/ศาสนสถาน", en: "Temple / place of worship", icon: "catTemple" },
    { id: "pharmacy", th: "ร้านขายยา", en: "Pharmacy", icon: "catPharmacy" },
    { id: "other", th: "อื่น ๆ", en: "Other", icon: "catOther" }
  ];

  var STATUSES = {
    full: { id: "full", th: "เข้าถึงได้เต็มที่", en: "Fully accessible", icon: "statusFull", short_th: "เต็มที่" },
    partial: { id: "partial", th: "เข้าถึงได้บางส่วน", en: "Partially accessible", icon: "statusPartial", short_th: "บางส่วน" },
    none: { id: "none", th: "เข้าถึงไม่ได้", en: "Not accessible", icon: "statusNone", short_th: "เข้าถึงไม่ได้" },
    unrated: { id: "unrated", th: "ยังไม่มีข้อมูล", en: "Not yet rated", icon: "statusUnrated", short_th: "ไม่มีข้อมูล" }
  };
  var STATUS_ORDER = ["full", "partial", "none", "unrated"];

  var FEATURES = [
    { id: "step_free_entrance", th: "ทางเข้าไม่มีขั้นบันได", en: "Step-free entrance", icon: "featureEntrance" },
    { id: "ramp", th: "มีทางลาด", en: "Ramp available", icon: "featureRamp" },
    { id: "accessible_restroom", th: "ห้องน้ำสำหรับผู้พิการ", en: "Accessible restroom", icon: "featureRestroom" },
    { id: "elevator", th: "มีลิฟต์", en: "Elevator", icon: "featureElevator" },
    { id: "wide_doorway", th: "ประตู/ทางเดินกว้างพอสำหรับรถเข็น", en: "Wide doorway / path", icon: "featureWideDoor" },
    { id: "accessible_parking", th: "ที่จอดรถสำหรับผู้พิการ", en: "Accessible parking", icon: "featureParking" }
  ];

  /*
   * Path-quality attributes — the "curb-cut effect" layer. One dataset
   * serves wheelchair users first AND walkers/runners/stroller parents:
   * a step-free, even, shaded, well-lit, wide path is good for all of
   * them. These attributes EXTEND the accessibility record above; the
   * four-level accessibility status stays the primary status everywhere.
   */
  var PATH_ATTRS = [
    { id: "surface", th: "พื้นผิวทางเดิน", en: "Surface", icon: "pathSurface", options: [
      { id: "paved", th: "เรียบ ลาดยาง/ปูน", en: "Paved and even" },
      { id: "uneven", th: "ขรุขระ/ชำรุดบางช่วง", en: "Uneven in places" },
      { id: "gravel", th: "กรวด/ลูกรัง", en: "Gravel" },
      { id: "grass", th: "หญ้า/ดิน", en: "Grass or dirt" }
    ] },
    { id: "shade", th: "ร่มเงา", en: "Shade", icon: "pathShade", options: [
      { id: "good", th: "ร่มรื่นตลอดทาง", en: "Well shaded" },
      { id: "partial", th: "ร่มบางช่วง", en: "Partly shaded" },
      { id: "none", th: "กลางแดด", en: "No shade" }
    ] },
    { id: "lighting", th: "แสงสว่างกลางคืน", en: "Night lighting", icon: "pathLight", options: [
      { id: "good", th: "สว่างดี", en: "Well lit" },
      { id: "partial", th: "สว่างบางจุด", en: "Partly lit" },
      { id: "none", th: "มืด", en: "Unlit" }
    ] },
    { id: "width", th: "ความกว้าง/ความหนาแน่น", en: "Width and crowding", icon: "pathWidth", options: [
      { id: "wide", th: "กว้าง สวนกันได้สบาย", en: "Wide, two can pass easily" },
      { id: "medium", th: "พอสวนกันได้", en: "Passable" },
      { id: "narrow", th: "แคบหรือแออัด", en: "Narrow or crowded" }
    ] }
  ];

  function place(p) { return p; }

  var SEED_PLACES = [
    place({ id: "seed-01", name_th: "ครัวคลองบางกอก", name_en: "Khlong Bangkok Kitchen", category: "restaurant",
      lat: 13.7207, lng: 100.5296, address_th: "ถนนสาทรเหนือ เขตบางรัก", status: "full",
      features: ["step_free_entrance", "ramp", "accessible_restroom", "wide_doorway"],
      contributorCount: 6, lastUpdated: "2026-06-28T10:15:00+07:00",
      notes: [{ id: "n1", text: "ทางเข้าไม่มีขั้นบันไดเลย มีที่จอดรถวีลแชร์ด้วยครับ", author: "ผู้ใช้นิรนาม 4821", createdAt: "2026-06-28T10:15:00+07:00" }] }),

    place({ id: "seed-02", name_th: "คาเฟ่เก้าแต้ม", name_en: "Kao Taem Cafe", category: "cafe",
      lat: 13.7301, lng: 100.5804, address_th: "ซอยทองหล่อ 9 เขตวัฒนา", status: "partial",
      features: ["step_free_entrance"],
      contributorCount: 3, lastUpdated: "2026-06-02T14:40:00+07:00",
      notes: [{ id: "n2", text: "เข้าร้านได้แบบไม่มีขั้น แต่ห้องน้ำอยู่ชั้นบน ไม่มีลิฟต์", author: "นักเดินทางวีลแชร์", createdAt: "2026-06-02T14:40:00+07:00" }] }),

    place({ id: "seed-03", name_th: "โรงพยาบาลรวมใจเมือง", name_en: "Ruamjai Muang Hospital", category: "hospital",
      lat: 13.7382, lng: 100.5605, address_th: "ถนนสุขุมวิท เขตวัฒนา", status: "full",
      features: ["step_free_entrance", "ramp", "accessible_restroom", "elevator", "wide_doorway", "accessible_parking"],
      contributorCount: 14, lastUpdated: "2026-07-10T09:05:00+07:00",
      notes: [{ id: "n3", text: "โรงพยาบาลออกแบบมาดีมาก มีลิฟต์ทุกอาคารและป้ายชัดเจน", author: "คุณแม่ลูกอ่อน", createdAt: "2026-07-10T09:05:00+07:00" }] }),

    place({ id: "seed-04", name_th: "สำนักงานเขตตัวอย่างกลางเมือง", name_en: "Central District Office (sample)", category: "government",
      lat: 13.7241, lng: 100.5336, address_th: "ถนนสีลม เขตบางรัก", status: "partial",
      features: ["ramp", "wide_doorway"],
      contributorCount: 4, lastUpdated: "2026-05-19T11:20:00+07:00",
      notes: [{ id: "n4", text: "มีทางลาดด้านข้างอาคาร แต่ค่อนข้างชัน ต้องมีคนช่วยเข็น", author: "ผู้ใช้นิรนาม 1190", createdAt: "2026-05-19T11:20:00+07:00" }] }),

    place({ id: "seed-05", name_th: "สถานีสายสุขใจ แยกสยาม", name_en: "Sukjai Line — Siam", category: "transit",
      lat: 13.7457, lng: 100.5340, address_th: "แยกสยาม เขตปทุมวัน", status: "full",
      features: ["step_free_entrance", "elevator", "wide_doorway"],
      contributorCount: 21, lastUpdated: "2026-07-15T08:30:00+07:00",
      notes: [{ id: "n5", text: "มีลิฟต์ทุกทางออก และเจ้าหน้าที่พร้อมช่วยเหลือตลอดเวลา", author: "ผู้ใช้ประจำสาย", createdAt: "2026-07-15T08:30:00+07:00" }] }),

    place({ id: "seed-06", name_th: "ห้างสรรพสินค้าลานคนเมือง", name_en: "Lan Khon Mueang Mall", category: "shop",
      lat: 13.7663, lng: 100.5734, address_th: "ถนนรัชดาภิเษก เขตดินแดง", status: "full",
      features: ["step_free_entrance", "ramp", "accessible_restroom", "elevator", "wide_doorway", "accessible_parking"],
      contributorCount: 9, lastUpdated: "2026-06-20T16:00:00+07:00",
      notes: [{ id: "n6", text: "ที่จอดรถผู้พิการอยู่ใกล้ลิฟต์มาก สะดวกดี", author: "ผู้ใช้นิรนาม 7702", createdAt: "2026-06-20T16:00:00+07:00" }] }),

    place({ id: "seed-07", name_th: "ร้านค้าปลีกมุมถนนอารีย์", name_en: "Ari Corner Shop", category: "shop",
      lat: 13.7793, lng: 100.5443, address_th: "ซอยอารีย์ 4 เขตพญาไท", status: "none",
      features: [],
      contributorCount: 2, lastUpdated: "2026-04-11T13:10:00+07:00",
      notes: [{ id: "n7", text: "มีขั้นบันได 3 ขั้นตรงทางเข้า ไม่มีทางลาดเลย", author: "ผู้ใช้นิรนาม 3345", createdAt: "2026-04-11T13:10:00+07:00" }] }),

    place({ id: "seed-08", name_th: "โรงเรียนวิถีใหม่", name_en: "Withi Mai School", category: "school",
      lat: 13.8003, lng: 100.5508, address_th: "ถนนพหลโยธิน เขตจตุจักร", status: "partial",
      features: ["ramp", "wide_doorway"],
      contributorCount: 5, lastUpdated: "2026-05-30T09:45:00+07:00",
      notes: [{ id: "n8", text: "อาคารเรียนหลักมีทางลาด แต่โรงยิมยังเข้าไม่ได้", author: "ผู้ปกครองนักเรียน", createdAt: "2026-05-30T09:45:00+07:00" }] }),

    place({ id: "seed-09", name_th: "มหาวิทยาลัยเปิดโลก", name_en: "Perd Lok University", category: "school",
      lat: 13.7654, lng: 100.5372, address_th: "ถนนราชวิถี เขตราชเทวี", status: "full",
      features: ["step_free_entrance", "ramp", "accessible_restroom", "elevator", "wide_doorway"],
      contributorCount: 11, lastUpdated: "2026-07-02T15:25:00+07:00",
      notes: [{ id: "n9", text: "ทุกอาคารมีทางลาดและลิฟต์ ห้องน้ำผู้พิการอยู่ทุกชั้น", author: "นักศึกษาปี 3", createdAt: "2026-07-02T15:25:00+07:00" }] }),

    place({ id: "seed-10", name_th: "สวนสาธารณะลมหายใจ", name_en: "Lom Hai Jai Park", category: "park",
      lat: 13.7986, lng: 100.5537, address_th: "ถนนกำแพงเพชร 2 เขตจตุจักร", status: "full",
      features: ["ramp", "wide_doorway", "accessible_restroom"],
      contributorCount: 8, lastUpdated: "2026-06-14T07:50:00+07:00",
      notes: [{ id: "n10", text: "ทางเดินในสวนเป็นพื้นเรียบตลอดเส้นทาง เข็นสบายมาก", author: "ผู้ใช้นิรนาม 5561", createdAt: "2026-06-14T07:50:00+07:00" }] }),

    place({ id: "seed-11", name_th: "วัดโพธิ์ทองสมมติ", name_en: "Wat Pho Thong (sample)", category: "temple",
      lat: 13.7284, lng: 100.5057, address_th: "ริมแม่น้ำเจ้าพระยา เขตบางรัก", status: "none",
      features: [],
      contributorCount: 3, lastUpdated: "2026-03-22T10:00:00+07:00",
      notes: [{ id: "n11", text: "ทางเข้าโบสถ์เป็นบันไดสูงชัน ไม่มีทางเลือกอื่น", author: "ผู้ใช้นิรนาม 9012", createdAt: "2026-03-22T10:00:00+07:00" }] }),

    place({ id: "seed-12", name_th: "ร้านขายยาใจดี", name_en: "Jai Dee Pharmacy", category: "pharmacy",
      lat: 13.7305, lng: 100.5695, address_th: "ถนนสุขุมวิท 39 เขตวัฒนา", status: "full",
      features: ["step_free_entrance", "wide_doorway"],
      contributorCount: 4, lastUpdated: "2026-06-08T18:20:00+07:00",
      notes: [{ id: "n12", text: "หน้าร้านเสมอพื้นถนนพอดี เข็นเข้าออกง่าย", author: "ผู้ใช้นิรนาม 2247", createdAt: "2026-06-08T18:20:00+07:00" }] }),

    place({ id: "seed-13", name_th: "ร้านอาหารเรือนไม้เอกมัย", name_en: "Ruean Mai Ekkamai", category: "restaurant",
      lat: 13.7192, lng: 100.5854, address_th: "ซอยเอกมัย 12 เขตวัฒนา", status: "partial",
      features: ["ramp"],
      contributorCount: 2, lastUpdated: "2026-05-05T19:10:00+07:00",
      notes: [{ id: "n13", text: "มีทางลาดไม้ตรงบันได แต่ห้องน้ำผู้พิการยังไม่มี", author: "ผู้ใช้นิรนาม 6634", createdAt: "2026-05-05T19:10:00+07:00" }] }),

    place({ id: "seed-14", name_th: "คาเฟ่ต้นไม้อารีย์", name_en: "Ton Mai Cafe Ari", category: "cafe",
      lat: 13.7787, lng: 100.5462, address_th: "ซอยอารีย์สัมพันธ์ เขตพญาไท", status: "unrated",
      features: [], contributorCount: 0, lastUpdated: "2026-07-01T12:00:00+07:00", notes: [] }),

    place({ id: "seed-15", name_th: "สถานีขนส่งสายเหนือจำลอง", name_en: "Northern Terminal (sample)", category: "transit",
      lat: 13.8225, lng: 100.5566, address_th: "ถนนกำแพงเพชร 2 เขตจตุจักร", status: "partial",
      features: ["ramp", "elevator"],
      contributorCount: 7, lastUpdated: "2026-06-25T06:40:00+07:00",
      notes: [{ id: "n15", text: "มีลิฟต์แต่ค่อนข้างเก่าและใช้เวลานาน ทางลาดใช้ได้ดี", author: "ผู้โดยสารประจำ", createdAt: "2026-06-25T06:40:00+07:00" }] }),

    place({ id: "seed-16", name_th: "สำนักงานที่ดินตัวอย่าง", name_en: "Land Office (sample)", category: "government",
      lat: 13.8017, lng: 100.5479, address_th: "ถนนพหลโยธิน เขตจตุจักร", status: "none",
      features: [],
      contributorCount: 1, lastUpdated: "2026-04-27T10:30:00+07:00",
      notes: [{ id: "n16", text: "มีแค่บันไดหน้าอาคาร ไม่มีทางลาดหรือลิฟต์สำรอง", author: "ผู้ใช้นิรนาม 4470", createdAt: "2026-04-27T10:30:00+07:00" }] }),

    place({ id: "seed-17", name_th: "คลินิกทันตกรรมยิ้มสดใส", name_en: "Yim Sodsai Dental Clinic", category: "hospital",
      lat: 13.7318, lng: 100.5789, address_th: "ซอยทองหล่อ 4 เขตวัฒนา", status: "full",
      features: ["step_free_entrance", "accessible_restroom", "wide_doorway", "accessible_parking"],
      contributorCount: 5, lastUpdated: "2026-06-30T13:55:00+07:00",
      notes: [{ id: "n17", text: "คลินิกอยู่ชั้นล่าง ทางเข้าโล่งไม่มีขั้น มีที่จอดรถให้ 2 คัน", author: "ผู้ใช้นิรนาม 8890", createdAt: "2026-06-30T13:55:00+07:00" }] }),

    place({ id: "seed-18", name_th: "สวนหย่อมกลางเมืองสีลม", name_en: "Silom Pocket Park", category: "park",
      lat: 13.7239, lng: 100.5301, address_th: "ถนนสีลม เขตบางรัก", status: "unrated",
      features: [], contributorCount: 0, lastUpdated: "2026-06-05T09:00:00+07:00", notes: [] }),

    // --- Chiang Mai (North) ---
    place({ id: "seed-19", name_th: "ร้านกาแฟดอยหลวงจำลอง", name_en: "Doi Luang Cafe (sample)", category: "cafe",
      lat: 18.7994, lng: 98.9673, address_th: "ถนนนิมมานเหมินท์ อำเภอเมืองเชียงใหม่", status: "full",
      features: ["step_free_entrance", "ramp", "wide_doorway"],
      contributorCount: 6, lastUpdated: "2026-07-08T09:20:00+07:00",
      notes: [{ id: "n19", text: "ทางเข้าเสมอพื้นถนน โต๊ะจัดวางเว้นช่องกว้างพอสำหรับรถเข็น", author: "ผู้ใช้นิรนาม 3312", createdAt: "2026-07-08T09:20:00+07:00" }] }),

    place({ id: "seed-20", name_th: "โรงพยาบาลประจำจังหวัดเชียงใหม่จำลอง", name_en: "Chiang Mai Provincial Hospital (sample)", category: "hospital",
      lat: 18.7811, lng: 98.9931, address_th: "ถนนสุเทพ อำเภอเมืองเชียงใหม่", status: "full",
      features: ["step_free_entrance", "ramp", "accessible_restroom", "elevator", "wide_doorway", "accessible_parking"],
      contributorCount: 12, lastUpdated: "2026-07-12T11:40:00+07:00",
      notes: [{ id: "n20", text: "มีทางลาดและลิฟต์ครบทุกอาคาร ป้ายบอกทางชัดเจน", author: "ผู้ใช้นิรนาม 7765", createdAt: "2026-07-12T11:40:00+07:00" }] }),

    place({ id: "seed-21", name_th: "วัดพระธาตุดอยจำลอง", name_en: "Wat Phra That Doi (sample)", category: "temple",
      lat: 18.8047, lng: 98.9214, address_th: "อำเภอเมืองเชียงใหม่", status: "none",
      features: [],
      contributorCount: 3, lastUpdated: "2026-05-14T08:30:00+07:00",
      notes: [{ id: "n21", text: "ต้องขึ้นบันไดนาคหลายร้อยขั้น ไม่มีทางลาดหรือกระเช้า", author: "ผู้ใช้นิรนาม 2201", createdAt: "2026-05-14T08:30:00+07:00" }] }),

    // --- Khon Kaen (Northeast / Isaan) ---
    place({ id: "seed-22", name_th: "ร้านอาหารบึงแก่นนครจำลอง", name_en: "Bueng Kaen Nakhon Restaurant (sample)", category: "restaurant",
      lat: 16.4222, lng: 102.8236, address_th: "ริมบึงแก่นนคร อำเภอเมืองขอนแก่น", status: "partial",
      features: ["ramp"],
      contributorCount: 2, lastUpdated: "2026-06-01T18:05:00+07:00",
      notes: [{ id: "n22", text: "มีทางลาดตรงทางเข้า แต่ห้องน้ำผู้พิการยังไม่มี", author: "ผู้ใช้นิรนาม 5540", createdAt: "2026-06-01T18:05:00+07:00" }] }),

    place({ id: "seed-23", name_th: "สถานีขนส่งขอนแก่นจำลอง", name_en: "Khon Kaen Bus Terminal (sample)", category: "transit",
      lat: 16.4485, lng: 102.8534, address_th: "อำเภอเมืองขอนแก่น", status: "full",
      features: ["step_free_entrance", "ramp", "wide_doorway", "accessible_restroom"],
      contributorCount: 9, lastUpdated: "2026-06-27T07:15:00+07:00",
      notes: [{ id: "n23", text: "ชานชาลาเสมอพื้น ทางลาดขึ้นรถบัสมีให้บริการ", author: "ผู้โดยสารประจำ", createdAt: "2026-06-27T07:15:00+07:00" }] }),

    place({ id: "seed-24", name_th: "ห้างสรรพสินค้ากลางเมืองขอนแก่นจำลอง", name_en: "Khon Kaen Central Mall (sample)", category: "shop",
      lat: 16.4402, lng: 102.8330, address_th: "อำเภอเมืองขอนแก่น", status: "unrated",
      features: [], contributorCount: 0, lastUpdated: "2026-07-05T10:00:00+07:00", notes: [] }),

    // --- Phuket (South) ---
    place({ id: "seed-25", name_th: "ร้านอาหารหาดป่าตองจำลอง", name_en: "Patong Beach Restaurant (sample)", category: "restaurant",
      lat: 7.8969, lng: 98.2965, address_th: "หาดป่าตอง อำเภอกะทู้", status: "partial",
      features: ["step_free_entrance"],
      contributorCount: 4, lastUpdated: "2026-06-18T19:30:00+07:00",
      notes: [{ id: "n25", text: "ทางเข้าไม่มีขั้น แต่พื้นทรายรอบร้านเข็นลำบาก", author: "ผู้ใช้นิรนาม 6612", createdAt: "2026-06-18T19:30:00+07:00" }] }),

    place({ id: "seed-26", name_th: "โรงพยาบาลภูเก็ตจำลอง", name_en: "Phuket Hospital (sample)", category: "hospital",
      lat: 7.8853, lng: 98.3931, address_th: "อำเภอเมืองภูเก็ต", status: "full",
      features: ["step_free_entrance", "ramp", "accessible_restroom", "elevator", "wide_doorway", "accessible_parking"],
      contributorCount: 10, lastUpdated: "2026-07-09T13:00:00+07:00",
      notes: [{ id: "n26", text: "ที่จอดรถผู้พิการอยู่ใกล้ทางเข้าหลัก มีลิฟต์ทุกตึก", author: "ผู้ใช้นิรนาม 4409", createdAt: "2026-07-09T13:00:00+07:00" }] }),

    place({ id: "seed-27", name_th: "สวนสาธารณะริมทะเลภูเก็ตจำลอง", name_en: "Phuket Seaside Park (sample)", category: "park",
      lat: 7.8776, lng: 98.3959, address_th: "อำเภอเมืองภูเก็ต", status: "full",
      features: ["ramp", "wide_doorway", "accessible_restroom"],
      contributorCount: 5, lastUpdated: "2026-06-22T17:10:00+07:00",
      notes: [{ id: "n27", text: "ทางเดินเลียบทะเลเป็นพื้นเรียบตลอดสาย", author: "ผู้ใช้นิรนาม 8890", createdAt: "2026-06-22T17:10:00+07:00" }] }),

    // --- Pattaya / Chonburi (East) ---
    place({ id: "seed-28", name_th: "ร้านกาแฟชายหาดพัทยาจำลอง", name_en: "Pattaya Beachside Cafe (sample)", category: "cafe",
      lat: 12.9280, lng: 100.8770, address_th: "ถนนเลียบชายหาดพัทยา อำเภอบางละมุง", status: "full",
      features: ["step_free_entrance", "wide_doorway"],
      contributorCount: 7, lastUpdated: "2026-07-11T16:20:00+07:00",
      notes: [{ id: "n28", text: "ทางเดินริมหาดเสมอพื้น เข้าร้านได้โดยไม่มีขั้น", author: "ผู้ใช้นิรนาม 1183", createdAt: "2026-07-11T16:20:00+07:00" }] }),

    place({ id: "seed-29", name_th: "สำนักงานเขตพัทยาจำลอง", name_en: "Pattaya District Office (sample)", category: "government",
      lat: 12.9357, lng: 100.8823, address_th: "อำเภอบางละมุง", status: "partial",
      features: ["ramp", "wide_doorway"],
      contributorCount: 3, lastUpdated: "2026-05-26T09:50:00+07:00",
      notes: [{ id: "n29", text: "มีทางลาดด้านหลังอาคาร แต่ป้ายบอกทางยังไม่ชัดเจน", author: "ผู้ใช้นิรนาม 7734", createdAt: "2026-05-26T09:50:00+07:00" }] }),

    place({ id: "seed-30", name_th: "โรงเรียนนานาชาติชลบุรีจำลอง", name_en: "Chonburi International School (sample)", category: "school",
      lat: 13.3611, lng: 100.9847, address_th: "อำเภอเมืองชลบุรี", status: "full",
      features: ["step_free_entrance", "ramp", "elevator", "wide_doorway", "accessible_restroom"],
      contributorCount: 8, lastUpdated: "2026-07-04T14:15:00+07:00",
      notes: [{ id: "n30", text: "อาคารเรียนทุกหลังมีทางลาดและลิฟต์ ห้องน้ำผู้พิการอยู่ทุกชั้น", author: "ผู้ปกครองนักเรียน", createdAt: "2026-07-04T14:15:00+07:00" }] })
  ];

  /*
   * Seed path-quality values, keyed by place id and merged below. A few
   * places are intentionally left without path data to demo the
   * "no path info yet" state that invites contribution.
   */
  var SEED_PATH = {
    "seed-01": { surface: "paved", shade: "partial", lighting: "good", width: "wide" },
    "seed-02": { surface: "paved", shade: "none", lighting: "partial", width: "narrow" },
    "seed-03": { surface: "paved", shade: "good", lighting: "good", width: "wide" },
    "seed-04": { surface: "uneven", shade: "partial", lighting: "partial", width: "medium" },
    "seed-05": { surface: "paved", shade: "good", lighting: "good", width: "wide" },
    "seed-06": { surface: "paved", shade: "good", lighting: "good", width: "wide" },
    "seed-07": { surface: "uneven", shade: "none", lighting: "none", width: "narrow" },
    "seed-08": { surface: "paved", shade: "partial", lighting: "partial", width: "medium" },
    "seed-09": { surface: "paved", shade: "good", lighting: "good", width: "wide" },
    "seed-10": { surface: "paved", shade: "good", lighting: "partial", width: "wide" },
    "seed-11": { surface: "uneven", shade: "partial", lighting: "none", width: "medium" },
    "seed-12": { surface: "paved", shade: "none", lighting: "good", width: "medium" },
    "seed-13": { surface: "gravel", shade: "good", lighting: "none", width: "narrow" },
    "seed-15": { surface: "paved", shade: "partial", lighting: "good", width: "wide" },
    "seed-16": { surface: "uneven", shade: "none", lighting: "partial", width: "medium" },
    "seed-17": { surface: "paved", shade: "partial", lighting: "good", width: "medium" },
    "seed-19": { surface: "paved", shade: "good", lighting: "good", width: "medium" },
    "seed-20": { surface: "paved", shade: "partial", lighting: "good", width: "wide" },
    "seed-21": { surface: "uneven", shade: "good", lighting: "none", width: "narrow" },
    "seed-22": { surface: "uneven", shade: "good", lighting: "partial", width: "medium" },
    "seed-23": { surface: "paved", shade: "partial", lighting: "good", width: "wide" },
    "seed-25": { surface: "grass", shade: "partial", lighting: "partial", width: "medium" },
    "seed-26": { surface: "paved", shade: "good", lighting: "good", width: "wide" },
    "seed-27": { surface: "paved", shade: "good", lighting: "partial", width: "wide" },
    "seed-28": { surface: "paved", shade: "partial", lighting: "good", width: "wide" },
    "seed-29": { surface: "uneven", shade: "none", lighting: "partial", width: "medium" },
    "seed-30": { surface: "paved", shade: "good", lighting: "good", width: "wide" }
  };
  SEED_PLACES.forEach(function (p) {
    p.path = SEED_PATH[p.id] || null;
  });

  global.RR_CATEGORIES = CATEGORIES;
  global.RR_STATUSES = STATUSES;
  global.RR_STATUS_ORDER = STATUS_ORDER;
  global.RR_FEATURES = FEATURES;
  global.RR_PATH_ATTRS = PATH_ATTRS;
  global.RR_SEED_PLACES = SEED_PLACES;
})(window);
