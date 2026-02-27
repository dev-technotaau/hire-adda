const fs = require('fs');

const content = fs.readFileSync(__dirname + '/indian-cities.ts', 'utf-8');

// Parse existing entries per state
const stateRegex = /const (\w+) = \[([\s\S]*?)\] as const;/g;
const stateData = {};
const stateOrder = [];
let match;
while ((match = stateRegex.exec(content)) !== null) {
  const name = match[1];
  const entriesStr = match[2];
  const entries = [];
  const entryRegex = /'([^']+)'/g;
  let em;
  while ((em = entryRegex.exec(entriesStr)) !== null) {
    entries.push(em[1]);
  }
  stateData[name] = entries;
  stateOrder.push(name);
}

const stateMap = {
  ANDHRA_PRADESH: 'Andhra Pradesh',
  ASSAM: 'Assam',
  BIHAR: 'Bihar',
  CHHATTISGARH: 'Chhattisgarh',
  GOA: 'Goa',
  GUJARAT: 'Gujarat',
  HARYANA: 'Haryana',
  HIMACHAL_PRADESH: 'Himachal Pradesh',
  JHARKHAND: 'Jharkhand',
  KARNATAKA: 'Karnataka',
  KERALA: 'Kerala',
  MADHYA_PRADESH: 'Madhya Pradesh',
  MAHARASHTRA: 'Maharashtra',
  MANIPUR: 'Manipur',
  MEGHALAYA: 'Meghalaya',
  ODISHA: 'Odisha',
  PUNJAB: 'Punjab',
  RAJASTHAN: 'Rajasthan',
  SIKKIM: 'Sikkim',
  TAMIL_NADU: 'Tamil Nadu',
  TELANGANA: 'Telangana',
  TRIPURA: 'Tripura',
  UTTAR_PRADESH: 'Uttar Pradesh',
  UTTARAKHAND: 'Uttarakhand',
  WEST_BENGAL: 'West Bengal',
};

