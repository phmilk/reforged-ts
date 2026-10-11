# Enumeration: OrderId

Defined in: [globals/order.ts:10](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L10)

The ids of the game's orders, one member per order, for the order members of [Unit](../../../../classes/Unit.md) and the `orderId` of an order event.

## Remarks

- A member is named after its order string, with the first letter capitalised: `OrderId.Attack` is the id of the `attack` order.
- Some orders have no order string, such as `Moveslot1` to `Moveslot6` and `Useslot1` to `Useslot6`: those are issued and recognised by id only.
- `OrderId` is a `const enum`: each use compiles to the number, and the emitted Lua holds no `OrderId` table to look a name up in.

## Enumeration Members

### Absorb

> **Absorb**: `852529`

Defined in: [globals/order.ts:12](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L12)

The id of the `absorb` order.

***

### Acidbomb

> **Acidbomb**: `852662`

Defined in: [globals/order.ts:14](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L14)

The id of the `acidbomb` order.

***

### Acolyteharvest

> **Acolyteharvest**: `852185`

Defined in: [globals/order.ts:16](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L16)

The id of the `acolyteharvest` order.

***

### Aimove

> **Aimove**: `851988`

Defined in: [globals/order.ts:18](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L18)

The id of the `AImove` order: the game spells the string with a capital `AI`.

***

### Ambush

> **Ambush**: `852131`

Defined in: [globals/order.ts:20](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L20)

The id of the `ambush` order.

***

### Ancestralspirit

> **Ancestralspirit**: `852490`

Defined in: [globals/order.ts:22](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L22)

The id of the `ancestralspirit` order.

***

### Ancestralspirittarget

> **Ancestralspirittarget**: `852491`

Defined in: [globals/order.ts:24](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L24)

The id of the `ancestralspirittarget` order.

***

### Animatedead

> **Animatedead**: `852217`

Defined in: [globals/order.ts:26](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L26)

The id of the `animatedead` order.

***

### Antimagicshell

> **Antimagicshell**: `852186`

Defined in: [globals/order.ts:28](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L28)

The id of the `antimagicshell` order.

***

### Attack

> **Attack**: `851983`

Defined in: [globals/order.ts:30](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L30)

The id of the `attack` order.

***

### Attackground

> **Attackground**: `851984`

Defined in: [globals/order.ts:32](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L32)

The id of the `attackground` order.

***

### Attackonce

> **Attackonce**: `851985`

Defined in: [globals/order.ts:34](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L34)

The id of the `attackonce` order.

***

### Attributemodskill

> **Attributemodskill**: `852576`

Defined in: [globals/order.ts:36](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L36)

The id of the `attributemodskill` order.

***

### Auraunholy

> **Auraunholy**: `852215`

Defined in: [globals/order.ts:38](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L38)

The id of the `auraunholy` order.

***

### Auravampiric

> **Auravampiric**: `852216`

Defined in: [globals/order.ts:40](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L40)

The id of the `auravampiric` order.

***

### Autodispel

> **Autodispel**: `852132`

Defined in: [globals/order.ts:42](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L42)

The id of the `autodispel` order.

***

### Autodispeloff

> **Autodispeloff**: `852134`

Defined in: [globals/order.ts:44](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L44)

The id of the `autodispeloff` order.

***

### Autodispelon

> **Autodispelon**: `852133`

Defined in: [globals/order.ts:46](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L46)

The id of the `autodispelon` order.

***

### Autoentangle

> **Autoentangle**: `852505`

Defined in: [globals/order.ts:48](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L48)

The id of the `autoentangle` order.

***

### Autoentangleinstant

> **Autoentangleinstant**: `852506`

Defined in: [globals/order.ts:50](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L50)

The id of the `autoentangleinstant` order.

***

### Autoharvestgold

> **Autoharvestgold**: `852021`

Defined in: [globals/order.ts:52](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L52)

The id of the `autoharvestgold` order.

***

### Autoharvestlumber

> **Autoharvestlumber**: `852022`

Defined in: [globals/order.ts:54](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L54)

The id of the `autoharvestlumber` order.

***

### Avatar

> **Avatar**: `852086`

Defined in: [globals/order.ts:56](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L56)

The id of the `avatar` order.

***

### Avengerform

> **Avengerform**: `852531`

Defined in: [globals/order.ts:58](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L58)

The id of the `avengerform` order.

***

### Awaken

> **Awaken**: `852466`

Defined in: [globals/order.ts:60](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L60)

The id of the `awaken` order.

***

### Banish

> **Banish**: `852486`

Defined in: [globals/order.ts:62](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L62)

The id of the `banish` order.

***

### Barkskin

> **Barkskin**: `852135`

Defined in: [globals/order.ts:64](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L64)

The id of the `barkskin` order.

***

### Barkskinoff

> **Barkskinoff**: `852137`

Defined in: [globals/order.ts:66](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L66)

The id of the `barkskinoff` order.

***

### Barkskinon

> **Barkskinon**: `852136`

Defined in: [globals/order.ts:68](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L68)

The id of the `barkskinon` order.

***

### Battleroar

> **Battleroar**: `852599`

Defined in: [globals/order.ts:74](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L74)

The id of the `battleroar` order.

#### Remarks

In w3ts 3.x it was 852099, the id of `battlestations`: issuing it issued `battlestations`, and an incoming order id compared with it matched `battlestations`, not `battleroar`. `Battlestations` is that id.

***

### Battlestations

> **Battlestations**: `852099`

Defined in: [globals/order.ts:76](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L76)

The id of the `battlestations` order.

***

### Bearform

> **Bearform**: `852138`

Defined in: [globals/order.ts:78](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L78)

The id of the `bearform` order.

***

### Berserk

> **Berserk**: `852100`

Defined in: [globals/order.ts:80](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L80)

The id of the `berserk` order.

***

### Blackarrow

> **Blackarrow**: `852577`

Defined in: [globals/order.ts:82](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L82)

The id of the `blackarrow` order.

***

### Blackarrowoff

> **Blackarrowoff**: `852579`

Defined in: [globals/order.ts:84](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L84)

The id of the `blackarrowoff` order.

***

### Blackarrowon

> **Blackarrowon**: `852578`

Defined in: [globals/order.ts:86](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L86)

The id of the `blackarrowon` order.

***

### Blight

> **Blight**: `852187`

Defined in: [globals/order.ts:88](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L88)

The id of the `blight` order.

***

### Blink

> **Blink**: `852525`

Defined in: [globals/order.ts:90](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L90)

The id of the `blink` order.

***

### Blizzard

> **Blizzard**: `852089`

Defined in: [globals/order.ts:92](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L92)

The id of the `blizzard` order.

***

### Bloodlust

> **Bloodlust**: `852101`

Defined in: [globals/order.ts:94](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L94)

The id of the `bloodlust` order.

***

### Bloodlustoff

> **Bloodlustoff**: `852103`

Defined in: [globals/order.ts:96](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L96)

The id of the `bloodlustoff` order.

***

### Bloodluston

> **Bloodluston**: `852102`

Defined in: [globals/order.ts:98](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L98)

The id of the `bloodluston` order.

