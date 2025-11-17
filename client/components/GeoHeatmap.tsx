'use client'

import { useState, useEffect, useMemo } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { scaleSequential } from 'd3-scale'
import { interpolateYlOrRd } from 'd3-scale-chromatic'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface GeoHeatmapProps {
  data: Record<string, number>
}

// Mapeamento de códigos ISO 3166-1 alpha-2 (2 letras) para alpha-3 (3 letras)
// geoip-lite retorna códigos de 2 letras, mas o mapa usa códigos de 3 letras
const alpha2ToAlpha3: Record<string, string> = {
  'AD': 'AND', 'AE': 'ARE', 'AF': 'AFG', 'AG': 'ATG', 'AI': 'AIA', 'AL': 'ALB', 'AM': 'ARM',
  'AO': 'AGO', 'AQ': 'ATA', 'AR': 'ARG', 'AS': 'ASM', 'AT': 'AUT', 'AU': 'AUS', 'AW': 'ABW',
  'AX': 'ALA', 'AZ': 'AZE', 'BA': 'BIH', 'BB': 'BRB', 'BD': 'BGD', 'BE': 'BEL', 'BF': 'BFA',
  'BG': 'BGR', 'BH': 'BHR', 'BI': 'BDI', 'BJ': 'BEN', 'BL': 'BLM', 'BM': 'BMU', 'BN': 'BRN',
  'BO': 'BOL', 'BQ': 'BES', 'BR': 'BRA', 'BS': 'BHS', 'BT': 'BTN', 'BV': 'BVT', 'BW': 'BWA',
  'BY': 'BLR', 'BZ': 'BLZ', 'CA': 'CAN', 'CC': 'CCK', 'CD': 'COD', 'CF': 'CAF', 'CG': 'COG',
  'CH': 'CHE', 'CI': 'CIV', 'CK': 'COK', 'CL': 'CHL', 'CM': 'CMR', 'CN': 'CHN', 'CO': 'COL',
  'CR': 'CRI', 'CU': 'CUB', 'CV': 'CPV', 'CW': 'CUW', 'CX': 'CXR', 'CY': 'CYP', 'CZ': 'CZE',
  'DE': 'DEU', 'DJ': 'DJI', 'DK': 'DNK', 'DM': 'DMA', 'DO': 'DOM', 'DZ': 'DZA', 'EC': 'ECU',
  'EE': 'EST', 'EG': 'EGY', 'EH': 'ESH', 'ER': 'ERI', 'ES': 'ESP', 'ET': 'ETH', 'FI': 'FIN',
  'FJ': 'FJI', 'FK': 'FLK', 'FM': 'FSM', 'FO': 'FRO', 'FR': 'FRA', 'GA': 'GAB', 'GB': 'GBR',
  'GD': 'GRD', 'GE': 'GEO', 'GF': 'GUF', 'GG': 'GGY', 'GH': 'GHA', 'GI': 'GIB', 'GL': 'GRL',
  'GM': 'GMB', 'GN': 'GIN', 'GP': 'GLP', 'GQ': 'GNQ', 'GR': 'GRC', 'GS': 'SGS', 'GT': 'GTM',
  'GU': 'GUM', 'GW': 'GNB', 'GY': 'GUY', 'HK': 'HKG', 'HM': 'HMD', 'HN': 'HND', 'HR': 'HRV',
  'HT': 'HTI', 'HU': 'HUN', 'ID': 'IDN', 'IE': 'IRL', 'IL': 'ISR', 'IM': 'IMN', 'IN': 'IND',
  'IO': 'IOT', 'IQ': 'IRQ', 'IR': 'IRN', 'IS': 'ISL', 'IT': 'ITA', 'JE': 'JEY', 'JM': 'JAM',
  'JO': 'JOR', 'JP': 'JPN', 'KE': 'KEN', 'KG': 'KGZ', 'KH': 'KHM', 'KI': 'KIR', 'KM': 'COM',
  'KN': 'KNA', 'KP': 'PRK', 'KR': 'KOR', 'KW': 'KWT', 'KY': 'CYM', 'KZ': 'KAZ', 'LA': 'LAO',
  'LB': 'LBN', 'LC': 'LCA', 'LI': 'LIE', 'LK': 'LKA', 'LR': 'LBR', 'LS': 'LSO', 'LT': 'LTU',
  'LU': 'LUX', 'LV': 'LVA', 'LY': 'LBY', 'MA': 'MAR', 'MC': 'MCO', 'MD': 'MDA', 'ME': 'MNE',
  'MF': 'MAF', 'MG': 'MDG', 'MH': 'MHL', 'MK': 'MKD', 'ML': 'MLI', 'MM': 'MMR', 'MN': 'MNG',
  'MO': 'MAC', 'MP': 'MNP', 'MQ': 'MTQ', 'MR': 'MRT', 'MS': 'MSR', 'MT': 'MLT', 'MU': 'MUS',
  'MV': 'MDV', 'MW': 'MWI', 'MX': 'MEX', 'MY': 'MYS', 'MZ': 'MOZ', 'NA': 'NAM', 'NC': 'NCL',
  'NE': 'NER', 'NF': 'NFK', 'NG': 'NGA', 'NI': 'NIC', 'NL': 'NLD', 'NO': 'NOR', 'NP': 'NPL',
  'NR': 'NRU', 'NU': 'NIU', 'NZ': 'NZL', 'OM': 'OMN', 'PA': 'PAN', 'PE': 'PER', 'PF': 'PYF',
  'PG': 'PNG', 'PH': 'PHL', 'PK': 'PAK', 'PL': 'POL', 'PM': 'SPM', 'PN': 'PCN', 'PR': 'PRI',
  'PS': 'PSE', 'PT': 'PRT', 'PW': 'PLW', 'PY': 'PRY', 'QA': 'QAT', 'RE': 'REU', 'RO': 'ROU',
  'RS': 'SRB', 'RU': 'RUS', 'RW': 'RWA', 'SA': 'SAU', 'SB': 'SLB', 'SC': 'SYC', 'SD': 'SDN',
  'SE': 'SWE', 'SG': 'SGP', 'SH': 'SHN', 'SI': 'SVN', 'SJ': 'SJM', 'SK': 'SVK', 'SL': 'SLE',
  'SM': 'SMR', 'SN': 'SEN', 'SO': 'SOM', 'SR': 'SUR', 'SS': 'SSD', 'ST': 'STP', 'SV': 'SLV',
  'SX': 'SXM', 'SY': 'SYR', 'SZ': 'SWZ', 'TC': 'TCA', 'TD': 'TCD', 'TF': 'ATF', 'TG': 'TGO',
  'TH': 'THA', 'TJ': 'TJK', 'TK': 'TKL', 'TL': 'TLS', 'TM': 'TKM', 'TN': 'TUN', 'TO': 'TON',
  'TR': 'TUR', 'TT': 'TTO', 'TV': 'TUV', 'TW': 'TWN', 'TZ': 'TZA', 'UA': 'UKR', 'UG': 'UGA',
  'UM': 'UMI', 'US': 'USA', 'UY': 'URY', 'UZ': 'UZB', 'VA': 'VAT', 'VC': 'VCT', 'VE': 'VEN',
  'VG': 'VGB', 'VI': 'VIR', 'VN': 'VNM', 'VU': 'VUT', 'WF': 'WLF', 'WS': 'WSM', 'YE': 'YEM',
  'YT': 'MYT', 'ZA': 'ZAF', 'ZM': 'ZMB', 'ZW': 'ZWE'
}