// Additional cities (raw names, will get state appended)
const additional = {
  ANDHRA_PRADESH: [
    'Addanki','Akividu','Allagadda','Amadalavalasa','Ambajipeta','Avanigadda',
    'Bheemili','Bukkapatnam','Chebrolu','Cumbum','Denduluru',
    'Gantyada','Gokavaram','Gopalapatnam','Gudlavalleru','Iragavaram',
    'Kanchikacharla','Koyyalagudem','Lakkireddipalli','Madhurawada','Mangalapuram',
    'Mantralayam','Mopidevi','Mudinepalli','Narsapuram','Nuziveedu',
    'Palkonda','Pendurthi','Ponnur','Rapur','Seethampeta',
    'Singarayakonda','Tekkali','Tirumala','Unguturu','Vuyyuru',
    'Yelamanchili','Kondapalle','Kalavapudi','Dachepalli','Komarolu',
    'Naguluppalapadu','Palacole','Pedakakani','Rajupalem','Edlapadu',
  ],
  ASSAM: [
    'Amingaon','Baihata Chariali','Banderdewa','Bokajan','Chabua',
    'Demow','Dhakuakhana','Dhing','Doboka','Gossaigaon',
    'Jagiroad','Kharupetia','Lahowal','Mazbat','Moranhat',
    'Namrup','Noonmati','Palashbari','Raha','Sarthebari',
    'Sipajhar','Sorbhog','Sualkuchi','Sarupathar','Sonari',
  ],
  BIHAR: [
    'Amnour','Bakhtiarpur','Barbigha','Baruni','Benipatti',
    'Bihpur','Bihta','Biraul','Brahmpur','Dhaka',
    'Dumari','Fatwa','Gogri','Harnaut','Imamganj',
    'Jagdispur','Jandaha','Kahalgaon','Khaira','Koilwar',
    'Lalganj','Mairwa','Mahua','Mehsi','Minapur',
    'Morwa','Pachrukhia','Pakri Dayal','Pandaul','Pirpainti',
    'Phulwari Sharif','Rajnagar','Sugauli','Tajpur','Thakurganj',
    'Triveniganj','Wazirganj','Dalsinghsarai','Revelganj','Sonepur Town',
    'Baisi','Bikram','Dehri Town','Ghoghardiha Town','Kharagpur Bihar',
    'Mahnar','Murliganj','Pipra','Raghopur','Sultanganj',
  ],
  CHHATTISGARH: [
    'Akaltara','Bhairamgarh','Bhanupratappur','Dharsiwa','Fingeshwar',
    'Gharghoda','Jashpurnagar','Kharsia','Lormi','Mainpat',
    'Marwahi','Narharpur','Pandaria','Pratappur','Simga',
    'Siltara','Wadrafnagar','Kurud','Rajpur CG','Baikunthpur Town',
  ],
  GOA: [
    'Anjuna','Assagao','Baga','Calangute','Candolim',
    'Carmona','Cavelossim','Chinchinim','Dabolim','Madgaon',
    'Marcaim','Navelim','Saligao','Siolim','Benaulim',
    'Betalbatim','Carambolim','Loutolim','Morjim','Taleigao',
  ],
  GUJARAT: [
    'Ambaliyasan','Bagasara','Bhachau','Chanasma','Chotila',
    'Dasada','Dhangadhra','Dhrol','Gadhada','Gariadhar',
    'Jambusar','Kathlal','Kheda','Lathi','Mansa Gujarat',
    'Matar','Nakhatrana','Paddhari','Rapar','Savarkundla',
    'Thangadh','Unjha','Vallabhipur','Visnagar','Waghodia',
    'Umbergaon','Wankaner Town','Damnagar Town','Sihor Town','Ranpur Town',
    'Khedbrahma Town','Prantij','Modasa Town','Idar Town','Shamlaji',
  ],
  HARYANA: [
    'Adampur Haryana','Barara','Bawani Khera','Beri','Bhuna',
    'Chhachhrauli','Ferozepurnamak','Gannaur','Israna','Jakhal',
    'Kalayat','Kanina','Maham','Morni','Murthal',
    'Naraingarh','Pundri','Sadhaura','Taoru','Tigaon',
    'Hodal Town','Pinjore Town','Shahzadpur','Gharaunda Town','Guhla',
  ],
  HIMACHAL_PRADESH: [
    'Bhota','Gagret','Haroli','Jaisinghpur','Jawalamukhi',
    'Kalpa','Karsog','Kotkhai','Kufri','Mehatpur',
    'Nadaun','Padhar','Rajgarh HP','Rampur Bushahar','Sangla',
    'Sarahan','Tira Sujanpur','Jutogh','Mashobra','Narkanda',
  ],
  JHARKHAND: [
    'Barharwa','Bero','Bishrampur','Chandrapura','Chakulia',
    'Govindpur','Hata','Jhumritilaiya','Kathikund','Kharsawan',
    'Lesliganj','Litipara','Maithon','Mandu','Nagar Untari',
    'Nirsa','Ormanjhi','Pathardih','Poreyahat','Satbarwa',
    'Torpa','Gamharia','Gumla Town','Narkopi','Noamundi',
  ],
  KARNATAKA: [
    'Anekal','Annigeri','Arakalgudu','Bantwal Town','Belthangady',
    'Bilgi','Bhatkal','Chikkanayakanahalli','Devadurga','Gajendragarh',
    'Gubbi','Harapanahalli','Honnali','Hosakote','Ittigi',
    'Joida','Kampli','Kerur','Khanapur','Krishnarajpet',
    'Kushtagi','Maski','Nargund','Terdal','Yelandur',
    'Arasikere','Bhadravathi','Channarayapatna','Chikmagalur Town','Gundlupet Town',
    'Halebidu','Harihar Town','Hosanagara','Hunsur Town','Jayanagar Mysuru',
    'Kadaba','Kundapura','Mahalingpur Town','Mudgere','Nagara',
    'Periyapatna','Raibag','Ranibennur Town','Savadatti','Thirthahalli Town',
  ],
  KERALA: [
    'Edappal','Eloor','Kaduthuruthy','Kanjirapally','Kazhakkoottam',
    'Koothattukulam','Kothamangalam','Kuttippuram','Muhamma','Nemmara',
    'Ranni','Thamarassery','Thalayolaparambu','Valapattanam','Vengara',
    'Aluva Town','Anthoor','Aranmula','Guruvayur Town','Karunagappally Town',
    'Cherpulassery','Edathala','Koilandy Town','Kottarakkara Town','Mananthavady',
  ],
  MADHYA_PRADESH: [
    'Ajaigarh','Baihar','Barela','Bhitarwar','Bichhia',
    'Birsinghpur','Budhni','Ghansaur','Gotegaon','Jamai',
    'Jasinghnagar','Junnardeo','Kesli','Khachrod','Khalwa',
    'Kolaras','Kukshi','Kurwai','Lateri','Maheshwar',
    'Manawar','Omkareshwar','Pandhurna','Patharia','Ranapur',
    'Sanchi','Shahgarh','Tamia','Vijayraghavgarh','Amla',
    'Barhi MP','Bijuri','Bina','Biora','Chandla',
    'Gandhigram','Garha','Kailaras','Malajkhand','Manawar Town',
    'Mandideep Town','Naigarhi','Nimarichh','Pansemal','Prithvipur',
    'Raghogarh Town','Raipura','Shujalpur Town','Sivni','Tendrukheda',
  ],
  MAHARASHTRA: [
    'Ambad','Ardhapur','Ashta MH','Babhulgaon','Bhiwapur',
    'Bhokar','Chamorshi','Dahiwadi','Devrukh','Ghansawangi',
    'Ghoti Budruk','Hatkanangle','Indapur','Jintoor','Kadegaon',
    'Kalamnuri','Kandhar','Kannad','Khalapur','Koregaon',
    'Kurduwadi','Majalgaon','Malvan','Mhasla','Mokhada',
    'Naldurg','Navapur','Oros','Partur','Rahuri',
    'Shahuwadi','Shirala','Sillod','Talasari','Trimbakeshwar',
    'Uran','Waluj MIDC Aurangabad','Wada','Yawal',
    'Ausa Town','Phulambri','Sengaon','Manchar','Rajgurunagar',
    'Karvir','Miraj','Palus','Tasgaon','Walchandnagar',
    'Chalisgaon','Shrirampur Town','Sindkhed Raja','Morshi Town','Daryapur',
    'Chikhli MH','Warud','Katol Town','Kamptee','Hingna',
    'Saoner','Armori','Bhadravati MH','Brahmapuri','Gondpipri',
    'Mul','Nagbhid','Rajura','Sironcha','Warora Town',
  ],
  ODISHA: [
    'Anandapur','Athgarh','Baliguda','Barkote','Bellaguntha',
    'Bhanjanagar','Birmaharajpur','Champua','Daringbadi','Dharmagarh',
    'G Udayagiri','Hinjilicut','Jaleswar','Jashipur','Junagarh',
    'Khariar','Khallikote','Khandapara','Kishorenagar','Lakhanpur',
    'Lanjigarh','M Rampur','Mohana','Narla Road','Nilagiri',
    'Patnagarh','Polasara','Purushottampur','R Udayagiri','Rairangpur',
    'Ranpur Odisha','Remuna','Salipur','Subarnapur','Sunabeda',
    'Udala','Banarpal','Hindol','Kuchinda','Nandapara',
    'Pallahara','Papadahandi','Surada','Tikabali','Tushra',
  ],
  PUNJAB: [
    'Bhulath','Chamkaur Sahib','Chunni Kalan','Dasuya','Fategarh Churian',
    'Giddarbaha','Goniana','Hariana','Jaitu','Khamano',
    'Khemkaran','Lopoke','Mahilpur','Makhu','Mukandpur',
    'Mullanpur Dakha','Nangal','Nathana','Nihal Singh Wala','Nurmahal',
    'Payal','Raman','Sham Churasi','Sirhind','Sri Hargobindpur',
    'Talwandi Bhai','Talwara','Tapa','Maur','Rampura',
    'Mehatpur Punjab','Phillaur Town','Goraya','Balachaur','Bassi Pathana',
  ],
  RAJASTHAN: [
    'Amet','Arnod','Bali','Banera','Bandikui',
    'Baswa','Bhinai','Bhinder','Bijainagar','Chhabra Town',
    'Degana','Devli','Dhariawad','Dhorimanna','Dudu',
    'Gogunda','Hurda','Jayal','Kankroli','Kapasan',
    'Khanpur','Kotra','Kushalgarh','Lalsot','Malpura',
    'Mandal','Mavli','Nagar','Nainwa','Nimaj',
    'Pachpadra','Partapur','Pindwara','Rani','Rashmi',
    'Reodar','Sambhar','Simalwara','Sojat','Tibi',
    'Uniyara','Vijaynagar','Anupgarh Town','Balotra Town','Barmer Town',
    'Baran Town','Bassi Town','Bhim','Bhinay','Chaksu Town',
    'Chau','Desuri','Gangapur','Jaitaran','Jojawar',
    'Kaman','Kelwa','Kherwara','Lakheri','Mandore',
    'Masuda','Nimbahera Town','Padampur Raj','Phulera','Rajakhera Town',
    'Sapotra','Talera','Thanagazi','Todabhim Town','Weir',
  ],
  TAMIL_NADU: [
    'Ambasamudram','Ammapettai','Anthiyur','Arani','Batlagundu',
    'Dharapuram','Gudalore','Gudalur','Iluppur','Kadayanallur',
    'Kalasapakkam','Kanchipuram Town','Kayathar','Kodavasal','Kulasekharam',
    'Kumarapalayam','Kundrathur','Madukkarai','Mannachanallur','Mulanur',
    'Needamangalam','Nilakottai','Padmanabhapuram','Palayamkottai','Pallikonda',
    'Pandalur','Pennagaram','Pugalur','Sattur','Shoolagiri',
    'Sivagiri','Surandai','Tharangambadi','Thiruparankundram','Thiruvarur',
    'Tiruchengode','Tirukalukundram','Tirukoilur','Tirumayam','Uppiliapuram',
    'Uthamapalayam','Vadalur','Valangaiman','Vandavasi','Vasudevanallur',
    'Veppanthattai','Viralimalai','Aranthangi','Cheyyar Town','Denkanikottai Town',
    'Gummidipoondi','Kadayam','Kallidaikurichi','Kamuthi','Keelakarai',
    'Kilvelur','Koradacherry','Kulithalai Town','Marandahalli','Mayuram',
    'Nallampalli','Natham Town','Odaipatti','Panagudi','Panaiyur',
    'Pennathur','Periyakulam','Perundurai','Sankaridurg','Sendamangalam',
    'Sholavandan','Srirangam Town','Thammampatti','Thiruparankundram Town','Thumbe',
    'Tirumangalam Town','Tiruppuvanam','Tiruttani Town','Ulundurpet Town','Vedanthangal',
  ],
  TELANGANA: [
    'Achampet','Armoor','Banswada','Bhupalpally','Chevella',
    'Dornakal','Farooqnagar','Haliya','Ibrahimpatnam','Jadcherla',
    'Jammikunta','Kalwakurthy','Kodad','Korutla','Luxettipet',
    'Makthal','Manuguru','Nakrekal','Narsampet','Narsapur',
    'Palwancha','Ramayampet','Sadasivpet','Satupalli','Sircilla',
    'Sultanabad','Thorrur','Utnoor','Vemulawada','Yellandu',
    'Yellareddy','Gaddi Annaram','Husnabad Town','Medak Town','Pegadapalli',
    'Adilabad Town','Bhadradri Kothagudem','Bhainsa Town','Kothur','Patancheru',
  ],
  UTTAR_PRADESH: [
    'Achhnera','Afzalgarh','Anupshahar','Bachhraon','Bah',
    'Baheri','Bakewar','Baldev','Banki UP','Bansi',
    'Baraut','Bayana','Behat','Bharthana','Bhinga',
    'Bhognipur','Bikapur','Bilhaur','Bindki','Bisauli',
    'Chail','Chandausi','Chhata','Chhibramau','Colonelganj',
    'Dalmau','Deoband','Domariyaganj','Faizabad','Gangoh',
    'Garh Mukteshwar','Ghatampur','Gunnaur','Iglas','Jagdishpur',
    'Jais','Jasrana','Kalpi','Karchhana','Katra',
    'Khadda','Khaga','Khatauli','Kheragarh','Kosi Kalan',
    'Lawar','Madanpur','Mahaban','Manjhanpur','Mauranipur',
    'Mirganj','Moth','Mubarakpur','Muhammadabad','Naini',
    'Nakur','Nichlaul','Phalauda','Phaphamau','Powayan',
    'Puranpur','Rasra','Sadat','Safipur','Sahjanwa',
    'Saifai','Salon','Sarai Akil','Sasni','Seohara',
    'Shamsabad','Shikarpur UP','Siana','Soron','Thakurdwara',
    'Unchahar','Zamania','Baragaon','Barsana','Charkhari Town',
    'Deoria Town','Faridpur','Ganjdundwara','Gosainganj','Jalalabad UP',
    'Jhinjhana','Koraon','Lalganj UP','Maghar','Milkipur',
    'Mungra Badshahpur','Noorpur Town','Phulpur Town','Rath','Sadabad',
    'Saidpur','Sandila Town','Shahabpur','Shishgarh','Tikaitnagar',
  ],
  UTTARAKHAND: [
    'Bazpur','Bhatwari','Dogadda','Gairsain','Gangolihat',
    'Jakholi','Karnaprayag','Khirsu','Lohaghat','Munsiari',
    'Narendra Nagar','Pokhari','Purola','Raiwala','Satpuli',
    'Srinagar Garhwal','Tharali','Ukhimath','Bhowali','Chinyalisaur',
    'Dwarahat','Gopeshwar Town','Kapkot','Lalkuan','Raipur Uttarakhand',
  ],
  WEST_BENGAL: [
    'Addra','Amlagora','Andul','Baduria','Bagdogra',
    'Bagnan','Balarampur','Barjora','Beldanga','Birpara',
    'Burnpur','Canning','Champadanga','Dankuni','Debagram',
    'Dhaniakhali','Dhubulia','Domjur','Falta','Garbeta',
    'Gobardanga','Goghat','Gurap','Haripal','Hooghly',
    'Illambazar','Jagatballavpur','Jhalda','Joynagar','Kaliachak',
    'Kaliaganj','Kalna','Khardah','Konnagar','Labhpur',
    'Magrahat','Mainaguri','Mankar','Nalhati','Nandigram',
    'Raidighi','Sagar Island','Santipur','Sonarpur','Tehatta',
    'Uttarpara','Baruipur','Bhatpara','Gayeshpur','Garulia',
    'Haldibari','Harischandrapur','Jiaganj','Kirnahar','Morgram',
    'Panagarh','Onda','Raina','Saktigarh','Singur',
  ],
};