***

### Board

> **Board**: `852043`

Defined in: [globals/order.ts:100](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L100)

The id of the `board` order.

***

### Breathoffire

> **Breathoffire**: `852580`

Defined in: [globals/order.ts:102](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L102)

The id of the `breathoffire` order.

***

### Breathoffrost

> **Breathoffrost**: `852560`

Defined in: [globals/order.ts:104](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L104)

The id of the `breathoffrost` order.

***

### Build

> **Build**: `851994`

Defined in: [globals/order.ts:106](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L106)

The id of the `build` order.

***

### Burrow

> **Burrow**: `852533`

Defined in: [globals/order.ts:108](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L108)

The id of the `burrow` order.

***

### Cancel

> **Cancel**: `851976`

Defined in: [globals/order.ts:110](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L110)

The id of the order that cancels a build, which has no order string: the game's internal order table calls it `ORDER_CANCEL_BUILD`.

***

### Cannibalize

> **Cannibalize**: `852188`

Defined in: [globals/order.ts:112](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L112)

The id of the `cannibalize` order.

***

### Carrionscarabs

> **Carrionscarabs**: `852551`

Defined in: [globals/order.ts:114](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L114)

The id of the `carrionscarabs` order.

***

### Carrionscarabsinstant

> **Carrionscarabsinstant**: `852554`

Defined in: [globals/order.ts:116](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L116)

The id of the `carrionscarabsinstant` order.

***

### Carrionscarabsoff

> **Carrionscarabsoff**: `852553`

Defined in: [globals/order.ts:118](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L118)

The id of the `carrionscarabsoff` order.

***

### Carrionscarabson

> **Carrionscarabson**: `852552`

Defined in: [globals/order.ts:120](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L120)

The id of the `carrionscarabson` order.

***

### Carrionswarm

> **Carrionswarm**: `852218`

Defined in: [globals/order.ts:122](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L122)

The id of the `carrionswarm` order.

***

### Chainlightning

> **Chainlightning**: `852119`

Defined in: [globals/order.ts:124](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L124)

The id of the `chainlightning` order.

***

### Channel

> **Channel**: `852600`

Defined in: [globals/order.ts:126](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L126)

The id of the `channel` order.

***

### Charm

> **Charm**: `852581`

Defined in: [globals/order.ts:128](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L128)

The id of the `charm` order.

***

### Chemicalrage

> **Chemicalrage**: `852663`

Defined in: [globals/order.ts:130](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L130)

The id of the `chemicalrage` order.

***

### Cloudoffog

> **Cloudoffog**: `852473`

Defined in: [globals/order.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L132)

The id of the `cloudoffog` order.

***

### Clusterrockets

> **Clusterrockets**: `852652`

Defined in: [globals/order.ts:134](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L134)

The id of the `clusterrockets` order.

***

### Coldarrows

> **Coldarrows**: `852244`

Defined in: [globals/order.ts:136](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L136)

The id of the `coldarrows` order.

***

### Coldarrowstarg

> **Coldarrowstarg**: `852243`

Defined in: [globals/order.ts:138](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L138)

The id of the `coldarrowstarg` order.

***

### Controlmagic

> **Controlmagic**: `852474`

Defined in: [globals/order.ts:140](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L140)

The id of the `controlmagic` order.

***

### Corporealform

> **Corporealform**: `852493`

Defined in: [globals/order.ts:142](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L142)

The id of the `corporealform` order.

***

### Corrosivebreath

> **Corrosivebreath**: `852140`

Defined in: [globals/order.ts:144](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L144)

The id of the `corrosivebreath` order.

***

### Coupleinstant

> **Coupleinstant**: `852508`

Defined in: [globals/order.ts:146](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L146)

The id of the `coupleinstant` order.

***

### Coupletarget

> **Coupletarget**: `852507`

Defined in: [globals/order.ts:148](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L148)

The id of the `coupletarget` order.

***

### Creepanimatedead

> **Creepanimatedead**: `852246`

Defined in: [globals/order.ts:150](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L150)

The id of the `creepanimatedead` order.

***

### Creepdevour

> **Creepdevour**: `852247`

Defined in: [globals/order.ts:152](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L152)

The id of the `creepdevour` order.

***

### Creepheal

> **Creepheal**: `852248`

Defined in: [globals/order.ts:154](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L154)

The id of the `creepheal` order.

***

### Creephealoff

> **Creephealoff**: `852250`

Defined in: [globals/order.ts:156](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L156)

The id of the `creephealoff` order.

***

### Creephealon

> **Creephealon**: `852249`

Defined in: [globals/order.ts:158](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L158)

The id of the `creephealon` order.

***

### Creepthunderbolt

> **Creepthunderbolt**: `852252`

Defined in: [globals/order.ts:160](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L160)

The id of the `creepthunderbolt` order.

***

### Creepthunderclap

> **Creepthunderclap**: `852253`

Defined in: [globals/order.ts:162](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L162)

The id of the `creepthunderclap` order.

***

### Cripple

> **Cripple**: `852189`

Defined in: [globals/order.ts:164](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L164)

The id of the `cripple` order.

***

### Curse

> **Curse**: `852190`

Defined in: [globals/order.ts:166](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L166)

The id of the `curse` order.

***

### Curseoff

> **Curseoff**: `852192`

Defined in: [globals/order.ts:168](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L168)

The id of the `curseoff` order.

***

### Curseon

> **Curseon**: `852191`

Defined in: [globals/order.ts:170](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L170)

The id of the `curseon` order.

***

### Cyclone

> **Cyclone**: `852144`

Defined in: [globals/order.ts:172](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L172)

The id of the `cyclone` order.

***

### Darkconversion

> **Darkconversion**: `852228`

Defined in: [globals/order.ts:174](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L174)

The id of the `darkconversion` order.

***

### Darkportal

> **Darkportal**: `852229`

Defined in: [globals/order.ts:176](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L176)

The id of the `darkportal` order.

***

### Darkritual

> **Darkritual**: `852219`

Defined in: [globals/order.ts:178](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L178)

The id of the `darkritual` order.

***

### Darksummoning

> **Darksummoning**: `852220`

Defined in: [globals/order.ts:180](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L180)

The id of the `darksummoning` order.

***

### Deathanddecay

> **Deathanddecay**: `852221`

Defined in: [globals/order.ts:182](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L182)

The id of the `deathanddecay` order.

***

### Deathcoil

> **Deathcoil**: `852222`

Defined in: [globals/order.ts:184](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L184)

The id of the `deathcoil` order.

***

### Deathpact

> **Deathpact**: `852223`

Defined in: [globals/order.ts:186](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L186)

The id of the `deathpact` order.

***

### Decouple

> **Decouple**: `852509`

Defined in: [globals/order.ts:188](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L188)

The id of the `decouple` order.

***

### Defend

> **Defend**: `852055`

Defined in: [globals/order.ts:190](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L190)

The id of the `defend` order.

***

### Detectaoe

> **Detectaoe**: `852015`

Defined in: [globals/order.ts:192](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L192)

The id of the `detectaoe` order.

***

### Detonate

> **Detonate**: `852145`

