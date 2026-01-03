// Pie chart visualization using real tree calculations
import { sharesOfGeneralFulfillmentMap } from '@playnet/free-association/tree';
import { sampleTree, nodesMap } from './sample-tree-data.js';

// Contributor color mapping
const contributorColors = {
    'alice': '#FF6B6B',
    'bob': '#4ECDC4',
    'carol': '#95E1D3'
};

const contributorNames = {
    'alice': 'Alice',
    'bob': 'Bob',
    'carol': 'Carol'
};

export function createContributorPieChart(containerId) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    // Calculate real recognition shares using the protocol function
    const shares = sharesOfGeneralFulfillmentMap(sampleTree, nodesMap);

    console.log('Calculated recognition shares:', shares);

    // Convert to array format for D3
    const data = Object.entries(shares)
        .map(([id, share]) => ({
            id,
            name: contributorNames[id] || id,
            value: share,
            color: contributorColors[id] || '#ccc'
        }))
        .filter(d => d.value > 0); // Only show contributors with non-zero shares

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie layout
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);

    // Draw pie slices
    const slices = g.selectAll('.slice')
        .data(pie(data))
        .enter().append('g')
        .attr('class', 'slice');

    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.9);

    // Add percentage labels
    slices.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '700')
        .style('fill', '#fff')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
        .text(d => `${(d.data.value * 100).toFixed(1)}%`);

    // Add title
    container.insert('h3', ':first-child')
        .style('text-align', 'center')
        .style('margin-bottom', '1rem')
        .style('color', 'var(--text-dark)')
        .text('Total Recognition Distribution');

    // Add legend below
    const legend = container.append('div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('gap', '2rem')
        .style('margin-top', '1rem');

    data.forEach(d => {
        const item = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '0.5rem');

        item.append('div')
            .style('width', '16px')
            .style('height', '16px')
            .style('background', d.color)
            .style('border-radius', '3px');

        item.append('span')
            .style('font-size', '14px')
            .style('color', 'var(--text-body)')
            .text(`${d.name}: ${(d.value * 100).toFixed(1)}%`);
    });

    // Add explanation
    container.append('div')
        .style('margin-top', '1rem')
        .style('padding', '1rem')
        .style('background', 'rgba(136, 178, 112, 0.08)')
        .style('border-left', '3px solid var(--accent-coral)')
        .style('font-size', '0.95rem')
        .html(`
            <strong>Recognition Calculation:</strong><br>
            Percentages calculated using <code>sharesOfGeneralFulfillmentMap()</code> from the protocol.<br>
            Each contributor's share reflects their weighted contributions across all goals.
        `);
}