// Delhi and J&K get different treatment
const delhiAdditional = [
  'Ashram, Delhi','Ber Sarai, Delhi','Burari, Delhi','Chhawla, Delhi',
  'Daryaganj, Delhi','Dilshad Garden, Delhi','Geeta Colony, Delhi',
  'GTB Nagar, Delhi','Govindpuri, Delhi','IP Extension, Delhi',
  'Jangpura, Delhi','Kailash Colony, Delhi','Kirti Nagar, Delhi',
  'Lodi Colony, Delhi','Malviya Nagar, Delhi','Moti Bagh, Delhi',
  'Mukherjee Nagar, Delhi','Nangloi, Delhi','Nehru Nagar, Delhi',
  'Okhla Industrial Area, Delhi','Paschim Vihar, Delhi',
  'Punjabi Bagh, Delhi','R.K. Puram, Delhi','Rajender Nagar, Delhi',
  'Sadar Bazaar, Delhi','Sangam Vihar, Delhi','Sarita Vihar, Delhi',
  'Shalimar Bagh, Delhi','Tri Nagar, Delhi','Tughlakabad, Delhi',
  'Uttam Nagar, Delhi','Wazirpur, Delhi',
];

const jkAdditional = [
  'Akhnoor, Jammu & Kashmir','Bijbehara, Jammu & Kashmir',
  'Hiranagar, Jammu & Kashmir','Kokernag, Jammu & Kashmir',
  'Pahalgam, Jammu & Kashmir','Qazigund, Jammu & Kashmir',
  'Sunderbani, Jammu & Kashmir','Tral, Jammu & Kashmir',
];