Defined in: [globals/order.ts:194](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L194)

The id of the `detonate` order.

***

### Devour

> **Devour**: `852104`

Defined in: [globals/order.ts:196](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L196)

The id of the `devour` order.

***

### Devourmagic

> **Devourmagic**: `852536`

Defined in: [globals/order.ts:198](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L198)

The id of the `devourmagic` order.

***

### Disassociate

> **Disassociate**: `852240`

Defined in: [globals/order.ts:200](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L200)

The id of the `disassociate` order.

***

### Disenchant

> **Disenchant**: `852495`

Defined in: [globals/order.ts:202](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L202)

The id of the `disenchant` order.

***

### Dismount

> **Dismount**: `852470`

Defined in: [globals/order.ts:204](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L204)

The id of the `dismount` order.

***

### Dispel

> **Dispel**: `852057`

Defined in: [globals/order.ts:206](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L206)

The id of the `dispel` order.

***

### Divineshield

> **Divineshield**: `852090`

Defined in: [globals/order.ts:208](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L208)

The id of the `divineshield` order.

***

### Doom

> **Doom**: `852583`

Defined in: [globals/order.ts:210](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L210)

The id of the `doom` order.

***

### Drain

> **Drain**: `852487`

Defined in: [globals/order.ts:212](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L212)

The id of the `drain` order.

***

### Dreadlordinferno

> **Dreadlordinferno**: `852224`

Defined in: [globals/order.ts:214](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L214)

The id of the `dreadlordinferno` order.

***

### Dropitem

> **Dropitem**: `852001`

Defined in: [globals/order.ts:216](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L216)

The id of the `dropitem` order.

***

### Drunkenhaze

> **Drunkenhaze**: `852585`

Defined in: [globals/order.ts:218](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L218)

The id of the `drunkenhaze` order.

***

### Earthquake

> **Earthquake**: `852121`

Defined in: [globals/order.ts:220](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L220)

The id of the `earthquake` order.

***

### Eattree

> **Eattree**: `852146`

Defined in: [globals/order.ts:222](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L222)

The id of the `eattree` order.

***

### Elementalfury

> **Elementalfury**: `852586`

Defined in: [globals/order.ts:224](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L224)

The id of the `elementalfury` order.

***

### Ensnare

> **Ensnare**: `852106`

Defined in: [globals/order.ts:226](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L226)

The id of the `ensnare` order.

***

### Ensnareoff

> **Ensnareoff**: `852108`

Defined in: [globals/order.ts:228](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L228)

The id of the `ensnareoff` order.

***

### Ensnareon

> **Ensnareon**: `852107`

Defined in: [globals/order.ts:230](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L230)

The id of the `ensnareon` order.

***

### Entangle

> **Entangle**: `852147`

Defined in: [globals/order.ts:232](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L232)

The id of the `entangle` order.

***

### Entangleinstant

> **Entangleinstant**: `852148`

Defined in: [globals/order.ts:234](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L234)

The id of the `entangleinstant` order.

***

### Entanglingroots

> **Entanglingroots**: `852171`

Defined in: [globals/order.ts:236](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L236)

The id of the `entanglingroots` order.

***

### Etherealform

> **Etherealform**: `852496`

Defined in: [globals/order.ts:238](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L238)

The id of the `etherealform` order.

***

### Evileye

> **Evileye**: `852105`

Defined in: [globals/order.ts:240](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L240)

The id of the `evileye` order.

***

### Faeriefire

> **Faeriefire**: `852149`

Defined in: [globals/order.ts:242](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L242)

The id of the `faeriefire` order.

***

### Faeriefireoff

> **Faeriefireoff**: `852151`

Defined in: [globals/order.ts:244](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L244)

The id of the `faeriefireoff` order.

***

### Faeriefireon

> **Faeriefireon**: `852150`

Defined in: [globals/order.ts:246](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L246)

The id of the `faeriefireon` order.

***

### Fanofknives

> **Fanofknives**: `852526`

Defined in: [globals/order.ts:248](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L248)

The id of the `fanofknives` order.

***

### Farsight

> **Farsight**: `852122`

Defined in: [globals/order.ts:250](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L250)

The id of the `farsight` order.

***

### Fingerofdeath

> **Fingerofdeath**: `852230`

Defined in: [globals/order.ts:252](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L252)

The id of the `fingerofdeath` order.

***

### Firebolt

> **Firebolt**: `852231`

Defined in: [globals/order.ts:254](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L254)

The id of the `firebolt` order.

***

### Flamestrike

> **Flamestrike**: `852488`

Defined in: [globals/order.ts:256](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L256)

The id of the `flamestrike` order.

***

### Flamingarrows

> **Flamingarrows**: `852174`

Defined in: [globals/order.ts:258](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L258)

The id of the `flamingarrows` order.

***

### Flamingarrowstarg

> **Flamingarrowstarg**: `852173`

Defined in: [globals/order.ts:260](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L260)

The id of the `flamingarrowstarg` order.

***

### Flamingattack

> **Flamingattack**: `852540`

Defined in: [globals/order.ts:262](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L262)

The id of the `flamingattack` order.

***

### Flamingattacktarg

> **Flamingattacktarg**: `852539`

Defined in: [globals/order.ts:264](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L264)

The id of the `flamingattacktarg` order.

***

### Flare

> **Flare**: `852060`

Defined in: [globals/order.ts:266](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L266)

The id of the `flare` order.

***

### Forceboard

> **Forceboard**: `852044`

Defined in: [globals/order.ts:268](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L268)

The id of the `forceboard` order.

***

### Forceofnature

> **Forceofnature**: `852176`

Defined in: [globals/order.ts:270](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L270)

The id of the `forceofnature` order.

***

### Forkedlightning

> **Forkedlightning**: `852587`

Defined in: [globals/order.ts:276](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L276)

The id of the `forkedlightning` order.

#### Remarks

In w3ts 3.x it was 852586, the id of `elementalfury`: issuing it issued `elementalfury`, and an incoming order id compared with it matched `elementalfury`, not `forkedlightning`. `Elementalfury` is that id.

***

### Freezingbreath

> **Freezingbreath**: `852195`

Defined in: [globals/order.ts:278](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L278)

The id of the `freezingbreath` order.

***

### Frenzy

> **Frenzy**: `852561`

Defined in: [globals/order.ts:280](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L280)

The id of the `frenzy` order.

***

### Frenzyoff

> **Frenzyoff**: `852563`

Defined in: [globals/order.ts:282](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L282)

The id of the `frenzyoff` order.

***

### Frenzyon

> **Frenzyon**: `852562`

Defined in: [globals/order.ts:284](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L284)

The id of the `frenzyon` order.

***

### Frostarmor

> **Frostarmor**: `852225`

Defined in: [globals/order.ts:286](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L286)

The id of the `frostarmor` order.

***

### Frostarmoroff

> **Frostarmoroff**: `852459`

Defined in: [globals/order.ts:288](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L288)

The id of the `frostarmoroff` order.

***

### Frostarmoron

> **Frostarmoron**: `852458`

Defined in: [globals/order.ts:290](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L290)

The id of the `frostarmoron` order.

