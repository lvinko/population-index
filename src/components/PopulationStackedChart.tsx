'use client'
import React from 'react';
import { BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { Grid } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
};

// Define proper types for the data
interface RegionData {
  year: string;
  name: string;
  total: number;
}

const purple1 = '#6c5efb';
const purple2 = '#c998ff';
const purple3 = '#a44afe';

export type BarStackProps = {
  width: number;
  height: number;
  data: RegionData[];
  margin?: { top: number; right: number; bottom: number; left: number };
};

const defaultMargin = { top: 40, right: 0, bottom: 0, left: 200 };

const PopulationStackedChart = ({
  width,
  height,
  data,
  margin = defaultMargin,
}: BarStackProps) => {
  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip();

  // Prepare the data
  const years = Array.from(new Set(data.map(d => d.year))).sort();
  const regions = Array.from(new Set(data.map(d => d.name)));

  // Format data for stacking
  const formattedData = years.map(year => {
    const yearData: Record<string, string | number> = { year };
    regions.forEach(region => {
      const regionData = data.find(d => d.year === year && d.name === region);
      yearData[region] = regionData ? regionData.total : 0;
    });
    return yearData;
  });

  // Bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Scales
  const xScale = scaleBand<string>({
    domain: years,
    range: [0, xMax],
    padding: 0.2,
  });

  const yScale = scaleLinear<number>({
    domain: [0, Math.max(...formattedData.map(d =>
      regions.reduce((sum: number, region: string) => sum + (d[region] as number || 0), 0)
    ))],
    range: [yMax, 0],
    nice: true,
  });

  const colorScale = scaleOrdinal<string, string>({
    domain: regions,
    range: [purple1, purple2, purple3],
  });

  // Add proper typing for tooltip data
  interface TooltipData {
    region: string;
    value: number;
    year: string;
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            strokeDasharray="1,3"
            stroke="rgba(255,255,255,0.2)"
          />
          <BarStack
            data={formattedData}
            keys={regions}
            x={d => d.year as string}
            xScale={xScale}
            yScale={yScale}
            color={colorScale}
          >
            {barStacks =>
              barStacks.map(barStack =>
                barStack.bars.map(bar => (
                  <rect
                    key={`bar-stack-${barStack.key}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    height={bar.height}
                    width={bar.width}
                    fill={bar.color}
                    onMouseLeave={() => hideTooltip()}
                    onMouseMove={(event) => {
                      const tooltip = {
                        region: barStack.key,
                        value: bar.bar.data[barStack.key],
                        year: bar.bar.data.year,
                      };
                      showTooltip({
                        tooltipData: tooltip,
                        tooltipTop: event.clientY,
                        tooltipLeft: event.clientX,
                      });
                    }}
                  />
                )),
              )
            }
          </BarStack>
          <AxisLeft
            scale={yScale}
            stroke={'#fff'}
            tickStroke={'#fff'}
            tickLabelProps={{
              fill: '#fff',
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
            }}
          />
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke={'#fff'}
            tickStroke={'#fff'}
            tickLabelProps={{
              fill: '#fff',
              fontSize: 11,
              textAnchor: 'middle',
            }}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div style={{ color: colorScale((tooltipData as TooltipData).region) }}>
            <strong>{(tooltipData as TooltipData).region}</strong>
          </div>
          <div>Year: {(tooltipData as TooltipData).year}</div>
          <div>Population: {(tooltipData as TooltipData).value.toLocaleString()}</div>
        </Tooltip>
      )}
    </div>
  );
};

export default PopulationStackedChart; 