/** @noSelfInFile */

/**
 * The ids of the game's orders, one member per order, for the order members of {@link Unit} and the `orderId` of an order event.
 * @remarks
 * - A member is named after its order string, with the first letter capitalised: `OrderId.Attack` is the id of the `attack` order.
 * - Some orders have no order string, such as `Moveslot1` to `Moveslot6` and `Useslot1` to `Useslot6`: those are issued and recognised by id only.
 * - `Battleroar` and `Forkedlightning` hold the ids of other orders: see their comments.
 * - `OrderId` is a `const enum`: each use compiles to the number, and the emitted Lua holds no `OrderId` table to look a name up in.
 */
export const enum OrderId {
  /** The id of the `absorb` order. */
  Absorb = 852529,
  /** The id of the `acidbomb` order. */
  Acidbomb = 852662,
  /** The id of the `acolyteharvest` order. */
  Acolyteharvest = 852185,
  /** The id of the `AImove` order: the game spells the string with a capital `AI`. */
  Aimove = 851988,
  /** The id of the `ambush` order. */
  Ambush = 852131,
  /** The id of the `ancestralspirit` order. */
  Ancestralspirit = 852490,
  /** The id of the `ancestralspirittarget` order. */
  Ancestralspirittarget = 852491,
  /** The id of the `animatedead` order. */
  Animatedead = 852217,
  /** The id of the `antimagicshell` order. */
  Antimagicshell = 852186,
  /** The id of the `attack` order. */
  Attack = 851983,
  /** The id of the `attackground` order. */
  Attackground = 851984,
  /** The id of the `attackonce` order. */
  Attackonce = 851985,
  /** The id of the `attributemodskill` order. */
  Attributemodskill = 852576,
  /** The id of the `auraunholy` order. */
  Auraunholy = 852215,
  /** The id of the `auravampiric` order. */
  Auravampiric = 852216,
  /** The id of the `autodispel` order. */
  Autodispel = 852132,
  /** The id of the `autodispeloff` order. */
  Autodispeloff = 852134,
  /** The id of the `autodispelon` order. */
  Autodispelon = 852133,
  /** The id of the `autoentangle` order. */
  Autoentangle = 852505,
  /** The id of the `autoentangleinstant` order. */
  Autoentangleinstant = 852506,
  /** The id of the `autoharvestgold` order. */
  Autoharvestgold = 852021,
  /** The id of the `autoharvestlumber` order. */
  Autoharvestlumber = 852022,
  /** The id of the `avatar` order. */
  Avatar = 852086,
  /** The id of the `avengerform` order. */
  Avengerform = 852531,
  /** The id of the `awaken` order. */
  Awaken = 852466,
  /** The id of the `banish` order. */
  Banish = 852486,
  /** The id of the `barkskin` order. */
  Barkskin = 852135,
  /** The id of the `barkskinoff` order. */
  Barkskinoff = 852137,
  /** The id of the `barkskinon` order. */
  Barkskinon = 852136,
  /**
   * A wrong id for the `battleroar` order: it holds the id of `battlestations`.
   * @remarks
   * The value is wrong: it is 852099, the id of `battlestations` ({@link OrderId.Battlestations}), where the game gives `battleroar` the id 852599. Issue the order by its string until the value is fixed.
   */
  Battleroar = 852099,
  /** The id of the `battlestations` order. */
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- Battleroar holds this id by mistake; fixing its value (#255) removes it
  Battlestations = 852099,
  /** The id of the `bearform` order. */
  Bearform = 852138,
  /** The id of the `berserk` order. */
  Berserk = 852100,
  /** The id of the `blackarrow` order. */
  Blackarrow = 852577,
  /** The id of the `blackarrowoff` order. */
  Blackarrowoff = 852579,
  /** The id of the `blackarrowon` order. */
  Blackarrowon = 852578,
  /** The id of the `blight` order. */
  Blight = 852187,
  /** The id of the `blink` order. */
  Blink = 852525,
  /** The id of the `blizzard` order. */
  Blizzard = 852089,
  /** The id of the `bloodlust` order. */
  Bloodlust = 852101,
  /** The id of the `bloodlustoff` order. */
  Bloodlustoff = 852103,
  /** The id of the `bloodluston` order. */
  Bloodluston = 852102,
  /** The id of the `board` order. */
  Board = 852043,
  /** The id of the `breathoffire` order. */
  Breathoffire = 852580,
  /** The id of the `breathoffrost` order. */
  Breathoffrost = 852560,
  /** The id of the `build` order. */
  Build = 851994,
  /** The id of the `burrow` order. */
  Burrow = 852533,
  /** The id of the order that cancels a build, which has no order string: the game's internal order table calls it `ORDER_CANCEL_BUILD`. */
  Cancel = 851976,
  /** The id of the `cannibalize` order. */
  Cannibalize = 852188,
  /** The id of the `carrionscarabs` order. */
  Carrionscarabs = 852551,
  /** The id of the `carrionscarabsinstant` order. */
  Carrionscarabsinstant = 852554,
  /** The id of the `carrionscarabsoff` order. */
  Carrionscarabsoff = 852553,
  /** The id of the `carrionscarabson` order. */
  Carrionscarabson = 852552,
  /** The id of the `carrionswarm` order. */
  Carrionswarm = 852218,
  /** The id of the `chainlightning` order. */
  Chainlightning = 852119,
  /** The id of the `channel` order. */
  Channel = 852600,
  /** The id of the `charm` order. */
  Charm = 852581,
  /** The id of the `chemicalrage` order. */
  Chemicalrage = 852663,
  /** The id of the `cloudoffog` order. */
  Cloudoffog = 852473,
  /** The id of the `clusterrockets` order. */
  Clusterrockets = 852652,
  /** The id of the `coldarrows` order. */
  Coldarrows = 852244,
  /** The id of the `coldarrowstarg` order. */
  Coldarrowstarg = 852243,
  /** The id of the `controlmagic` order. */
  Controlmagic = 852474,
  /** The id of the `corporealform` order. */
  Corporealform = 852493,
  /** The id of the `corrosivebreath` order. */
  Corrosivebreath = 852140,
  /** The id of the `coupleinstant` order. */
  Coupleinstant = 852508,
  /** The id of the `coupletarget` order. */
  Coupletarget = 852507,
  /** The id of the `creepanimatedead` order. */
  Creepanimatedead = 852246,
  /** The id of the `creepdevour` order. */
  Creepdevour = 852247,
  /** The id of the `creepheal` order. */
  Creepheal = 852248,
  /** The id of the `creephealoff` order. */
  Creephealoff = 852250,
  /** The id of the `creephealon` order. */
  Creephealon = 852249,
  /** The id of the `creepthunderbolt` order. */
  Creepthunderbolt = 852252,
  /** The id of the `creepthunderclap` order. */
  Creepthunderclap = 852253,
  /** The id of the `cripple` order. */
  Cripple = 852189,
  /** The id of the `curse` order. */
  Curse = 852190,
  /** The id of the `curseoff` order. */
  Curseoff = 852192,
  /** The id of the `curseon` order. */
  Curseon = 852191,
  /** The id of the `cyclone` order. */
  Cyclone = 852144,
  /** The id of the `darkconversion` order. */
  Darkconversion = 852228,
  /** The id of the `darkportal` order. */
  Darkportal = 852229,
  /** The id of the `darkritual` order. */
  Darkritual = 852219,
  /** The id of the `darksummoning` order. */
  Darksummoning = 852220,
  /** The id of the `deathanddecay` order. */
  Deathanddecay = 852221,
  /** The id of the `deathcoil` order. */
  Deathcoil = 852222,
  /** The id of the `deathpact` order. */
  Deathpact = 852223,
  /** The id of the `decouple` order. */
  Decouple = 852509,
  /** The id of the `defend` order. */
  Defend = 852055,
  /** The id of the `detectaoe` order. */
  Detectaoe = 852015,
  /** The id of the `detonate` order. */
  Detonate = 852145,
  /** The id of the `devour` order. */
  Devour = 852104,
  /** The id of the `devourmagic` order. */
  Devourmagic = 852536,
  /** The id of the `disassociate` order. */
  Disassociate = 852240,
  /** The id of the `disenchant` order. */
  Disenchant = 852495,
  /** The id of the `dismount` order. */
  Dismount = 852470,
  /** The id of the `dispel` order. */
  Dispel = 852057,
  /** The id of the `divineshield` order. */
  Divineshield = 852090,
  /** The id of the `doom` order. */
  Doom = 852583,
  /** The id of the `drain` order. */
  Drain = 852487,
  /** The id of the `dreadlordinferno` order. */
  Dreadlordinferno = 852224,
  /** The id of the `dropitem` order. */
  Dropitem = 852001,
  /** The id of the `drunkenhaze` order. */
  Drunkenhaze = 852585,
  /** The id of the `earthquake` order. */
  Earthquake = 852121,
  /** The id of the `eattree` order. */
  Eattree = 852146,
  /** The id of the `elementalfury` order. */
  Elementalfury = 852586,
  /** The id of the `ensnare` order. */
  Ensnare = 852106,
  /** The id of the `ensnareoff` order. */
  Ensnareoff = 852108,
  /** The id of the `ensnareon` order. */
  Ensnareon = 852107,
  /** The id of the `entangle` order. */
  Entangle = 852147,
  /** The id of the `entangleinstant` order. */
  Entangleinstant = 852148,
  /** The id of the `entanglingroots` order. */
  Entanglingroots = 852171,
  /** The id of the `etherealform` order. */
  Etherealform = 852496,
  /** The id of the `evileye` order. */
  Evileye = 852105,
  /** The id of the `faeriefire` order. */
  Faeriefire = 852149,
  /** The id of the `faeriefireoff` order. */
  Faeriefireoff = 852151,
  /** The id of the `faeriefireon` order. */
  Faeriefireon = 852150,
  /** The id of the `fanofknives` order. */
  Fanofknives = 852526,
  /** The id of the `farsight` order. */
  Farsight = 852122,
  /** The id of the `fingerofdeath` order. */
  Fingerofdeath = 852230,
  /** The id of the `firebolt` order. */
  Firebolt = 852231,
  /** The id of the `flamestrike` order. */
  Flamestrike = 852488,
  /** The id of the `flamingarrows` order. */
  Flamingarrows = 852174,
  /** The id of the `flamingarrowstarg` order. */
  Flamingarrowstarg = 852173,
  /** The id of the `flamingattack` order. */
  Flamingattack = 852540,
  /** The id of the `flamingattacktarg` order. */
  Flamingattacktarg = 852539,
  /** The id of the `flare` order. */
  Flare = 852060,
  /** The id of the `forceboard` order. */
  Forceboard = 852044,
  /** The id of the `forceofnature` order. */
  Forceofnature = 852176,
  /**
   * A wrong id for the `forkedlightning` order: it holds the id of `elementalfury`.
   * @remarks
   * The value is wrong: it is 852586, the id of `elementalfury` ({@link OrderId.Elementalfury}), where the game gives `forkedlightning` the id 852587. Issue the order by its string until the value is fixed.
   */
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- this id is Elementalfury's, by mistake; fixing the value (#255) removes it
  Forkedlightning = 852586,
  /** The id of the `freezingbreath` order. */
  Freezingbreath = 852195,
  /** The id of the `frenzy` order. */
  Frenzy = 852561,
  /** The id of the `frenzyoff` order. */
  Frenzyoff = 852563,
  /** The id of the `frenzyon` order. */
  Frenzyon = 852562,
  /** The id of the `frostarmor` order. */
  Frostarmor = 852225,
  /** The id of the `frostarmoroff` order. */
  Frostarmoroff = 852459,
  /** The id of the `frostarmoron` order. */
  Frostarmoron = 852458,
  /** The id of the `frostnova` order. */
  Frostnova = 852226,
  /** The id of the `getitem` order. */
  Getitem = 851981,
  /** The id of the `gold2lumber` order. */
  Gold2lumber = 852233,
  /** The id of the `grabtree` order. */
  Grabtree = 852511,
  /** The id of the `harvest` order. */
  Harvest = 852018,
  /** The id of the `heal` order. */
  Heal = 852063,
  /** The id of the `healingspray` order. */
  Healingspray = 852664,
  /** The id of the `healingward` order. */
  Healingward = 852109,
  /** The id of the `healingwave` order. */
  Healingwave = 852501,
  /** The id of the `healoff` order. */
  Healoff = 852065,
  /** The id of the `healon` order. */
  Healon = 852064,
  /** The id of the `hex` order. */
  Hex = 852502,
  /** The id of the `holdposition` order. */
  Holdposition = 851993,
  /** The id of the `holybolt` order. */
  Holybolt = 852092,
  /** The id of the `howlofterror` order. */
  Howlofterror = 852588,
  /** The id of the `humanbuild` order. */
  Humanbuild = 851995,
  /** The id of the `immolation` order. */
  Immolation = 852177,
  /** The id of the `impale` order. */
  Impale = 852555,
  /** The id of the `incineratearrow` order. */
  Incineratearrow = 852670,
  /** The id of the `incineratearrowoff` order. */
  Incineratearrowoff = 852672,
  /** The id of the `incineratearrowon` order. */
  Incineratearrowon = 852671,
  /** The id of the `inferno` order. */
  Inferno = 852232,
  /** The id of the `innerfire` order. */
  Innerfire = 852066,
  /** The id of the `innerfireoff` order. */
  Innerfireoff = 852068,
  /** The id of the `innerfireon` order. */
  Innerfireon = 852067,
  /** The id of the `instant` order. */
  Instant = 852200,
  /** The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_PATROL2`. */
  Instant1 = 851991,
  /** The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_GUARD_RETURN`. */
  Instant2 = 851987,
  /** The id of the generic cancel order, which has no order string: the game's internal order table calls it `ORDER_CANCEL`. */
  Instant3 = 851975,
  /** The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_HARVEST_AGAIN`. */
  Instant4 = 852019,
  /** The id of the `invisibility` order. */
  Invisibility = 852069,
  /** The id of the `lavamonster` order. */
  Lavamonster = 852667,
  /** The id of the `lightningshield` order. */
  Lightningshield = 852110,
  /** The id of the `load` order. */
  Load = 852046,
  /** The id of the `loadarcher` order. */
  Loadarcher = 852142,
  /** The id of the `loadcorpse` order. */
  Loadcorpse = 852050,
  /** The id of the `loadcorpseinstant` order. */
  Loadcorpseinstant = 852053,
  /** The id of the `locustswarm` order. */
  Locustswarm = 852556,
  /** The id of the `lumber2gold` order. */
  Lumber2gold = 852234,
  /** The id of the `magicdefense` order. */
  Magicdefense = 852478,
  /** The id of the `magicleash` order. */
  Magicleash = 852480,
  /** The id of the `magicundefense` order. */
  Magicundefense = 852479,
  /** The id of the `manaburn` order. */
  Manaburn = 852179,
  /** The id of the `manaflareoff` order. */
  Manaflareoff = 852513,
  /** The id of the `manaflareon` order. */
  Manaflareon = 852512,
  /** The id of the `manashieldoff` order. */
  Manashieldoff = 852590,
  /** The id of the `manashieldon` order. */
  Manashieldon = 852589,
  /** The id of the `massteleport` order. */
  Massteleport = 852093,
  /** The id of the `mechanicalcritter` order. */
  Mechanicalcritter = 852564,
  /** The id of the `metamorphosis` order. */
  Metamorphosis = 852180,
  /** The id of the `militia` order. */
  Militia = 852072,
  /** The id of the `militiaconvert` order. */
  Militiaconvert = 852071,
  /** The id of the `militiaoff` order. */
  Militiaoff = 852073,
  /** The id of the `militiaunconvert` order. */
  Militiaunconvert = 852651,
  /** The id of the `mindrot` order. */
  Mindrot = 852565,
  /** The id of the `mirrorimage` order. */
  Mirrorimage = 852123,
  /** The id of the `monsoon` order. */
  Monsoon = 852591,
  /** The id of the `mount` order. */
  Mount = 852469,
  /** The id of the `mounthippogryph` order. */
  Mounthippogryph = 852143,
  /** The id of the `move` order. */
  Move = 851986,
  /** The id of the order that moves the target item to the unit's first inventory slot (index 0), which has no order string. */
  Moveslot1 = 852002,
  /** The id of the order that moves the target item to the unit's second inventory slot (index 1), which has no order string. */
  Moveslot2 = 852003,
  /** The id of the order that moves the target item to the unit's third inventory slot (index 2), which has no order string. */
  Moveslot3 = 852004,
  /** The id of the order that moves the target item to the unit's fourth inventory slot (index 3), which has no order string. */
  Moveslot4 = 852005,
  /** The id of the order that moves the target item to the unit's fifth inventory slot (index 4), which has no order string. */
  Moveslot5 = 852006,
  /** The id of the order that moves the target item to the unit's sixth inventory slot (index 5), which has no order string. */
  Moveslot6 = 852007,
  /** The id of the `nagabuild` order. */
  Nagabuild = 852467,
  /** The id of the `neutraldetectaoe` order. */
  Neutraldetectaoe = 852023,
  /** The id of the `neutralinteract` order. */
  Neutralinteract = 852566,
  /** The id of the `neutralspell` order. */
  Neutralspell = 852630,
  /** The id of the `nightelfbuild` order. */
  Nightelfbuild = 851997,
  /** The id of the `orcbuild` order. */
  Orcbuild = 851996,
  /** The id of the `parasite` order. */
  Parasite = 852601,
  /** The id of the `parasiteoff` order. */
  Parasiteoff = 852603,
  /** The id of the `parasiteon` order. */
  Parasiteon = 852602,
  /** The id of the `patrol` order. */
  Patrol = 851990,
  /** The id of the `phaseshift` order. */
  Phaseshift = 852514,
  /** The id of the `phaseshiftinstant` order. */
  Phaseshiftinstant = 852517,
  /** The id of the `phaseshiftoff` order. */
  Phaseshiftoff = 852516,
  /** The id of the `phaseshifton` order. */
  Phaseshifton = 852515,
  /** The id of the `phoenixfire` order. */
  Phoenixfire = 852481,
  /** The id of the `phoenixmorph` order. */
  Phoenixmorph = 852482,
  /** The id of the `poisonarrows` order. */
  Poisonarrows = 852255,
  /** The id of the `poisonarrowstarg` order. */
  Poisonarrowstarg = 852254,
  /** The id of the `polymorph` order. */
  Polymorph = 852074,
  /** The id of the `possession` order. */
  Possession = 852196,
  /** The id of the `preservation` order. */
  Preservation = 852568,
  /** The id of the `purge` order. */
  Purge = 852111,
  /** The id of the `rainofchaos` order. */
  Rainofchaos = 852237,
  /** The id of the `rainoffire` order. */
  Rainoffire = 852238,
  /** The id of the `raisedead` order. */
  Raisedead = 852197,
  /** The id of the `raisedeadoff` order. */
  Raisedeadoff = 852199,
  /** The id of the `raisedeadon` order. */
  Raisedeadon = 852198,
  /** The id of the `ravenform` order. */
  Ravenform = 852155,
  /** The id of the `recharge` order. */
  Recharge = 852157,
  /** The id of the `rechargeoff` order. */
  Rechargeoff = 852159,
  /** The id of the `rechargeon` order. */
  Rechargeon = 852158,
  /** The id of the `rejuvination` order. */
  Rejuvination = 852160,
  /** The id of the `renew` order. */
  Renew = 852161,
  /** The id of the `renewoff` order. */
  Renewoff = 852163,
  /** The id of the `renewon` order. */
  Renewon = 852162,
  /** The id of the `repair` order. */
  Repair = 852024,
  /** The id of the `repairoff` order. */
  Repairoff = 852026,
  /** The id of the `repairon` order. */
  Repairon = 852025,
  /** The id of the `replenish` order. */
  Replenish = 852542,
  /** The id of the `replenishlife` order. */
  Replenishlife = 852545,
  /** The id of the `replenishlifeoff` order. */
  Replenishlifeoff = 852547,
  /** The id of the `replenishlifeon` order. */
  Replenishlifeon = 852546,
  /** The id of the `replenishmana` order. */
  Replenishmana = 852548,
  /** The id of the `replenishmanaoff` order. */
  Replenishmanaoff = 852550,
  /** The id of the `replenishmanaon` order. */
  Replenishmanaon = 852549,
  /** The id of the `replenishoff` order. */
  Replenishoff = 852544,
  /** The id of the `replenishon` order. */
  Replenishon = 852543,
  /** The id of the `request_hero` order. */
  Request_hero = 852239,
  /** The id of the `requestsacrifice` order. */
  Requestsacrifice = 852201,
  /** The id of the `restoration` order. */
  Restoration = 852202,
  /** The id of the `restorationoff` order. */
  Restorationoff = 852204,
  /** The id of the `restorationon` order. */
  Restorationon = 852203,
  /** The id of the `resumebuild` order. */
  Resumebuild = 851999,
  /** The id of the `resumeharvesting` order. */
  Resumeharvesting = 852017,
  /** The id of the `resurrection` order. */
  Resurrection = 852094,
  /** The id of the `returnresources` order. */
  Returnresources = 852020,
  /** The id of the `revenge` order. */
  Revenge = 852241,
  /** The id of the `revive` order. */
  Revive = 852039,
  /** The id of the `roar` order. */
  Roar = 852164,
  /** The id of the `robogoblin` order. */
  Robogoblin = 852656,
  /** The id of the `root` order. */
  Root = 852165,
  /** The id of the `sacrifice` order. */
  Sacrifice = 852205,
  /** The id of the `sanctuary` order. */
  Sanctuary = 852569,
  /** The id of the `scout` order. */
  Scout = 852181,
  /** The id of the Scroll of Speed item's order, which has no order string. */
  Scrollofspeed = 852285,
  /** The id of the `selfdestruct` order. */
  Selfdestruct = 852040,
  /** The id of the `selfdestructoff` order. */
  Selfdestructoff = 852042,
  /** The id of the `selfdestructon` order. */
  Selfdestructon = 852041,
  /** The id of the `sentinel` order. */
  Sentinel = 852182,
  /** The id of the `setrally` order. */
  Setrally = 851980,
  /** The id of the `shadowsight` order. */
  Shadowsight = 852570,
  /** The id of the `shadowstrike` order. */
  Shadowstrike = 852527,
  /** The id of the `shockwave` order. */
  Shockwave = 852125,
  /** The id of the `silence` order. */
  Silence = 852592,
  /** The id of the order that opens a hero's skill menu, which has no order string. */
  Skillmenu = 852000,
  /** The id of the `sleep` order. */
  Sleep = 852227,
  /** The id of the `slow` order. */
  Slow = 852075,
  /** The id of the `slowoff` order. */
  Slowoff = 852077,
  /** The id of the `slowon` order. */
  Slowon = 852076,
  /** The id of the `smart` order, the right-click on a point or a target. */
  Smart = 851971,
  /** The id of the `soulburn` order. */
  Soulburn = 852668,
  /** The id of the `soulpreservation` order. */
  Soulpreservation = 852242,
  /** The id of the `spellshield` order. */
  Spellshield = 852571,
  /** The id of the `spellshieldaoe` order. */
  Spellshieldaoe = 852572,
  /** The id of the `spellsteal` order. */
  Spellsteal = 852483,
  /** The id of the `spellstealoff` order. */
  Spellstealoff = 852485,
  /** The id of the `spellstealon` order. */
  Spellstealon = 852484,
  /** The id of the `spies` order. */
  Spies = 852235,
  /** The id of the `spiritlink` order. */
  Spiritlink = 852499,
  /** The id of the `spiritofvengeance` order. */
  Spiritofvengeance = 852528,
  /** The id of the `spirittroll` order. */
  Spirittroll = 852573,
  /** The id of the `spiritwolf` order. */
  Spiritwolf = 852126,
  /** The id of the `stampede` order. */
  Stampede = 852593,
  /** The id of the `standdown` order. */
  Standdown = 852113,
  /** The id of the `starfall` order. */
  Starfall = 852183,
  /** The id of the `stasistrap` order. */
  Stasistrap = 852114,
  /** The id of the `steal` order. */
  Steal = 852574,
  /** The id of the `stomp` order. */
  Stomp = 852127,
  /** The id of the `stoneform` order. */
  Stoneform = 852206,
  /** The id of the `stop` order. */
  Stop = 851972,
  /** The id of the order the game gives a unit that a spell stuns, which has no order string. */
  Stunned = 851973,
  /** The id of the `submerge` order. */
  Submerge = 852604,
  /** The id of the `summonfactory` order. */
  Summonfactory = 852658,
  /** The id of the `summongrizzly` order. */
  Summongrizzly = 852594,
  /** The id of the `summonphoenix` order. */
  Summonphoenix = 852489,
  /** The id of the `summonquillbeast` order. */
  Summonquillbeast = 852595,
  /** The id of the `summonwareagle` order. */
  Summonwareagle = 852596,
  /** The id of the `tankdroppilot` order. */
  Tankdroppilot = 852079,
  /** The id of the `tankloadpilot` order. */
  Tankloadpilot = 852080,
  /** The id of the `tankpilot` order. */
  Tankpilot = 852081,
  /** The id of the `taunt` order. */
  Taunt = 852520,
  /** The id of the `thunderbolt` order. */
  Thunderbolt = 852095,
  /** The id of the `thunderclap` order. */
  Thunderclap = 852096,
  /** The id of the `tornado` order. */
  Tornado = 852597,
  /** The id of the `townbelloff` order. */
  Townbelloff = 852083,
  /** The id of the `townbellon` order. */
  Townbellon = 852082,
  /** The id of the `tranquility` order. */
  Tranquility = 852184,
  /** The id of the `transmute` order. */
  Transmute = 852665,
  /** The id of the `unavatar` order. */
  Unavatar = 852087,
  /** The id of the `unavengerform` order. */
  Unavengerform = 852532,
  /** The id of the `unbearform` order. */
  Unbearform = 852139,
  /** The id of the `unburrow` order. */
  Unburrow = 852534,
  /** The id of the `uncoldarrows` order. */
  Uncoldarrows = 852245,
  /** The id of the `uncorporealform` order. */
  Uncorporealform = 852494,
  /** The id of the `undeadbuild` order. */
  Undeadbuild = 851998,
  /** The id of the `undefend` order. */
  Undefend = 852056,
  /** The id of the `undivineshield` order. */
  Undivineshield = 852091,
  /** The id of the `unetherealform` order. */
  Unetherealform = 852497,
  /** The id of the `unflamingarrows` order. */
  Unflamingarrows = 852175,
  /** The id of the `unflamingattack` order. */
  Unflamingattack = 852541,
  /** The id of the `unholyfrenzy` order. */
  Unholyfrenzy = 852209,
  /** The id of the `unimmolation` order. */
  Unimmolation = 852178,
  /** The id of the `unload` order. */
  Unload = 852047,
  /** The id of the `unloadall` order. */
  Unloadall = 852048,
  /** The id of the `unloadallcorpses` order. */
  Unloadallcorpses = 852054,
  /** The id of the `unloadallinstant` order. */
  Unloadallinstant = 852049,
  /** The id of the `unpoisonarrows` order. */
  Unpoisonarrows = 852256,
  /** The id of the `unravenform` order. */
  Unravenform = 852156,
  /** The id of the `unrobogoblin` order. */
  Unrobogoblin = 852657,
  /** The id of the `unroot` order. */
  Unroot = 852166,
  /** The id of the `unstableconcoction` order. */
  Unstableconcoction = 852500,
  /** The id of the `unstoneform` order. */
  Unstoneform = 852207,
  /** The id of the `unsubmerge` order. */
  Unsubmerge = 852605,
  /** The id of the `unsummon` order. */
  Unsummon = 852210,
  /** The id of the `unwindwalk` order. */
  Unwindwalk = 852130,
  /** The id of the order that uses the item in the unit's first inventory slot (index 0), which has no order string. */
  Useslot1 = 852008,
  /** The id of the order that uses the item in the unit's second inventory slot (index 1), which has no order string. */
  Useslot2 = 852009,
  /** The id of the order that uses the item in the unit's third inventory slot (index 2), which has no order string. */
  Useslot3 = 852010,
  /** The id of the order that uses the item in the unit's fourth inventory slot (index 3), which has no order string. */
  Useslot4 = 852011,
  /** The id of the order that uses the item in the unit's fifth inventory slot (index 4), which has no order string. */
  Useslot5 = 852012,
  /** The id of the order that uses the item in the unit's sixth inventory slot (index 5), which has no order string. */
  Useslot6 = 852013,
  /** The id of the `vengeance` order. */
  Vengeance = 852521,
  /** The id of the `vengeanceinstant` order. */
  Vengeanceinstant = 852524,
  /** The id of the `vengeanceoff` order. */
  Vengeanceoff = 852523,
  /** The id of the `vengeanceon` order. */
  Vengeanceon = 852522,
  /** The id of the `volcano` order. */
  Volcano = 852669,
  /** The id of the `voodoo` order. */
  Voodoo = 852503,
  /** The id of the `ward` order. */
  Ward = 852504,
  /** The id of the `waterelemental` order. */
  Waterelemental = 852097,
  /** The id of the `wateryminion` order. */
  Wateryminion = 852598,
  /** The id of the `web` order. */
  Web = 852211,
  /** The id of the `weboff` order. */
  Weboff = 852213,
  /** The id of the `webon` order. */
  Webon = 852212,
  /** The id of the `whirlwind` order. */
  Whirlwind = 852128,
  /** The id of the `windwalk` order. */
  Windwalk = 852129,
  /** The id of the `wispharvest` order. */
  Wispharvest = 852214,
}