***

### Frostnova

> **Frostnova**: `852226`

Defined in: [globals/order.ts:292](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L292)

The id of the `frostnova` order.

***

### Getitem

> **Getitem**: `851981`

Defined in: [globals/order.ts:294](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L294)

The id of the `getitem` order.

***

### Gold2lumber

> **Gold2lumber**: `852233`

Defined in: [globals/order.ts:296](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L296)

The id of the `gold2lumber` order.

***

### Grabtree

> **Grabtree**: `852511`

Defined in: [globals/order.ts:298](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L298)

The id of the `grabtree` order.

***

### Harvest

> **Harvest**: `852018`

Defined in: [globals/order.ts:300](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L300)

The id of the `harvest` order.

***

### Heal

> **Heal**: `852063`

Defined in: [globals/order.ts:302](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L302)

The id of the `heal` order.

***

### Healingspray

> **Healingspray**: `852664`

Defined in: [globals/order.ts:304](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L304)

The id of the `healingspray` order.

***

### Healingward

> **Healingward**: `852109`

Defined in: [globals/order.ts:306](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L306)

The id of the `healingward` order.

***

### Healingwave

> **Healingwave**: `852501`

Defined in: [globals/order.ts:308](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L308)

The id of the `healingwave` order.

***

### Healoff

> **Healoff**: `852065`

Defined in: [globals/order.ts:310](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L310)

The id of the `healoff` order.

***

### Healon

> **Healon**: `852064`

Defined in: [globals/order.ts:312](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L312)

The id of the `healon` order.

***

### Hex

> **Hex**: `852502`

Defined in: [globals/order.ts:314](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L314)

The id of the `hex` order.

***

### Holdposition

> **Holdposition**: `851993`

Defined in: [globals/order.ts:316](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L316)

The id of the `holdposition` order.

***

### Holybolt

> **Holybolt**: `852092`

Defined in: [globals/order.ts:318](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L318)

The id of the `holybolt` order.

***

### Howlofterror

> **Howlofterror**: `852588`

Defined in: [globals/order.ts:320](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L320)

The id of the `howlofterror` order.

***

### Humanbuild

> **Humanbuild**: `851995`

Defined in: [globals/order.ts:322](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L322)

The id of the `humanbuild` order.

***

### Immolation

> **Immolation**: `852177`

Defined in: [globals/order.ts:324](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L324)

The id of the `immolation` order.

***

### Impale

> **Impale**: `852555`

Defined in: [globals/order.ts:326](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L326)

The id of the `impale` order.

***

### Incineratearrow

> **Incineratearrow**: `852670`

Defined in: [globals/order.ts:328](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L328)

The id of the `incineratearrow` order.

***

### Incineratearrowoff

> **Incineratearrowoff**: `852672`

Defined in: [globals/order.ts:330](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L330)

The id of the `incineratearrowoff` order.

***

### Incineratearrowon

> **Incineratearrowon**: `852671`

Defined in: [globals/order.ts:332](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L332)

The id of the `incineratearrowon` order.

***

### Inferno

> **Inferno**: `852232`

Defined in: [globals/order.ts:334](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L334)

The id of the `inferno` order.

***

### Innerfire

> **Innerfire**: `852066`

Defined in: [globals/order.ts:336](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L336)

The id of the `innerfire` order.

***

### Innerfireoff

> **Innerfireoff**: `852068`

Defined in: [globals/order.ts:338](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L338)

The id of the `innerfireoff` order.

***

### Innerfireon

> **Innerfireon**: `852067`

Defined in: [globals/order.ts:340](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L340)

The id of the `innerfireon` order.

***

### Instant

> **Instant**: `852200`

Defined in: [globals/order.ts:342](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L342)

The id of the `instant` order.

***

### Instant1

> **Instant1**: `851991`

Defined in: [globals/order.ts:347](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L347)

The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_PATROL2`.

#### Remarks

Unconfirmed: none of the public order tables (UjAPI, WarRaft/Order, WurstStdlib2) lists this id.

***

### Instant2

> **Instant2**: `851987`

Defined in: [globals/order.ts:352](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L352)

The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_GUARD_RETURN`.

#### Remarks

Unconfirmed: none of the public order tables (UjAPI, WarRaft/Order, WurstStdlib2) lists this id.

***

### Instant3

> **Instant3**: `851975`

Defined in: [globals/order.ts:357](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L357)

The id of the generic cancel order, which has no order string: the game's internal order table calls it `ORDER_CANCEL`.

#### Remarks

UjAPI's order table gives this id to `cmdcancel`; the other public order tables (WarRaft/Order, WurstStdlib2) do not list it.

***

### Instant4

> **Instant4**: `852019`

Defined in: [globals/order.ts:362](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L362)

The id of an order the game issues itself, which has no order string: the game's internal order table calls it `ORDER_HARVEST_AGAIN`.

#### Remarks

Unconfirmed: none of the public order tables (UjAPI, WarRaft/Order, WurstStdlib2) lists this id.

***

### Invisibility

> **Invisibility**: `852069`

Defined in: [globals/order.ts:364](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L364)

The id of the `invisibility` order.

***

### Lavamonster

> **Lavamonster**: `852667`

Defined in: [globals/order.ts:366](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L366)

The id of the `lavamonster` order.

***

### Lightningshield

> **Lightningshield**: `852110`

Defined in: [globals/order.ts:368](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L368)

The id of the `lightningshield` order.

***

### Load

> **Load**: `852046`

Defined in: [globals/order.ts:370](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L370)

The id of the `load` order.

***

### Loadarcher

> **Loadarcher**: `852142`

Defined in: [globals/order.ts:372](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L372)

The id of the `loadarcher` order.

***

### Loadcorpse

> **Loadcorpse**: `852050`

Defined in: [globals/order.ts:374](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L374)

The id of the `loadcorpse` order.

***

### Loadcorpseinstant

> **Loadcorpseinstant**: `852053`

Defined in: [globals/order.ts:376](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L376)

The id of the `loadcorpseinstant` order.

***

### Locustswarm

> **Locustswarm**: `852556`

Defined in: [globals/order.ts:378](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L378)

The id of the `locustswarm` order.

***

### Lumber2gold

> **Lumber2gold**: `852234`

Defined in: [globals/order.ts:380](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L380)

The id of the `lumber2gold` order.

***

### Magicdefense

> **Magicdefense**: `852478`

Defined in: [globals/order.ts:382](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L382)

The id of the `magicdefense` order.

***

### Magicleash

> **Magicleash**: `852480`

Defined in: [globals/order.ts:384](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L384)

The id of the `magicleash` order.

***

### Magicundefense

> **Magicundefense**: `852479`

Defined in: [globals/order.ts:386](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L386)

The id of the `magicundefense` order.

***

### Manaburn

> **Manaburn**: `852179`

Defined in: [globals/order.ts:388](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L388)

The id of the `manaburn` order.

***

### Manaflareoff

> **Manaflareoff**: `852513`

Defined in: [globals/order.ts:390](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L390)

The id of the `manaflareoff` order.

***

### Manaflareon

> **Manaflareon**: `852512`

