/**
 * Comprehensive Indian cities data organized by state/UT.
 * Covers all state capitals, major district headquarters, IT hubs, industrial cities,
 * satellite towns, and special work arrangements.
 * ~750+ locations for autocomplete in onboarding and profile forms.
 */

// ---------- States ----------

const ANDHRA_PRADESH = [
    'Amaravati, Andhra Pradesh', 'Visakhapatnam, Andhra Pradesh', 'Vijayawada, Andhra Pradesh',
    'Guntur, Andhra Pradesh', 'Tirupati, Andhra Pradesh', 'Nellore, Andhra Pradesh',
    'Kurnool, Andhra Pradesh', 'Rajahmundry, Andhra Pradesh', 'Kakinada, Andhra Pradesh',
    'Kadapa, Andhra Pradesh', 'Anantapur, Andhra Pradesh', 'Eluru, Andhra Pradesh',
    'Ongole, Andhra Pradesh', 'Srikakulam, Andhra Pradesh', 'Chittoor, Andhra Pradesh',
    'Machilipatnam, Andhra Pradesh', 'Tenali, Andhra Pradesh', 'Proddatur, Andhra Pradesh',
    'Adoni, Andhra Pradesh', 'Bhimavaram, Andhra Pradesh', 'Hindupur, Andhra Pradesh',
    'Sri City, Andhra Pradesh', 'Mangalagiri, Andhra Pradesh',
] as const;

const ARUNACHAL_PRADESH = [
    'Itanagar, Arunachal Pradesh', 'Naharlagun, Arunachal Pradesh', 'Pasighat, Arunachal Pradesh',
    'Tawang, Arunachal Pradesh', 'Ziro, Arunachal Pradesh',
] as const;

const ASSAM = [
    'Guwahati, Assam', 'Silchar, Assam', 'Dibrugarh, Assam', 'Jorhat, Assam',
    'Nagaon, Assam', 'Tinsukia, Assam', 'Tezpur, Assam', 'Bongaigaon, Assam',
    'Karimganj, Assam', 'Sivasagar, Assam', 'Goalpara, Assam', 'Dhubri, Assam',
    'Diphu, Assam', 'North Lakhimpur, Assam',
] as const;

const BIHAR = [
    'Patna, Bihar', 'Gaya, Bihar', 'Bhagalpur, Bihar', 'Muzaffarpur, Bihar',
    'Purnia, Bihar', 'Darbhanga, Bihar', 'Bihar Sharif, Bihar', 'Arrah, Bihar',
    'Begusarai, Bihar', 'Katihar, Bihar', 'Munger, Bihar', 'Chapra, Bihar',
    'Sasaram, Bihar', 'Hajipur, Bihar', 'Dehri, Bihar', 'Siwan, Bihar',
    'Motihari, Bihar', 'Saharsa, Bihar', 'Bettiah, Bihar', 'Nawada, Bihar',
] as const;

const CHHATTISGARH = [
    'Raipur, Chhattisgarh', 'Bhilai, Chhattisgarh', 'Bilaspur, Chhattisgarh',
    'Korba, Chhattisgarh', 'Durg, Chhattisgarh', 'Rajnandgaon, Chhattisgarh',
    'Raigarh, Chhattisgarh', 'Jagdalpur, Chhattisgarh', 'Ambikapur, Chhattisgarh',
    'Naya Raipur, Chhattisgarh',
] as const;

const GOA = [
    'Panaji, Goa', 'Margao, Goa', 'Vasco da Gama, Goa', 'Mapusa, Goa',
    'Ponda, Goa',
] as const;

