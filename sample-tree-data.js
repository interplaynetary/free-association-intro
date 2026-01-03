// Sample tree data matching the visualization
export const sampleTree = {
    id: 'root',
    name: 'My Goals',
    type: 'RootNode',
    children: [
        {
            id: 'health',
            name: 'Health',
            type: 'NonRootNode',
            points: 40,
            parent_id: 'root',
            children: [
                {
                    id: 'exercise',
                    name: 'Exercise',
                    type: 'NonRootNode',
                    points: 60,
                    parent_id: 'health',
                    children: [],
                    contributors: [
                        { id: 'alice', points: 70 },
                        { id: 'bob', points: 30 }
                    ],
                    anti_contributors: [],
                    manual_fulfillment: 1.0
                },
                {
                    id: 'nutrition',
                    name: 'Nutrition',
                    type: 'NonRootNode',
                    points: 40,
                    parent_id: 'health',
                    children: [],
                    contributors: [
                        { id: 'alice', points: 50 },
                        { id: 'carol', points: 50 }
                    ],
                    anti_contributors: [],
                    manual_fulfillment: 1.0
                }
            ],
            contributors: [],
            anti_contributors: [],
            manual_fulfillment: null
        },
        {
            id: 'education',
            name: 'Education',
            type: 'NonRootNode',
            points: 35,
            parent_id: 'root',
            children: [],
            contributors: [
                { id: 'bob', points: 60 },
                { id: 'carol', points: 40 }
            ],
            anti_contributors: [],
            manual_fulfillment: 1.0
        },
        {
            id: 'community',
            name: 'Community',
            type: 'NonRootNode',
            points: 25,
            parent_id: 'root',
            children: [],
            contributors: [
                { id: 'alice', points: 40 },
                { id: 'bob', points: 30 },
                { id: 'carol', points: 30 }
            ],
            anti_contributors: [],
            manual_fulfillment: 1.0
        }
    ],
    manual_fulfillment: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

// Create nodes map for tree functions
export const nodesMap = {
    'root': sampleTree,
    'health': sampleTree.children[0],
    'exercise': sampleTree.children[0].children[0],
    'nutrition': sampleTree.children[0].children[1],
    'education': sampleTree.children[1],
    'community': sampleTree.children[2]
};