Defined in: [globals/order.ts:392](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L392)

The id of the `manaflareon` order.

***

### Manashieldoff

> **Manashieldoff**: `852590`

Defined in: [globals/order.ts:394](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L394)

The id of the `manashieldoff` order.

***

### Manashieldon

> **Manashieldon**: `852589`

Defined in: [globals/order.ts:396](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L396)

The id of the `manashieldon` order.

***

### Massteleport

> **Massteleport**: `852093`

Defined in: [globals/order.ts:398](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L398)

The id of the `massteleport` order.

***

### Mechanicalcritter

> **Mechanicalcritter**: `852564`

Defined in: [globals/order.ts:400](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L400)

The id of the `mechanicalcritter` order.

***

### Metamorphosis

> **Metamorphosis**: `852180`

Defined in: [globals/order.ts:402](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L402)

The id of the `metamorphosis` order.

***

### Militia

> **Militia**: `852072`

Defined in: [globals/order.ts:404](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L404)

The id of the `militia` order.

***

### Militiaconvert

> **Militiaconvert**: `852071`

Defined in: [globals/order.ts:406](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L406)

The id of the `militiaconvert` order.

***

### Militiaoff

> **Militiaoff**: `852073`

Defined in: [globals/order.ts:408](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L408)

The id of the `militiaoff` order.

***

### Militiaunconvert

> **Militiaunconvert**: `852651`

Defined in: [globals/order.ts:410](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L410)

The id of the `militiaunconvert` order.

***

### Mindrot

> **Mindrot**: `852565`

Defined in: [globals/order.ts:412](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L412)

The id of the `mindrot` order.

***

### Mirrorimage

> **Mirrorimage**: `852123`

Defined in: [globals/order.ts:414](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L414)

The id of the `mirrorimage` order.

***

### Monsoon

> **Monsoon**: `852591`

Defined in: [globals/order.ts:416](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L416)

The id of the `monsoon` order.

***

### Mount

> **Mount**: `852469`

Defined in: [globals/order.ts:418](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L418)

The id of the `mount` order.

***

### Mounthippogryph

> **Mounthippogryph**: `852143`

Defined in: [globals/order.ts:420](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L420)

The id of the `mounthippogryph` order.

***

### Move

> **Move**: `851986`

Defined in: [globals/order.ts:422](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L422)

The id of the `move` order.

***

### Moveslot1

> **Moveslot1**: `852002`

Defined in: [globals/order.ts:424](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L424)

The id of the order that moves the target item to the unit's first inventory slot (index 0), which has no order string.

***

### Moveslot2

> **Moveslot2**: `852003`

Defined in: [globals/order.ts:426](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L426)

The id of the order that moves the target item to the unit's second inventory slot (index 1), which has no order string.

***

### Moveslot3

> **Moveslot3**: `852004`

Defined in: [globals/order.ts:428](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L428)

The id of the order that moves the target item to the unit's third inventory slot (index 2), which has no order string.

***

### Moveslot4

> **Moveslot4**: `852005`

Defined in: [globals/order.ts:430](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L430)

The id of the order that moves the target item to the unit's fourth inventory slot (index 3), which has no order string.

***

### Moveslot5

> **Moveslot5**: `852006`

Defined in: [globals/order.ts:432](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L432)

The id of the order that moves the target item to the unit's fifth inventory slot (index 4), which has no order string.

***

### Moveslot6

> **Moveslot6**: `852007`

Defined in: [globals/order.ts:434](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L434)

The id of the order that moves the target item to the unit's sixth inventory slot (index 5), which has no order string.

***

### Nagabuild

> **Nagabuild**: `852467`

Defined in: [globals/order.ts:436](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L436)

The id of the `nagabuild` order.

***

### Neutraldetectaoe

> **Neutraldetectaoe**: `852023`

Defined in: [globals/order.ts:438](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L438)

The id of the `neutraldetectaoe` order.

***

### Neutralinteract

> **Neutralinteract**: `852566`

Defined in: [globals/order.ts:440](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L440)

The id of the `neutralinteract` order.

***

### Neutralspell

> **Neutralspell**: `852630`

Defined in: [globals/order.ts:442](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L442)

The id of the `neutralspell` order.

***

### Nightelfbuild

> **Nightelfbuild**: `851997`

Defined in: [globals/order.ts:444](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L444)

The id of the `nightelfbuild` order.

***

### Orcbuild

> **Orcbuild**: `851996`

Defined in: [globals/order.ts:446](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L446)

The id of the `orcbuild` order.

***

### Parasite

> **Parasite**: `852601`

Defined in: [globals/order.ts:448](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L448)

The id of the `parasite` order.

***

### Parasiteoff

> **Parasiteoff**: `852603`

Defined in: [globals/order.ts:450](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L450)

The id of the `parasiteoff` order.

***

### Parasiteon

> **Parasiteon**: `852602`

Defined in: [globals/order.ts:452](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L452)

The id of the `parasiteon` order.

***

### Patrol

> **Patrol**: `851990`

Defined in: [globals/order.ts:454](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L454)

The id of the `patrol` order.

***

### Phaseshift

> **Phaseshift**: `852514`

Defined in: [globals/order.ts:456](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L456)

The id of the `phaseshift` order.

***

### Phaseshiftinstant

> **Phaseshiftinstant**: `852517`

Defined in: [globals/order.ts:458](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L458)

The id of the `phaseshiftinstant` order.

***

### Phaseshiftoff

> **Phaseshiftoff**: `852516`

Defined in: [globals/order.ts:460](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L460)

The id of the `phaseshiftoff` order.

***

### Phaseshifton

> **Phaseshifton**: `852515`

Defined in: [globals/order.ts:462](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L462)

The id of the `phaseshifton` order.

***

### Phoenixfire

> **Phoenixfire**: `852481`

Defined in: [globals/order.ts:464](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L464)

The id of the `phoenixfire` order.

***

### Phoenixmorph

> **Phoenixmorph**: `852482`

Defined in: [globals/order.ts:466](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L466)

The id of the `phoenixmorph` order.

***

### Poisonarrows

> **Poisonarrows**: `852255`

Defined in: [globals/order.ts:468](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L468)

The id of the `poisonarrows` order.

***

### Poisonarrowstarg

> **Poisonarrowstarg**: `852254`

Defined in: [globals/order.ts:470](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L470)

The id of the `poisonarrowstarg` order.

***

### Polymorph

> **Polymorph**: `852074`

Defined in: [globals/order.ts:472](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L472)

The id of the `polymorph` order.

***

### Possession

> **Possession**: `852196`

Defined in: [globals/order.ts:474](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L474)

The id of the `possession` order.

***

### Preservation

> **Preservation**: `852568`

Defined in: [globals/order.ts:476](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L476)

The id of the `preservation` order.

***

### Purge

> **Purge**: `852111`

Defined in: [globals/order.ts:478](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L478)

The id of the `purge` order.

***

### Rainofchaos

> **Rainofchaos**: `852237`

Defined in: [globals/order.ts:480](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L480)

The id of the `rainofchaos` order.

***

### Rainoffire

> **Rainoffire**: `852238`