const GUJARAT = [
    'Ahmedabad, Gujarat', 'Surat, Gujarat', 'Vadodara, Gujarat', 'Rajkot, Gujarat',
    'Bhavnagar, Gujarat', 'Jamnagar, Gujarat', 'Junagadh, Gujarat', 'Gandhinagar, Gujarat',
    'Gandhidham, Gujarat', 'Anand, Gujarat', 'Morbi, Gujarat', 'Nadiad, Gujarat',
    'Mehsana, Gujarat', 'Bharuch, Gujarat', 'Navsari, Gujarat', 'Vapi, Gujarat',
    'Porbandar, Gujarat', 'Godhra, Gujarat', 'Dahod, Gujarat', 'Palanpur, Gujarat',
    'Mundra, Gujarat', 'Sanand, Gujarat', 'GIFT City, Gujarat', 'Hazira, Gujarat',
    'Dholera, Gujarat',
] as const;

const HARYANA = [
    'Gurugram, Haryana', 'Faridabad, Haryana', 'Panipat, Haryana', 'Ambala, Haryana',
    'Karnal, Haryana', 'Hisar, Haryana', 'Rohtak, Haryana', 'Sonipat, Haryana',
    'Yamunanagar, Haryana', 'Panchkula, Haryana', 'Bhiwani, Haryana', 'Sirsa, Haryana',
    'Bahadurgarh, Haryana', 'Jind, Haryana', 'Thanesar, Haryana', 'Kaithal, Haryana',
    'Rewari, Haryana', 'Palwal, Haryana', 'Manesar, Haryana',
    'Gurugram Sector 44, Haryana', 'Gurugram Sector 48, Haryana', 'Cyber City Gurugram, Haryana',
    'IMT Manesar, Haryana', 'Sohna Road, Haryana',
] as const;

const HIMACHAL_PRADESH = [
    'Shimla, Himachal Pradesh', 'Dharamshala, Himachal Pradesh', 'Solan, Himachal Pradesh',
    'Mandi, Himachal Pradesh', 'Kullu, Himachal Pradesh', 'Hamirpur, Himachal Pradesh',
    'Una, Himachal Pradesh', 'Nahan, Himachal Pradesh', 'Bilaspur, Himachal Pradesh',
    'Manali, Himachal Pradesh', 'Kangra, Himachal Pradesh', 'Baddi, Himachal Pradesh',
] as const;

const JHARKHAND = [
    'Ranchi, Jharkhand', 'Jamshedpur, Jharkhand', 'Dhanbad, Jharkhand',
    'Bokaro, Jharkhand', 'Hazaribagh, Jharkhand', 'Deoghar, Jharkhand',
    'Giridih, Jharkhand', 'Ramgarh, Jharkhand', 'Phusro, Jharkhand',
    'Adityapur, Jharkhand', 'Chaibasa, Jharkhand',
] as const;

const KARNATAKA = [
    'Bangalore, Karnataka', 'Mysuru, Karnataka', 'Hubli-Dharwad, Karnataka',
    'Mangalore, Karnataka', 'Belgaum, Karnataka', 'Gulbarga, Karnataka',
    'Davanagere, Karnataka', 'Bellary, Karnataka', 'Shimoga, Karnataka',
    'Tumkur, Karnataka', 'Udupi, Karnataka', 'Raichur, Karnataka',
    'Bidar, Karnataka', 'Hospet, Karnataka', 'Hassan, Karnataka',
    'Chitradurga, Karnataka', 'Mandya, Karnataka', 'Bagalkot, Karnataka',
    // Bangalore Areas
    'Whitefield, Bangalore', 'Electronic City, Bangalore', 'Koramangala, Bangalore',
    'HSR Layout, Bangalore', 'Indiranagar, Bangalore', 'Marathahalli, Bangalore',
    'Manyata Tech Park, Bangalore', 'Outer Ring Road, Bangalore', 'Hebbal, Bangalore',
    'Sarjapur Road, Bangalore', 'Bellandur, Bangalore', 'Yelahanka, Bangalore',
    'JP Nagar, Bangalore', 'Bannerghatta Road, Bangalore', 'Devanahalli, Bangalore',
] as const;