// Add Delhi entries
for (const city of delhiAdditional) {
  if (!stateData.DELHI.includes(city)) {
    stateData.DELHI.push(city);
  }
}
stateData.DELHI.sort();

// Add J&K entries
for (const city of jkAdditional) {
  if (!stateData.JAMMU_KASHMIR.includes(city)) {
    stateData.JAMMU_KASHMIR.push(city);
  }
}
stateData.JAMMU_KASHMIR.sort();

// Add state-suffixed entries
for (const [state, cities] of Object.entries(additional)) {
  const stateName = stateMap[state];
  if (stateName && stateData[state]) {
    for (const city of cities) {
      const fullEntry = city + ', ' + stateName;
      if (!stateData[state].includes(fullEntry)) {
        stateData[state].push(fullEntry);
      }
    }
    // Sort, but keep IT areas/special areas at end
    const mainEntries = [];
    const specialEntries = [];
    for (const entry of stateData[state]) {
      // entries with comma followed by space and city name (sub-areas)
      if (entry.includes(', Bangalore') || entry.includes(', Mumbai') ||
          entry.includes(', Pune') || entry.includes(', Navi Mumbai') ||
          entry.includes(', Nagpur') || entry.includes(', Chennai') ||
          entry.includes(', Coimbatore') || entry.includes(', Hyderabad') ||
          entry.includes(', Kolkata') || entry.includes(', Ahmedabad') ||
          entry.includes(', Surat') || entry.includes(', Gurugram') ||
          entry.includes(', Greater Noida') || entry.includes(', Dehradun') ||
          entry.includes('IT Park') || entry.includes('MIDC') ||
          entry.includes('SEZ') || entry.includes('GIDC') ||
          entry.includes('Sector ') || entry.includes('Techzone') ||
          entry.includes('ELCOT') || entry.includes('TIDEL') ||
          entry.includes('DLF') || entry.includes('OMR') ||
          entry.includes('ECR') || entry.includes('SIPCOT') ||
          entry.includes('Mahindra World') || entry.includes('HITEC') ||
          entry.includes('Knowledge Park') || entry.includes('Yamuna Expressway') ||
          entry.includes('Manyata') || entry.includes('Electronic City') ||
          entry.includes('Technopark') || entry.includes('InfoPark') ||
          entry.includes('Cyber ') || entry.includes('Financial District') ||
          entry.includes('Pocharam') || entry.includes('Infocity') ||
          entry.includes('Sahastradhara') || entry.includes('IMT ') ||
          entry.includes('Udyog Vihar') || entry.includes('Golf Course') ||
          entry.includes('Sohna Road') || entry.includes('Industrial Area')) {
        specialEntries.push(entry);
      } else {
        mainEntries.push(entry);
      }
    }
    mainEntries.sort();
    specialEntries.sort();
    stateData[state] = [...mainEntries, ...specialEntries];
  }
}

