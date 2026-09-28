# Enumeration: OrderId

Defined in: [globals/order.ts:11](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L11)

The ids of the game's orders, one member per order, for the order members of [Unit](../../../../classes/Unit.md) and the `orderId` of an order event.

## Remarks

- A member is named after its order string, with the first letter capitalised: `OrderId.Attack` is the id of the `attack` order.
- Some orders have no order string, such as `Moveslot1` to `Moveslot6` and `Useslot1` to `Useslot6`: those are issued and recognised by id only.
- `Battleroar` and `Forkedlightning` hold the ids of other orders: see their comments.
- `OrderId` is a `const enum`: each use compiles to the number, and the emitted Lua holds no `OrderId` table to look a name up in.

## Enumeration Members

### Absorb

> **Absorb**: `852529`

Defined in: [globals/order.ts:13](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L13)

The id of the `absorb` order.

***

### Acidbomb

> **Acidbomb**: `852662`

Defined in: [globals/order.ts:15](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L15)

The id of the `acidbomb` order.

***

### Acolyteharvest

> **Acolyteharvest**: `852185`

Defined in: [globals/order.ts:17](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L17)

The id of the `acolyteharvest` order.

***

### Aimove

> **Aimove**: `851988`

Defined in: [globals/order.ts:19](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L19)

The id of the `AImove` order: the game spells the string with a capital `AI`.

***

### Ambush

> **Ambush**: `852131`

Defined in: [globals/order.ts:21](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L21)

The id of the `ambush` order.

***

### Ancestralspirit

> **Ancestralspirit**: `852490`

Defined in: [globals/order.ts:23](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L23)

The id of the `ancestralspirit` order.

***

### Ancestralspirittarget

> **Ancestralspirittarget**: `852491`

Defined in: [globals/order.ts:25](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L25)

The id of the `ancestralspirittarget` order.

***

### Animatedead

> **Animatedead**: `852217`

Defined in: [globals/order.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L27)

The id of the `animatedead` order.

***

### Antimagicshell

> **Antimagicshell**: `852186`

Defined in: [globals/order.ts:29](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L29)

The id of the `antimagicshell` order.

***

### Attack

> **Attack**: `851983`

Defined in: [globals/order.ts:31](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L31)

The id of the `attack` order.

***

### Attackground

> **Attackground**: `851984`

Defined in: [globals/order.ts:33](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L33)

The id of the `attackground` order.

***

### Attackonce

> **Attackonce**: `851985`

Defined in: [globals/order.ts:35](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L35)

The id of the `attackonce` order.

***

### Attributemodskill

> **Attributemodskill**: `852576`

Defined in: [globals/order.ts:37](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L37)

The id of the `attributemodskill` order.

***

### Auraunholy

> **Auraunholy**: `852215`

Defined in: [globals/order.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L39)

The id of the `auraunholy` order.

***

### Auravampiric

> **Auravampiric**: `852216`

Defined in: [globals/order.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L41)

The id of the `auravampiric` order.

***

### Autodispel

> **Autodispel**: `852132`

Defined in: [globals/order.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L43)

The id of the `autodispel` order.

***

### Autodispeloff

> **Autodispeloff**: `852134`

Defined in: [globals/order.ts:45](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L45)

The id of the `autodispeloff` order.

***

### Autodispelon

> **Autodispelon**: `852133`

Defined in: [globals/order.ts:47](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L47)

The id of the `autodispelon` order.

***

### Autoentangle

> **Autoentangle**: `852505`

Defined in: [globals/order.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L49)

The id of the `autoentangle` order.

***

### Autoentangleinstant

> **Autoentangleinstant**: `852506`

Defined in: [globals/order.ts:51](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L51)

The id of the `autoentangleinstant` order.

***

### Autoharvestgold

> **Autoharvestgold**: `852021`

Defined in: [globals/order.ts:53](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L53)

The id of the `autoharvestgold` order.

***

### Autoharvestlumber

> **Autoharvestlumber**: `852022`

Defined in: [globals/order.ts:55](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L55)

The id of the `autoharvestlumber` order.

***

### Avatar

> **Avatar**: `852086`

Defined in: [globals/order.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L57)

The id of the `avatar` order.

***

### Avengerform

> **Avengerform**: `852531`

Defined in: [globals/order.ts:59](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L59)

The id of the `avengerform` order.

***

### Awaken

> **Awaken**: `852466`

Defined in: [globals/order.ts:61](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L61)

The id of the `awaken` order.

***

### Banish

> **Banish**: `852486`

Defined in: [globals/order.ts:63](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L63)

The id of the `banish` order.

***

### Barkskin

> **Barkskin**: `852135`

Defined in: [globals/order.ts:65](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L65)

The id of the `barkskin` order.

***

### Barkskinoff

> **Barkskinoff**: `852137`

Defined in: [globals/order.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L67)

The id of the `barkskinoff` order.

***

### Barkskinon

> **Barkskinon**: `852136`

Defined in: [globals/order.ts:69](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L69)

The id of the `barkskinon` order.

***

### Battleroar

> **Battleroar**: `852099`

Defined in: [globals/order.ts:75](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L75)

A wrong id for the `battleroar` order: it holds the id of `battlestations`.

#### Remarks