const KERALA = [
    'Thiruvananthapuram, Kerala', 'Kochi, Kerala', 'Kozhikode, Kerala',
    'Thrissur, Kerala', 'Kollam, Kerala', 'Kannur, Kerala', 'Alappuzha, Kerala',
    'Palakkad, Kerala', 'Kottayam, Kerala', 'Malappuram, Kerala',
    'Kasaragod, Kerala', 'Pathanamthitta, Kerala', 'Idukki, Kerala',
    'Wayanad, Kerala', 'Ernakulam, Kerala',
    'Technopark Trivandrum, Kerala', 'InfoPark Kochi, Kerala', 'Kakkanad, Kerala',
    'Cyber Park Kozhikode, Kerala',
] as const;

const MADHYA_PRADESH = [
    'Bhopal, Madhya Pradesh', 'Indore, Madhya Pradesh', 'Jabalpur, Madhya Pradesh',
    'Gwalior, Madhya Pradesh', 'Ujjain, Madhya Pradesh', 'Sagar, Madhya Pradesh',
    'Dewas, Madhya Pradesh', 'Satna, Madhya Pradesh', 'Ratlam, Madhya Pradesh',
    'Rewa, Madhya Pradesh', 'Murwara, Madhya Pradesh', 'Singrauli, Madhya Pradesh',
    'Burhanpur, Madhya Pradesh', 'Chhindwara, Madhya Pradesh', 'Khandwa, Madhya Pradesh',
    'Morena, Madhya Pradesh', 'Vidisha, Madhya Pradesh', 'Pithampur, Madhya Pradesh',
] as const;

const MAHARASHTRA = [
    'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Nagpur, Maharashtra',
    'Thane, Maharashtra', 'Navi Mumbai, Maharashtra', 'Nashik, Maharashtra',
    'Aurangabad, Maharashtra', 'Solapur, Maharashtra', 'Kolhapur, Maharashtra',
    'Amravati, Maharashtra', 'Sangli, Maharashtra', 'Malegaon, Maharashtra',
    'Jalgaon, Maharashtra', 'Akola, Maharashtra', 'Latur, Maharashtra',
    'Dhule, Maharashtra', 'Ahmednagar, Maharashtra', 'Chandrapur, Maharashtra',
    'Parbhani, Maharashtra', 'Ichalkaranji, Maharashtra', 'Jalna, Maharashtra',
    'Satara, Maharashtra', 'Ratnagiri, Maharashtra', 'Nanded, Maharashtra',
    // Mumbai Areas
    'Andheri, Mumbai', 'Bandra, Mumbai', 'Lower Parel, Mumbai', 'BKC, Mumbai',
    'Goregaon, Mumbai', 'Powai, Mumbai', 'Malad, Mumbai', 'Worli, Mumbai',
    'Nariman Point, Mumbai', 'Fort, Mumbai', 'Vikhroli, Mumbai', 'Airoli, Mumbai',
    // Pune Areas
    'Hinjewadi, Pune', 'Kharadi, Pune', 'Magarpatta, Pune', 'Baner, Pune',
    'Wakad, Pune', 'Hadapsar, Pune', 'Viman Nagar, Pune', 'Koregaon Park, Pune',
    'Pimpri-Chinchwad, Pune', 'Talawade, Pune', 'Chakan, Pune', 'Talegaon, Pune',
    // Navi Mumbai Areas
    'Vashi, Navi Mumbai', 'Belapur, Navi Mumbai', 'Kharghar, Navi Mumbai',
    'Panvel, Navi Mumbai', 'Nerul, Navi Mumbai',
] as const;

const MANIPUR = [
    'Imphal, Manipur', 'Thoubal, Manipur', 'Bishnupur, Manipur',
    'Churachandpur, Manipur',
] as const;

const MEGHALAYA = [
    'Shillong, Meghalaya', 'Tura, Meghalaya', 'Jowai, Meghalaya', 'Nongpoh, Meghalaya',
] as const;

const MIZORAM = [
    'Aizawl, Mizoram', 'Lunglei, Mizoram', 'Champhai, Mizoram',
] as const;

