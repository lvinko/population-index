'use client'
import React from 'react';
import { BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { Grid } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { RegionData } from '@/types/population';
import { LegendOrdinal } from '@visx/legend';

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'var(--background)',
  color: 'var(--foreground)',
  stroke: 'var(--foreground)',
};

const colorRange = [
  '#6c5efb', // Original
  '#9e6fff', // Lightened and shifted
  '#c998ff', // Existing light lavender
  '#7b3cff', // Deepened purple-blue
  '#a55fed', // Lightened magenta-purple
  '#b589ff', // Soft purple
  '#8c4bff', // Vivid purple
  '#5f3fbb', // Dark purple
  '#9f7aea', // Existing lavender
  '#6d28d9', // Dark violet
  '#7e3af2', // Vibrant medium purple
  '#a78bfa', // Softened lavender
  '#c4b5fd', // Pale lavender
  '#4c1d95', // Deep violet-blue
  '#9333ea', // Bright purple
  '#805ad5', // Medium lavender
  '#b589d9', // Lighter purple shade
  '#6b46c1', // Deep lavender
  '#7c3aed', // Vivid lavender
  '#a44afe', // Medium violet
  '#9747FF', // Medium blue-purple
  '#6B21A8', // Dark indigo purple
  '#5b21b6', // Dark purple
  '#8b5cf6', // Soft vibrant purple
  '#553c9a'  // Darker violet
];

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
    range: colorRange,
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
            stroke="var(--foreground)"
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
                    fill={colorScale(barStack.key)}
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
            stroke="var(--foreground)"
            tickStroke="var(--foreground)"
            tickLabelProps={{
              fill: 'var(--foreground)',
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
            }}
          />
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="var(--foreground)"
            tickStroke="var(--foreground)"
            tickLabelProps={{
              fill: 'var(--foreground)',
              fontSize: 11,
              textAnchor: 'middle',
            }}
          />
        </Group>
      </svg>
      <div
        style={{
          position: 'absolute',
          top: margin.top / 2 - 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '10px',
        }}
      >
        <div className='overflow-x-auto'>
          <LegendOrdinal scale={colorScale} direction="row" labelMargin="0 15px 0 0" />
        </div>
      </div>
      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop ? tooltipTop - 100 : 0}
          left={tooltipLeft ? tooltipLeft - 20 : 0}
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