// Count total
let grandTotal = 0;
for (const entries of Object.values(stateData)) {
  grandTotal += entries.length;
}
console.log('Grand total:', grandTotal);

// Generate TypeScript file
const lines = [];
lines.push('/**');
lines.push(' * Comprehensive Indian cities data organized by state/UT.');
lines.push(' * Covers all state capitals, district headquarters, taluka/tehsil headquarters,');
lines.push(' * industrial cities, IT hubs, satellite towns, census towns, and special work arrangements.');
lines.push(' * ~' + grandTotal + ' locations for autocomplete in onboarding and profile forms.');
lines.push(' */');
lines.push('');
lines.push('// ---------- States ----------');
lines.push('');

const statesSection = [
  'ANDHRA_PRADESH','ARUNACHAL_PRADESH','ASSAM','BIHAR','CHHATTISGARH','GOA',
  'GUJARAT','HARYANA','HIMACHAL_PRADESH','JHARKHAND','KARNATAKA','KERALA',
  'MADHYA_PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA','MIZORAM','NAGALAND',
  'ODISHA','PUNJAB','RAJASTHAN','SIKKIM','TAMIL_NADU','TELANGANA','TRIPURA',
  'UTTAR_PRADESH','UTTARAKHAND','WEST_BENGAL',
];
const utsSection = [
  'DELHI','CHANDIGARH','JAMMU_KASHMIR','LADAKH','PUDUCHERRY',
  'ANDAMAN_NICOBAR','DADRA_DAMAN','LAKSHADWEEP',
];