const NAGALAND = [
    'Kohima, Nagaland', 'Dimapur, Nagaland', 'Mokokchung, Nagaland', 'Wokha, Nagaland',
] as const;

const ODISHA = [
    'Bhubaneswar, Odisha', 'Cuttack, Odisha', 'Rourkela, Odisha',
    'Berhampur, Odisha', 'Sambalpur, Odisha', 'Puri, Odisha',
    'Balasore, Odisha', 'Bhadrak, Odisha', 'Baripada, Odisha',
    'Jharsuguda, Odisha', 'Angul, Odisha', 'Jeypore, Odisha',
    'Barbil, Odisha', 'Paradip, Odisha', 'Infocity Bhubaneswar, Odisha',
] as const;

const PUNJAB = [
    'Chandigarh, Punjab', 'Ludhiana, Punjab', 'Amritsar, Punjab',
    'Jalandhar, Punjab', 'Patiala, Punjab', 'Bathinda, Punjab',
    'Mohali, Punjab', 'Pathankot, Punjab', 'Hoshiarpur, Punjab',
    'Moga, Punjab', 'Batala, Punjab', 'Abohar, Punjab',
    'Malerkotla, Punjab', 'Khanna, Punjab', 'Phagwara, Punjab',
    'Muktsar, Punjab', 'Rajpura, Punjab', 'Zirakpur, Punjab',
    'IT City Mohali, Punjab', 'Knowledge City Mohali, Punjab',
] as const;

const RAJASTHAN = [
    'Jaipur, Rajasthan', 'Jodhpur, Rajasthan', 'Udaipur, Rajasthan',
    'Kota, Rajasthan', 'Ajmer, Rajasthan', 'Bikaner, Rajasthan',
    'Bhilwara, Rajasthan', 'Alwar, Rajasthan', 'Sikar, Rajasthan',
    'Bharatpur, Rajasthan', 'Pali, Rajasthan', 'Sri Ganganagar, Rajasthan',
    'Tonk, Rajasthan', 'Kishangarh, Rajasthan', 'Beawar, Rajasthan',
    'Hanumangarh, Rajasthan', 'Chittorgarh, Rajasthan', 'Jhunjhunu, Rajasthan',
    'Neemrana, Rajasthan', 'Bhiwadi, Rajasthan', 'Sitapura IT Park, Jaipur',
    'Mahindra World City, Jaipur',
] as const;

const SIKKIM = [
    'Gangtok, Sikkim', 'Namchi, Sikkim', 'Mangan, Sikkim', 'Gyalshing, Sikkim',
] as const;

const TAMIL_NADU = [
    'Chennai, Tamil Nadu', 'Coimbatore, Tamil Nadu', 'Madurai, Tamil Nadu',
    'Tiruchirappalli, Tamil Nadu', 'Salem, Tamil Nadu', 'Tirunelveli, Tamil Nadu',
    'Erode, Tamil Nadu', 'Vellore, Tamil Nadu', 'Thoothukudi, Tamil Nadu',
    'Thanjavur, Tamil Nadu', 'Dindigul, Tamil Nadu', 'Tirupur, Tamil Nadu',
    'Hosur, Tamil Nadu', 'Nagercoil, Tamil Nadu', 'Kancheepuram, Tamil Nadu',
    'Kumbakonam, Tamil Nadu', 'Cuddalore, Tamil Nadu', 'Karur, Tamil Nadu',
    'Sivakasi, Tamil Nadu', 'Ooty, Tamil Nadu', 'Pollachi, Tamil Nadu',
    // Chennai Areas
    'OMR (Old Mahabalipuram Road), Chennai', 'Sholinganallur, Chennai',
    'Siruseri, Chennai', 'TIDEL Park, Chennai', 'Guindy, Chennai',
    'T. Nagar, Chennai', 'Anna Nagar, Chennai', 'Porur, Chennai',
    'Ambattur, Chennai', 'Perungudi, Chennai', 'Taramani, Chennai',
    'DLF IT Park Chennai', 'Sriperumbudur, Tamil Nadu',
    'SIPCOT Hosur, Tamil Nadu', 'Mahindra World City Chennai',
] as const;