Defined in: [globals/order.ts:482](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L482)

The id of the `rainoffire` order.

***

### Raisedead

> **Raisedead**: `852197`

Defined in: [globals/order.ts:484](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L484)

The id of the `raisedead` order.

***

### Raisedeadoff

> **Raisedeadoff**: `852199`

Defined in: [globals/order.ts:486](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L486)

The id of the `raisedeadoff` order.

***

### Raisedeadon

> **Raisedeadon**: `852198`

Defined in: [globals/order.ts:488](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L488)

The id of the `raisedeadon` order.

***

### Ravenform

> **Ravenform**: `852155`

Defined in: [globals/order.ts:490](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L490)

The id of the `ravenform` order.

***

### Recharge

> **Recharge**: `852157`

Defined in: [globals/order.ts:492](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L492)

The id of the `recharge` order.

***

### Rechargeoff

> **Rechargeoff**: `852159`

Defined in: [globals/order.ts:494](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L494)

The id of the `rechargeoff` order.

***

### Rechargeon

> **Rechargeon**: `852158`

Defined in: [globals/order.ts:496](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L496)

The id of the `rechargeon` order.

***

### Rejuvination

> **Rejuvination**: `852160`

Defined in: [globals/order.ts:498](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L498)

The id of the `rejuvination` order.

***

### Renew

> **Renew**: `852161`

Defined in: [globals/order.ts:500](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L500)

The id of the `renew` order.

***

### Renewoff

> **Renewoff**: `852163`

Defined in: [globals/order.ts:502](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L502)

The id of the `renewoff` order.

***

### Renewon

> **Renewon**: `852162`

Defined in: [globals/order.ts:504](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L504)

The id of the `renewon` order.

***

### Repair

> **Repair**: `852024`

Defined in: [globals/order.ts:506](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L506)

The id of the `repair` order.

***

### Repairoff

> **Repairoff**: `852026`

Defined in: [globals/order.ts:508](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L508)

The id of the `repairoff` order.

***

### Repairon

> **Repairon**: `852025`

Defined in: [globals/order.ts:510](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L510)

The id of the `repairon` order.

***

### Replenish

> **Replenish**: `852542`

Defined in: [globals/order.ts:512](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L512)

The id of the `replenish` order.

***

### Replenishlife

> **Replenishlife**: `852545`

Defined in: [globals/order.ts:514](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L514)

The id of the `replenishlife` order.

***

### Replenishlifeoff

> **Replenishlifeoff**: `852547`

Defined in: [globals/order.ts:516](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L516)

The id of the `replenishlifeoff` order.

***

### Replenishlifeon

> **Replenishlifeon**: `852546`

Defined in: [globals/order.ts:518](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L518)

The id of the `replenishlifeon` order.

***

### Replenishmana

> **Replenishmana**: `852548`

Defined in: [globals/order.ts:520](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L520)

The id of the `replenishmana` order.

***

### Replenishmanaoff

> **Replenishmanaoff**: `852550`

Defined in: [globals/order.ts:522](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L522)

The id of the `replenishmanaoff` order.

***

### Replenishmanaon

> **Replenishmanaon**: `852549`

Defined in: [globals/order.ts:524](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L524)

The id of the `replenishmanaon` order.

***

### Replenishoff

> **Replenishoff**: `852544`

Defined in: [globals/order.ts:526](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L526)

The id of the `replenishoff` order.

***

### Replenishon

> **Replenishon**: `852543`

Defined in: [globals/order.ts:528](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L528)

The id of the `replenishon` order.

***

### Request\_hero

> **Request\_hero**: `852239`

Defined in: [globals/order.ts:530](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L530)

The id of the `request_hero` order.

***

### Requestsacrifice

> **Requestsacrifice**: `852201`

Defined in: [globals/order.ts:532](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L532)

The id of the `requestsacrifice` order.

***

### Restoration

> **Restoration**: `852202`

Defined in: [globals/order.ts:534](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L534)

The id of the `restoration` order.

***

### Restorationoff

> **Restorationoff**: `852204`

Defined in: [globals/order.ts:536](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L536)

The id of the `restorationoff` order.

***

### Restorationon

> **Restorationon**: `852203`

Defined in: [globals/order.ts:538](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L538)

The id of the `restorationon` order.

***

### Resumebuild

> **Resumebuild**: `851999`

Defined in: [globals/order.ts:540](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L540)

The id of the `resumebuild` order.

***

### Resumeharvesting

> **Resumeharvesting**: `852017`

Defined in: [globals/order.ts:542](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L542)

The id of the `resumeharvesting` order.

***

### Resurrection

> **Resurrection**: `852094`

Defined in: [globals/order.ts:544](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L544)

The id of the `resurrection` order.

***

### Returnresources

> **Returnresources**: `852020`

Defined in: [globals/order.ts:546](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L546)

The id of the `returnresources` order.

***

### Revenge

> **Revenge**: `852241`

Defined in: [globals/order.ts:548](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L548)

The id of the `revenge` order.

***

### Revive

> **Revive**: `852039`

Defined in: [globals/order.ts:550](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L550)

The id of the `revive` order.

***

### Roar

> **Roar**: `852164`

Defined in: [globals/order.ts:552](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L552)

The id of the `roar` order.

***

### Robogoblin

> **Robogoblin**: `852656`

Defined in: [globals/order.ts:554](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L554)

The id of the `robogoblin` order.

***

### Root

> **Root**: `852165`

Defined in: [globals/order.ts:556](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L556)

The id of the `root` order.

***

### Sacrifice

> **Sacrifice**: `852205`

Defined in: [globals/order.ts:558](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L558)

The id of the `sacrifice` order.

***

### Sanctuary

> **Sanctuary**: `852569`

Defined in: [globals/order.ts:560](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L560)

The id of the `sanctuary` order.

***

### Scout

> **Scout**: `852181`

Defined in: [globals/order.ts:562](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L562)

The id of the `scout` order.

***

### Scrollofspeed

> **Scrollofspeed**: `852285`

Defined in: [globals/order.ts:564](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L564)

The id of the Scroll of Speed item's order, which has no order string.

***

### Selfdestruct

> **Selfdestruct**: `852040`

Defined in: [globals/order.ts:566](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L566)

The id of the `selfdestruct` order.

***

### Selfdestructoff

> **Selfdestructoff**: `852042`

Defined in: [globals/order.ts:568](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L568)

The id of the `selfdestructoff` order.

***

### Selfdestructon

> **Selfdestructon**: `852041`

Defined in: [globals/order.ts:570](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L570)

The id of the `selfdestructon` order.

***

### Sentinel

> **Sentinel**: `852182`

Defined in: [globals/order.ts:572](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L572)

The id of the `sentinel` order.

***

### Setrally

> **Setrally**: `851980`

Defined in: [globals/order.ts:574](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L574)

The id of the `setrally` order.

***

### Shadowsight

> **Shadowsight**: `852570`

Defined in: [globals/order.ts:576](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L576)

The id of the `shadowsight` order.

***

### Shadowstrike

> **Shadowstrike**: `852527`

Defined in: [globals/order.ts:578](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L578)

The id of the `shadowstrike` order.

