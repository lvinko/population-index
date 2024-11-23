import React from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { Arc } from '@visx/shape';
import { Text } from '@visx/text';
import { useTooltip, Tooltip } from '@visx/tooltip';
import { PopulationData } from '@/types/population';

interface RadialBarsProps {
  width?: number;
  height?: number;
  data: PopulationData;
}

const defaultMargin = {
  top: 40,
  left: 40,
  right: 40,
  bottom: 40,
};

export default function RadialBars({
  width = 600,
  height = 600,
  data,
}: RadialBarsProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{
    name: string;
    label: string;
    value: number;
  }>();

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - Math.max(...Object.values(defaultMargin));

  // Get the most recent year's data
  const mostRecentYear = 2022;
  const filteredYear = data
    .find(d => d.year === mostRecentYear)

  // Filter out regions with no total population
  const regions = filteredYear?.regions.filter(r => {
    const totalPop = r.dataset.population.find(p => p.type === 'total')
    return totalPop?.value ?? 0 > 0
  }) ?? []

  if (regions.length === 0) {
    return null;
  }

  // Scales
  const radiusScale = scaleLinear({
    range: [0, radius],
    domain: [0, Math.max(...regions.map(r => {
      const totalPop = r.dataset.population.find(p => p.type === 'total');
      return totalPop?.value ?? 0;
    }))],
    nice: true,
  });

  const angleScale = scaleLinear({
    range: [0, 2 * Math.PI],
    domain: [0, regions.length],
  });

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group top={centerY} left={centerX}>
          {regions.map((region, i) => {
            const angle = angleScale(i);
            const barWidth = (2 * Math.PI) / regions.length;

            return (
              <React.Fragment key={region.name}>
                <Arc
                  data={region}
                  innerRadius={0}
                  outerRadius={radiusScale(region.dataset.population.find(p => p.type === 'total')?.value ?? 0)}
                  fill={`hsl(${(i / regions.length) * 360}, 70%, 50%)`}
                  startAngle={angle - barWidth / 2}
                  endAngle={angle + barWidth / 2}
                  stroke="white"
                  strokeWidth={1}
                  onMouseMove={(event) => {
                    const point = {
                      x: event.clientX,
                      y: event.clientY,
                    };
                    showTooltip({
                      tooltipData: {
                        ...region,
                        value: region.dataset.population.find(p => p.type === 'total')?.value ?? 0
                      },
                      tooltipLeft: point.x,
                      tooltipTop: point.y,
                    });
                  }}
                  onMouseLeave={() => hideTooltip()}
                />

                {/* Add labels */}
                <Text
                  x={Math.cos(angle) * (radius + 20)}
                  y={Math.sin(angle) * (radius + 20)}
                  fontSize={10}
                  textAnchor="middle"
                  transform={`rotate(${(angle * 180) / Math.PI - 90}, 
                    ${Math.cos(angle) * (radius + 20)}, 
                    ${Math.sin(angle) * (radius + 20)})`}
                >
                  {region.label}
                </Text>
              </React.Fragment>
            );
          })}
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            position: 'fixed',
            backgroundColor: '#556677',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            padding: '0.5rem',
            borderRadius: '4px',
            color: 'rgba(100, 123, 193, 0.5)',
          }}
        >
          <div>
            <strong>{tooltipData.label}</strong>
            <div>Населення: {tooltipData.value.toLocaleString()}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
}