for (const state of statesSection) {
  if (stateData[state]) {
    lines.push('const ' + state + ' = [');
    for (const entry of stateData[state]) {
      lines.push("  '" + entry.replace(/'/g, "\\'") + "',");
    }
    lines.push('] as const;');
    lines.push('');
  }
}

lines.push('// ---------- Union Territories ----------');
lines.push('');

for (const state of utsSection) {
  if (stateData[state]) {
    lines.push('const ' + state + ' = [');
    for (const entry of stateData[state]) {
      lines.push("  '" + entry.replace(/'/g, "\\'") + "',");
    }
    lines.push('] as const;');
    lines.push('');
  }
}

lines.push('// ---------- Special / Remote ----------');
lines.push('');
lines.push('const SPECIAL = [');
for (const entry of stateData.SPECIAL) {
  lines.push("  '" + entry + "',");
}
lines.push('] as const;');
lines.push('');
lines.push('// ---------- Combined Export ----------');
lines.push('');
lines.push('export const INDIAN_CITIES: readonly string[] = [');

const allStates = [...statesSection, ...utsSection, 'SPECIAL'];
for (const state of allStates) {
  lines.push('  ...' + state + ',');
}
lines.push('] as const;');
lines.push('');

fs.writeFileSync(__dirname + '/indian-cities.ts', lines.join('\n'), 'utf-8');
console.log('File written. Lines:', lines.length);

// Check for duplicates
const allEntries = [];
for (const entries of Object.values(stateData)) {
  allEntries.push(...entries);
}
const dupes = allEntries.filter((item, index) => allEntries.indexOf(item) !== index);
if (dupes.length > 0) {
  console.log('Duplicates found:', dupes.length);
  for (const d of dupes) {
    console.log('  -', d);
  }
} else {
  console.log('No duplicates found!');
}

// Per state
for (const state of [...statesSection, ...utsSection, 'SPECIAL']) {
  if (stateData[state]) {
    console.log(state + ':', stateData[state].length);
  }
}
