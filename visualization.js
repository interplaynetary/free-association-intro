// Goal-Priority Tree Visualization
function createGoalPriorityTree(containerId) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    // Color palette - more diverse colors for goals
    const contributorColors = {
        'Alice': '#FF6B6B',
        'Bob': '#4ECDC4',
        'Carol': '#95E1D3'
    };

    const goalColors = ['#88B270', '#E07A5F', '#4ECDC4', '#F4A261', '#81B29A', '#E76F51'];

    // Build tree data with colors assigned
    function buildNode(name, value, color, children = null, contributors = null) {
        const node = { name, value, color };
        if (children) node.children = children;
        if (contributors) node.contributors = contributors;
        return node;
    }

    const goalData = buildNode("Total", 100, null, [
        buildNode("Health", 40, goalColors[0], [
            buildNode("Exercise", 60, goalColors[0], null, [
                { name: 'Alice', share: 70 },
                { name: 'Bob', share: 30 }
            ]),
            buildNode("Nutrition", 40, goalColors[0], null, [
                { name: 'Alice', share: 50 },
                { name: 'Carol', share: 50 }
            ])
        ]),
        buildNode("Education", 35, goalColors[1], null, [
            { name: 'Bob', share: 60 },
            { name: 'Carol', share: 40 }
        ]),
        buildNode("Community", 25, goalColors[2], null, [
            { name: 'Alice', share: 40 },
            { name: 'Bob', share: 30 },
            { name: 'Carol', share: 30 }
        ])
    ]);

    // Responsive sizing
    const containerWidth = container.node().offsetWidth;
    const width = Math.min(containerWidth, 900);
    const height = 700;
    const legendHeight = 60;
    const margin = { top: 200, right: 40, bottom: 80, left: 40 };

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', height + legendHeight)
        .attr('viewBox', `0 0 ${width} ${height + legendHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(0, ${margin.top})`);

    // Tree layout (vertical) with better spacing
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const tree = d3.tree()
        .size([innerWidth, innerHeight])
        .separation((a, b) => {
            if (a.parent === b.parent) {
                return 1.2;
            }
            return 1.5;
        });

    const root = d3.hierarchy(goalData);
    tree(root);

    // Calculate actual bounds of the tree
    let minX = Infinity, maxX = -Infinity;
    root.descendants().forEach(d => {
        if (d.x < minX) minX = d.x;
        if (d.x > maxX) maxX = d.x;
    });

    // Center the tree by offsetting to middle of container
    const treeWidth = maxX - minX;
    const offsetX = (width - treeWidth) / 2 - minX;

    const MAX_BAR_WIDTH = 160;
    const MIN_BAR_WIDTH = 20;
    const barHeight = 36;

    // Calculate proportional bar widths for each node
    function calculateBarWidths(node, parentWidth = MAX_BAR_WIDTH) {
        // Root node gets full width
        if (!node.parent) {
            node.barWidth = MAX_BAR_WIDTH;
        } else {
            // Calculate parent's total points
            const parentTotalPoints = node.parent.children
                .reduce((sum, child) => sum + child.data.value, 0);

            // This node's width is proportional to its share of parent
            const proportionalWidth = parentWidth * (node.data.value / parentTotalPoints);

            // Apply minimum width constraint
            node.barWidth = Math.max(proportionalWidth, MIN_BAR_WIDTH);
        }

        // Recursively calculate for children
        if (node.children) {
            node.children.forEach(child =>
                calculateBarWidths(child, node.barWidth)
            );
        }
    }

    // Calculate bar widths for all nodes
    calculateBarWidths(root);

    // Calculate slice positions for each node with children
    root.descendants().forEach(node => {
        if (node.children && node.children.length > 0) {
            const nodeBarWidth = node.barWidth || MAX_BAR_WIDTH;
            let cumulativeValue = 0;

            node.children.forEach(child => {
                const childValue = child.data.value;
                const sliceStart = cumulativeValue;
                const sliceEnd = cumulativeValue + childValue;
                const sliceCenter = (sliceStart + sliceEnd) / 2;

                // Store the x position of this child's slice in the parent
                // Use parent's actual width for calculation
                child.parentSliceX = (sliceCenter / 100) * nodeBarWidth - nodeBarWidth / 2;

                cumulativeValue += childValue;
            });
        }
    });

    // Draw custom links from parent slice positions
    g.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('d', d => {
            const sourceX = d.source.x + offsetX + (d.target.parentSliceX || 0);
            const sourceY = d.source.y + barHeight / 2;
            const targetX = d.target.x + offsetX;
            const targetY = d.target.y - barHeight / 2;

            // Create curved path from parent slice to child
            const midY = (sourceY + targetY) / 2;
            return `M ${sourceX},${sourceY} 
                    C ${sourceX},${midY} 
                      ${targetX},${midY} 
                      ${targetX},${targetY}`;
        })
        .attr('fill', 'none')
        .attr('stroke', d => d.target.data.color || 'rgba(136, 178, 112, 0.3)')
        .attr('stroke-width', 2)
        .attr('opacity', 0.6);

    // Draw nodes
    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x + offsetX},${d.y})`);

    // Create bars for each node
    nodes.each(function (d) {
        const node = d3.select(this);
        const barWidth = d.barWidth || MAX_BAR_WIDTH;  // Use calculated proportional width

        if (d.data.contributors) {
            // Leaf node with contributors - stacked bar
            let cumulativeX = 0;
            d.data.contributors.forEach(contributor => {
                const segmentWidth = (contributor.share / 100) * barWidth;
                node.append('rect')
                    .attr('x', -barWidth / 2 + cumulativeX)
                    .attr('y', -barHeight / 2)
                    .attr('width', segmentWidth)
                    .attr('height', barHeight)
                    .attr('fill', contributorColors[contributor.name])
                    .attr('opacity', 0.9)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5);

                cumulativeX += segmentWidth;
            });

            // Colored border box matching parent
            if (d.data.color) {
                node.append('rect')
                    .attr('x', -barWidth / 2 - 4)
                    .attr('y', -barHeight / 2 - 4)
                    .attr('width', barWidth + 8)
                    .attr('height', barHeight + 8)
                    .attr('fill', 'none')
                    .attr('stroke', d.data.color)
                    .attr('stroke-width', 3)
                    .attr('rx', 3);
            }
        } else if (d.children) {
            // Node with children - show proportions as colored segments
            let cumulativeX = 0;
            d.children.forEach(child => {
                const segmentWidth = (child.data.value / 100) * barWidth;

                node.append('rect')
                    .attr('x', -barWidth / 2 + cumulativeX)
                    .attr('y', -barHeight / 2)
                    .attr('width', segmentWidth)
                    .attr('height', barHeight)
                    .attr('fill', child.data.color || 'var(--bg-green)')
                    .attr('opacity', 0.75)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5);

                cumulativeX += segmentWidth;
            });

            // Colored border for non-root nodes
            if (d.data.color && d.parent) {
                node.append('rect')
                    .attr('x', -barWidth / 2 - 4)
                    .attr('y', -barHeight / 2 - 4)
                    .attr('width', barWidth + 8)
                    .attr('height', barHeight + 8)
                    .attr('fill', 'none')
                    .attr('stroke', d.parent.data.color || d.data.color)
                    .attr('stroke-width', 3)
                    .attr('rx', 3);
            }
        }
    });

    // Add labels to nodes
    nodes.each(function (d) {
        const node = d3.select(this);
        const isRoot = !d.parent;
        const isLeaf = !d.children && d.data.contributors;
        const isGoal = d.children;

        // Node Name (Above)
        node.append('text')
            .attr('y', -barHeight / 2 - 8)
            .attr('text-anchor', 'middle')
            .style('font-family', 'var(--font-sans)')
            .style('font-size', '14px')
            .style('font-weight', '700')
            .style('fill', 'var(--text-dark)')
            .style('text-shadow', '0 2px 4px rgba(255,255,255,0.9)')
            .text(d.data.name);

        // Node Type (Below)
        let typeLabel = "";
        let typeColor = "var(--text-light)";

        if (isRoot) {
            typeLabel = "ROOT PRIORITY";
            typeColor = "var(--text-dark)";
        } else if (isGoal) {
            typeLabel = "GOAL";
            typeColor = "#88B270"; // Greenish
        } else if (isLeaf) {
            typeLabel = "CONTRIBUTION";
            typeColor = "#E07A5F"; // Coral-ish
        }

        node.append('text')
            .attr('y', barHeight / 2 + 14)
            .attr('text-anchor', 'middle')
            .style('font-family', 'var(--font-sans)')
            .style('font-size', '10px')
            .style('font-weight', '600')
            .style('letter-spacing', '0.05em')
            .style('fill', typeColor)
            .text(typeLabel);
    });

    // Add pie chart above the root node
    const pieRadius = 60;
    const pieY = -120; // Position above the root
    const rootX = root.x + offsetX; // Center pie chart with root node

    // Calculate recognition shares (simplified for visualization)
    const contributorShares = {
        'Alice': 0,
        'Bob': 0,
        'Carol': 0
    };

    // Sum up all contributor shares from the tree
    root.descendants().forEach(node => {
        if (node.data.contributors) {
            const nodeWeight = node.data.value / 100; // Simplified weight
            node.data.contributors.forEach(c => {
                const share = (c.share / 100) * nodeWeight;
                contributorShares[c.name] = (contributorShares[c.name] || 0) + share;
            });
        }
    });

    // Normalize shares to sum to 1
    const totalShares = Object.values(contributorShares).reduce((sum, val) => sum + val, 0);
    const normalizedShares = Object.entries(contributorShares)
        .map(([name, share]) => ({
            name,
            value: totalShares > 0 ? share / totalShares : 0,
            color: contributorColors[name]
        }))
        .filter(d => d.value > 0);

    // Create pie layout
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(pieRadius);

    // Draw pie chart
    const pieGroup = g.append('g')
        .attr('transform', `translate(${rootX}, ${pieY})`);

    const slices = pieGroup.selectAll('.pie-slice')
        .data(pie(normalizedShares))
        .enter().append('g')
        .attr('class', 'pie-slice');

    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.9);

    // Add percentage labels
    slices.append('text')
        .attr('transform', d => {
            const [x, y] = arc.centroid(d);
            return `translate(${x * 0.7}, ${y * 0.7})`;
        })
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '700')
        .style('fill', '#fff')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
        .text(d => `${(d.data.value * 100).toFixed(0)}%`);

    // Add title above pie
    pieGroup.append('text')
        .attr('y', -pieRadius - 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '700')
        .style('fill', 'var(--text-dark)')
        .text('Recognition of Contribution to Priorities in General');

    // Add legend at bottom
    const legend = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height + 20})`);

    legend.append('text')
        .attr('x', -180)
        .attr('y', 0)
        .style('font-size', '13px')
        .style('font-weight', '700')
        .style('fill', 'var(--text-dark)')
        .text('Contributors:');

    const contributors = Object.keys(contributorColors);
    contributors.forEach((name, i) => {
        const x = -100 + (i * 80);

        legend.append('rect')
            .attr('x', x)
            .attr('y', -8)
            .attr('width', 14)
            .attr('height', 14)
            .attr('fill', contributorColors[name])
            .attr('rx', 2);

        legend.append('text')
            .attr('x', x + 20)
            .attr('y', 3)
            .style('font-size', '12px')
            .style('fill', 'var(--text-body)')
            .text(name);
    });

    // Add explanation
    container.append('div')
        .style('margin-top', '1rem')
        .style('padding', '1rem')
        .style('background', 'rgba(136, 178, 112, 0.08)')
        .style('border-left', '3px solid var(--accent-coral)')
        .style('font-size', '0.95rem')
        .html(`
            <strong>Tree Anatomy:</strong><br>
            <strong>Goals (Branches):</strong> Abstract structural nodes. They don't do work; they organize it. Their fulfillment is the weighted average of their children.<br>
            <strong>Contributions (Leaves):</strong> When a node has a contributor, it becomes a contribution. This is where actual work is done and recognition meets capacity.<br>
            <br>
            <strong>Reading the Graph:</strong><br>
            • <strong>Width</strong> = Relative Weight (Importance)<br>
            • <strong>Pie Chart</strong> = Total Recognition Share (Aggregated from all leaves)<br>
            • <strong>Links</strong> = Flow of priority from goal to sub-goal
        `);
}