***

### Shockwave

> **Shockwave**: `852125`

Defined in: [globals/order.ts:580](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L580)

The id of the `shockwave` order.

***

### Silence

> **Silence**: `852592`

Defined in: [globals/order.ts:582](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L582)

The id of the `silence` order.

***

### Skillmenu

> **Skillmenu**: `852000`

Defined in: [globals/order.ts:584](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L584)

The id of the order that opens a hero's skill menu, which has no order string.

***

### Sleep

> **Sleep**: `852227`

Defined in: [globals/order.ts:586](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L586)

The id of the `sleep` order.

***

### Slow

> **Slow**: `852075`

Defined in: [globals/order.ts:588](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L588)

The id of the `slow` order.

***

### Slowoff

> **Slowoff**: `852077`

Defined in: [globals/order.ts:590](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L590)

The id of the `slowoff` order.

***

### Slowon

> **Slowon**: `852076`

Defined in: [globals/order.ts:592](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L592)

The id of the `slowon` order.

***

### Smart

> **Smart**: `851971`

Defined in: [globals/order.ts:594](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L594)

The id of the `smart` order, the right-click on a point or a target.

***

### Soulburn

> **Soulburn**: `852668`

Defined in: [globals/order.ts:596](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L596)

The id of the `soulburn` order.

***

### Soulpreservation

> **Soulpreservation**: `852242`

Defined in: [globals/order.ts:598](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L598)

The id of the `soulpreservation` order.

***

### Spellshield

> **Spellshield**: `852571`

Defined in: [globals/order.ts:600](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L600)

The id of the `spellshield` order.

***

### Spellshieldaoe

> **Spellshieldaoe**: `852572`

Defined in: [globals/order.ts:602](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L602)

The id of the `spellshieldaoe` order.

***

### Spellsteal

> **Spellsteal**: `852483`

Defined in: [globals/order.ts:604](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L604)

The id of the `spellsteal` order.

***

### Spellstealoff

> **Spellstealoff**: `852485`

Defined in: [globals/order.ts:606](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L606)

The id of the `spellstealoff` order.

***

### Spellstealon

> **Spellstealon**: `852484`

Defined in: [globals/order.ts:608](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L608)

The id of the `spellstealon` order.

***

### Spies

> **Spies**: `852235`

Defined in: [globals/order.ts:610](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L610)

The id of the `spies` order.

***

### Spiritlink

> **Spiritlink**: `852499`

Defined in: [globals/order.ts:612](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L612)

The id of the `spiritlink` order.

***

### Spiritofvengeance

> **Spiritofvengeance**: `852528`

Defined in: [globals/order.ts:614](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L614)

The id of the `spiritofvengeance` order.

***

### Spirittroll

> **Spirittroll**: `852573`

Defined in: [globals/order.ts:616](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L616)

The id of the `spirittroll` order.

***

### Spiritwolf

> **Spiritwolf**: `852126`

Defined in: [globals/order.ts:618](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L618)

The id of the `spiritwolf` order.

***

### Stampede

> **Stampede**: `852593`

Defined in: [globals/order.ts:620](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L620)

The id of the `stampede` order.

***

### Standdown

> **Standdown**: `852113`

Defined in: [globals/order.ts:622](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L622)

The id of the `standdown` order.

***

### Starfall

> **Starfall**: `852183`

Defined in: [globals/order.ts:624](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L624)

The id of the `starfall` order.

***

### Stasistrap

> **Stasistrap**: `852114`

Defined in: [globals/order.ts:626](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L626)

The id of the `stasistrap` order.

***

### Steal

> **Steal**: `852574`

Defined in: [globals/order.ts:628](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L628)

The id of the `steal` order.

***

### Stomp

> **Stomp**: `852127`

Defined in: [globals/order.ts:630](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L630)

The id of the `stomp` order.

***

### Stoneform

> **Stoneform**: `852206`

Defined in: [globals/order.ts:632](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L632)

The id of the `stoneform` order.

***

### Stop

> **Stop**: `851972`

Defined in: [globals/order.ts:634](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L634)

The id of the `stop` order.

***

### Stunned

> **Stunned**: `851973`

Defined in: [globals/order.ts:636](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L636)

The id of the order the game gives a unit that a spell stuns, which has no order string.

***

### Submerge

> **Submerge**: `852604`

Defined in: [globals/order.ts:638](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L638)

The id of the `submerge` order.

***

### Summonfactory

> **Summonfactory**: `852658`

Defined in: [globals/order.ts:640](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L640)

The id of the `summonfactory` order.

***

### Summongrizzly

> **Summongrizzly**: `852594`

Defined in: [globals/order.ts:642](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L642)

The id of the `summongrizzly` order.

***

### Summonphoenix

> **Summonphoenix**: `852489`

Defined in: [globals/order.ts:644](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L644)

The id of the `summonphoenix` order.

***

### Summonquillbeast

> **Summonquillbeast**: `852595`

Defined in: [globals/order.ts:646](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L646)

The id of the `summonquillbeast` order.

***

### Summonwareagle

> **Summonwareagle**: `852596`

Defined in: [globals/order.ts:648](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L648)

The id of the `summonwareagle` order.

***

### Tankdroppilot

> **Tankdroppilot**: `852079`

Defined in: [globals/order.ts:650](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L650)

The id of the `tankdroppilot` order.

***

### Tankloadpilot

> **Tankloadpilot**: `852080`

Defined in: [globals/order.ts:652](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L652)

The id of the `tankloadpilot` order.

***

### Tankpilot

> **Tankpilot**: `852081`

Defined in: [globals/order.ts:654](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L654)

The id of the `tankpilot` order.

***

### Taunt

> **Taunt**: `852520`

Defined in: [globals/order.ts:656](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L656)

The id of the `taunt` order.

***

### Thunderbolt

> **Thunderbolt**: `852095`

Defined in: [globals/order.ts:658](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L658)

The id of the `thunderbolt` order.

***

### Thunderclap

> **Thunderclap**: `852096`

Defined in: [globals/order.ts:660](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L660)

The id of the `thunderclap` order.

***

### Tornado

> **Tornado**: `852597`

Defined in: [globals/order.ts:662](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L662)

The id of the `tornado` order.

***

### Townbelloff

> **Townbelloff**: `852083`

Defined in: [globals/order.ts:664](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L664)

The id of the `townbelloff` order.

***

### Townbellon

> **Townbellon**: `852082`

Defined in: [globals/order.ts:666](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L666)

The id of the `townbellon` order.

***

### Tranquility

> **Tranquility**: `852184`

Defined in: [globals/order.ts:668](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L668)

The id of the `tranquility` order.

***

### Transmute

> **Transmute**: `852665`

Defined in: [globals/order.ts:670](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L670)

The id of the `transmute` order.

***

### Unavatar

> **Unavatar**: `852087`

Defined in: [globals/order.ts:672](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L672)

The id of the `unavatar` order.

***

### Unavengerform

> **Unavengerform**: `852532`

Defined in: [globals/order.ts:674](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L674)

The id of the `unavengerform` order.

***

### Unbearform

> **Unbearform**: `852139`

