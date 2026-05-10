import { NextRequest, NextResponse } from "next/server";

const COMUNA_POSTAL: Record<string, string> = {
  // Región Metropolitana
  "alhué": "9560000",
  "maría pinto": "9630000",
  "san josé de maipo": "8920000",
  "santiago": "8320000",
  "providencia": "7500000",
  "las condes": "7550000",
  "ñuñoa": "7750000",
  "vitacura": "7630000",
  "lo barnechea": "7690000",
  "la reina": "7780000",
  "peñalolén": "7870000",
  "macul": "7810000",
  "san joaquín": "8940000",
  "la granja": "8950000",
  "la florida": "8240000",
  "puente alto": "8150000",
  "la pintana": "8180000",
  "san bernardo": "8050000",
  "el bosque": "8070000",
  "pedro aguirre cerda": "8400000",
  "lo espejo": "9050000",
  "cerrillos": "9190000",
  "maipú": "9250000",
  "pudahuel": "9020000",
  "quinta normal": "8430000",
  "cerro navia": "9000000",
  "renca": "8660000",
  "quilicura": "8710000",
  "conchalí": "8570000",
  "huechuraba": "8580000",
  "recoleta": "8420000",
  "independencia": "8380000",
  "estación central": "9100000",
  "lo prado": "9160000",
  "san ramón": "8970000",
  "la cisterna": "8900000",
  "san miguel": "8900000",
  "el monte": "9760000",
  "padre hurtado": "9770000",
  "peñaflor": "9800000",
  "lampa": "9260000",
  "colina": "9300000",
  "buin": "9130000",
  "paine": "9120000",
  "pirque": "8910000",
  "calera de tango": "9210000",
  "talagante": "9730000",
  "isla de maipo": "9740000",
  "melipilla": "9580000",
  "curacaví": "9620000",
  "til til": "9360000",
  // Coquimbo (faltantes)
  "canela": "1990000",
  "combarbalá": "1870000",
  "punitaqui": "1900000",
  // Valparaíso (faltantes)
  "la cruz": "2280000",
  // Arica y Parinacota
  "arica": "1000000",
  "camarones": "1040000",
  "putre": "1060000",
  "general lagos": "1080000",
  // Tarapacá
  "iquique": "1100000",
  "alto hospicio": "1110000",
  "pozo almonte": "1130000",
  "pica": "1140000",
  "huara": "1150000",
  "colchane": "1160000",
  "camiña": "1170000",
  // Antofagasta
  "antofagasta": "1240000",
  "mejillones": "1250000",
  "sierra gorda": "1260000",
  "taltal": "1270000",
  "calama": "1390000",
  "san pedro de atacama": "1410000",
  "tocopilla": "1340000",
  "maría elena": "1360000",
  // Atacama
  "copiapó": "1530000",
  "caldera": "1550000",
  "chañaral": "1590000",
  "diego de almagro": "1610000",
  "vallenar": "1660000",
  "alto del carmen": "1680000",
  "freirina": "1700000",
  "huasco": "1720000",
  // Coquimbo
  "la serena": "1700000",
  "coquimbo": "1780000",
  "andacollo": "1760000",
  "la higuera": "1770000",
  "ovalle": "1840000",
  "illapel": "1950000",
  "los vilos": "1970000",
  "salamanca": "1980000",
  "vicuña": "1760000",
  "paihuano": "1790000",
  "monte patria": "1850000",
  // Valparaíso
  "valparaíso": "2340000",
  "viña del mar": "2520000",
  "quilpué": "2430000",
  "villa alemana": "2470000",
  "quillota": "2260000",
  "la calera": "2270000",
  "limache": "2440000",
  "olmué": "2450000",
  "san antonio": "2580000",
  "cartagena": "2590000",
  "el quisco": "2600000",
  "el tabo": "2610000",
  "santo domingo": "2620000",
  "los andes": "1140000",
  "san esteban": "1150000",
  "calle larga": "1160000",
  "rinconada": "1170000",
  "san felipe": "1060000",
  "putaendo": "1070000",
  "santa maría": "1080000",
  "panquehue": "1090000",
  "llaillay": "1100000",
  "catemu": "1110000",
  "casablanca": "2380000",
  "juan fernández": "2640000",
  "isla de pascua": "2770000",
  "petorca": "1020000",
  "la ligua": "1030000",
  "papudo": "1040000",
  "zapallar": "1050000",
  "cabildo": "1060000",
  "hijuelas": "2300000",
  "nogales": "2310000",
  "puchuncaví": "2320000",
  "quintero": "2330000",
  // O'Higgins
  "chépica": "3080000",
  "chimbarongo": "3060000",
  "la estrella": "3160000",
  "lolol": "3090000",
  "malloa": "2940000",
  "marchihue": "3170000",
  "nancagua": "3100000",
  "navidad": "3180000",
  "olivar": "2870000",
  "palmilla": "3110000",
  "paredones": "3190000",
  "peralillo": "3120000",
  "placilla": "3130000",
  "quinta de tilcoco": "2960000",
  "rancagua": "2820000",
  "machalí": "2830000",
  "graneros": "2840000",
  "mostazal": "2850000",
  "codegua": "2860000",
  "coinco": "2870000",
  "coltauco": "2880000",
  "doñihue": "2890000",
  "requínoa": "2900000",
  "rengo": "2910000",
  "san fernando": "3070000",
  "san vicente": "3000000",
  "peumo": "3010000",
  "pichidegua": "3020000",
  "las cabras": "3030000",
  "pichilemu": "3130000",
  "santa cruz": "3070000",
  // Maule
  "colbún": "3700000",
  "curepto": "3540000",
  "empedrado": "3620000",
  "hualañé": "3480000",
  "licantén": "3500000",
  "pelarco": "3520000",
  "pelluhue": "3630000",
  "retiro": "3660000",
  "río claro": "3720000",
  "romeral": "3380000",
  "sagrada familia": "3560000",
  "san clemente": "3570000",
  "san rafael": "3740000",
  "teno": "3400000",
  "villa alegre": "3650000",
  "yerbas buenas": "3670000",
  "talca": "3460000",
  "constitución": "3560000",
  "curicó": "3340000",
  "linares": "3580000",
  "cauquenes": "3600000",
  "parral": "3620000",
  "san javier": "3640000",
  "molina": "3360000",
  "maule": "3540000",
  "longaví": "3660000",
  // Ñuble
  "cobquecura": "3900000",
  "coelemu": "3920000",
  "el carmen": "3810000",
  "ninhue": "3930000",
  "ñiquén": "3940000",
  "pemuco": "3950000",
  "portezuelo": "3960000",
  "ránquil": "3970000",
  "san ignacio": "3830000",
  "san nicolás": "3980000",
  "trehuaco": "3990000",
  "chillán": "3780000",
  "chillán viejo": "3790000",
  "san carlos": "3820000",
  "quirihue": "3860000",
  "bulnes": "3800000",
  "coihueco": "3840000",
  "yungay": "3880000",
  // Biobío
  "concepción": "4030000",
  "talcahuano": "4040000",
  "hualpén": "4060000",
  "coronel": "4190000",
  "lota": "4200000",
  "tomé": "4080000",
  "penco": "4090000",
  "hualqui": "4140000",
  "santa juana": "4160000",
  "florida": "4160000",
  "chiguayante": "4051000",
  "san pedro de la paz": "4130000",
  "los ángeles": "4440000",
  "nacimiento": "4460000",
  "mulchén": "4480000",
  "yumbel": "4500000",
  "lebu": "4360000",
  "cañete": "4380000",
  "los álamos": "4400000",
  "arauco": "4340000",
  "curanilahue": "4420000",
  // La Araucanía
  "cholchol": "4830000",
  "collipulli": "4720000",
  "contulmo": "4410000",
  "curacautín": "4760000",
  "curarrehue": "4960000",
  "ercilla": "4730000",
  "galvarino": "4840000",
  "loncoche": "4970000",
  "lonquimay": "4770000",
  "los sauces": "4740000",
  "lumaco": "4750000",
  "perquenco": "4810000",
  "purén": "4780000",
  "renaico": "4860000",
  "toltén": "5040000",
  "traiguén": "4870000",
  "tirúa": "4430000",
  "tucapel": "4580000",
  "temuco": "4780000",
  "padre las casas": "4790000",
  "lautaro": "4800000",
  "villarrica": "4920000",
  "pucón": "4930000",
  "angol": "4850000",
  "victoria": "4860000",
  "nueva imperial": "4870000",
  "carahue": "4880000",
  "freire": "4910000",
  "pitrufquén": "4960000",
  "cunco": "4940000",
  "melipeuco": "4950000",
  // Los Ríos
  "los lagos": "5190000",
  "máfil": "5210000",
  "valdivia": "5090000",
  "la unión": "5110000",
  "río bueno": "5130000",
  "futrono": "5150000",
  "lago ranco": "5170000",
  "mariquina": "5200000",
  "lanco": "5230000",
  "panguipulli": "5260000",
  "corral": "5280000",
  // Los Lagos
  "chaitén": "5830000",
  "cochamó": "5640000",
  "futaleufú": "5840000",
  "hualaihué": "5660000",
  "palena": "5850000",
  "puerto octay": "5680000",
  "puqueldón": "5760000",
  "puerto montt": "5480000",
  "osorno": "5290000",
  "puerto varas": "5500000",
  "llanquihue": "5520000",
  "frutillar": "5540000",
  "los muermos": "5560000",
  "maullín": "5580000",
  "calbuco": "5600000",
  "ancud": "5700000",
  "castro": "5710000",
  "quellón": "5730000",
  "chonchi": "5760000",
  "río negro": "5620000",
  "purranque": "5660000",
  "fresia": "5680000",
  // Aysén
  "cisnes": "5990000",
  "guaitecas": "6010000",
  "lago verde": "6020000",
  "río ibáñez": "6050000",
  "coyhaique": "5950000",
  "aysén": "5970000",
  "chile chico": "6000000",
  "cochrane": "6020000",
  "puerto natales": "6160000",
  // Chiloé (faltantes)
  "queilén": "5720000",
  "quemchi": "5750000",
  "quinchao": "5770000",
  // Coquimbo (faltantes adicionales)
  "río hurtado": "1880000",
  // O'Higgins (faltantes adicionales)
  "rauco": "3420000",
  // Maule (faltantes adicionales)
  "quillón": "3870000",
  // Los Lagos (faltantes adicionales)
  "san juan de la costa": "5300000",
  // Biobío (faltantes)
  "alto biobío": "4590000",
  "antuco": "4560000",
  "cabrero": "4520000",
  "calera": "2270000",
  "negrete": "4530000",
  "quilaco": "4550000",
  "quilleco": "4570000",
  "san rosendo": "4540000",
  // Atacama (faltantes)
  "tierra amarilla": "1570000",
  // Biobío (faltantes adicionales)
  "san gregorio": "4260000",
  "san pablo": "5310000",
  "san pedro": "4100000",
  "santa bárbara": "4510000",
  // Magallanes
  "laguna blanca": "6230000",
  "primavera": "6240000",
  "río verde": "6250000",
  "timaukel": "6260000",
  "torres del paine": "6270000",
  "punta arenas": "6200000",
  "puerto williams": "6210000",
};