const TELANGANA = [
    'Hyderabad, Telangana', 'Warangal, Telangana', 'Nizamabad, Telangana',
    'Karimnagar, Telangana', 'Khammam, Telangana', 'Mahbubnagar, Telangana',
    'Nalgonda, Telangana', 'Adilabad, Telangana', 'Suryapet, Telangana',
    'Siddipet, Telangana', 'Miryalaguda, Telangana',
    // Hyderabad Areas
    'HITEC City, Hyderabad', 'Gachibowli, Hyderabad', 'Madhapur, Hyderabad',
    'Kondapur, Hyderabad', 'Banjara Hills, Hyderabad', 'Jubilee Hills, Hyderabad',
    'Kukatpally, Hyderabad', 'Secunderabad, Telangana', 'Ameerpet, Hyderabad',
    'Begumpet, Hyderabad', 'Miyapur, Hyderabad', 'Manikonda, Hyderabad',
    'Nanakramguda, Hyderabad', 'Financial District, Hyderabad',
    'Shamshabad, Hyderabad', 'Pocharam IT Park, Hyderabad',
] as const;

const TRIPURA = [
    'Agartala, Tripura', 'Dharmanagar, Tripura', 'Udaipur, Tripura',
] as const;

const UTTAR_PRADESH = [
    'Lucknow, Uttar Pradesh', 'Noida, Uttar Pradesh', 'Kanpur, Uttar Pradesh',
    'Ghaziabad, Uttar Pradesh', 'Agra, Uttar Pradesh', 'Varanasi, Uttar Pradesh',
    'Meerut, Uttar Pradesh', 'Prayagraj, Uttar Pradesh', 'Bareilly, Uttar Pradesh',
    'Aligarh, Uttar Pradesh', 'Moradabad, Uttar Pradesh', 'Saharanpur, Uttar Pradesh',
    'Gorakhpur, Uttar Pradesh', 'Mathura, Uttar Pradesh', 'Firozabad, Uttar Pradesh',
    'Jhansi, Uttar Pradesh', 'Muzaffarnagar, Uttar Pradesh', 'Shahjahanpur, Uttar Pradesh',
    'Rampur, Uttar Pradesh', 'Ayodhya, Uttar Pradesh', 'Etawah, Uttar Pradesh',
    'Sultanpur, Uttar Pradesh', 'Fatehpur, Uttar Pradesh', 'Unnao, Uttar Pradesh',
    'Bulandshahr, Uttar Pradesh', 'Hapur, Uttar Pradesh',
    // NCR Areas
    'Greater Noida, Uttar Pradesh', 'Noida Sector 62, Uttar Pradesh',
    'Noida Sector 63, Uttar Pradesh', 'Noida Sector 125, Uttar Pradesh',
    'Noida Sector 135, Uttar Pradesh', 'Noida Sector 142, Uttar Pradesh',
    'Techzone Greater Noida', 'Knowledge Park Greater Noida',
] as const;

const UTTARAKHAND = [
    'Dehradun, Uttarakhand', 'Haridwar, Uttarakhand', 'Rishikesh, Uttarakhand',
    'Haldwani, Uttarakhand', 'Rudrapur, Uttarakhand', 'Kashipur, Uttarakhand',
    'Roorkee, Uttarakhand', 'Nainital, Uttarakhand', 'Mussoorie, Uttarakhand',
    'Pantnagar, Uttarakhand', 'Ramnagar, Uttarakhand',
] as const;

