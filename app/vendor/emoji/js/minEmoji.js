/*! jMinEmoji v1.0.0 | (c) 2014 RodrigoPolo.com | https://github.com/rodrigopolo/minEmoji/blob/master/LICENSE */
;(function(){
	function ca(r){for(var t="",n=0;n<r.length;n++)t+="\\u"+("000"+r[n].charCodeAt(0).toString(16)).substr(-4);return t}
	var emoji = {"👩‍👩‍👦‍👦":964,"👨‍👩‍👦‍👦":959,"👨‍👨‍👦‍👦":955,"👨‍👨‍👧‍👦":957,"👩‍👩‍👧‍👧":967,"👨‍👨‍👧‍👧":958,"👩‍❤️‍💋‍👩":1091,"👨‍❤️‍💋‍👨":1090,"👩‍👩‍👧‍👦":966,"👨‍👩‍👧‍👦":961,"👨‍👩‍👧‍👧":962,"👩‍❤️‍👩":1095,"👩👩👦👦":964,"👨‍❤️‍👨":1094,"👨👨👧👧":958,"👨👨👧👦":957,"👩👩👧👦":966,"👨‍👨‍👧":956,"👨‍👨‍👦":954,"👨‍👩‍👧":960,"👩‍👩‍👧":965,"👩👩👧👧":967,"👨👩👧👦":961,"👩‍👩‍👦":963,"👨👩👦👦":959,"👨👨👦👦":955,"👨👩👧👧":962,"👨❤💋👨":1090,"👩❤💋👩":1091,"👨👩👧":960,"👩👩👧":965,"👩👩👦":963,"👨👨👦":954,"👨👨👧":956,"️👆🏽":845,"️👆🏿":847,"️👆🏾":846,"️👌🏻":879,"👨❤👨":1094,"👩❤👩":1095,"️👆🏼":844,"️👆🏻":843,"️👌🏿":883,"️👌🏾":882,"️👌🏽":881,"️👌🏼":880,"👁‍🗨":827,"🇬🇱":306,"👌🏻":879,"🙌🏼":1457,"👌🏼":880,"🙌🏽":1458,"👌🏽":881,"🙌🏾":1459,"👌🏾":882,"🙌🏿":1460,"👌🏿":883,"🇫🇮":292,"🇫🇯":293,"🇫🇴":296,"🇫🇰":294,"🇪🇺":291,"👐🏻":903,"👐🏼":904,"👐🏽":905,"👐🏾":906,"👐🏿":907,"💪🏻":1121,"💪🏼":1122,"💪🏽":1123,"💪🏾":1124,"💪🏿":1125,"🙏🏻":1474,"🙏🏼":1475,"🙏🏽":1476,"🙏🏾":1477,"🙏🏿":1478,"🇿🇼":469,"☝️🏻":64,"🇪🇹":290,"☝️🏼":65,"🇪🇪":285,"☝️🏽":66,"🇪🇷":288,"☝️🏾":67,"🇬🇶":310,"☝️🏿":68,"🇸🇻":430,"🇪🇬":286,"👏🏻":897,"👆🏻":843,"👏🏼":898,"👆🏼":844,"👏🏽":899,"👆🏽":845,"👏🏾":900,"👆🏾":846,"👏🏿":901,"👆🏿":847,"👇🏻":849,"👇🏼":850,"👇🏽":851,"👇🏾":852,"👇🏿":853,"👈🏻":855,"👈🏼":856,"👈🏽":857,"👈🏾":858,"👈🏿":859,"👉🏻":861,"👉🏼":862,"👉🏽":863,"👉🏾":864,"👉🏿":865,"🖕🏻":1323,"🖕🏼":1324,"🖕🏽":1325,"🖕🏾":1326,"🖕🏿":1327,"🖐🏻":1317,"🖐🏼":1318,"🖐🏽":1319,"🖐🏾":1320,"🖐🏿":1321,"🤘🏻":1600,"🤘🏼":1601,"🤘🏽":1602,"🤘🏾":1603,"🤘🏿":1604,"🖖🏻":1329,"🖖🏼":1330,"🖖🏽":1331,"🖖🏾":1332,"🖖🏿":1333,"🇿🇲":468,"🇪🇨":284,"🇩🇴":282,"🇩🇲":281,"🇩🇯":279,"🇩🇰":280,"💅🏻":1065,"💅🏼":1066,"💅🏽":1067,"💅🏾":1068,"💅🏿":1069,"👂🏻":829,"👂🏼":830,"👂🏽":831,"👂🏾":832,"👂🏿":833,"👃🏻":835,"👃🏼":836,"👃🏽":837,"👃🏾":838,"👃🏿":839,"👶🏻":1015,"👶🏼":1016,"👶🏽":1017,"👶🏾":1018,"👶🏿":1019,"👦🏻":930,"👦🏼":931,"👦🏽":932,"👦🏾":933,"👦🏿":934,"👧🏻":936,"👧🏼":937,"👧🏽":938,"👧🏾":939,"👧🏿":940,"👨🏻":942,"👨🏼":943,"👨🏽":944,"👨🏾":945,"👨🏿":946,"👩🏻":948,"👩🏼":949,"👩🏽":950,"👩🏾":951,"👩🏿":952,"👱🏻":985,"👱🏼":986,"👱🏽":987,"👱🏾":988,"👱🏿":989,"👴🏻":1003,"👴🏼":1004,"👴🏽":1005,"👴🏾":1006,"👴🏿":1007,"👵🏻":1009,"👵🏼":1010,"👵🏽":1011,"👵🏾":1012,"👵🏿":1013,"👲🏻":991,"👲🏼":992,"👲🏽":993,"👲🏾":994,"👲🏿":995,"👳🏻":997,"👳🏼":998,"👳🏽":999,"👳🏾":1000,"👳🏿":1001,"👮🏻":972,"👮🏼":973,"👮🏽":974,"👮🏾":975,"👮🏿":976,"👷🏻":1021,"👷🏼":1022,"👷🏽":1023,"👷🏾":1024,"👷🏿":1025,"💂🏻":1052,"💂🏼":1053,"💂🏽":1054,"💂🏾":1055,"💂🏿":1056,"🎅🏻":617,"🎅🏼":618,"🎅🏽":619,"🎅🏾":620,"🎅🏿":621,"👼🏻":1036,"👼🏼":1037,"👼🏽":1038,"👼🏾":1039,"👼🏿":1040,"👸🏻":1027,"👸🏼":1028,"👸🏽":1029,"👸🏾":1030,"👸🏿":1031,"👰🏻":979,"👰🏼":980,"👰🏽":981,"👰🏾":982,"👰🏿":983,"🚶🏻":1549,"🚶🏼":1550,"🚶🏽":1551,"🚶🏾":1552,"🚶🏿":1553,"🏃🏻":679,"🏃🏼":680,"🏃🏽":681,"🏃🏾":682,"🏃🏿":683,"💃🏻":1058,"💃🏼":1059,"💃🏽":1060,"💃🏾":1061,"💃🏿":1062,"🙇🏻":1441,"🙇🏼":1442,"🙇🏽":1443,"🙇🏾":1444,"🙇🏿":1445,"💁🏻":1046,"💁🏼":1047,"💁🏽":1048,"💁🏾":1049,"💁🏿":1050,"🙅🏻":1429,"🙅🏼":1430,"🙅🏽":1431,"🙅🏾":1432,"🙅🏿":1433,"🙆🏻":1435,"🙆🏼":1436,"🙆🏽":1437,"🙆🏾":1438,"🙆🏿":1439,"🙋🏻":1450,"🙋🏼":1451,"🙋🏽":1452,"🙋🏾":1453,"🙋🏿":1454,"🙎🏻":1468,"🙎🏼":1469,"🙎🏽":1470,"🙎🏾":1471,"🙎🏿":1472,"🙍🏻":1462,"🙍🏼":1463,"🙍🏽":1464,"🙍🏾":1465,"🙍🏿":1466,"💇🏻":1077,"💇🏼":1078,"💇🏽":1079,"💇🏾":1080,"💇🏿":1081,"💆🏻":1071,"💆🏼":1072,"💆🏽":1073,"💆🏾":1074,"💆🏿":1075,"👋🏻":873,"👋🏼":874,"👋🏽":875,"👋🏾":876,"👋🏿":877,"👍🏻":885,"👍🏼":886,"👍🏽":887,"👍🏾":888,"👍🏿":889,"👎🏻":891,"👎🏼":892,"👎🏽":893,"👎🏾":894,"👎🏿":895,"👊🏻":867,"👊🏼":868,"👊🏽":869,"👊🏾":870,"👊🏿":871,"🇬🇷":311,"🇬🇮":305,"🇬🇭":304,"🇩🇪":278,"🇬🇪":301,"✌️🏻":157,"🇬🇲":307,"✌️🏼":158,"🙌🏻":1456,"🇬🇦":298,"✌️🏽":159,"🇹🇫":436,"✌️🏾":160,"🇵🇫":396,"✌️🏿":161,"🇬🇫":302,"🇾🇪":465,"🇪🇭":287,"🇼🇫":462,"🇨🇿":277,"🇻🇳":460,"🇻🇪":457,"🇻🇦":455,"🇨🇾":276,"🇻🇺":461,"🇨🇼":274,"🇺🇿":454,"🇺🇾":453,"🇺🇸":452,"🇬🇧":299,"🇦🇪":224,"🇺🇦":450,"🇺🇬":451,"🇻🇮":459,"🇹🇻":447,"🇹🇨":434,"🇹🇲":442,"🇹🇷":445,"🇹🇳":443,"🇹🇹":446,"🚣🏻":1515,"🚣🏼":1516,"🚣🏽":1517,"🚣🏾":1518,"🚣🏿":1519,"🏊🏻":701,"🏊🏼":702,"🏊🏽":703,"🏊🏾":704,"🏊🏿":705,"🏄🏻":685,"🏄🏼":686,"🏄🏽":687,"🏄🏾":688,"🏄🏿":689,"🛀🏻":1564,"🛀🏼":1565,"🛀🏽":1566,"🛀🏾":1567,"🛀🏿":1568,"🇹🇴":444,"🇨🇺":272,"🇭🇷":319,"🇨🇮":265,"🇨🇷":271,"🇨🇰":266,"🏋🏻":707,"🏋🏼":708,"🏋🏽":709,"🏋🏾":710,"🏋🏿":711,"🚴🏻":1537,"🚴🏼":1538,"🚴🏽":1539,"🚴🏾":1540,"🚴🏿":1541,"🚵🏻":1543,"🚵🏼":1544,"🚵🏽":1545,"🚵🏾":1546,"🚵🏿":1547,"🏇🏻":693,"🏇🏼":694,"🏇🏽":695,"🏇🏾":696,"🏇🏿":697,"🇹🇰":440,"🇹🇬":437,"🇹🇱":441,"🇹🇭":438,"🇹🇿":449,"🇹🇯":439,"🇹🇼":448,"🇸🇾":432,"🇨🇭":264,"🇸🇪":418,"🇸🇿":433,"🇸🇷":427,"🇸🇩":417,"🇻🇨":456,"🇵🇲":401,"🇱🇨":350,"🇰🇳":342,"🇸🇭":420,"🇧🇱":248,"🇱🇰":352,"🇪🇸":289,"🇸🇸":428,"🇰🇷":344,"🇿🇦":467,"🇸🇴":426,"🇸🇧":415,"🇬🇸":312,"🇸🇮":421,"🇸🇰":422,"🇸🇽":431,"🇸🇬":419,"🇸🇱":423,"🇸🇨":416,"🇷🇸":411,"🇸🇳":425,"🇸🇦":414,"🇸🇹":429,"🇸🇲":424,"🇼🇸":463,"🇷🇼":413,"🇷🇺":412,"🇷🇴":410,"🇷🇪":409,"🇶🇦":408,"🇵🇷":403,"🇵🇹":405,"🇵🇱":400,"🇵🇳":402,"🇵🇭":398,"🇵🇪":395,"🇵🇾":407,"🇵🇬":397,"🇵🇦":394,"🇵🇸":404,"🇵🇼":406,"🇵🇰":399,"🇴🇲":393,"🇳🇴":388,"🇨🇩":261,"🇨🇬":263,"🇰🇲":341,"🇲🇵":370,"🇰🇵":343,"🇳🇫":384,"🇨🇴":270,"🇨🇨":260,"🇨🇽":275,"🇳🇺":391,"🇳🇬":385,"🇳🇪":383,"🇳🇮":386,"🇳🇿":392,"🇳🇨":382,"🇳🇱":387,"🇳🇵":389,"🇳🇷":390,"🇳🇦":381,"🇲🇲":367,"🇲🇿":380,"🇲🇦":359,"🇲🇸":373,"🇨🇳":269,"🇨🇱":267,"🇲🇪":362,"🇲🇳":368,"🇲🇨":360,"🇲🇩":361,"🇫🇲":295,"🇲🇽":378,"🇹🇩":435,"🇾🇹":466,"🇨🇫":262,"🇰🇾":346,"🇧🇶":252,"🇨🇻":273,"🇮🇨":322,"🇨🇦":259,"🇨🇲":268,"🇰🇭":339,"🇧🇮":246,"🇧🇫":243,"🇧🇬":244,"🇧🇳":250,"🇲🇺":375,"🇲🇷":372,"🇲🇶":371,"🇲🇭":364,"🇲🇹":374,"🇲🇱":366,"🇲🇻":376,"🇲🇾":379,"🇲🇼":377,"🇲🇬":363,"🇲🇰":365,"🇲🇴":369,"🇱🇺":356,"🇱🇹":355,"🇱🇮":351,"🇱🇾":358,"🇱🇷":353,"🇱🇸":354,"🇱🇧":349,"🇱🇻":357,"🇱🇦":348,"🇰🇬":338,"🇰🇼":345,"🇽🇰":464,"🇰🇮":340,"🇰🇪":337,"🇻🇬":458,"🇮🇴":328,"🇰🇿":347,"🇯🇴":335,"🇯🇪":333,"🇯🇵":336,"🇯🇲":334,"🇮🇹":332,"🇮🇱":325,"🇮🇲":326,"🇮🇪":324,"🇮🇶":329,"🇮🇷":330,"🇮🇩":323,"🇮🇳":327,"🇮🇸":331,"🇭🇺":321,"🇭🇰":317,"🇭🇳":318,"🇭🇹":320,"🇬🇾":316,"🇬🇼":315,"🇬🇳":308,"🇬🇬":303,"🇧🇷":253,"🇧🇼":256,"🇬🇹":313,"🇬🇺":314,"🇬🇵":309,"🇬🇩":300,"🇫🇷":297,"👁🗨":827,"🇦🇫":225,"🇦🇽":237,"🇦🇱":228,"🇩🇿":283,"🇦🇸":233,"🇦🇩":223,"🇦🇴":230,"🇦🇮":227,"🇦🇶":231,"🇦🇬":226,"🇦🇷":232,"🇦🇲":229,"🇦🇼":236,"🇦🇺":235,"🇦🇹":234,"🇦🇿":238,"🇧🇸":254,"🇧🇭":245,"🇧🇩":241,"🇧🇧":240,"🇧🇾":257,"🇧🇪":242,"🇧🇿":258,"🇧🇯":247,"🇧🇲":249,"🇧🇹":255,"🇧🇴":251,"🇧🇦":239,"️🌥":520,"️♠️":91,"*️⃣":2,"#️⃣":1,"9️⃣":12,"8️⃣":11,"7️⃣":10,"6️⃣":9,"5️⃣":8,"4️⃣":7,"3️⃣":6,"2️⃣":5,"1️⃣":4,"0️⃣":3,"️🚰":1532,"🅿️":211,"🈂️":471,"️💹":1140,"🈯️":473,"🅾️":210,"🅱️":209,"🅰️":208,"🈷️":479,"️🈸":480,"🈚️":472,"⛹🏿":137,"⛹🏾":136,"⛹🏽":135,"⛹🏼":134,"⛹🏻":133,"🀄️":206,"️🌤":519,"️🌟":516,"✍🏿":167,"✍🏾":166,"✍🏽":165,"✍🏼":164,"✍🏻":163,"️👆":842,"☝🏿":68,"☝🏾":67,"☝🏽":66,"☝🏼":65,"☝🏻":64,"✋🏿":155,"✋🏾":154,"✋🏽":153,"✋🏼":152,"✋🏻":151,"️👌":878,"✌🏿":161,"✌🏾":160,"✌🏽":159,"✌🏼":158,"✌🏻":157,"✊🏿":149,"✊🏾":148,"✊🏽":147,"✊🏼":146,"✊🏻":145,"🙅":1428,"☁️":54,"👍":884,"🌧":522,"😌":1371,"🌩":524,"⚡️":107,"💂":1051,"🔥":1247,"💥":1115,"❄️":177,"👉":860,"🌨":523,"☃️":56,"😍":1372,"⛄️":114,"😘":1383,"🌬":527,"💨":1118,"🌪":525,"🌫":526,"☂️":55,"😗":1382,"☔️":60,"😙":1384,"💧":1117,"💦":1116,"🌊":495,"🍏":562,"🍎":561,"🍐":563,"🍊":557,"🍋":558,"🍌":559,"🍉":556,"🍇":554,"🍓":566,"🍈":555,"🍒":565,"🍑":564,"🍍":560,"🍅":552,"🍆":553,"🌶":537,"🌽":544,"🍠":579,"🍯":594,"🍞":577,"🧀":1610,"🍗":570,"🍖":569,"🍤":583,"🍳":598,"🍔":567,"🍟":578,"🌭":528,"🍕":568,"🍝":576,"🌮":529,"🌯":530,"🍜":575,"🍲":597,"🍥":584,"🍣":582,"🍱":596,"🍛":574,"🍙":572,"🍚":573,"🍘":571,"🍢":581,"🍡":580,"🍧":586,"🍨":587,"🍦":585,"🍰":595,"🎂":613,"🍮":593,"🍬":591,"🍭":592,"🍫":590,"🍿":610,"🍩":588,"🍪":589,"🍺":605,"🍻":606,"🍷":602,"🍸":603,"🍹":604,"🍾":609,"🍶":601,"🍵":600,"☕️":61,"🕵":1306,"🍼":607,"🍴":599,"🍽":608,"⚽️":112,"🎅":616,"🏀":675,"🏈":698,"⚾️":113,"👎":890,"🎾":673,"🏐":716,"🏉":699,"🎱":660,"⛳️":127,"🖕":1322,"🏌":712,"🏓":719,"🏸":753,"🏒":718,"🏑":717,"🏏":715,"🎿":674,"😚":1385,"🏂":677,"😜":1387,"🏹":754,"🎣":646,"🚣":1514,"😝":1388,"👼":1035,"😛":1386,"🤑":1592,"🖐":1316,"🏊":700,"👊":866,"🤓":1594,"👸":1026,"😎":1373,"🤗":1598,"🏄":684,"😏":1374,"🤘":1599,"😶":1413,"👰":978,"🏽":758,"🛀":1563,"😐":1375,"😑":1376,"😒":1377,"🖖":1328,"🚶":1548,"🙄":1427,"🤔":1595,"✌️":156,"🏼":757,"😳":1410,"🏃":678,"🏋":706,"😞":1389,"😟":1390,"😠":1391,"😡":1392,"😔":1379,"🚴":1536,"💃":1057,"😕":1380,"💅":1064,"🙁":1424,"☹️":77,"🚵":1542,"🏾":759,"👯":977,"👫":968,"👬":969,"👭":970,"🏇":692,"🙇":1440,"😣":1394,"👌":878,"👄":840,"👅":841,"🕴":1305,"🏆":691,"🎽":672,"🏅":690,"🎖":636,"🎗":637,"🏵":751,"🎫":654,"🎟":642,"🎭":656,"🎨":651,"🎪":653,"🎤":647,"🎧":650,"🎼":671,"🎹":668,"🎷":666,"🎺":669,"🎸":667,"🎻":670,"🎬":655,"🎮":657,"👾":1042,"🎯":658,"🎲":661,"🎰":659,"🎳":662,"🚗":1502,"🚕":1500,"🚙":1504,"🚌":1491,"🚎":1493,"🏎":714,"🚓":1498,"🚑":1496,"🚒":1497,"🚐":1495,"🚚":1505,"🚛":1506,"🚜":1507,"🏍":713,"🚲":1534,"🚨":1524,"🚔":1499,"🚍":1492,"🚘":1503,"🚖":1501,"🚡":1512,"🚠":1511,"🚟":1510,"🚃":1482,"🚋":1490,"🚝":1508,"🚄":1483,"🚅":1484,"🚈":1487,"🚞":1509,"🚂":1481,"🚆":1485,"🚇":1486,"🚊":1489,"🚉":1488,"🚁":1480,"🛩":1586,"✈️":142,"👂":828,"🛫":1587,"🛬":1588,"⛵️":129,"💁":1045,"🛥":1585,"🚤":1520,"😖":1381,"🛳":1590,"🚀":1479,"🛰":1589,"💺":1141,"⚓️":99,"😫":1402,"🚧":1523,"⛽️":139,"😩":1400,"🚏":1494,"🚦":1521,"🚥":1522,"🏁":676,"🚢":1513,"🎡":644,"🎢":645,"🎠":643,"🏗":723,"🌁":486,"🗼":1355,"🏭":745,"⛲️":126,"😤":1395,"🎑":633,"😮":1405,"🏔":720,"🗻":1354,"🌋":496,"🗾":1357,"🏕":721,"⛺️":138,"😬":1403,"🏞":730,"🛣":1583,"🛤":1584,"🌅":490,"🌄":489,"🏜":728,"🏖":722,"🏝":729,"🌇":492,"🌆":491,"🏙":725,"🌃":488,"🌉":494,"🌌":497,"🌠":517,"🎇":623,"🎆":622,"🌈":493,"🏘":724,"🏰":748,"🏯":747,"🏟":731,"🗽":1356,"🏠":732,"🏡":733,"🏚":726,"🏢":734,"🏬":744,"🏣":735,"🏤":736,"🏥":737,"🏦":738,"🏨":740,"🏪":742,"🏫":743,"🏩":741,"💒":1096,"🏛":727,"⛪️":123,"👃":834,"🕌":1275,"🕍":1276,"🕋":1274,"😱":1408,"⌚️":27,"😨":1399,"📱":1196,"📲":1197,"💻":1142,"😰":1407,"🖥":1334,"🖨":1335,"🖱":1336,"🖲":1337,"🕹":1310,"🗜":1345,"💽":1144,"💾":1145,"💿":1146,"📀":1147,"📼":1207,"📷":1202,"📸":1203,"📹":1204,"🎥":648,"📽":1208,"🎞":641,"📞":1177,"☎️":58,"😯":1406,"📟":1178,"📠":1179,"📺":1205,"📻":1206,"🎙":638,"🎚":639,"🎛":640,"🙆":1434,"😦":1397,"👁":826,"🕰":1303,"👀":825,"⌛️":28,"👤":927,"📡":1180,"🔋":1221,"🔌":1222,"💡":1111,"🔦":1248,"🕯":1302,"🗑":1342,"🛢":1582,"💸":1139,"💵":1136,"💴":1135,"💶":1137,"💷":1138,"💰":1131,"💳":1134,"💎":1088,"👥":928,"🔧":1249,"🔨":1250,"🙋":1449,"🛠":1580,"🗣":1349,"🔩":1251,"👶":1014,"🏻":756,"🔫":1253,"💣":1113,"🔪":1252,"🗡":1348,"😧":1398,"🛡":1581,"🚬":1528,"😢":1393,"🙎":1467,"😥":1396,"🏺":755,"🔮":1256,"📿":1209,"💈":1082,"😪":1401,"🔭":1255,"🔬":1254,"🕳":1304,"💊":1084,"💉":1083,"🌡":518,"🏷":752,"🔖":1232,"🚽":1560,"🚿":1562,"🛁":1569,"🔑":1227,"🗝":1346,"🛋":1574,"🛌":1575,"🛏":1578,"🚪":1526,"🛎":1577,"🖼":1338,"🗺":1353,"👦":929,"🗿":1358,"🛍":1576,"🎈":624,"🎏":631,"🎀":611,"🎁":612,"🎊":626,"🎉":625,"🎎":630,"🎐":632,"🎌":628,"🏮":746,"✉️":143,"😓":1378,"📩":1188,"📨":1187,"📧":1186,"💌":1086,"📮":1193,"📪":1189,"📫":1190,"📬":1191,"📭":1192,"📦":1185,"📯":1194,"📥":1184,"📤":1183,"📜":1175,"📃":1150,"📑":1164,"📊":1157,"📈":1155,"📉":1156,"📄":1151,"📅":1152,"📆":1153,"🗓":1344,"📇":1154,"🗃":1340,"🗳":1352,"🗄":1341,"📋":1158,"🗒":1343,"📁":1148,"📂":1149,"🗂":1339,"🗞":1347,"📰":1195,"📓":1166,"📕":1168,"📗":1170,"📘":1171,"📙":1172,"📔":1167,"📒":1165,"📚":1173,"📖":1169,"🔗":1233,"📎":1161,"🖇":1311,"✂️":140,"👐":902,"📐":1163,"📏":1162,"📌":1159,"📍":1160,"🚩":1525,"🏳":749,"🏴":750,"🔐":1226,"🔒":1228,"🔓":1229,"🔏":1225,"🖊":1312,"🖋":1313,"✒️":169,"🙍":1461,"📝":1176,"✏️":168,"😭":1404,"🖍":1315,"🖌":1314,"🔍":1223,"🔎":1224,"❤️":186,"😵":1409,"💛":1105,"💚":1104,"💙":1103,"💜":1106,"💔":1098,"❣️":185,"😲":1412,"💕":1099,"💞":1108,"💓":1097,"💗":1101,"💖":1100,"💘":1102,"💝":1107,"💟":1109,"👧":935,"✝️":172,"🤐":1591,"💇":1076,"🕉":1272,"😷":1414,"✡️":173,"💪":1120,"🔯":1257,"🕎":1277,"☯️":75,"🤒":1593,"🤕":1596,"🛐":1579,"👨":941,"♈️":79,"💆":1070,"♉️":80,"😴":1411,"♊️":81,"💤":1114,"♋️":82,"💩":1119,"♌️":83,"🙏":1473,"♍️":84,"😈":1367,"♎️":85,"💑":1093,"♏️":86,"👩":947,"♐️":87,"👿":1043,"♑️":88,"👹":1032,"♒️":89,"👺":1033,"♓️":90,"💏":1089,"🆔":216,"💀":1044,"🈳":475,"🈹":481,"☝️":63,"👱":984,"📴":1199,"📳":1198,"🈶":478,"👻":1034,"🈚":472,"👪":953,"🈸":480,"🈺":482,"👽":1041,"🈷":479,"✴️":176,"🤖":1597,"🆚":222,"🉑":484,"💮":1129,"🉐":483,"㊙️":205,"😺":1417,"㊗️":204,"😸":1415,"🈴":476,"🈵":477,"🈲":474,"👴":1002,"🅰":208,"😹":1416,"🅱":209,"🆎":212,"🆑":213,"😻":1418,"🅾":210,"🆘":220,"⛔️":121,"😼":1419,"📛":1174,"🚫":1527,"😽":1420,"⭕️":201,"🙀":1423,"💢":1112,"♨️":95,"👵":1008,"🚷":1554,"🚯":1531,"🚳":1535,"🚱":1533,"🔞":1240,"📵":1200,"❗️":184,"😿":1422,"😾":1421,"👆":842,"🙌":1455,"‼️":15,"😀":1359,"⁉️":16,"👲":990,"💯":1130,"🔅":1215,"🔆":1216,"🔱":1259,"😁":1360,"〽️":203,"😂":1361,"⚠️":106,"😃":1362,"🚸":1555,"🔰":1258,"♻️":96,"😄":1363,"👏":896,"🈯":473,"👳":996,"💹":1140,"❇️":178,"😅":1364,"✳️":175,"😆":1365,"😇":1366,"👇":848,"💠":1110,"🌀":485,"😉":1368,"🌐":501,"Ⓜ️":44,"👚":917,"🏧":739,"👕":912,"🈂":471,"🛂":1570,"🛃":1571,"🛄":1572,"🛅":1573,"♿️":97,"👖":913,"🚭":1529,"🚾":1561,"👔":911,"🅿":211,"👗":914,"🚰":1532,"🚹":1556,"🚺":1557,"🚼":1559,"🚻":1558,"🚮":1530,"🎦":649,"📶":1201,"🈁":470,"🆖":218,"🆗":219,"🆙":221,"🆒":214,"🆕":217,"🆓":215,"👙":916,"0⃣":3,"👘":915,"1⃣":4,"💄":1063,"2⃣":5,"💋":1085,"3⃣":6,"👣":926,"4⃣":7,"👠":923,"5⃣":8,"👡":924,"6⃣":9,"👢":925,"7⃣":10,"👞":921,"8⃣":11,"👟":922,"9⃣":12,"🔟":1241,"🔢":1244,"▶️":47,"👒":909,"🎩":652,"🎓":635,"👑":908,"👮":971,"🎒":634,"👝":920,"👛":918,"👜":919,"🔀":1210,"🔁":1211,"🔂":1212,"◀️":48,"💼":1143,"🔼":1270,"🔽":1271,"👓":910,"🕶":1307,"➡️":190,"💍":1087,"⬅️":195,"🌂":487,"⬆️":196,"🐶":815,"⬇️":197,"🐱":810,"↗️":22,"🐭":806,"↘️":23,"🐹":818,"↙️":24,"🐰":809,"↖️":21,"🐻":820,"↕️":20,"🐼":821,"↔️":19,"🐨":801,"🔄":1214,"↪️":26,"🐯":808,"↩️":25,"🦁":1606,"⤴️":193,"🐮":807,"⤵️":194,"🐷":816,"🐽":822,"#⃣":1,"🐸":817,"*⃣":2,"ℹ️":18,"🐙":786,"🔤":1246,"🔡":1243,"🔠":1242,"🔣":1245,"🎵":664,"🎶":665,"〰️":202,"🐵":814,"🙈":1446,"✔️":170,"🙉":1447,"🔃":1213,"🙊":1448,"🐒":779,"🐔":781,"✖️":171,"🐧":800,"💲":1133,"💱":1132,"©️":13,"🐦":799,"®️":14,"🐤":797,"™️":17,"🐣":796,"🔚":1236,"🔙":1235,"🔛":1237,"🔝":1239,"🔜":1238,"☑️":59,"🐥":798,"🔘":1234,"⚪️":108,"🐺":819,"⚫️":109,"🐗":784,"🔴":1262,"🔵":1263,"🔸":1266,"🔹":1267,"🔶":1264,"🔷":1265,"🔺":1268,"▪️":45,"🐴":813,"▫️":46,"🦄":1609,"⬛️":198,"🐝":790,"⬜️":199,"🐛":788,"🔻":1269,"◼️":50,"🐌":773,"◻️":49,"🐞":791,"◾️":52,"🐜":789,"◽️":51,"🕷":1308,"🔲":1260,"🔳":1261,"🔈":1218,"🔉":1219,"🔊":1220,"🔇":1217,"📣":1182,"📢":1181,"🔔":1230,"🔕":1231,"🃏":207,"🦂":1607,"🀄":206,"🦀":1605,"♠️":91,"🐍":774,"♣️":92,"🐢":795,"♥️":93,"🐠":793,"♦️":94,"🐟":792,"🎴":663,"🐡":794,"🐬":805,"💭":1128,"🗯":1351,"💬":1127,"🕐":1278,"🕑":1279,"🕒":1280,"🕓":1281,"🕔":1282,"🕕":1283,"🕖":1284,"🕗":1285,"🕘":1286,"🕙":1287,"🕚":1288,"🕛":1289,"🕜":1290,"🕝":1291,"🕞":1292,"🕟":1293,"🕠":1294,"🕡":1295,"🕢":1296,"🕣":1297,"🕤":1298,"🕥":1299,"🕦":1300,"🕧":1301,"🐳":812,"🐋":772,"🐊":771,"🐆":767,"🐅":766,"🐃":764,"🐂":763,"🐄":765,"🐪":803,"🐫":804,"🐘":785,"🐐":777,"🐏":776,"🐑":778,"🐎":775,"🐖":783,"🐀":761,"🐁":762,"🐓":780,"🦃":1608,"🕊":1273,"🐕":782,"🐩":802,"🐈":769,"🐇":768,"🐿":824,"🐾":823,"🐉":770,"🐲":811,"🌵":536,"🎄":615,"🌲":533,"🌳":534,"🌴":535,"🌱":532,"🌿":546,"😊":1369,"🍀":547,"🎍":629,"🎋":627,"🍃":550,"🍂":549,"🍁":548,"🌾":545,"🌺":541,"🌻":542,"🌹":540,"🌷":538,"🌼":543,"🌸":539,"💐":1092,"🍄":551,"🌰":531,"🎃":614,"🐚":787,"🕸":1309,"🌎":499,"🌍":498,"🌏":500,"🌕":506,"🌖":507,"🌗":508,"🌘":509,"🌑":502,"🌒":503,"🌓":504,"🌔":505,"🌚":511,"🌝":514,"🌛":512,"🌜":513,"🌞":515,"🌙":510,"⭐️":200,"👋":872,"🙂":1425,"🌟":516,"💫":1126,"🙃":1426,"👈":854,"☀️":53,"👷":1020,"☺️":78,"🌤":519,"⛅️":115,"🏿":760,"😋":1370,"🌥":520,"🌦":521,"🗨":1350,"♦":94,"♣":92,"♠":91,"◽":51,"◾":52,"◻":49,"◼":50,"⬜":199,"⬛":198,"▫":46,"▪":45,"⚫":109,"⚪":108,"☑":59,"™":17,"®":14,"©":13,"✖":171,"➗":189,"➖":188,"➕":187,"✔":170,"➰":191,"〰":202,"ℹ":18,"⤵":194,"⤴":193,"↩":25,"↪":26,"↔":19,"↕":20,"↖":21,"↙":24,"↘":23,"↗":22,"⬇":197,"⬆":196,"⬅":195,"➡":190,"⏬":33,"⏫":32,"◀":48,"⏪":31,"⏩":30,"⏮":35,"⏭":34,"⏺":43,"⏹":42,"⏯":36,"⏸":41,"▶":47,"♿":97,"Ⓜ":44,"➿":192,"✅":141,"❎":180,"✳":175,"❇":178,"♻":96,"⚠":106,"〽":203,"⚜":105,"⁉":16,"‼":15,"❔":182,"❓":181,"❕":183,"❗":184,"♨":95,"⭕":201,"❌":179,"⛔":121,"㊗":204,"㊙":205,"✴":176,"☣":71,"☢":70,"⚛":104,"♓":90,"♒":89,"♑":88,"♥":93,"♏":86,"♎":85,"♍":84,"♌":83,"♋":82,"♊":81,"♉":80,"♈":79,"⛎":117,"☦":72,"☯":75,"✡":173,"☸":76,"☪":73,"✝":172,"☮":74,"❣":185,"❤":186,"✏":168,"✒":169,"✂":140,"✉":143,"⛱":125,"⚗":102,"⚱":111,"⚰":110,"☠":69,"⚔":100,"⛓":120,"⚙":103,"⛏":118,"⚒":98,"⚖":101,"⌛":28,"⏳":40,"⏰":37,"⏲":39,"⏱":38,"☎":58,"⌨":29,"⌚":27,"⛩":122,"⛪":123,"⛺":138,"⛰":124,"⛲":126,"⛽":139,"⚓":99,"⛴":128,"⛵":129,"✈":142,"⛹":132,"⛸":131,"⛷":130,"⛳":127,"⚾":113,"⚽":112,"☕":61,"☔":60,"☂":55,"⛄":114,"☃":56,"❄":177,"⚡":107,"⛈":116,"☁":54,"⛅":115,"☀":53,"☄":57,"✨":174,"⭐":200,"☘":62,"⛑":119,"✍":162,"☝":63,"✋":150,"✌":156,"✊":144,"☹":77,"☺":78,"♐":87};
	var regx_arr=[];
	for(var k in emoji){
		regx_arr.push(ca(k));
	}
	var regx = new RegExp('(' + regx_arr.join('|') + ')', 'g');
	regx_arr = null;
	var minEmoji = function(s, wrap){
		return s.replace(regx, function (a, b) {
			var smileIMG  = '<img src="images/blank.gif" ' +
							'alt="'+b+'" ' +
							'data-unicode="'+b+'" ' +
							'class="em emj'+emoji[b]+'" ' +
							'contenteditable="false">';
			if (wrap) {
				smileIMG = '<div class="em_wrap j-em_wrap">' + smileIMG + '</div>';
			}

			return smileIMG
		});
	}
	window.minEmoji = minEmoji;
})();