export default function GeoHeatmap({ data }: GeoHeatmapProps) {
  const [tooltipContent, setTooltipContent] = useState<{ country: string; clicks: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcular valores máximo e mínimo para escala
  const values = Object.values(data || {})
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)

  // Criar escala de cores
  const colorScale = scaleSequential(interpolateYlOrRd)
    .domain([minValue, maxValue])

  // Criar um Map para lookup rápido dos dados (código de 3 letras -> cliques)
  // Converter códigos de 2 letras (do geoip-lite) para 3 letras (do mapa)
  // Usar useMemo para recriar apenas quando data mudar
  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    if (data) {
      Object.entries(data).forEach(([code, count]) => {
        const normalizedCode = code.toUpperCase().trim()
        // Converter código de 2 letras para 3 letras se necessário
        const alpha3Code = alpha2ToAlpha3[normalizedCode] || normalizedCode
        map.set(alpha3Code, count as number)
        if (process.env.NODE_ENV === 'development') {
          console.log(`DataMap: ${normalizedCode} (2 letras) -> ${alpha3Code} (3 letras) = ${count}`)
        }
      })
    }
    return map
  }, [data])

  // Debug: log dos dados recebidos (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('GeoHeatmap data:', data)
      console.log('Países com dados:', Object.keys(data || {}))
      console.log('Valores:', Object.values(data || {}))
      console.log('DataMap size:', dataMap.size)
      console.log('DataMap entries:', Array.from(dataMap.entries()))
    }
  }, [data, dataMap])

  // Função para obter cliques e cor baseados no país
  const getCountryData = (geo: any): { clicks: number; fillColor: string; countryName: string } => {
    // Tentar diferentes propriedades para nome do país
    const countryName = geo.properties.NAME || 
                       geo.properties.NAME_LONG || 
                       geo.properties.NAME_EN || 
                       geo.properties.NAME_SORT ||
                       'Unknown'
    
    // O mapa world-atlas usa ISO_A3 (código de 3 letras) ou ADM0_A3
    // Priorizar ISO_A3, depois ADM0_A3
    const countryCode = geo.properties.ISO_A3 || 
                       geo.properties.ADM0_A3 ||
                       geo.properties.ISO_A3_EH ||
                       null
    
    // Procurar dados por código ISO do país (código de 3 letras)
    let clicks = 0
    
    if (countryCode) {
      const normalizedCode = countryCode.toUpperCase().trim()
      clicks = dataMap.get(normalizedCode) || 0
      
      // Debug detalhado
      if (process.env.NODE_ENV === 'development') {
        if (clicks > 0) {
          console.log(`✅ Match encontrado: ${countryName} (${normalizedCode}) = ${clicks} cliques`)
        }
      }
    }

    const fillColor = clicks === 0 
      ? '#1a1a1a' // Cor padrão para países sem dados (tema dark)
      : colorScale(clicks)

    return { clicks, fillColor, countryName }
  }

  // Não renderizar até que o componente esteja montado (evita problemas de SSR)
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando mapa...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: '500px' }}>
      <ComposableMap
        projectionConfig={{
          scale: 147,
          center: [0, 20]
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) => {
              
              return geographies.map((geo) => {
                const { clicks, fillColor, countryName } = getCountryData(geo)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#2a2a2a"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (process.env.NODE_ENV === 'development') {
                        const code = geo.properties.ISO_A3 || geo.properties.ADM0_A3 || 'undefined'
                        console.log(`Hover: ${countryName} - Código (3 letras): ${code} - Clicks: ${clicks}`)
                      }
                      setTooltipContent({ country: countryName, clicks })
                    }}
                    onMouseLeave={() => {
                      setTooltipContent(null)
                    }}
                    style={{
                      default: {
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      hover: {
                        fill: fillColor === '#1a1a1a' ? '#3a3a3a' : fillColor,
                        outline: 'none',
                        stroke: '#6a6a6a',
                        strokeWidth: 1.5,
                        cursor: 'pointer',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                  />
                )
              })
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Tooltip */}
      {tooltipContent && (
        <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
          <p className="font-semibold text-foreground">{tooltipContent.country}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {tooltipContent.clicks} {tooltipContent.clicks === 1 ? 'clique' : 'cliques'}
          </p>
        </div>
      )}
    </div>
  )
}