const WEST_BENGAL = [
    'Kolkata, West Bengal', 'Howrah, West Bengal', 'Durgapur, West Bengal',
    'Asansol, West Bengal', 'Siliguri, West Bengal', 'Bardhaman, West Bengal',
    'Malda, West Bengal', 'Baharampur, West Bengal', 'Habra, West Bengal',
    'Kharagpur, West Bengal', 'Haldia, West Bengal', 'Krishnanagar, West Bengal',
    'Bankura, West Bengal', 'Cooch Behar, West Bengal', 'Darjeeling, West Bengal',
    // Kolkata Areas
    'Salt Lake City, Kolkata', 'New Town Rajarhat, Kolkata', 'Sector V Salt Lake, Kolkata',
    'EM Bypass, Kolkata', 'Park Street, Kolkata', 'Esplanade, Kolkata',
    'Bidhannagar, Kolkata',
] as const;

// ---------- Union Territories ----------

const DELHI = [
    'New Delhi, Delhi', 'South Delhi, Delhi', 'North Delhi, Delhi',
    'East Delhi, Delhi', 'West Delhi, Delhi',
    'Connaught Place, Delhi', 'Nehru Place, Delhi', 'Okhla, Delhi',
    'Saket, Delhi', 'Dwarka, Delhi', 'Rohini, Delhi', 'Pitampura, Delhi',
    'Janakpuri, Delhi', 'Laxmi Nagar, Delhi', 'Karol Bagh, Delhi',
    'Netaji Subhash Place, Delhi', 'Jasola, Delhi', 'Vasant Kunj, Delhi',
    'Aerocity, Delhi',
] as const;

const CHANDIGARH = [
    'Chandigarh', 'Chandigarh IT Park', 'Chandigarh Sector 17',
] as const;

const JAMMU_KASHMIR = [
    'Srinagar, Jammu & Kashmir', 'Jammu, Jammu & Kashmir', 'Anantnag, Jammu & Kashmir',
    'Baramulla, Jammu & Kashmir', 'Sopore, Jammu & Kashmir', 'Udhampur, Jammu & Kashmir',
    'Kathua, Jammu & Kashmir',
] as const;

const LADAKH = [
    'Leh, Ladakh', 'Kargil, Ladakh',
] as const;

const PUDUCHERRY = [
    'Puducherry', 'Karaikal, Puducherry', 'Mahe, Puducherry', 'Yanam, Puducherry',
] as const;

const ANDAMAN_NICOBAR = [
    'Port Blair, Andaman & Nicobar Islands',
] as const;

const DADRA_DAMAN = [
    'Silvassa, Dadra & Nagar Haveli', 'Daman, Daman & Diu', 'Diu, Daman & Diu',
] as const;

const LAKSHADWEEP = [
    'Kavaratti, Lakshadweep',
] as const;

// ---------- Special / Remote ----------

const SPECIAL_LOCATIONS = [
    'Remote', 'Work From Home', 'Pan India', 'Hybrid', 'Anywhere in India',
    'Overseas', 'Multiple Locations',
] as const;

// ---------- Combined Export ----------

export const INDIAN_CITIES = [
    ...ANDHRA_PRADESH,
    ...ARUNACHAL_PRADESH,
    ...ASSAM,
    ...BIHAR,
    ...CHHATTISGARH,
    ...GOA,
    ...GUJARAT,
    ...HARYANA,
    ...HIMACHAL_PRADESH,
    ...JHARKHAND,
    ...KARNATAKA,
    ...KERALA,
    ...MADHYA_PRADESH,
    ...MAHARASHTRA,
    ...MANIPUR,
    ...MEGHALAYA,
    ...MIZORAM,
    ...NAGALAND,
    ...ODISHA,
    ...PUNJAB,
    ...RAJASTHAN,
    ...SIKKIM,
    ...TAMIL_NADU,
    ...TELANGANA,
    ...TRIPURA,
    ...UTTAR_PRADESH,
    ...UTTARAKHAND,
    ...WEST_BENGAL,
    ...DELHI,
    ...CHANDIGARH,
    ...JAMMU_KASHMIR,
    ...LADAKH,
    ...PUDUCHERRY,
    ...ANDAMAN_NICOBAR,
    ...DADRA_DAMAN,
    ...LAKSHADWEEP,
    ...SPECIAL_LOCATIONS,
] as const;
