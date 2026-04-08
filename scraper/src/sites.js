// Website Template Database — 150 sites across 25 industries
// priority: "high" | "medium" | "low"

export const sites = [

  // ── E-commerce ──────────────────────────────────────────────────────────
  { id:1,   name:"Allbirds",              url:"https://allbirds.com",                  industry:"E-commerce",           type:"E-commerce store",   tags:["minimal","product","DTC","sustainability"],            priority:"high" },
  { id:2,   name:"Warby Parker",          url:"https://warbyparker.com",               industry:"E-commerce",           type:"E-commerce store",   tags:["fashion","try-on","editorial"],                        priority:"high" },
  { id:3,   name:"Gymshark",              url:"https://gymshark.com",                  industry:"E-commerce",           type:"E-commerce store",   tags:["fashion","fitness","community"],                       priority:"medium" },
  { id:4,   name:"Glossier",              url:"https://glossier.com",                  industry:"E-commerce",           type:"E-commerce store",   tags:["beauty","pastel","DTC"],                               priority:"medium" },
  { id:5,   name:"MVMT",                  url:"https://mvmt.com",                      industry:"E-commerce",           type:"E-commerce store",   tags:["DTC","watches","lifestyle"],                           priority:"medium" },
  { id:6,   name:"Away",                  url:"https://awaytravel.com",                industry:"E-commerce",           type:"E-commerce store",   tags:["luggage","editorial","gifting"],                       priority:"medium" },
  { id:7,   name:"Brooklinen",            url:"https://brooklinen.com",                industry:"E-commerce",           type:"E-commerce store",   tags:["bedding","DTC","subscription"],                        priority:"medium" },
  { id:8,   name:"Dollar Shave Club",     url:"https://dollarshaveclub.com",           industry:"E-commerce",           type:"E-commerce store",   tags:["subscription","humor","DTC"],                          priority:"high" },
  { id:9,   name:"Patagonia",             url:"https://patagonia.com",                 industry:"E-commerce",           type:"E-commerce store",   tags:["outdoor","sustainability","activism","editorial"],      priority:"high" },
  { id:10,  name:"Everlane",              url:"https://everlane.com",                  industry:"E-commerce",           type:"E-commerce store",   tags:["transparency","fashion","minimal","ethical"],           priority:"medium" },
  { id:11,  name:"Casper",                url:"https://casper.com",                    industry:"E-commerce",           type:"E-commerce store",   tags:["mattress","DTC","lifestyle","comparison"],              priority:"medium" },
  { id:12,  name:"Bombas",                url:"https://bombas.com",                    industry:"E-commerce",           type:"E-commerce store",   tags:["socks","social impact","subscription","gifting"],       priority:"medium" },

  // ── SaaS ────────────────────────────────────────────────────────────────
  { id:13,  name:"Linear",                url:"https://linear.app",                    industry:"SaaS",                 type:"Landing page",        tags:["dark mode","developer","B2B","animated"],              priority:"high" },
  { id:14,  name:"Notion",                url:"https://notion.so",                     industry:"SaaS",                 type:"Landing page",        tags:["productivity","B2B","interactive"],                    priority:"high" },
  { id:15,  name:"Vercel",                url:"https://vercel.com",                    industry:"SaaS",                 type:"Landing page",        tags:["developer","dark mode","technical"],                   priority:"high" },
  { id:16,  name:"Loom",                  url:"https://loom.com",                      industry:"SaaS",                 type:"Landing page",        tags:["video","B2B","social proof"],                         priority:"medium" },
  { id:17,  name:"Figma",                 url:"https://figma.com",                     industry:"SaaS",                 type:"Dashboard / App",     tags:["design","B2B","community"],                           priority:"high" },
  { id:18,  name:"Intercom",              url:"https://intercom.com",                  industry:"SaaS",                 type:"Landing page",        tags:["B2B","gradients","ROI"],                              priority:"high" },
  { id:19,  name:"Airtable",              url:"https://airtable.com",                  industry:"SaaS",                 type:"Landing page",        tags:["no-code","templates","colourful"],                     priority:"medium" },
  { id:20,  name:"HubSpot",               url:"https://hubspot.com",                   industry:"SaaS",                 type:"Landing page",        tags:["CRM","B2B","freemium"],                               priority:"medium" },
  { id:21,  name:"Calendly",              url:"https://calendly.com",                  industry:"SaaS",                 type:"Landing page",        tags:["scheduling","integrations","simple"],                  priority:"medium" },
  { id:22,  name:"Webflow",               url:"https://webflow.com",                   industry:"SaaS",                 type:"Landing page",        tags:["no-code","visual builder","designer-focused"],         priority:"high" },
  { id:23,  name:"Framer",                url:"https://framer.com",                    industry:"SaaS",                 type:"Landing page",        tags:["website builder","animated","designer-focused"],       priority:"high" },
  { id:24,  name:"Retool",                url:"https://retool.com",                    industry:"SaaS",                 type:"Landing page",        tags:["internal tools","developer","B2B","dark mode"],        priority:"medium" },
  { id:25,  name:"Clerk",                 url:"https://clerk.com",                     industry:"SaaS",                 type:"Landing page",        tags:["auth","developer","clean","dark mode"],                priority:"medium" },

  // ── Restaurant ──────────────────────────────────────────────────────────
  { id:26,  name:"Eleven Madison Park",   url:"https://elevenmadisonpark.com",         industry:"Restaurant",           type:"Landing page",        tags:["luxury","fine dining","photography"],                  priority:"high" },
  { id:27,  name:"Sweetgreen",            url:"https://sweetgreen.com",                industry:"Restaurant",           type:"E-commerce store",    tags:["fast casual","ordering","mobile-first"],               priority:"medium" },
  { id:28,  name:"Nobu",                  url:"https://noburestaurants.com",           industry:"Restaurant",           type:"Booking platform",    tags:["luxury","global","reservations"],                      priority:"medium" },
  { id:29,  name:"Shake Shack",           url:"https://shakeshack.com",                industry:"Restaurant",           type:"E-commerce store",    tags:["fast casual","bold type","ordering"],                  priority:"medium" },
  { id:30,  name:"Eataly",                url:"https://eataly.com",                    industry:"Restaurant",           type:"E-commerce store",    tags:["marketplace","editorial","retail"],                    priority:"medium" },
  { id:31,  name:"Chipotle",              url:"https://chipotle.com",                  industry:"Restaurant",           type:"E-commerce store",    tags:["fast casual","ordering","loyalty","mobile"],           priority:"high" },
  { id:32,  name:"Noma",                  url:"https://noma.dk",                       industry:"Restaurant",           type:"Landing page",        tags:["luxury","minimal","Scandinavian","fine dining"],        priority:"high" },
  { id:33,  name:"Pret A Manger",         url:"https://pret.com",                      industry:"Restaurant",           type:"E-commerce store",    tags:["fast casual","subscription","loyalty","UK"],           priority:"medium" },

  // ── Healthcare ───────────────────────────────────────────────────────────
  { id:34,  name:"ZocDoc",                url:"https://zocdoc.com",                    industry:"Healthcare",           type:"Directory",           tags:["booking","trust","search"],                           priority:"high" },
  { id:35,  name:"Hims & Hers",           url:"https://forhims.com",                   industry:"Healthcare",           type:"E-commerce store",    tags:["DTC","telehealth","lifestyle"],                        priority:"medium" },
  { id:36,  name:"Oscar Health",          url:"https://hioscar.com",                   industry:"Healthcare",           type:"Landing page",        tags:["insurance","friendly","bold type"],                    priority:"medium" },
  { id:37,  name:"One Medical",           url:"https://onemedical.com",                industry:"Healthcare",           type:"Landing page",        tags:["membership","booking","trust"],                        priority:"medium" },
  { id:38,  name:"Noom",                  url:"https://noom.com",                      industry:"Healthcare",           type:"Landing page",        tags:["quiz","weight loss","personalisation"],                priority:"high" },
  { id:39,  name:"Calm",                  url:"https://calm.com",                      industry:"Healthcare",           type:"Landing page",        tags:["mental health","subscription","soothing","dark bg"],   priority:"high" },
  { id:40,  name:"Headspace",             url:"https://headspace.com",                 industry:"Healthcare",           type:"Landing page",        tags:["mental health","illustration","subscription","app"],   priority:"high" },
  { id:41,  name:"Roman Health",          url:"https://ro.co",                         industry:"Healthcare",           type:"Landing page",        tags:["telehealth","DTC","men's health","trust"],             priority:"medium" },

  // ── Real Estate ──────────────────────────────────────────────────────────
  { id:42,  name:"Zillow",                url:"https://zillow.com",                    industry:"Real Estate",          type:"Directory",           tags:["map","search","data-rich"],                           priority:"high" },
  { id:43,  name:"Compass",               url:"https://compass.com",                   industry:"Real Estate",          type:"Directory",           tags:["luxury","editorial","agents"],                         priority:"high" },
  { id:44,  name:"Airbnb",                url:"https://airbnb.com",                    industry:"Real Estate",          type:"Booking platform",    tags:["marketplace","photography","booking"],                 priority:"high" },
  { id:45,  name:"Redfin",                url:"https://redfin.com",                    industry:"Real Estate",          type:"Directory",           tags:["data","calculator","brokerage"],                       priority:"medium" },
  { id:46,  name:"WeWork",                url:"https://wework.com",                    industry:"Real Estate",          type:"Booking platform",    tags:["coworking","lifestyle","enterprise"],                  priority:"medium" },
  { id:47,  name:"Landed",                url:"https://landed.com",                    industry:"Real Estate",          type:"Landing page",        tags:["down payment","trust","minimal","fintech"],            priority:"medium" },
  { id:48,  name:"Opendoor",              url:"https://opendoor.com",                  industry:"Real Estate",          type:"Landing page",        tags:["instant offer","data","trust","calculator"],           priority:"high" },

  // ── Agency / Portfolio ───────────────────────────────────────────────────
  { id:49,  name:"Instrument",            url:"https://instrument.com",                industry:"Agency / Portfolio",   type:"Portfolio",           tags:["case studies","experimental","scroll"],                priority:"high" },
  { id:50,  name:"Fantasy",               url:"https://fantasy.co",                    industry:"Agency / Portfolio",   type:"Portfolio",           tags:["minimal","craft","UX"],                               priority:"medium" },
  { id:51,  name:"ueno",                  url:"https://ueno.co",                       industry:"Agency / Portfolio",   type:"Portfolio",           tags:["playful","bold","interactive"],                        priority:"medium" },
  { id:52,  name:"Huge",                  url:"https://hugeinc.com",                   industry:"Agency / Portfolio",   type:"Portfolio",           tags:["editorial","magazine","thought leadership"],           priority:"medium" },
  { id:53,  name:"Active Theory",         url:"https://activetheory.net",              industry:"Agency / Portfolio",   type:"Portfolio",           tags:["3D","WebGL","experimental"],                          priority:"high" },
  { id:54,  name:"IDEO",                  url:"https://ideo.com",                      industry:"Agency / Portfolio",   type:"Portfolio",           tags:["design thinking","editorial","impact","consulting"],   priority:"high" },
  { id:55,  name:"Pentagram",             url:"https://pentagram.com",                 industry:"Agency / Portfolio",   type:"Portfolio",           tags:["branding","minimal","grid","typography"],              priority:"high" },
  { id:56,  name:"Superflux",             url:"https://superflux.in",                  industry:"Agency / Portfolio",   type:"Portfolio",           tags:["futures","speculative","editorial","dark"],            priority:"medium" },

  // ── Education ────────────────────────────────────────────────────────────
  { id:57,  name:"Duolingo",              url:"https://duolingo.com",                  industry:"Education",            type:"Landing page",        tags:["gamification","mascot","mobile"],                      priority:"high" },
  { id:58,  name:"Masterclass",           url:"https://masterclass.com",               industry:"Education",            type:"E-commerce store",    tags:["premium","cinematic","dark mode"],                     priority:"high" },
  { id:59,  name:"Coursera",              url:"https://coursera.org",                  industry:"Education",            type:"Directory",           tags:["B2B","university","career"],                          priority:"medium" },
  { id:60,  name:"Khan Academy",          url:"https://khanacademy.org",               industry:"Education",            type:"Landing page",        tags:["non-profit","progress","accessible"],                  priority:"medium" },
  { id:61,  name:"Skillshare",            url:"https://skillshare.com",                industry:"Education",            type:"E-commerce store",    tags:["subscription","creative","trial"],                     priority:"medium" },
  { id:62,  name:"Brilliant",             url:"https://brilliant.org",                 industry:"Education",            type:"Landing page",        tags:["STEM","interactive","dark mode","premium"],            priority:"high" },
  { id:63,  name:"Udemy",                 url:"https://udemy.com",                     industry:"Education",            type:"Directory",           tags:["marketplace","discount","breadth","social proof"],     priority:"medium" },
  { id:64,  name:"Teachable",             url:"https://teachable.com",                 industry:"Education",            type:"Landing page",        tags:["creator economy","B2B","course builder","pricing"],    priority:"medium" },

  // ── Finance ──────────────────────────────────────────────────────────────
  { id:65,  name:"Stripe",                url:"https://stripe.com",                    industry:"Finance",              type:"Landing page",        tags:["developer","B2B","gradients","technical"],             priority:"high" },
  { id:66,  name:"Robinhood",             url:"https://robinhood.com",                 industry:"Finance",              type:"Landing page",        tags:["mobile-first","consumer","lifestyle"],                 priority:"medium" },
  { id:67,  name:"Wise",                  url:"https://wise.com",                      industry:"Finance",              type:"Landing page",        tags:["trust","global","calculator"],                         priority:"medium" },
  { id:68,  name:"Coinbase",              url:"https://coinbase.com",                  industry:"Finance",              type:"Landing page",        tags:["crypto","trust","onboarding"],                         priority:"high" },
  { id:69,  name:"Betterment",            url:"https://betterment.com",                industry:"Finance",              type:"Landing page",        tags:["investing","calculator","quiz"],                       priority:"medium" },
  { id:70,  name:"Brex",                  url:"https://brex.com",                      industry:"Finance",              type:"Landing page",        tags:["corporate card","B2B","startup","dark mode"],          priority:"high" },
  { id:71,  name:"Plaid",                 url:"https://plaid.com",                     industry:"Finance",              type:"Landing page",        tags:["fintech","B2B","developer","data"],                    priority:"high" },
  { id:72,  name:"Chime",                 url:"https://chime.com",                     industry:"Finance",              type:"Landing page",        tags:["neobank","consumer","mobile","no fees"],               priority:"medium" },

  // ── Travel ───────────────────────────────────────────────────────────────
  { id:73,  name:"Airbnb Experiences",    url:"https://airbnb.com/s/experiences",      industry:"Travel",               type:"Booking platform",    tags:["marketplace","photography","booking"],                 priority:"medium" },
  { id:74,  name:"Going",                 url:"https://going.com",                     industry:"Travel",               type:"Landing page",        tags:["subscription","deals","newsletter"],                   priority:"medium" },
  { id:75,  name:"Lonely Planet",         url:"https://lonelyplanet.com",              industry:"Travel",               type:"Blog / Magazine",     tags:["editorial","media","destination"],                     priority:"medium" },
  { id:76,  name:"Booking.com",           url:"https://booking.com",                   industry:"Travel",               type:"Booking platform",    tags:["marketplace","urgency","conversion"],                  priority:"high" },
  { id:77,  name:"Headout",               url:"https://headout.com",                   industry:"Travel",               type:"E-commerce store",    tags:["tours","mobile-first","last-minute"],                  priority:"medium" },
  { id:78,  name:"Skyscanner",            url:"https://skyscanner.com",                industry:"Travel",               type:"Booking platform",    tags:["flights","comparison","search","global"],              priority:"high" },
  { id:79,  name:"GetYourGuide",          url:"https://getyourguide.com",              industry:"Travel",               type:"E-commerce store",    tags:["activities","tours","photography","marketplace"],      priority:"medium" },
  { id:80,  name:"Tripadvisor",           url:"https://tripadvisor.com",               industry:"Travel",               type:"Directory",           tags:["reviews","directory","social proof","search"],         priority:"high" },

  // ── Media / Blog ─────────────────────────────────────────────────────────
  { id:81,  name:"The Verge",             url:"https://theverge.com",                  industry:"Media / Blog",         type:"Blog / Magazine",     tags:["editorial","tech","video"],                           priority:"high" },
  { id:82,  name:"Substack",              url:"https://substack.com",                  industry:"Media / Blog",         type:"Landing page",        tags:["newsletter","creator","minimal"],                      priority:"high" },
  { id:83,  name:"Medium",                url:"https://medium.com",                    industry:"Media / Blog",         type:"Blog / Magazine",     tags:["reading","typography","community"],                    priority:"medium" },
  { id:84,  name:"Wired",                 url:"https://wired.com",                     industry:"Media / Blog",         type:"Blog / Magazine",     tags:["editorial","magazine","subscription"],                 priority:"medium" },
  { id:85,  name:"The Athletic",          url:"https://theathletic.com",               industry:"Media / Blog",         type:"Blog / Magazine",     tags:["sports","subscription","cards"],                       priority:"medium" },
  { id:86,  name:"The Guardian",          url:"https://theguardian.com",               industry:"Media / Blog",         type:"Blog / Magazine",     tags:["news","editorial","membership","UK"],                  priority:"high" },
  { id:87,  name:"Rest of World",         url:"https://restofworld.org",               industry:"Media / Blog",         type:"Blog / Magazine",     tags:["tech journalism","global","editorial","bold"],         priority:"medium" },
  { id:88,  name:"Axios",                 url:"https://axios.com",                     industry:"Media / Blog",         type:"Blog / Magazine",     tags:["news","smart brevity","newsletter","minimal"],         priority:"medium" },

  // ── Non-profit ───────────────────────────────────────────────────────────
  { id:89,  name:"charity: water",        url:"https://charitywater.org",              industry:"Non-profit",           type:"Landing page",        tags:["storytelling","impact","transparency"],                priority:"high" },
  { id:90,  name:"Wikipedia",             url:"https://wikipedia.org",                 industry:"Non-profit",           type:"Directory",           tags:["utility","open source","reading"],                     priority:"low" },
  { id:91,  name:"MSF",                   url:"https://msf.org",                       industry:"Non-profit",           type:"Landing page",        tags:["humanitarian","crisis","impact"],                      priority:"medium" },
  { id:92,  name:"Greenpeace",            url:"https://greenpeace.org",                industry:"Non-profit",           type:"Landing page",        tags:["activism","environmental","bold","photography"],        priority:"medium" },
  { id:93,  name:"ACLU",                  url:"https://aclu.org",                      industry:"Non-profit",           type:"Landing page",        tags:["civil rights","advocacy","bold","petition"],           priority:"medium" },

  // ── Fitness ──────────────────────────────────────────────────────────────
  { id:94,  name:"Peloton",               url:"https://onepeloton.com",                industry:"Fitness",              type:"E-commerce store",    tags:["hardware","subscription","community","lifestyle"],      priority:"high" },
  { id:95,  name:"MyFitnessPal",          url:"https://myfitnesspal.com",              industry:"Fitness",              type:"Landing page",        tags:["app","data","health","tracking"],                      priority:"medium" },
  { id:96,  name:"Nike Training Club",    url:"https://nike.com/ntc-app",              industry:"Fitness",              type:"Landing page",        tags:["premium","brand","workouts"],                          priority:"medium" },
  { id:97,  name:"Whoop",                 url:"https://whoop.com",                     industry:"Fitness",              type:"E-commerce store",    tags:["wearable","data","membership"],                        priority:"high" },
  { id:98,  name:"Strava",                url:"https://strava.com",                    industry:"Fitness",              type:"Landing page",        tags:["community","social","running","cycling"],              priority:"high" },
  { id:99,  name:"Future",                url:"https://future.co",                     industry:"Fitness",              type:"Landing page",        tags:["personal training","premium","app","coaching"],        priority:"medium" },

  // ── Fashion & Luxury ─────────────────────────────────────────────────────
  { id:100, name:"Net-a-Porter",          url:"https://net-a-porter.com",              industry:"Fashion & Luxury",     type:"E-commerce store",    tags:["luxury","editorial","fashion","black and white"],      priority:"high" },
  { id:101, name:"SSENSE",                url:"https://ssense.com",                    industry:"Fashion & Luxury",     type:"E-commerce store",    tags:["luxury","minimal","editorial","avant-garde"],          priority:"high" },
  { id:102, name:"Farfetch",              url:"https://farfetch.com",                  industry:"Fashion & Luxury",     type:"E-commerce store",    tags:["luxury","marketplace","global","multi-brand"],         priority:"high" },
  { id:103, name:"Matches Fashion",       url:"https://matchesfashion.com",            industry:"Fashion & Luxury",     type:"E-commerce store",    tags:["luxury","editorial","curation","photography"],         priority:"medium" },
  { id:104, name:"Mr Porter",             url:"https://mrporter.com",                  industry:"Fashion & Luxury",     type:"E-commerce store",    tags:["menswear","luxury","editorial","guide"],               priority:"medium" },

  // ── Food & Grocery Delivery ──────────────────────────────────────────────
  { id:105, name:"Instacart",             url:"https://instacart.com",                 industry:"Food & Grocery",       type:"E-commerce store",    tags:["delivery","grocery","marketplace","convenience"],      priority:"high" },
  { id:106, name:"DoorDash",              url:"https://doordash.com",                  industry:"Food & Grocery",       type:"Booking platform",    tags:["delivery","marketplace","local","urgency"],            priority:"high" },
  { id:107, name:"Freshly",               url:"https://freshly.com",                   industry:"Food & Grocery",       type:"E-commerce store",    tags:["meal delivery","subscription","health","DTC"],         priority:"medium" },
  { id:108, name:"Thrive Market",         url:"https://thrivemarket.com",              industry:"Food & Grocery",       type:"E-commerce store",    tags:["organic","membership","values-driven","savings"],      priority:"medium" },
  { id:109, name:"Gousto",                url:"https://gousto.co.uk",                  industry:"Food & Grocery",       type:"E-commerce store",    tags:["meal kit","subscription","UK","recipe-led"],           priority:"medium" },

  // ── Legal & Professional Services ────────────────────────────────────────
  { id:110, name:"Clerky",                url:"https://clerky.com",                    industry:"Legal",                type:"Landing page",        tags:["legal tech","startup","minimal","trust"],              priority:"medium" },
  { id:111, name:"Ironclad",              url:"https://ironcladapp.com",               industry:"Legal",                type:"Landing page",        tags:["contract management","B2B","dark mode","enterprise"],  priority:"medium" },
  { id:112, name:"LegalZoom",             url:"https://legalzoom.com",                 industry:"Legal",                type:"Landing page",        tags:["SMB","accessible","legal","pricing"],                  priority:"high" },
  { id:113, name:"Clio",                  url:"https://clio.com",                      industry:"Legal",                type:"Landing page",        tags:["law firm","B2B","SaaS","professional"],                priority:"medium" },

  // ── Logistics & Supply Chain ─────────────────────────────────────────────
  { id:114, name:"Flexport",              url:"https://flexport.com",                  industry:"Logistics",            type:"Landing page",        tags:["freight","B2B","data","global"],                       priority:"high" },
  { id:115, name:"Shipbob",               url:"https://shipbob.com",                   industry:"Logistics",            type:"Landing page",        tags:["fulfillment","e-commerce","B2B","pricing"],            priority:"medium" },
  { id:116, name:"Convoy",                url:"https://convoy.com",                    industry:"Logistics",            type:"Landing page",        tags:["trucking","marketplace","B2B","data"],                 priority:"medium" },

  // ── HR & Recruiting ──────────────────────────────────────────────────────
  { id:117, name:"Greenhouse",            url:"https://greenhouse.com",                industry:"HR & Recruiting",      type:"Landing page",        tags:["ATS","B2B","enterprise","hiring"],                     priority:"medium" },
  { id:118, name:"Lever",                 url:"https://lever.co",                      industry:"HR & Recruiting",      type:"Landing page",        tags:["ATS","B2B","mid-market","hiring"],                     priority:"medium" },
  { id:119, name:"Lattice",               url:"https://lattice.com",                   industry:"HR & Recruiting",      type:"Landing page",        tags:["performance","people ops","B2B","colourful"],          priority:"medium" },
  { id:120, name:"Deel",                  url:"https://deel.com",                      industry:"HR & Recruiting",      type:"Landing page",        tags:["global payroll","B2B","compliance","dark mode"],       priority:"high" },

  // ── Developer Tools ──────────────────────────────────────────────────────
  { id:121, name:"GitHub",                url:"https://github.com",                    industry:"Developer Tools",      type:"Landing page",        tags:["developer","dark mode","community","open source"],     priority:"high" },
  { id:122, name:"Supabase",              url:"https://supabase.com",                  industry:"Developer Tools",      type:"Landing page",        tags:["developer","dark mode","open source","database"],      priority:"high" },
  { id:123, name:"Planetscale",           url:"https://planetscale.com",               industry:"Developer Tools",      type:"Landing page",        tags:["database","developer","dark","technical"],             priority:"medium" },
  { id:124, name:"Railway",               url:"https://railway.app",                   industry:"Developer Tools",      type:"Landing page",        tags:["deployment","developer","dark mode","simple"],         priority:"medium" },
  { id:125, name:"Resend",                url:"https://resend.com",                    industry:"Developer Tools",      type:"Landing page",        tags:["email API","developer","minimal","dark mode"],         priority:"medium" },

  // ── Marketing & Analytics ────────────────────────────────────────────────
  { id:126, name:"Mailchimp",             url:"https://mailchimp.com",                 industry:"Marketing & Analytics",type:"Landing page",        tags:["email marketing","SMB","illustration","playful"],      priority:"high" },
  { id:127, name:"Klaviyo",               url:"https://klaviyo.com",                   industry:"Marketing & Analytics",type:"Landing page",        tags:["email","B2B","e-commerce","data"],                    priority:"high" },
  { id:128, name:"Amplitude",             url:"https://amplitude.com",                 industry:"Marketing & Analytics",type:"Landing page",        tags:["analytics","B2B","dark mode","data viz"],             priority:"medium" },
  { id:129, name:"Hotjar",                url:"https://hotjar.com",                    industry:"Marketing & Analytics",type:"Landing page",        tags:["heatmaps","B2B","conversational","UX"],               priority:"medium" },
  { id:130, name:"Semrush",               url:"https://semrush.com",                   industry:"Marketing & Analytics",type:"Landing page",        tags:["SEO","B2B","data","enterprise"],                      priority:"medium" },

  // ── Design & Creative Tools ───────────────────────────────────────────────
  { id:131, name:"Canva",                 url:"https://canva.com",                     industry:"Design & Creative",    type:"Landing page",        tags:["design tool","SMB","colourful","freemium"],            priority:"high" },
  { id:132, name:"Adobe Creative Cloud",  url:"https://adobe.com/creativecloud",       industry:"Design & Creative",    type:"Landing page",        tags:["professional","dark mode","creative","B2C"],          priority:"high" },
  { id:133, name:"Dribbble",              url:"https://dribbble.com",                  industry:"Design & Creative",    type:"Directory",           tags:["community","portfolio","hiring","pink"],               priority:"medium" },
  { id:134, name:"Behance",               url:"https://behance.net",                   industry:"Design & Creative",    type:"Directory",           tags:["portfolio","community","Adobe","grid"],                priority:"medium" },
  { id:135, name:"Spline",                url:"https://spline.design",                 industry:"Design & Creative",    type:"Landing page",        tags:["3D","dark mode","interactive","WebGL"],                priority:"high" },

  // ── Events & Ticketing ───────────────────────────────────────────────────
  { id:136, name:"Eventbrite",            url:"https://eventbrite.com",                industry:"Events & Ticketing",   type:"Directory",           tags:["events","marketplace","search","community"],           priority:"high" },
  { id:137, name:"Dice",                  url:"https://dice.fm",                       industry:"Events & Ticketing",   type:"Directory",           tags:["music","dark mode","discovery","mobile-first"],        priority:"high" },
  { id:138, name:"Luma",                  url:"https://lu.ma",                         industry:"Events & Ticketing",   type:"Landing page",        tags:["events","minimal","social","community"],               priority:"medium" },
  { id:139, name:"Splash",                url:"https://splashthat.com",                industry:"Events & Ticketing",   type:"Landing page",        tags:["corporate events","B2B","registration","premium"],     priority:"medium" },

  // ── Gaming ───────────────────────────────────────────────────────────────
  { id:140, name:"Steam",                 url:"https://store.steampowered.com",        industry:"Gaming",               type:"E-commerce store",    tags:["gaming","dark mode","marketplace","deals"],            priority:"high" },
  { id:141, name:"Epic Games Store",      url:"https://store.epicgames.com",           industry:"Gaming",               type:"E-commerce store",    tags:["gaming","dark mode","free games","bold"],              priority:"medium" },
  { id:142, name:"Unity",                 url:"https://unity.com",                     industry:"Gaming",               type:"Landing page",        tags:["game engine","B2B","developer","dark mode"],           priority:"medium" },

  // ── Home & Interior ──────────────────────────────────────────────────────
  { id:143, name:"Houzz",                 url:"https://houzz.com",                     industry:"Home & Interior",      type:"Directory",           tags:["interior design","marketplace","photography","search"],priority:"high" },
  { id:144, name:"Article",               url:"https://article.com",                   industry:"Home & Interior",      type:"E-commerce store",    tags:["furniture","DTC","minimal","photography"],             priority:"medium" },
  { id:145, name:"Parachute Home",        url:"https://parachutehome.com",             industry:"Home & Interior",      type:"E-commerce store",    tags:["bedding","DTC","lifestyle","warm palette"],            priority:"medium" },

  // ── Sustainability & Climate ─────────────────────────────────────────────
  { id:146, name:"Arcadia",               url:"https://arcadia.com",                   industry:"Sustainability",       type:"Landing page",        tags:["clean energy","B2C","green","trust"],                  priority:"medium" },
  { id:147, name:"Pachama",               url:"https://pachama.com",                   industry:"Sustainability",       type:"Landing page",        tags:["carbon credits","B2B","data","nature"],                priority:"medium" },
  { id:148, name:"Watershed",             url:"https://watershed.com",                 industry:"Sustainability",       type:"Landing page",        tags:["carbon accounting","B2B","enterprise","dark mode"],    priority:"high" },

  // ── Beauty & Wellness ────────────────────────────────────────────────────
  { id:149, name:"Curology",              url:"https://curology.com",                  industry:"Beauty & Wellness",    type:"Landing page",        tags:["skincare","DTC","personalisation","quiz"],             priority:"high" },
  { id:150, name:"Function of Beauty",    url:"https://functionofbeauty.com",          industry:"Beauty & Wellness",    type:"E-commerce store",    tags:["personalisation","hair care","quiz","DTC"],            priority:"high" },
  { id:151, name:"Aesop",                 url:"https://aesop.com",                     industry:"Beauty & Wellness",    type:"E-commerce store",    tags:["luxury","editorial","typography","minimal"],           priority:"high" },
  { id:152, name:"Goop",                  url:"https://goop.com",                      industry:"Beauty & Wellness",    type:"E-commerce store",    tags:["wellness","editorial","luxury","lifestyle"],           priority:"medium" },
];

export const priorityOrder = { high: 0, medium: 1, low: 2 };
export const sortedSites = [...sites].sort((a, b) =>
  priorityOrder[a.priority] - priorityOrder[b.priority] || a.id - b.id
);
