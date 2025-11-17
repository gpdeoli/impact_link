'use client'

import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { scaleSequential } from 'd3-scale'
import { interpolateYlOrRd } from 'd3-scale-chromatic'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface GeoHeatmapProps {
  data: Record<string, number>
}

// Mapeamento de nomes de países para códigos ISO
const countryNameToCode: Record<string, string> = {
  'United States': 'USA',
  'United Kingdom': 'GBR',
  'Brazil': 'BRA',
  'Canada': 'CAN',
  'Germany': 'DEU',
  'France': 'FRA',
  'Spain': 'ESP',
  'Italy': 'ITA',
  'Netherlands': 'NLD',
  'Belgium': 'BEL',
  'Switzerland': 'CHE',
  'Austria': 'AUT',
  'Sweden': 'SWE',
  'Norway': 'NOR',
  'Denmark': 'DNK',
  'Finland': 'FIN',
  'Poland': 'POL',
  'Portugal': 'PRT',
  'Greece': 'GRC',
  'Ireland': 'IRL',
  'Czech Republic': 'CZE',
  'Hungary': 'HUN',
  'Romania': 'ROU',
  'Bulgaria': 'BGR',
  'Croatia': 'HRV',
  'Slovakia': 'SVK',
  'Slovenia': 'SVN',
  'Lithuania': 'LTU',
  'Latvia': 'LVA',
  'Estonia': 'EST',
  'Luxembourg': 'LUX',
  'Malta': 'MLT',
  'Cyprus': 'CYP',
  'Japan': 'JPN',
  'China': 'CHN',
  'India': 'IND',
  'South Korea': 'KOR',
  'Australia': 'AUS',
  'New Zealand': 'NZL',
  'Singapore': 'SGP',
  'Malaysia': 'MYS',
  'Thailand': 'THA',
  'Indonesia': 'IDN',
  'Philippines': 'PHL',
  'Vietnam': 'VNM',
  'Mexico': 'MEX',
  'Argentina': 'ARG',
  'Chile': 'CHL',
  'Colombia': 'COL',
  'Peru': 'PER',
  'Venezuela': 'VEN',
  'Ecuador': 'ECU',
  'Uruguay': 'URY',
  'Paraguay': 'PRY',
  'Bolivia': 'BOL',
  'South Africa': 'ZAF',
  'Egypt': 'EGY',
  'Nigeria': 'NGA',
  'Kenya': 'KEN',
  'Morocco': 'MAR',
  'Algeria': 'DZA',
  'Tunisia': 'TUN',
  'Israel': 'ISR',
  'Saudi Arabia': 'SAU',
  'United Arab Emirates': 'ARE',
  'Turkey': 'TUR',
  'Russia': 'RUS',
  'Ukraine': 'UKR',
  'Belarus': 'BLR',
  'Kazakhstan': 'KAZ',
  'Uzbekistan': 'UZB',
  'Pakistan': 'PAK',
  'Bangladesh': 'BGD',
  'Sri Lanka': 'LKA',
  'Nepal': 'NPL',
  'Myanmar': 'MMR',
  'Cambodia': 'KHM',
  'Laos': 'LAO',
  'Mongolia': 'MNG',
  'Taiwan': 'TWN',
  'Hong Kong': 'HKG',
  'Macau': 'MAC',
}

export default function GeoHeatmap({ data }: GeoHeatmapProps) {
  const [tooltipContent, setTooltipContent] = useState<{ country: string; clicks: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug: log dos dados recebidos (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('GeoHeatmap data:', data)
      console.log('Países com dados:', Object.keys(data))
      console.log('Valores:', Object.values(data))
    }
  }, [data])

  // Calcular valores máximo e mínimo para escala
  const values = Object.values(data)
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)

  // Criar escala de cores
  const colorScale = scaleSequential(interpolateYlOrRd)
    .domain([minValue, maxValue])

  // Função para obter cliques e cor baseados no país
  const getCountryData = (geo: any): { clicks: number; fillColor: string } => {
    const countryName = geo.properties.NAME || geo.properties.NAME_LONG || geo.properties.NAME_EN
    // geoip-lite retorna códigos de 2 letras (ISO_A2), então priorizamos ISO_A2
    const countryCode = geo.properties.ISO_A2 || geo.properties.ISO_A3
    
    // Procurar dados por código ISO do país (mais confiável)
    let clicks = 0
    
    // Primeiro, tentar por código ISO_A2 (2 letras) - formato do geoip-lite
    if (countryCode) {
      const normalizedCode = countryCode.toUpperCase().trim()
      for (const [country, count] of Object.entries(data)) {
        const normalizedCountry = country.toUpperCase().trim()
        // Match exato por código (2 letras)
        if (normalizedCountry === normalizedCode) {
          clicks = count as number
          break
        }
      }
    }
    
    // Se não encontrou por código, tentar por nome (fallback)
    if (clicks === 0 && countryName) {
      for (const [country, count] of Object.entries(data)) {
        const normalizedCountry = country.toLowerCase().trim()
        const normalizedName = countryName.toLowerCase().trim()
        
        if (
          normalizedCountry === normalizedName ||
          normalizedCountry.includes(normalizedName) ||
          normalizedName.includes(normalizedCountry)
        ) {
          clicks = count as number
          break
        }
      }
    }

    const fillColor = clicks === 0 
      ? '#1a1a1a' // Cor padrão para países sem dados (tema dark)
      : colorScale(clicks)

    return { clicks, fillColor }
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
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.NAME || geo.properties.NAME_LONG || geo.properties.NAME_EN
                const { clicks, fillColor } = getCountryData(geo)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#2a2a2a"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      setTooltipContent({ country: countryName || 'Unknown', clicks })
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
            }
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