Defined in: [globals/order.ts:676](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L676)

The id of the `unbearform` order.

***

### Unburrow

> **Unburrow**: `852534`

Defined in: [globals/order.ts:678](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L678)

The id of the `unburrow` order.

***

### Uncoldarrows

> **Uncoldarrows**: `852245`

Defined in: [globals/order.ts:680](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L680)

The id of the `uncoldarrows` order.

***

### Uncorporealform

> **Uncorporealform**: `852494`

Defined in: [globals/order.ts:682](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L682)

The id of the `uncorporealform` order.

***

### Undeadbuild

> **Undeadbuild**: `851998`

Defined in: [globals/order.ts:684](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L684)

The id of the `undeadbuild` order.

***

### Undefend

> **Undefend**: `852056`

Defined in: [globals/order.ts:686](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L686)

The id of the `undefend` order.

***

### Undivineshield

> **Undivineshield**: `852091`

Defined in: [globals/order.ts:688](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L688)

The id of the `undivineshield` order.

***

### Unetherealform

> **Unetherealform**: `852497`

Defined in: [globals/order.ts:690](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L690)

The id of the `unetherealform` order.

***

### Unflamingarrows

> **Unflamingarrows**: `852175`

Defined in: [globals/order.ts:692](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L692)

The id of the `unflamingarrows` order.

***

### Unflamingattack

> **Unflamingattack**: `852541`

Defined in: [globals/order.ts:694](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L694)

The id of the `unflamingattack` order.

***

### Unholyfrenzy

> **Unholyfrenzy**: `852209`

Defined in: [globals/order.ts:696](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L696)

The id of the `unholyfrenzy` order.

***

### Unimmolation

> **Unimmolation**: `852178`

Defined in: [globals/order.ts:698](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L698)

The id of the `unimmolation` order.

***

### Unload

> **Unload**: `852047`

Defined in: [globals/order.ts:700](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L700)

The id of the `unload` order.

***

### Unloadall

> **Unloadall**: `852048`

Defined in: [globals/order.ts:702](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L702)

The id of the `unloadall` order.

***

### Unloadallcorpses

> **Unloadallcorpses**: `852054`

Defined in: [globals/order.ts:704](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L704)

The id of the `unloadallcorpses` order.

***

### Unloadallinstant

> **Unloadallinstant**: `852049`

Defined in: [globals/order.ts:706](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L706)

The id of the `unloadallinstant` order.

***

### Unpoisonarrows

> **Unpoisonarrows**: `852256`

Defined in: [globals/order.ts:708](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L708)

The id of the `unpoisonarrows` order.

***

### Unravenform

> **Unravenform**: `852156`

Defined in: [globals/order.ts:710](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L710)

The id of the `unravenform` order.

***

### Unrobogoblin

> **Unrobogoblin**: `852657`

Defined in: [globals/order.ts:712](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L712)

The id of the `unrobogoblin` order.

***

### Unroot

> **Unroot**: `852166`

Defined in: [globals/order.ts:714](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L714)

The id of the `unroot` order.

***

### Unstableconcoction

> **Unstableconcoction**: `852500`

Defined in: [globals/order.ts:716](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L716)

The id of the `unstableconcoction` order.

***

### Unstoneform

> **Unstoneform**: `852207`

Defined in: [globals/order.ts:718](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L718)

The id of the `unstoneform` order.

***

### Unsubmerge

> **Unsubmerge**: `852605`

Defined in: [globals/order.ts:720](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L720)

The id of the `unsubmerge` order.

***

### Unsummon

> **Unsummon**: `852210`

Defined in: [globals/order.ts:722](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L722)

The id of the `unsummon` order.

***

### Unwindwalk

> **Unwindwalk**: `852130`

Defined in: [globals/order.ts:724](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L724)

The id of the `unwindwalk` order.

***

### Useslot1

> **Useslot1**: `852008`

Defined in: [globals/order.ts:726](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L726)

The id of the order that uses the item in the unit's first inventory slot (index 0), which has no order string.

***

### Useslot2

> **Useslot2**: `852009`

Defined in: [globals/order.ts:728](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L728)

The id of the order that uses the item in the unit's second inventory slot (index 1), which has no order string.

***

### Useslot3

> **Useslot3**: `852010`

Defined in: [globals/order.ts:730](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L730)

The id of the order that uses the item in the unit's third inventory slot (index 2), which has no order string.

***

### Useslot4

> **Useslot4**: `852011`

Defined in: [globals/order.ts:732](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L732)

The id of the order that uses the item in the unit's fourth inventory slot (index 3), which has no order string.

***

### Useslot5

> **Useslot5**: `852012`

Defined in: [globals/order.ts:734](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L734)

The id of the order that uses the item in the unit's fifth inventory slot (index 4), which has no order string.

***

### Useslot6

> **Useslot6**: `852013`

Defined in: [globals/order.ts:736](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L736)

The id of the order that uses the item in the unit's sixth inventory slot (index 5), which has no order string.

***

### Vengeance

> **Vengeance**: `852521`

Defined in: [globals/order.ts:738](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L738)

The id of the `vengeance` order.

***

### Vengeanceinstant

> **Vengeanceinstant**: `852524`

Defined in: [globals/order.ts:740](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L740)

The id of the `vengeanceinstant` order.

***

### Vengeanceoff

> **Vengeanceoff**: `852523`

Defined in: [globals/order.ts:742](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L742)

The id of the `vengeanceoff` order.

***

### Vengeanceon

> **Vengeanceon**: `852522`

Defined in: [globals/order.ts:744](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L744)

The id of the `vengeanceon` order.

***

### Volcano

> **Volcano**: `852669`

Defined in: [globals/order.ts:746](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L746)

The id of the `volcano` order.

***

### Voodoo

> **Voodoo**: `852503`

Defined in: [globals/order.ts:748](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L748)

The id of the `voodoo` order.

***

### Ward

> **Ward**: `852504`

Defined in: [globals/order.ts:750](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L750)

The id of the `ward` order.

***

### Waterelemental

> **Waterelemental**: `852097`

Defined in: [globals/order.ts:752](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L752)

The id of the `waterelemental` order.

***

### Wateryminion

> **Wateryminion**: `852598`

Defined in: [globals/order.ts:754](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L754)

The id of the `wateryminion` order.

***

### Web

> **Web**: `852211`

Defined in: [globals/order.ts:756](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L756)

The id of the `web` order.

***

### Weboff

> **Weboff**: `852213`

Defined in: [globals/order.ts:758](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L758)

The id of the `weboff` order.

***

### Webon

> **Webon**: `852212`

Defined in: [globals/order.ts:760](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L760)

The id of the `webon` order.

***

### Whirlwind

> **Whirlwind**: `852128`

Defined in: [globals/order.ts:762](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L762)

The id of the `whirlwind` order.

***

### Windwalk

> **Windwalk**: `852129`

Defined in: [globals/order.ts:764](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L764)

The id of the `windwalk` order.

***

### Wispharvest

> **Wispharvest**: `852214`

Defined in: [globals/order.ts:766](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/globals/order.ts#L766)

The id of the `wispharvest` order.