The value is wrong: it is 852099, the id of `battlestations` ([OrderId.Battlestations](#battlestations)), where the game gives `battleroar` the id 852599. Issue the order by its string until the value is fixed.

***

### Battlestations

> **Battlestations**: `852099`

Defined in: [globals/order.ts:78](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L78)

The id of the `battlestations` order.

***

### Bearform

> **Bearform**: `852138`

Defined in: [globals/order.ts:80](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L80)

The id of the `bearform` order.

***

### Berserk

> **Berserk**: `852100`

Defined in: [globals/order.ts:82](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L82)

The id of the `berserk` order.

***

### Blackarrow

> **Blackarrow**: `852577`

Defined in: [globals/order.ts:84](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L84)

The id of the `blackarrow` order.

***

### Blackarrowoff

> **Blackarrowoff**: `852579`

Defined in: [globals/order.ts:86](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L86)

The id of the `blackarrowoff` order.

***

### Blackarrowon

> **Blackarrowon**: `852578`

Defined in: [globals/order.ts:88](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L88)

The id of the `blackarrowon` order.

***

### Blight

> **Blight**: `852187`

Defined in: [globals/order.ts:90](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L90)

The id of the `blight` order.

***

### Blink

> **Blink**: `852525`

Defined in: [globals/order.ts:92](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L92)

The id of the `blink` order.

***

### Blizzard

> **Blizzard**: `852089`

Defined in: [globals/order.ts:94](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L94)

The id of the `blizzard` order.

***

### Bloodlust

> **Bloodlust**: `852101`

Defined in: [globals/order.ts:96](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L96)

The id of the `bloodlust` order.

***

### Bloodlustoff

> **Bloodlustoff**: `852103`

Defined in: [globals/order.ts:98](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L98)

The id of the `bloodlustoff` order.

***

### Bloodluston

> **Bloodluston**: `852102`

Defined in: [globals/order.ts:100](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L100)

The id of the `bloodluston` order.

***

### Board

> **Board**: `852043`

Defined in: [globals/order.ts:102](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L102)

The id of the `board` order.

***

### Breathoffire

> **Breathoffire**: `852580`

Defined in: [globals/order.ts:104](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L104)

The id of the `breathoffire` order.

***

### Breathoffrost

> **Breathoffrost**: `852560`

Defined in: [globals/order.ts:106](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L106)

The id of the `breathoffrost` order.

***

### Build

> **Build**: `851994`

Defined in: [globals/order.ts:108](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L108)

The id of the `build` order.

***

### Burrow

> **Burrow**: `852533`

Defined in: [globals/order.ts:110](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L110)

The id of the `burrow` order.

***

### Cancel

> **Cancel**: `851976`

Defined in: [globals/order.ts:112](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L112)

The id of the order that cancels a build, which has no order string: the game's internal order table calls it `ORDER_CANCEL_BUILD`.

***

### Cannibalize

> **Cannibalize**: `852188`

Defined in: [globals/order.ts:114](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L114)

The id of the `cannibalize` order.

***

### Carrionscarabs

> **Carrionscarabs**: `852551`

Defined in: [globals/order.ts:116](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L116)

The id of the `carrionscarabs` order.

***

### Carrionscarabsinstant

> **Carrionscarabsinstant**: `852554`

Defined in: [globals/order.ts:118](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L118)

The id of the `carrionscarabsinstant` order.

***

### Carrionscarabsoff

> **Carrionscarabsoff**: `852553`

Defined in: [globals/order.ts:120](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L120)

The id of the `carrionscarabsoff` order.

***

### Carrionscarabson

> **Carrionscarabson**: `852552`

Defined in: [globals/order.ts:122](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L122)

The id of the `carrionscarabson` order.

***

### Carrionswarm

> **Carrionswarm**: `852218`

Defined in: [globals/order.ts:124](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L124)

The id of the `carrionswarm` order.

***

### Chainlightning

> **Chainlightning**: `852119`

Defined in: [globals/order.ts:126](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L126)

The id of the `chainlightning` order.

***

### Channel

> **Channel**: `852600`

Defined in: [globals/order.ts:128](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L128)

The id of the `channel` order.

***

### Charm

> **Charm**: `852581`

Defined in: [globals/order.ts:130](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L130)

The id of the `charm` order.

***

### Chemicalrage

> **Chemicalrage**: `852663`

Defined in: [globals/order.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L132)

The id of the `chemicalrage` order.

***

### Cloudoffog

> **Cloudoffog**: `852473`

Defined in: [globals/order.ts:134](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L134)

The id of the `cloudoffog` order.

***

### Clusterrockets

> **Clusterrockets**: `852652`

Defined in: [globals/order.ts:136](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L136)

The id of the `clusterrockets` order.

***

### Coldarrows

> **Coldarrows**: `852244`

Defined in: [globals/order.ts:138](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L138)

The id of the `coldarrows` order.

***

### Coldarrowstarg

> **Coldarrowstarg**: `852243`

Defined in: [globals/order.ts:140](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L140)

The id of the `coldarrowstarg` order.

***

### Controlmagic

> **Controlmagic**: `852474`

Defined in: [globals/order.ts:142](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L142)

The id of the `controlmagic` order.

***

### Corporealform

> **Corporealform**: `852493`

Defined in: [globals/order.ts:144](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L144)

The id of the `corporealform` order.

***

### Corrosivebreath

> **Corrosivebreath**: `852140`

Defined in: [globals/order.ts:146](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L146)

The id of the `corrosivebreath` order.

***

### Coupleinstant

> **Coupleinstant**: `852508`

Defined in: [globals/order.ts:148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L148)

The id of the `coupleinstant` order.

***

### Coupletarget

> **Coupletarget**: `852507`

Defined in: [globals/order.ts:150](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L150)

The id of the `coupletarget` order.

***

### Creepanimatedead

> **Creepanimatedead**: `852246`

Defined in: [globals/order.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L152)

The id of the `creepanimatedead` order.

***

### Creepdevour

> **Creepdevour**: `852247`

Defined in: [globals/order.ts:154](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L154)

The id of the `creepdevour` order.

***

### Creepheal

> **Creepheal**: `852248`

Defined in: [globals/order.ts:156](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L156)

The id of the `creepheal` order.

***

### Creephealoff

> **Creephealoff**: `852250`

Defined in: [globals/order.ts:158](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L158)

The id of the `creephealoff` order.

***

### Creephealon

> **Creephealon**: `852249`

Defined in: [globals/order.ts:160](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L160)

The id of the `creephealon` order.

***

### Creepthunderbolt

> **Creepthunderbolt**: `852252`

Defined in: [globals/order.ts:162](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L162)

The id of the `creepthunderbolt` order.

***

### Creepthunderclap

> **Creepthunderclap**: `852253`

Defined in: [globals/order.ts:164](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L164)

The id of the `creepthunderclap` order.

***

### Cripple

> **Cripple**: `852189`

Defined in: [globals/order.ts:166](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L166)

The id of the `cripple` order.

***

### Curse

> **Curse**: `852190`

Defined in: [globals/order.ts:168](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L168)

The id of the `curse` order.

***

### Curseoff

> **Curseoff**: `852192`

Defined in: [globals/order.ts:170](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L170)

The id of the `curseoff` order.

***

### Curseon

> **Curseon**: `852191`

Defined in: [globals/order.ts:172](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L172)

The id of the `curseon` order.

***

### Cyclone

> **Cyclone**: `852144`

Defined in: [globals/order.ts:174](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L174)

The id of the `cyclone` order.

***

### Darkconversion

> **Darkconversion**: `852228`

Defined in: [globals/order.ts:176](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L176)

The id of the `darkconversion` order.

***

### Darkportal

> **Darkportal**: `852229`

Defined in: [globals/order.ts:178](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L178)

The id of the `darkportal` order.

***

### Darkritual

> **Darkritual**: `852219`

Defined in: [globals/order.ts:180](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L180)

The id of the `darkritual` order.

***

### Darksummoning

> **Darksummoning**: `852220`

Defined in: [globals/order.ts:182](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L182)

The id of the `darksummoning` order.

***

### Deathanddecay

> **Deathanddecay**: `852221`

Defined in: [globals/order.ts:184](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L184)

The id of the `deathanddecay` order.

***

### Deathcoil

> **Deathcoil**: `852222`

Defined in: [globals/order.ts:186](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L186)

The id of the `deathcoil` order.

***

### Deathpact

> **Deathpact**: `852223`

Defined in: [globals/order.ts:188](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L188)

The id of the `deathpact` order.

***

### Decouple

> **Decouple**: `852509`

Defined in: [globals/order.ts:190](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L190)

The id of the `decouple` order.

***

### Defend

> **Defend**: `852055`

Defined in: [globals/order.ts:192](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L192)

The id of the `defend` order.

***

### Detectaoe

> **Detectaoe**: `852015`

Defined in: [globals/order.ts:194](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L194)

The id of the `detectaoe` order.

***

### Detonate

> **Detonate**: `852145`

Defined in: [globals/order.ts:196](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L196)

The id of the `detonate` order.

***

### Devour

> **Devour**: `852104`

Defined in: [globals/order.ts:198](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L198)

The id of the `devour` order.

***

### Devourmagic

> **Devourmagic**: `852536`

Defined in: [globals/order.ts:200](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L200)

The id of the `devourmagic` order.

***

### Disassociate

> **Disassociate**: `852240`

Defined in: [globals/order.ts:202](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L202)

The id of the `disassociate` order.

***

### Disenchant

> **Disenchant**: `852495`

Defined in: [globals/order.ts:204](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L204)

The id of the `disenchant` order.

***

### Dismount

> **Dismount**: `852470`

Defined in: [globals/order.ts:206](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L206)

The id of the `dismount` order.

***

### Dispel

> **Dispel**: `852057`

Defined in: [globals/order.ts:208](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L208)

The id of the `dispel` order.

***

### Divineshield

> **Divineshield**: `852090`

Defined in: [globals/order.ts:210](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L210)

The id of the `divineshield` order.

***

### Doom

> **Doom**: `852583`

Defined in: [globals/order.ts:212](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L212)

The id of the `doom` order.

***

### Drain

> **Drain**: `852487`

Defined in: [globals/order.ts:214](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L214)

The id of the `drain` order.

***

### Dreadlordinferno

> **Dreadlordinferno**: `852224`

Defined in: [globals/order.ts:216](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L216)

The id of the `dreadlordinferno` order.

***

### Dropitem

> **Dropitem**: `852001`

Defined in: [globals/order.ts:218](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L218)

The id of the `dropitem` order.

***

### Drunkenhaze

> **Drunkenhaze**: `852585`

Defined in: [globals/order.ts:220](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L220)

The id of the `drunkenhaze` order.

***

### Earthquake

> **Earthquake**: `852121`

Defined in: [globals/order.ts:222](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L222)

The id of the `earthquake` order.

***

### Eattree

> **Eattree**: `852146`

Defined in: [globals/order.ts:224](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L224)

The id of the `eattree` order.

***

### Elementalfury

> **Elementalfury**: `852586`

Defined in: [globals/order.ts:226](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L226)

The id of the `elementalfury` order.

***

### Ensnare

> **Ensnare**: `852106`

Defined in: [globals/order.ts:228](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L228)

The id of the `ensnare` order.

***

### Ensnareoff

> **Ensnareoff**: `852108`

Defined in: [globals/order.ts:230](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L230)

The id of the `ensnareoff` order.

***

### Ensnareon

> **Ensnareon**: `852107`

Defined in: [globals/order.ts:232](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L232)

The id of the `ensnareon` order.

***

### Entangle

> **Entangle**: `852147`

Defined in: [globals/order.ts:234](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L234)

The id of the `entangle` order.

***

### Entangleinstant

> **Entangleinstant**: `852148`

Defined in: [globals/order.ts:236](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L236)

The id of the `entangleinstant` order.

***

### Entanglingroots

> **Entanglingroots**: `852171`

Defined in: [globals/order.ts:238](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L238)

The id of the `entanglingroots` order.

***

### Etherealform

> **Etherealform**: `852496`

Defined in: [globals/order.ts:240](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L240)

The id of the `etherealform` order.

***

### Evileye

> **Evileye**: `852105`

Defined in: [globals/order.ts:242](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L242)

The id of the `evileye` order.

***

### Faeriefire

> **Faeriefire**: `852149`

Defined in: [globals/order.ts:244](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L244)

The id of the `faeriefire` order.

***

### Faeriefireoff

> **Faeriefireoff**: `852151`

Defined in: [globals/order.ts:246](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L246)

The id of the `faeriefireoff` order.

***

### Faeriefireon

> **Faeriefireon**: `852150`

Defined in: [globals/order.ts:248](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L248)

The id of the `faeriefireon` order.

***

### Fanofknives

> **Fanofknives**: `852526`

Defined in: [globals/order.ts:250](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L250)

The id of the `fanofknives` order.

***

### Farsight

> **Farsight**: `852122`

Defined in: [globals/order.ts:252](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L252)

The id of the `farsight` order.

***

### Fingerofdeath

> **Fingerofdeath**: `852230`

Defined in: [globals/order.ts:254](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L254)

The id of the `fingerofdeath` order.

***

### Firebolt

> **Firebolt**: `852231`

Defined in: [globals/order.ts:256](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L256)

The id of the `firebolt` order.

***

### Flamestrike

> **Flamestrike**: `852488`

Defined in: [globals/order.ts:258](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L258)

The id of the `flamestrike` order.

***

### Flamingarrows

> **Flamingarrows**: `852174`

Defined in: [globals/order.ts:260](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L260)

The id of the `flamingarrows` order.

***

### Flamingarrowstarg

> **Flamingarrowstarg**: `852173`

Defined in: [globals/order.ts:262](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L262)

The id of the `flamingarrowstarg` order.

***

### Flamingattack

> **Flamingattack**: `852540`

Defined in: [globals/order.ts:264](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L264)

The id of the `flamingattack` order.

***

### Flamingattacktarg

> **Flamingattacktarg**: `852539`

Defined in: [globals/order.ts:266](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L266)

The id of the `flamingattacktarg` order.

***

### Flare

> **Flare**: `852060`

Defined in: [globals/order.ts:268](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L268)

The id of the `flare` order.

***

### Forceboard

> **Forceboard**: `852044`

Defined in: [globals/order.ts:270](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L270)

The id of the `forceboard` order.

***

### Forceofnature

> **Forceofnature**: `852176`

Defined in: [globals/order.ts:272](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L272)

The id of the `forceofnature` order.

***

### Forkedlightning

> **Forkedlightning**: `852586`

Defined in: [globals/order.ts:279](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L279)

A wrong id for the `forkedlightning` order: it holds the id of `elementalfury`.

#### Remarks

The value is wrong: it is 852586, the id of `elementalfury` ([OrderId.Elementalfury](#elementalfury)), where the game gives `forkedlightning` the id 852587. Issue the order by its string until the value is fixed.

***

### Freezingbreath

> **Freezingbreath**: `852195`

Defined in: [globals/order.ts:281](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L281)

The id of the `freezingbreath` order.

***

### Frenzy

> **Frenzy**: `852561`

Defined in: [globals/order.ts:283](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L283)

The id of the `frenzy` order.

***

### Frenzyoff

> **Frenzyoff**: `852563`

Defined in: [globals/order.ts:285](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L285)

The id of the `frenzyoff` order.

***

### Frenzyon

> **Frenzyon**: `852562`

Defined in: [globals/order.ts:287](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L287)

The id of the `frenzyon` order.

***

### Frostarmor

> **Frostarmor**: `852225`

Defined in: [globals/order.ts:289](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L289)

The id of the `frostarmor` order.

***

### Frostarmoroff

> **Frostarmoroff**: `852459`

Defined in: [globals/order.ts:291](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L291)

The id of the `frostarmoroff` order.

***

### Frostarmoron

> **Frostarmoron**: `852458`

Defined in: [globals/order.ts:293](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L293)

The id of the `frostarmoron` order.

***

### Frostnova

> **Frostnova**: `852226`

Defined in: [globals/order.ts:295](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L295)

The id of the `frostnova` order.

***

### Getitem

> **Getitem**: `851981`

Defined in: [globals/order.ts:297](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L297)

The id of the `getitem` order.

***

### Gold2lumber

> **Gold2lumber**: `852233`

Defined in: [globals/order.ts:299](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L299)

The id of the `gold2lumber` order.

***

### Grabtree

> **Grabtree**: `852511`

Defined in: [globals/order.ts:301](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L301)

The id of the `grabtree` order.

***

### Harvest

> **Harvest**: `852018`

Defined in: [globals/order.ts:303](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L303)

The id of the `harvest` order.

***

### Heal

> **Heal**: `852063`

Defined in: [globals/order.ts:305](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L305)

The id of the `heal` order.

***

### Healingspray

> **Healingspray**: `852664`

Defined in: [globals/order.ts:307](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L307)

The id of the `healingspray` order.

***

### Healingward

> **Healingward**: `852109`

Defined in: [globals/order.ts:309](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L309)

The id of the `healingward` order.

***

### Healingwave

> **Healingwave**: `852501`

Defined in: [globals/order.ts:311](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L311)

The id of the `healingwave` order.

***

### Healoff

> **Healoff**: `852065`

Defined in: [globals/order.ts:313](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L313)

The id of the `healoff` order.

***

### Healon

> **Healon**: `852064`

Defined in: [globals/order.ts:315](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L315)

The id of the `healon` order.

***

### Hex

> **Hex**: `852502`

Defined in: [globals/order.ts:317](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L317)

The id of the `hex` order.

***

### Holdposition

> **Holdposition**: `851993`

Defined in: [globals/order.ts:319](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L319)

The id of the `holdposition` order.

***

### Holybolt

> **Holybolt**: `852092`

Defined in: [globals/order.ts:321](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L321)

The id of the `holybolt` order.

***

### Howlofterror

> **Howlofterror**: `852588`

Defined in: [globals/order.ts:323](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L323)

The id of the `howlofterror` order.

***

### Humanbuild

> **Humanbuild**: `851995`

Defined in: [globals/order.ts:325](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L325)

The id of the `humanbuild` order.

***

### Immolation

> **Immolation**: `852177`

Defined in: [globals/order.ts:327](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L327)

The id of the `immolation` order.

***

### Impale

> **Impale**: `852555`

Defined in: [globals/order.ts:329](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L329)

The id of the `impale` order.

***

### Incineratearrow

> **Incineratearrow**: `852670`

Defined in: [globals/order.ts:331](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L331)

The id of the `incineratearrow` order.

***

### Incineratearrowoff

> **Incineratearrowoff**: `852672`

Defined in: [globals/order.ts:333](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L333)

The id of the `incineratearrowoff` order.

***

### Incineratearrowon

> **Incineratearrowon**: `852671`

Defined in: [globals/order.ts:335](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L335)

The id of the `incineratearrowon` order.

***

### Inferno

> **Inferno**: `852232`

Defined in: [globals/order.ts:337](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L337)

The id of the `inferno` order.

***

### Innerfire

> **Innerfire**: `852066`

Defined in: [globals/order.ts:339](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L339)

The id of the `innerfire` order.

***

### Innerfireoff

> **Innerfireoff**: `852068`

Defined in: [globals/order.ts:341](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L341)

The id of the `innerfireoff` order.

***

### Innerfireon

> **Innerfireon**: `852067`

Defined in: [globals/order.ts:343](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L343)

The id of the `innerfireon` order.

***

### Instant

> **Instant**: `852200`

Defined in: [globals/order.ts:345](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L345)

The id of the `instant` order.

***

### Instant1

> **Instant1**: `851991`

Defined in: [globals/order.ts:347](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L347)

The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_PATROL2`.

***

### Instant2

> **Instant2**: `851987`

Defined in: [globals/order.ts:349](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L349)

The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_GUARD_RETURN`.

***

### Instant3

> **Instant3**: `851975`

Defined in: [globals/order.ts:351](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L351)

The id of the generic cancel order, which has no order string: the game's internal order table calls it `ORDER_CANCEL`.

***

### Instant4

> **Instant4**: `852019`

Defined in: [globals/order.ts:353](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L353)

The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_HARVEST_AGAIN`.

***

### Invisibility

> **Invisibility**: `852069`

Defined in: [globals/order.ts:355](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L355)

The id of the `invisibility` order.

***

### Lavamonster

> **Lavamonster**: `852667`

Defined in: [globals/order.ts:357](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L357)

The id of the `lavamonster` order.

***

### Lightningshield

> **Lightningshield**: `852110`

Defined in: [globals/order.ts:359](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L359)

The id of the `lightningshield` order.

***

### Load

> **Load**: `852046`

Defined in: [globals/order.ts:361](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L361)

The id of the `load` order.

***

### Loadarcher

> **Loadarcher**: `852142`

Defined in: [globals/order.ts:363](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L363)

The id of the `loadarcher` order.

***

### Loadcorpse

> **Loadcorpse**: `852050`

Defined in: [globals/order.ts:365](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L365)

The id of the `loadcorpse` order.

***

### Loadcorpseinstant

> **Loadcorpseinstant**: `852053`

Defined in: [globals/order.ts:367](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L367)

The id of the `loadcorpseinstant` order.

***

### Locustswarm

> **Locustswarm**: `852556`

Defined in: [globals/order.ts:369](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L369)

The id of the `locustswarm` order.

***

### Lumber2gold

> **Lumber2gold**: `852234`

Defined in: [globals/order.ts:371](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L371)

The id of the `lumber2gold` order.

***

### Magicdefense

> **Magicdefense**: `852478`

Defined in: [globals/order.ts:373](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L373)

The id of the `magicdefense` order.

***

### Magicleash

> **Magicleash**: `852480`

Defined in: [globals/order.ts:375](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L375)

The id of the `magicleash` order.

***

### Magicundefense

> **Magicundefense**: `852479`

Defined in: [globals/order.ts:377](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L377)

The id of the `magicundefense` order.

***

### Manaburn

> **Manaburn**: `852179`

Defined in: [globals/order.ts:379](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L379)

The id of the `manaburn` order.

***

### Manaflareoff

> **Manaflareoff**: `852513`

Defined in: [globals/order.ts:381](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L381)

The id of the `manaflareoff` order.

***

### Manaflareon

> **Manaflareon**: `852512`

Defined in: [globals/order.ts:383](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L383)

The id of the `manaflareon` order.

***

### Manashieldoff

> **Manashieldoff**: `852590`

Defined in: [globals/order.ts:385](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L385)

The id of the `manashieldoff` order.

***

### Manashieldon

> **Manashieldon**: `852589`

Defined in: [globals/order.ts:387](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L387)

The id of the `manashieldon` order.

***

### Massteleport

> **Massteleport**: `852093`

Defined in: [globals/order.ts:389](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L389)

The id of the `massteleport` order.

***

### Mechanicalcritter

> **Mechanicalcritter**: `852564`

Defined in: [globals/order.ts:391](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L391)

The id of the `mechanicalcritter` order.

***

### Metamorphosis

> **Metamorphosis**: `852180`

Defined in: [globals/order.ts:393](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L393)

The id of the `metamorphosis` order.

***

### Militia

> **Militia**: `852072`

Defined in: [globals/order.ts:395](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L395)

The id of the `militia` order.

***

### Militiaconvert

> **Militiaconvert**: `852071`

Defined in: [globals/order.ts:397](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L397)

The id of the `militiaconvert` order.

***

### Militiaoff

> **Militiaoff**: `852073`

Defined in: [globals/order.ts:399](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L399)

The id of the `militiaoff` order.

***

### Militiaunconvert

> **Militiaunconvert**: `852651`

Defined in: [globals/order.ts:401](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L401)

The id of the `militiaunconvert` order.

***

### Mindrot

> **Mindrot**: `852565`

Defined in: [globals/order.ts:403](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L403)

The id of the `mindrot` order.

***

### Mirrorimage

> **Mirrorimage**: `852123`

Defined in: [globals/order.ts:405](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L405)

The id of the `mirrorimage` order.

***

### Monsoon

> **Monsoon**: `852591`

Defined in: [globals/order.ts:407](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L407)

The id of the `monsoon` order.

***

### Mount

> **Mount**: `852469`

Defined in: [globals/order.ts:409](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L409)

The id of the `mount` order.

***

### Mounthippogryph

> **Mounthippogryph**: `852143`

Defined in: [globals/order.ts:411](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L411)

The id of the `mounthippogryph` order.

***

### Move

> **Move**: `851986`

Defined in: [globals/order.ts:413](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L413)

The id of the `move` order.

***

### Moveslot1

> **Moveslot1**: `852002`

Defined in: [globals/order.ts:415](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L415)

The id of the order that moves the target item to the unit's first inventory slot (index 0), which has no order string.

***

### Moveslot2

> **Moveslot2**: `852003`

Defined in: [globals/order.ts:417](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L417)

The id of the order that moves the target item to the unit's second inventory slot (index 1), which has no order string.

***

### Moveslot3

> **Moveslot3**: `852004`

Defined in: [globals/order.ts:419](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L419)

The id of the order that moves the target item to the unit's third inventory slot (index 2), which has no order string.

***

### Moveslot4

> **Moveslot4**: `852005`

Defined in: [globals/order.ts:421](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L421)

The id of the order that moves the target item to the unit's fourth inventory slot (index 3), which has no order string.

***

### Moveslot5

> **Moveslot5**: `852006`

Defined in: [globals/order.ts:423](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L423)

The id of the order that moves the target item to the unit's fifth inventory slot (index 4), which has no order string.

***

### Moveslot6

> **Moveslot6**: `852007`

Defined in: [globals/order.ts:425](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L425)

The id of the order that moves the target item to the unit's sixth inventory slot (index 5), which has no order string.

***

### Nagabuild

> **Nagabuild**: `852467`

Defined in: [globals/order.ts:427](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L427)

The id of the `nagabuild` order.

***

### Neutraldetectaoe

> **Neutraldetectaoe**: `852023`

Defined in: [globals/order.ts:429](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L429)

The id of the `neutraldetectaoe` order.

***

### Neutralinteract

> **Neutralinteract**: `852566`

Defined in: [globals/order.ts:431](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L431)

The id of the `neutralinteract` order.

***

### Neutralspell

> **Neutralspell**: `852630`

Defined in: [globals/order.ts:433](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L433)

The id of the `neutralspell` order.

***

### Nightelfbuild

> **Nightelfbuild**: `851997`

Defined in: [globals/order.ts:435](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L435)

The id of the `nightelfbuild` order.

***

### Orcbuild

> **Orcbuild**: `851996`

Defined in: [globals/order.ts:437](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L437)

The id of the `orcbuild` order.

***

### Parasite

> **Parasite**: `852601`

Defined in: [globals/order.ts:439](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L439)

The id of the `parasite` order.

***

### Parasiteoff

> **Parasiteoff**: `852603`

Defined in: [globals/order.ts:441](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L441)

The id of the `parasiteoff` order.

***

### Parasiteon

> **Parasiteon**: `852602`

Defined in: [globals/order.ts:443](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L443)

The id of the `parasiteon` order.

***

### Patrol

> **Patrol**: `851990`

Defined in: [globals/order.ts:445](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L445)

The id of the `patrol` order.

***

### Phaseshift

> **Phaseshift**: `852514`

Defined in: [globals/order.ts:447](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L447)

The id of the `phaseshift` order.

***

### Phaseshiftinstant

> **Phaseshiftinstant**: `852517`

Defined in: [globals/order.ts:449](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L449)

The id of the `phaseshiftinstant` order.

***

### Phaseshiftoff

> **Phaseshiftoff**: `852516`

Defined in: [globals/order.ts:451](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L451)

The id of the `phaseshiftoff` order.

***

### Phaseshifton

> **Phaseshifton**: `852515`

Defined in: [globals/order.ts:453](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L453)

The id of the `phaseshifton` order.

***

### Phoenixfire

> **Phoenixfire**: `852481`

Defined in: [globals/order.ts:455](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L455)

The id of the `phoenixfire` order.

***

### Phoenixmorph

> **Phoenixmorph**: `852482`

Defined in: [globals/order.ts:457](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L457)

The id of the `phoenixmorph` order.

***

### Poisonarrows

> **Poisonarrows**: `852255`

Defined in: [globals/order.ts:459](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L459)

The id of the `poisonarrows` order.

***

### Poisonarrowstarg

> **Poisonarrowstarg**: `852254`

Defined in: [globals/order.ts:461](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L461)

The id of the `poisonarrowstarg` order.

***

### Polymorph

> **Polymorph**: `852074`

Defined in: [globals/order.ts:463](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L463)

The id of the `polymorph` order.

***

### Possession

> **Possession**: `852196`

Defined in: [globals/order.ts:465](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L465)

The id of the `possession` order.

***

### Preservation

> **Preservation**: `852568`

Defined in: [globals/order.ts:467](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L467)

The id of the `preservation` order.

***

### Purge

> **Purge**: `852111`

Defined in: [globals/order.ts:469](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L469)

The id of the `purge` order.

***

### Rainofchaos

> **Rainofchaos**: `852237`

Defined in: [globals/order.ts:471](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L471)

The id of the `rainofchaos` order.

***

### Rainoffire

> **Rainoffire**: `852238`

Defined in: [globals/order.ts:473](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L473)

The id of the `rainoffire` order.

***

### Raisedead

> **Raisedead**: `852197`

Defined in: [globals/order.ts:475](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L475)

The id of the `raisedead` order.

***

### Raisedeadoff

> **Raisedeadoff**: `852199`

Defined in: [globals/order.ts:477](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L477)

The id of the `raisedeadoff` order.

***

### Raisedeadon

> **Raisedeadon**: `852198`

Defined in: [globals/order.ts:479](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L479)

The id of the `raisedeadon` order.

***

### Ravenform

> **Ravenform**: `852155`

Defined in: [globals/order.ts:481](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L481)

The id of the `ravenform` order.

***

### Recharge

> **Recharge**: `852157`

Defined in: [globals/order.ts:483](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L483)

The id of the `recharge` order.

***

### Rechargeoff

> **Rechargeoff**: `852159`

Defined in: [globals/order.ts:485](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L485)

The id of the `rechargeoff` order.

***

### Rechargeon

> **Rechargeon**: `852158`

Defined in: [globals/order.ts:487](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L487)

The id of the `rechargeon` order.

***

### Rejuvination

> **Rejuvination**: `852160`

Defined in: [globals/order.ts:489](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L489)

The id of the `rejuvination` order.

***

### Renew

> **Renew**: `852161`

Defined in: [globals/order.ts:491](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L491)

The id of the `renew` order.

***

### Renewoff

> **Renewoff**: `852163`

Defined in: [globals/order.ts:493](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L493)

The id of the `renewoff` order.

***

### Renewon

> **Renewon**: `852162`

Defined in: [globals/order.ts:495](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L495)

The id of the `renewon` order.

***

### Repair

> **Repair**: `852024`

Defined in: [globals/order.ts:497](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L497)

The id of the `repair` order.

***

### Repairoff

> **Repairoff**: `852026`

Defined in: [globals/order.ts:499](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L499)

The id of the `repairoff` order.

***

### Repairon

> **Repairon**: `852025`

Defined in: [globals/order.ts:501](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L501)

The id of the `repairon` order.

***

### Replenish

> **Replenish**: `852542`

Defined in: [globals/order.ts:503](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L503)

The id of the `replenish` order.

***

### Replenishlife

> **Replenishlife**: `852545`

Defined in: [globals/order.ts:505](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L505)

The id of the `replenishlife` order.

***

### Replenishlifeoff

> **Replenishlifeoff**: `852547`

Defined in: [globals/order.ts:507](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L507)

The id of the `replenishlifeoff` order.

***

### Replenishlifeon

> **Replenishlifeon**: `852546`

Defined in: [globals/order.ts:509](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L509)

The id of the `replenishlifeon` order.

***

### Replenishmana

> **Replenishmana**: `852548`

Defined in: [globals/order.ts:511](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L511)

The id of the `replenishmana` order.

***

### Replenishmanaoff

> **Replenishmanaoff**: `852550`

Defined in: [globals/order.ts:513](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L513)

The id of the `replenishmanaoff` order.

***

### Replenishmanaon

> **Replenishmanaon**: `852549`

Defined in: [globals/order.ts:515](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L515)

The id of the `replenishmanaon` order.

***

### Replenishoff

> **Replenishoff**: `852544`

Defined in: [globals/order.ts:517](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L517)

The id of the `replenishoff` order.

***

### Replenishon

> **Replenishon**: `852543`

Defined in: [globals/order.ts:519](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L519)

The id of the `replenishon` order.

***

### Request\_hero

> **Request\_hero**: `852239`

Defined in: [globals/order.ts:521](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L521)

The id of the `request_hero` order.

***

### Requestsacrifice

> **Requestsacrifice**: `852201`

Defined in: [globals/order.ts:523](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L523)

The id of the `requestsacrifice` order.

***

### Restoration

> **Restoration**: `852202`

Defined in: [globals/order.ts:525](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L525)

The id of the `restoration` order.

***

### Restorationoff

> **Restorationoff**: `852204`

Defined in: [globals/order.ts:527](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L527)

The id of the `restorationoff` order.

***

### Restorationon

> **Restorationon**: `852203`

Defined in: [globals/order.ts:529](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L529)

The id of the `restorationon` order.

***

### Resumebuild

> **Resumebuild**: `851999`

Defined in: [globals/order.ts:531](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L531)

The id of the `resumebuild` order.

***

### Resumeharvesting

> **Resumeharvesting**: `852017`

Defined in: [globals/order.ts:533](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L533)

The id of the `resumeharvesting` order.

***

### Resurrection

> **Resurrection**: `852094`

Defined in: [globals/order.ts:535](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L535)

The id of the `resurrection` order.

***

### Returnresources

> **Returnresources**: `852020`

Defined in: [globals/order.ts:537](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L537)

The id of the `returnresources` order.

***

### Revenge

> **Revenge**: `852241`

Defined in: [globals/order.ts:539](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L539)

The id of the `revenge` order.

***

### Revive

> **Revive**: `852039`

Defined in: [globals/order.ts:541](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L541)

The id of the `revive` order.

***

### Roar

> **Roar**: `852164`

Defined in: [globals/order.ts:543](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L543)

The id of the `roar` order.

***

### Robogoblin

> **Robogoblin**: `852656`

Defined in: [globals/order.ts:545](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L545)

The id of the `robogoblin` order.

***

### Root

> **Root**: `852165`

Defined in: [globals/order.ts:547](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L547)

The id of the `root` order.

***

### Sacrifice

> **Sacrifice**: `852205`

Defined in: [globals/order.ts:549](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L549)

The id of the `sacrifice` order.

***

### Sanctuary

> **Sanctuary**: `852569`

Defined in: [globals/order.ts:551](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L551)

The id of the `sanctuary` order.

***

### Scout

> **Scout**: `852181`

Defined in: [globals/order.ts:553](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L553)

The id of the `scout` order.

***

### Scrollofspeed

> **Scrollofspeed**: `852285`

Defined in: [globals/order.ts:555](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L555)

The id of the Scroll of Speed item's order, which has no order string.

***

### Selfdestruct

> **Selfdestruct**: `852040`

Defined in: [globals/order.ts:557](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L557)

The id of the `selfdestruct` order.

***

### Selfdestructoff

> **Selfdestructoff**: `852042`

Defined in: [globals/order.ts:559](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L559)

The id of the `selfdestructoff` order.

***

### Selfdestructon

> **Selfdestructon**: `852041`

Defined in: [globals/order.ts:561](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L561)

The id of the `selfdestructon` order.

***

### Sentinel

> **Sentinel**: `852182`

Defined in: [globals/order.ts:563](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L563)

The id of the `sentinel` order.

***

### Setrally

> **Setrally**: `851980`

Defined in: [globals/order.ts:565](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L565)

The id of the `setrally` order.

***

### Shadowsight

> **Shadowsight**: `852570`

Defined in: [globals/order.ts:567](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L567)

The id of the `shadowsight` order.

***

### Shadowstrike

> **Shadowstrike**: `852527`

Defined in: [globals/order.ts:569](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L569)

The id of the `shadowstrike` order.

***

### Shockwave

> **Shockwave**: `852125`

Defined in: [globals/order.ts:571](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L571)

The id of the `shockwave` order.

***

### Silence

> **Silence**: `852592`

Defined in: [globals/order.ts:573](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L573)

The id of the `silence` order.

***

### Skillmenu

> **Skillmenu**: `852000`

Defined in: [globals/order.ts:575](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L575)

The id of the order that opens a hero's skill menu, which has no order string.

***

### Sleep

> **Sleep**: `852227`

Defined in: [globals/order.ts:577](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L577)

The id of the `sleep` order.

***

### Slow

> **Slow**: `852075`

Defined in: [globals/order.ts:579](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L579)

The id of the `slow` order.

***

### Slowoff

> **Slowoff**: `852077`

Defined in: [globals/order.ts:581](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L581)

The id of the `slowoff` order.

***

### Slowon

> **Slowon**: `852076`

Defined in: [globals/order.ts:583](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L583)

The id of the `slowon` order.

***

### Smart

> **Smart**: `851971`

Defined in: [globals/order.ts:585](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L585)

The id of the `smart` order, the right-click on a point or a target.

***

### Soulburn

> **Soulburn**: `852668`

Defined in: [globals/order.ts:587](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L587)

The id of the `soulburn` order.

***

### Soulpreservation

> **Soulpreservation**: `852242`

Defined in: [globals/order.ts:589](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L589)

The id of the `soulpreservation` order.

***

### Spellshield

> **Spellshield**: `852571`

Defined in: [globals/order.ts:591](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L591)

The id of the `spellshield` order.

***

### Spellshieldaoe

> **Spellshieldaoe**: `852572`

Defined in: [globals/order.ts:593](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L593)

The id of the `spellshieldaoe` order.

***

### Spellsteal

> **Spellsteal**: `852483`

Defined in: [globals/order.ts:595](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L595)

The id of the `spellsteal` order.

***

### Spellstealoff

> **Spellstealoff**: `852485`

Defined in: [globals/order.ts:597](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L597)

The id of the `spellstealoff` order.

***

### Spellstealon

> **Spellstealon**: `852484`

Defined in: [globals/order.ts:599](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L599)

The id of the `spellstealon` order.

***

### Spies

> **Spies**: `852235`

Defined in: [globals/order.ts:601](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L601)

The id of the `spies` order.

***

### Spiritlink

> **Spiritlink**: `852499`

Defined in: [globals/order.ts:603](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L603)

The id of the `spiritlink` order.

***

### Spiritofvengeance

> **Spiritofvengeance**: `852528`

Defined in: [globals/order.ts:605](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L605)

The id of the `spiritofvengeance` order.

***

### Spirittroll

> **Spirittroll**: `852573`

Defined in: [globals/order.ts:607](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L607)

The id of the `spirittroll` order.

***

### Spiritwolf

> **Spiritwolf**: `852126`

Defined in: [globals/order.ts:609](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L609)

The id of the `spiritwolf` order.

***

### Stampede

> **Stampede**: `852593`

Defined in: [globals/order.ts:611](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L611)

The id of the `stampede` order.

***

### Standdown

> **Standdown**: `852113`

Defined in: [globals/order.ts:613](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L613)

The id of the `standdown` order.

***

### Starfall

> **Starfall**: `852183`

Defined in: [globals/order.ts:615](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L615)

The id of the `starfall` order.

***

### Stasistrap

> **Stasistrap**: `852114`

Defined in: [globals/order.ts:617](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L617)

The id of the `stasistrap` order.

***

### Steal

> **Steal**: `852574`

Defined in: [globals/order.ts:619](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L619)

The id of the `steal` order.

***

### Stomp

> **Stomp**: `852127`

Defined in: [globals/order.ts:621](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L621)

The id of the `stomp` order.

***

### Stoneform

> **Stoneform**: `852206`

Defined in: [globals/order.ts:623](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L623)

The id of the `stoneform` order.

***

### Stop

> **Stop**: `851972`

Defined in: [globals/order.ts:625](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L625)

The id of the `stop` order.

***

### Stunned

> **Stunned**: `851973`

Defined in: [globals/order.ts:627](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L627)

The id of the order the game gives a unit that a spell stuns, which has no order string.

***

### Submerge

> **Submerge**: `852604`

Defined in: [globals/order.ts:629](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L629)

The id of the `submerge` order.

***

### Summonfactory

> **Summonfactory**: `852658`

Defined in: [globals/order.ts:631](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L631)

The id of the `summonfactory` order.

***

### Summongrizzly

> **Summongrizzly**: `852594`

Defined in: [globals/order.ts:633](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L633)

The id of the `summongrizzly` order.

***

### Summonphoenix

> **Summonphoenix**: `852489`

Defined in: [globals/order.ts:635](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L635)

The id of the `summonphoenix` order.

***

### Summonquillbeast

> **Summonquillbeast**: `852595`

Defined in: [globals/order.ts:637](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L637)

The id of the `summonquillbeast` order.

***

### Summonwareagle

> **Summonwareagle**: `852596`

Defined in: [globals/order.ts:639](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L639)

The id of the `summonwareagle` order.

***

### Tankdroppilot

> **Tankdroppilot**: `852079`

Defined in: [globals/order.ts:641](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L641)

The id of the `tankdroppilot` order.

***

### Tankloadpilot

> **Tankloadpilot**: `852080`

Defined in: [globals/order.ts:643](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L643)

The id of the `tankloadpilot` order.

***

### Tankpilot

> **Tankpilot**: `852081`

Defined in: [globals/order.ts:645](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L645)

The id of the `tankpilot` order.

***

### Taunt

> **Taunt**: `852520`

Defined in: [globals/order.ts:647](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L647)

The id of the `taunt` order.

***

### Thunderbolt

> **Thunderbolt**: `852095`

Defined in: [globals/order.ts:649](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L649)

The id of the `thunderbolt` order.

***

### Thunderclap

> **Thunderclap**: `852096`

Defined in: [globals/order.ts:651](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L651)

The id of the `thunderclap` order.

***

### Tornado

> **Tornado**: `852597`

Defined in: [globals/order.ts:653](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L653)

The id of the `tornado` order.

***

### Townbelloff

> **Townbelloff**: `852083`

Defined in: [globals/order.ts:655](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L655)

The id of the `townbelloff` order.

***

### Townbellon

> **Townbellon**: `852082`

Defined in: [globals/order.ts:657](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L657)

The id of the `townbellon` order.

***

### Tranquility

> **Tranquility**: `852184`

Defined in: [globals/order.ts:659](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L659)

The id of the `tranquility` order.

***

### Transmute

> **Transmute**: `852665`

Defined in: [globals/order.ts:661](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L661)

The id of the `transmute` order.

***

### Unavatar

> **Unavatar**: `852087`

Defined in: [globals/order.ts:663](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L663)

The id of the `unavatar` order.

***

### Unavengerform

> **Unavengerform**: `852532`

Defined in: [globals/order.ts:665](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L665)

The id of the `unavengerform` order.

***

### Unbearform

> **Unbearform**: `852139`

Defined in: [globals/order.ts:667](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L667)

The id of the `unbearform` order.

***

### Unburrow

> **Unburrow**: `852534`

Defined in: [globals/order.ts:669](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L669)

The id of the `unburrow` order.

***

### Uncoldarrows

> **Uncoldarrows**: `852245`

Defined in: [globals/order.ts:671](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L671)

The id of the `uncoldarrows` order.

***

### Uncorporealform

> **Uncorporealform**: `852494`

Defined in: [globals/order.ts:673](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L673)

The id of the `uncorporealform` order.

***

### Undeadbuild

> **Undeadbuild**: `851998`

Defined in: [globals/order.ts:675](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L675)

The id of the `undeadbuild` order.

***

### Undefend

> **Undefend**: `852056`

Defined in: [globals/order.ts:677](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L677)

The id of the `undefend` order.

***

### Undivineshield

> **Undivineshield**: `852091`

Defined in: [globals/order.ts:679](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L679)

The id of the `undivineshield` order.

***

### Unetherealform

> **Unetherealform**: `852497`

Defined in: [globals/order.ts:681](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L681)

The id of the `unetherealform` order.

***

### Unflamingarrows

> **Unflamingarrows**: `852175`

Defined in: [globals/order.ts:683](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L683)

The id of the `unflamingarrows` order.

***

### Unflamingattack

> **Unflamingattack**: `852541`

Defined in: [globals/order.ts:685](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L685)

The id of the `unflamingattack` order.

***

### Unholyfrenzy

> **Unholyfrenzy**: `852209`

Defined in: [globals/order.ts:687](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L687)

The id of the `unholyfrenzy` order.

***

### Unimmolation

> **Unimmolation**: `852178`

Defined in: [globals/order.ts:689](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L689)

The id of the `unimmolation` order.

***

### Unload

> **Unload**: `852047`

Defined in: [globals/order.ts:691](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L691)

The id of the `unload` order.

***

### Unloadall

> **Unloadall**: `852048`

Defined in: [globals/order.ts:693](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L693)

The id of the `unloadall` order.

***

### Unloadallcorpses

> **Unloadallcorpses**: `852054`

Defined in: [globals/order.ts:695](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L695)

The id of the `unloadallcorpses` order.

***

### Unloadallinstant

> **Unloadallinstant**: `852049`

Defined in: [globals/order.ts:697](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L697)

The id of the `unloadallinstant` order.

***

### Unpoisonarrows

> **Unpoisonarrows**: `852256`

Defined in: [globals/order.ts:699](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L699)

The id of the `unpoisonarrows` order.

***

### Unravenform

> **Unravenform**: `852156`

Defined in: [globals/order.ts:701](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L701)

The id of the `unravenform` order.

***

### Unrobogoblin

> **Unrobogoblin**: `852657`

Defined in: [globals/order.ts:703](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L703)

The id of the `unrobogoblin` order.

***

### Unroot

> **Unroot**: `852166`

Defined in: [globals/order.ts:705](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L705)

The id of the `unroot` order.

***

### Unstableconcoction

> **Unstableconcoction**: `852500`

Defined in: [globals/order.ts:707](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L707)

The id of the `unstableconcoction` order.

***

### Unstoneform

> **Unstoneform**: `852207`

Defined in: [globals/order.ts:709](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L709)

The id of the `unstoneform` order.

***

### Unsubmerge

> **Unsubmerge**: `852605`

Defined in: [globals/order.ts:711](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L711)

The id of the `unsubmerge` order.

***

### Unsummon

> **Unsummon**: `852210`

Defined in: [globals/order.ts:713](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L713)

The id of the `unsummon` order.

***

### Unwindwalk

> **Unwindwalk**: `852130`

Defined in: [globals/order.ts:715](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L715)

The id of the `unwindwalk` order.

***

### Useslot1

> **Useslot1**: `852008`

Defined in: [globals/order.ts:717](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L717)

The id of the order that uses the item in the unit's first inventory slot (index 0), which has no order string.

***

### Useslot2

> **Useslot2**: `852009`

Defined in: [globals/order.ts:719](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L719)

The id of the order that uses the item in the unit's second inventory slot (index 1), which has no order string.

***

### Useslot3

> **Useslot3**: `852010`

Defined in: [globals/order.ts:721](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L721)

The id of the order that uses the item in the unit's third inventory slot (index 2), which has no order string.

***

### Useslot4

> **Useslot4**: `852011`

Defined in: [globals/order.ts:723](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L723)

The id of the order that uses the item in the unit's fourth inventory slot (index 3), which has no order string.

***

### Useslot5

> **Useslot5**: `852012`

Defined in: [globals/order.ts:725](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L725)

The id of the order that uses the item in the unit's fifth inventory slot (index 4), which has no order string.

***

### Useslot6

> **Useslot6**: `852013`

Defined in: [globals/order.ts:727](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L727)

The id of the order that uses the item in the unit's sixth inventory slot (index 5), which has no order string.

***

### Vengeance

> **Vengeance**: `852521`

Defined in: [globals/order.ts:729](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L729)

The id of the `vengeance` order.

***

### Vengeanceinstant

> **Vengeanceinstant**: `852524`

Defined in: [globals/order.ts:731](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L731)

The id of the `vengeanceinstant` order.

***

### Vengeanceoff

> **Vengeanceoff**: `852523`

Defined in: [globals/order.ts:733](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L733)

The id of the `vengeanceoff` order.

***

### Vengeanceon

> **Vengeanceon**: `852522`

Defined in: [globals/order.ts:735](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L735)

The id of the `vengeanceon` order.

***

### Volcano

> **Volcano**: `852669`

Defined in: [globals/order.ts:737](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L737)

The id of the `volcano` order.

***

### Voodoo

> **Voodoo**: `852503`

Defined in: [globals/order.ts:739](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L739)

The id of the `voodoo` order.

***

### Ward

> **Ward**: `852504`

Defined in: [globals/order.ts:741](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L741)

The id of the `ward` order.

***

### Waterelemental

> **Waterelemental**: `852097`

Defined in: [globals/order.ts:743](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L743)

The id of the `waterelemental` order.

***

### Wateryminion

> **Wateryminion**: `852598`

Defined in: [globals/order.ts:745](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L745)

The id of the `wateryminion` order.

***

### Web

> **Web**: `852211`

Defined in: [globals/order.ts:747](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L747)

The id of the `web` order.

***

### Weboff

> **Weboff**: `852213`

Defined in: [globals/order.ts:749](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L749)

The id of the `weboff` order.

***

### Webon

> **Webon**: `852212`

Defined in: [globals/order.ts:751](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L751)

The id of the `webon` order.

***

### Whirlwind

> **Whirlwind**: `852128`

Defined in: [globals/order.ts:753](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L753)

The id of the `whirlwind` order.

***

### Windwalk

> **Windwalk**: `852129`

Defined in: [globals/order.ts:755](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L755)

The id of the `windwalk` order.

***

### Wispharvest

> **Wispharvest**: `852214`

Defined in: [globals/order.ts:757](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/order.ts#L757)

The id of the `wispharvest` order.