function lookupByComuna(comuna: string): string | null {
  const key = comuna.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "").trim();

  // Buscar con tilde normalizada
  for (const [k, v] of Object.entries(COMUNA_POSTAL)) {
    const kNorm = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (kNorm === key) return v;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const calle  = searchParams.get("calle")  ?? "";
  const numero = searchParams.get("numero") ?? "";
  const comuna = searchParams.get("comuna") ?? "";

  if (!calle || !numero || !comuna) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // 1. Intentar Nominatim
  try {
    const q = encodeURIComponent(`${calle} ${numero}, ${comuna}, Chile`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=1&countrycodes=cl`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MochiDrop/1.0 (contacto@mochidrop.cl)",
        "Accept-Language": "es",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const postcode = data?.[0]?.address?.postcode ?? null;
      if (postcode) {
        console.log(`[geocode] Nominatim OK — ${comuna} → ${postcode}`);
        return NextResponse.json({ postcode, source: "nominatim" });
      }
    }
  } catch (err) {
    console.warn("[geocode] Nominatim falló, usando fallback:", err);
  }

  // 2. Fallback: mapa hardcodeado por comuna
  const postcode = lookupByComuna(comuna);
  if (postcode) {
    console.log(`[geocode] Fallback hardcodeado — ${comuna} → ${postcode}`);
    return NextResponse.json({ postcode, source: "fallback" });
  }

  // 3. No encontrado en ninguna fuente
  console.warn(`[geocode] Sin código postal para comuna: ${comuna}`);
  return NextResponse.json({ postcode: null, source: "none" });
}
